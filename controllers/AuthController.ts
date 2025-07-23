import { NextFunction, Request, Response } from 'express';

import UserModel from '../models/User';
import { Credentials, OAuth2Client, TokenPayload } from 'google-auth-library';
import AppError from '../utils/AppError';
import catchAsync from '../utils/catchAsync';
import JWTService from '../utils/JWTService';
import {
  PermissionAction,
  PermissionResource,
  PermissionScope,
  PrismaClient,
} from '@prisma/client';
import userSchema from '../schema/user.schema';
import { create } from 'domain';

declare global {
  namespace Express {
    interface Request {
      oauthJwtPayload: TokenPayload;
      oauthTokens: Credentials;
      user: UserModel;
    }
  }
}

export default class AuthController {
  private static GOOGLE_CLIENT_ID: string = process.env.GOOGLE_CLIENT_ID!;
  private static GOOGLE_CLIENT_SECRET: string =
    process.env.GOOGLE_CLIENT_SECRET!;
  private static GOOGLE_REDIRECT_URI: string = process.env.GOOGLE_REDIRECT_URI!;

  private static oauth2Client: OAuth2Client = new OAuth2Client({
    clientId: this.GOOGLE_CLIENT_ID,
    clientSecret: this.GOOGLE_CLIENT_SECRET,
    redirectUri: this.GOOGLE_REDIRECT_URI,
  });

  public static continueWithGoogle = catchAsync(async function (
    req: Request,
    res: Response,
  ) {
    const authUrl = AuthController.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['profile', 'email', 'openid'],
      prompt: 'consent', // Always ask for consent to get refresh_token
    });

    res.redirect(authUrl);
  });

  public static extractOAuth2Tokens = catchAsync(async function (
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const authCode: string = String(req.query.code);

    if (!authCode)
      return next(
        new AppError(
          'Invalid authorization code obtained from Google authorization server.',
          500,
        ),
      );

    // Exchange auth code for tokens
    const { tokens } = await AuthController.oauth2Client.getToken(authCode);
    AuthController.oauth2Client.setCredentials(tokens);

    if (!tokens.access_token)
      return next(
        new AppError(
          'Invalid access token received from Google authorization server.',
          500,
        ),
      );

    if (!tokens.refresh_token)
      return next(
        new AppError(
          'Invalid refresh token received from Google authorization server.',
          500,
        ),
      );

    req.oauthTokens = tokens;
    next();
  });

  public static extractAndVerifyGoogleJWT = catchAsync(async function (
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    // Verify ID token (JWT) and get user info
    const ticket = await AuthController.oauth2Client.verifyIdToken({
      idToken: String(req.oauthTokens.id_token),
      audience: AuthController.GOOGLE_CLIENT_ID,
    });

    const jwtPayload = ticket.getPayload();

    if (!jwtPayload)
      throw new AppError(
        'Invalid JWT received from Google authorization server.',
        500,
      );

    req.oauthJwtPayload = jwtPayload;
    next();
  });

  public static createOrFetchUser = catchAsync(async function (
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const jwtPayload = req.oauthJwtPayload;
    const tokens = req.oauthTokens;

    const googleSubId = jwtPayload.sub;

    let user: UserModel;

    // If you don't find the user, it means that it is a new user account
    try {
      user = await UserModel.findOneByGoogleSubId(googleSubId);
    } catch (error) {
      const creationParameters = {
        googleSubId: jwtPayload.sub,
        givenName: jwtPayload.given_name || '',
        familyName: jwtPayload.family_name || '',
        email: jwtPayload.email || '',
        picture: jwtPayload.picture || '',
        roleId: 1, // User ID
        status: false,
      };

      const createInput = userSchema.create.safeParse(creationParameters);

      if (createInput.error)
        throw new AppError(
          `Error when creating user. Creation parameters: ${creationParameters}`,
          500,
        );

      user = await UserModel.create(createInput.data);
    }

    JWTService.createAndSendJWT(user.id, (await user.role()).name, res, 201, {
      user,
    });
  });

  public static protect = catchAsync(async function (
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    // 1) Check if a token exists and extract it if so
    const jwt = JWTService.extractJWT(req);

    // 2) Verify the token
    const payload: any = JWTService.verifyJWT(jwt);

    // 3) Verify the user exists
    const user = await UserModel.findOneById(payload.id);

    if (!(user && payload))
      return next(
        new AppError('The user owning this token no longer exists.', 401),
      );

    // GRANT ACCESS TO USER
    req.user = user;
    res.locals.user = user;

    next();
  });

  private static async checkUserIsResourceCreator(
    req: Request,
    next: NextFunction,
    modelClass: {
      findCreatorIdById(id: number): Promise<number | null>;
    },
  ): Promise<Boolean> {
    const resourceId = Number(req.params.id);

    if (isNaN(resourceId)) throw new AppError('Invalid resource ID.', 400);

    const creatorId = await modelClass.findCreatorIdById(resourceId);

    // To handle old resources (that didn't have creatorId), assume that everyone is their owner
    if (!creatorId || creatorId === 0) return true;

    if (creatorId === req.user.id) return true;

    // The default is: don't give ownership (to counteract any possible security bugs)
    return false;
  }

  static requirePermission = function (
    action: PermissionAction,
    scope: PermissionScope,
    resource: PermissionResource,
    modelClass?: {
      findCreatorIdById(id: number): Promise<number | null>;
    }, // optional model
  ) {
    return catchAsync(
      async (req: Request, res: Response, next: NextFunction) => {
        const role = await req.user.role();

        // 0 is the ID of the SuperAdmin role. They can do anything.
        if (role.id === 0) return next();

        // Check general permission first, to fail fast (Doesn't consider resource ownership)
        if (!role.hasPermission(action, scope, resource))
          return next(
            new AppError(
              "You don't have enough permissions to do this action!",
              403,
            ),
          );

        // You don't need to check for ownership for a user who can update any instance of a resource
        if (scope === PermissionScope.ANY) return next();
        if (role.hasPermission(action, PermissionScope.ANY, resource))
          return next();

        // This is likely a bug (whenever scope is OWN, modelClass must be input)
        if (!modelClass)
          return next(
            new AppError(
              'For OWN ownership check, `modelClass` must be provided!',
              500,
              false,
            ),
          );

        // If the scope is OWN, check if the user is the resource creator
        const userIsResourceCreator =
          await AuthController.checkUserIsResourceCreator(
            req,
            next,
            modelClass,
          );

        if (userIsResourceCreator) return next();

        // Make failure the default action
        return next(
          new AppError(
            "You can't modify or delete a resource created by someone else!",
            403,
          ),
        );
      },
    );
  };
}

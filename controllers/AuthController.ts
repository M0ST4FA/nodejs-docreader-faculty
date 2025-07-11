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
} from '@prisma/client';

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
    client_id: this.GOOGLE_CLIENT_ID,
    client_secret: this.GOOGLE_CLIENT_SECRET,
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
      user = await UserModel.create({
        googleSubId: jwtPayload.sub,
        givenName: jwtPayload.given_name || '',
        familyName: jwtPayload.family_name || '',
        email: jwtPayload.email || '',
        picture: jwtPayload.picture || '',
        roleId: 1,
        status: false,
      });
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
    const payload = JWTService.verifyJWT(jwt);

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

  static requirePermission = function (
    action: PermissionAction,
    scope: PermissionScope,
    resource: PermissionResource,
  ) {
    return catchAsync(
      async (req: Request, res: Response, next: NextFunction) => {
        const role = await req.user.role();

        for (const permission of permissions)
          if (role.hasPermission(permission)) return next();

        return next(
          new AppError(
            "You don't have enough permissions to do this action!",
            403,
          ),
        );
      },
    );
  };
}

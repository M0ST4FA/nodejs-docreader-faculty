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
import userSchema from '../schema/user.schema';
import RoleModel from '../models/Role';

declare global {
  namespace Express {
    interface Request {
      oauthJwtPayload: TokenPayload;
      oauthTokens: Credentials;
      user: UserModel;
      userMostPermissiveScope: PermissionScope;
    }
  }
}

type ModelClass = {
  findCreatorIdById?(id: number): Promise<number | null>;
  findCreatorIdByName?(name: string): Promise<number | null>;
  findOneById?(id: number, queryParams: any): any;
  findOneByName?(name: string, queryParams: any): any;
};

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

  private static getResourceDesignation(req: Request) {
    const resourceId = Number(req.params.id);
    const resourceName = req.params.name;

    const hasResourceId = !isNaN(resourceId) && resourceId > 0; // Check for actual ID presence
    const hasResourceName =
      typeof resourceName === 'string' && resourceName.length > 0;

    return {
      resourceId: hasResourceId ? resourceId : undefined,
      resourceName: hasResourceName ? resourceName : undefined,
    };
  }

  private static async getSingleResource(
    modelClass: ModelClass,
    resourceId?: number,
    resourceName?: string,
  ) {
    if (!resourceName && !resourceId)
      throw new AppError(
        'Invalid resource ID and name for single resource restriction checks.',
        400,
      );

    if (resourceId) {
      if (modelClass.findOneById)
        return await modelClass.findOneById(resourceId, {
          fields: 'id,name,public',
        });
      else
        throw new AppError(
          `'findOneById() is not defined. Cannot continue with restricted resource checks.`,
          500,
        );
    } else if (resourceName) {
      if (modelClass.findOneByName)
        return await modelClass.findOneByName(resourceName, {
          fields: 'id,name,public',
        });
      else
        throw new AppError(
          `'findOneByName() is not defined. Cannot continue with restricted resource checks.`,
          500,
        );
    }
  }

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
        roleId: 3, // User ID
      };

      const createInput = userSchema.create.safeParse(creationParameters);

      if (createInput.error)
        throw new AppError(
          `Error when creating user. Creation parameters: ${creationParameters}`,
          500,
        );

      // These query params are not recognized by the QueryParamService and will lead to an error when parsing req.query if not deleted
      delete req.query.code;
      delete req.query.scope;
      delete req.query.authuser;
      delete req.query.prompt;

      if (req.query.fields !== undefined) {
        const arr = (req.query.fields as string).split(',');
        arr.push('roleId');
        req.query.fields = arr.join(',');
      }

      user = (await UserModel.create(createInput.data, req.query)) as UserModel;
    }

    JWTService.createAndSendJWT(user.id, user.roleId, res, 201, {
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

    if (!payload) throw new AppError('JWT payload is empty.', 401);

    // 3) Verify the user exists
    try {
      const user = (await UserModel.findOneById(payload.id, {})) as UserModel;

      // GRANT ACCESS TO USER
      req.user = user;
      res.locals.user = user;
    } catch (error) {
      throw new AppError(`Couldn't find logged in user.`, 401);
    }

    next();
  });

  static requirePermission = function (
    action: PermissionAction,
    requestedScope: PermissionScope,
    resource: PermissionResource,
  ) {
    return catchAsync(
      async (req: Request, res: Response, next: NextFunction) => {
        const role = await req.user.role();

        // STEP 1: SUPER ADMIN HAS ALL OF THE PERMISSIONS

        // 0 is the ID of the SuperAdmin role. They can do anything.
        if (role.id === 0) {
          req.userMostPermissiveScope = 'RESTRICTED'; // True for any resource
          return next();
        }

        // STEP 2: CHECK GENERAL PERMISSION WITHOUT CONSIDERING OWNERSHIP OR ANY SPECIAL RELATIONSHIP TO THE RESOURCE
        const userMostPermissiveScope = role.getMostPermissiveScope(
          action,
          resource,
        );

        if (!userMostPermissiveScope)
          return next(
            new AppError(
              "You don't have any permissions for this action/resource!",
              403,
            ),
          );

        if (!RoleModel.scopeIsDominant(userMostPermissiveScope, requestedScope))
          return next(
            new AppError(
              "You don't have enough permissions to do this action!",
              403,
            ),
          );

        req.userMostPermissiveScope = userMostPermissiveScope;
        return next();
      },
    );
  };

  static checkUserIsResourceCreator = function (modelClass: ModelClass) {
    return catchAsync(async function (
      req: Request,
      res: Response,
      next: NextFunction,
    ) {
      if (['ANY', 'RESTRICTED'].includes(req.userMostPermissiveScope))
        return next();

      const { resourceId, resourceName } =
        AuthController.getResourceDesignation(req);

      if (!resourceId && !resourceName)
        throw new AppError(
          'Invalid resource ID and name for permissions check.',
          400,
        );

      let creatorId: number | null = null;

      if (resourceId) {
        if (modelClass.findCreatorIdById)
          creatorId = await modelClass.findCreatorIdById(resourceId);
        else
          throw new AppError(
            `'findCreatorIdById() is not defined. Cannot continue with permission checks.`,
            500,
          );
      } else if (resourceName) {
        if (modelClass.findCreatorIdByName)
          creatorId = await modelClass.findCreatorIdByName(resourceName);
        else
          throw new AppError(
            `'findCreatorIdByName() is not defined. Cannot continue with permission checks.`,
            500,
          );
      }

      // To handle old resources (that didn't have creatorId), assume that everyone is their owner
      if (!creatorId || creatorId === 0) return next();

      if (creatorId === req.user.id) return next();

      // The default is: don't give ownership (to counteract any possible security bugs)
      return next(
        new AppError(
          "You can't modify or delete a resource created by someone else!",
          403,
        ),
      );
    });
  };

  static checkAccessToRestrictedResource = function (modelClass: ModelClass) {
    return catchAsync(async function (
      req: Request,
      res: Response,
      next: NextFunction,
    ) {
      // STEP 1: Calculate essential variables
      const { resourceId, resourceName } =
        AuthController.getResourceDesignation(req);

      const canAccessRestrictedResource: boolean =
        req.userMostPermissiveScope === 'RESTRICTED';
      const accessingSingleResource: boolean =
        resourceId !== undefined || resourceName !== undefined;

      // STEP 2: Perform actual checks

      /**  
       If they can access restricted resources anyways, no need to check resource. In the case where a collection is accessed, then part of it may be restricted the rest not. In this case, you cannot say the user has no access to the entire collection, just because they do not have access to part of it. Filtering what the user has access to or not is left to the next middleware. This is not the job of authentication controller. Its job is to only tell you whether, in this particular collection, the user has access to its restricted resources, which is done this way. 
      */
      if (canAccessRestrictedResource || !accessingSingleResource)
        return next();

      // In the case where they are accessing a single resource, and they do not have access to restricted resources, then you must check whether the resource is actually restricted or not
      let resourceObject = await AuthController.getSingleResource(
        modelClass,
        resourceId,
        resourceName,
      );

      const resourceIsRestrictable =
        resourceObject && resourceObject.public === false;

      if (resourceIsRestrictable && canAccessRestrictedResource) return next();
      else
        return next(
          new AppError(
            "You don't have enough permissions to access this restricted resource!",
            403,
          ),
        );
    });
  };
}

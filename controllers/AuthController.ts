import { CookieOptions, NextFunction, Request, Response } from 'express';

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
      hasAccessToRestrictedResource: Boolean;
    }
  }
}

type ModelClass = {
  findCreatorIdById?(id: number): Promise<number | null>;
  findCreatorIdByName?(name: string): Promise<number | null>;
  findOneById?(id: number, queryParams: any): any;
  findOneByName?(name: string, queryParams: any): any;
};

type ScopeCheckResult = {
  grantAccess: Boolean;
  error?: AppError;
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

  public static extractAndVerifyGoogleJWT = catchAsync(async function (
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    // Verify ID token (JWT) and get user info
    const ticket = await AuthController.oauth2Client.verifyIdToken({
      idToken: String(req.body.id_token),
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

  private static async checkUserIsResourceCreator(
    req: Request,
    modelClass: ModelClass,
  ): Promise<Boolean> {
    const resourceId = Number(req.params.id);
    const resourceName = req.params.name;

    const hasResourceId = !isNaN(resourceId) && resourceId > 0; // Check for actual ID presence
    const hasResourceName =
      typeof resourceName === 'string' && resourceName.length > 0;

    if (!hasResourceId && !hasResourceName)
      throw new AppError(
        'Invalid resource ID and name for permissions check.',
        400,
      );

    let creatorId: number | null = null;

    if (hasResourceId) {
      if (modelClass.findCreatorIdById)
        creatorId = await modelClass.findCreatorIdById(resourceId);
      else
        throw new AppError(
          `'findCreatorIdById() is not defined. Cannot continue with permission checks.`,
          500,
        );
    } else if (hasResourceName) {
      if (modelClass.findCreatorIdByName)
        creatorId = await modelClass.findCreatorIdByName(resourceName);
      else
        throw new AppError(
          `'findCreatorIdByName() is not defined. Cannot continue with permission checks.`,
          500,
        );
    }

    // To handle old resources (that didn't have creatorId), assume that everyone is their owner
    if (!creatorId || creatorId === 0) return true;

    if (creatorId === req.user.id) return true;

    // The default is: don't give ownership (to counteract any possible security bugs)
    return false;
  }

  private static async checkAccessToRestrictedResource(
    req: Request,
    role: RoleModel,
    action: PermissionAction,
    resource: PermissionResource,
    modelClass?: ModelClass,
  ): Promise<{
    canAccessRestrictedResource: Boolean;
    accessingSingleResource: Boolean;
    singleResourceIsRestricted?: Boolean;
  }> {
    // Step 1: Calculate essential variables
    const resourceId = Number(req.params.id);
    const resourceName = req.params.name;
    const hasResourceId = !isNaN(resourceId) && resourceId > 0; // Check for actual ID presence
    const hasResourceName =
      typeof resourceName === 'string' && resourceName.length > 0;

    const canAccessRestrictedResource = role.hasPermission(
      action,
      'RESTRICTED',
      resource,
    );
    const accessingSingleResource = hasResourceId || hasResourceName;

    // Step 2: Perform actual checks

    // If they can access restricted resources anyways, no need to check resource. In the case where a collection is accessed, then part of it may be restricted the rest not. In this case, you cannot say the user has no access to the entire collection, just because they do not have access to part of it. Filtering what the user has access to or not is left to the next middleware. This is not the job of authentication controller. Its job is to only tell you whether, in this particular collection, the user has access to its restricted resources, which is done this way.
    if (canAccessRestrictedResource || !accessingSingleResource)
      return {
        canAccessRestrictedResource,
        accessingSingleResource,
      };

    // In the case where they are accessing a single resource, and they do not have access to restricted resources, then you must check whether the resource is actually restricted or not
    let resourceObject: any;

    if (!hasResourceId && !hasResourceName)
      throw new AppError(
        'Invalid resource ID and name for single resource restriction checks.',
        400,
      );

    if (!modelClass)
      throw new AppError(
        `For resource restriction checks of a single resource, 'modelClass' must be provided!`,
        500,
      );

    if (hasResourceId) {
      if (modelClass.findOneById)
        resourceObject = await modelClass.findOneById(resourceId, {
          fields: 'id,name,public',
        });
      else
        throw new AppError(
          `'findOneById() is not defined. Cannot continue with restricted resource checks.`,
          500,
        );
    } else if (hasResourceName) {
      if (modelClass.findOneByName)
        resourceObject = await modelClass.findOneByName(resourceName, {
          fields: 'id,name,public',
        });
      else
        throw new AppError(
          `'findOneByName() is not defined. Cannot continue with restricted resource checks.`,
          500,
        );
    }

    // A resource is considered 'restricted' ONLY if it exists AND its 'public' field is explicitly 'false'.
    // If 'resourceObject' is null/undefined (not found), or 'resourceObject.public' is undefined, null, or true,
    // then the resource is NOT considered restricted by its properties.
    const resourceIsRestrictable =
      resourceObject && resourceObject.public === false;

    if (resourceIsRestrictable) {
      // If the resource IS restricted, and the user's role DOES NOT have the RESTRICTED permission,
      // then they can't access it.
      return {
        canAccessRestrictedResource: false, // User cannot access *this specific* restricted resource
        accessingSingleResource: true,
        singleResourceIsRestricted: !resourceObject.public,
      };
    } else {
      // If the resource is NOT actually restricted (it's implicitly public, or public: true)
      // Then the user can access it, provided they passed the general permission check.
      // We return `canAccessRestrictedResourceByRole` here, which is `false` in this branch
      // but represents the user's general capability.
      return {
        canAccessRestrictedResource: canAccessRestrictedResource, // Still false, meaning user's role doesn't grant universal restricted access
        accessingSingleResource: true,
        singleResourceIsRestricted: false,
      };
    }
  }

  private static async checkResourceScope(
    req: Request,
    requestedScope: PermissionScope,
    modelClass?: ModelClass,
  ): Promise<ScopeCheckResult> {
    switch (requestedScope) {
      // You don't need to check for ownership for a user who can update any instance of a resource
      case PermissionScope.RESTRICTED:
      case PermissionScope.ANY:
        return {
          grantAccess: true,
        };

      case PermissionScope.OWN: {
        // This is likely a bug (whenever scope is OWN, modelClass must be input)
        if (!modelClass)
          return {
            grantAccess: false,
            error: new AppError(
              `For ${requestedScope} permission check, 'modelClass' must be provided!`,
              500,
            ),
          };

        const userIsResourceCreator =
          await AuthController.checkUserIsResourceCreator(req, modelClass);

        if (userIsResourceCreator) return { grantAccess: true };

        // Make failure the default action
        return {
          grantAccess: false,
          error: new AppError(
            "You can't modify or delete a resource created by someone else!",
            403,
          ),
        };
      }
    }

    return {
      grantAccess: false,
      error: new AppError(
        'Unkown error while checking for scope and relationship requirements. Access denied.',
        500,
      ),
    };
  }

  static requirePermission = function (
    action: PermissionAction,
    requestedScope: PermissionScope,
    resource: PermissionResource,
    modelClass?: ModelClass,
  ) {
    return catchAsync(
      async (req: Request, res: Response, next: NextFunction) => {
        const role = await req.user.role();

        // 0. SUPER ADMIN HAS ALL OF THE PERMISSIONS

        // 0 is the ID of the SuperAdmin role. They can do anything.
        if (role.id === 0) {
          req.hasAccessToRestrictedResource = true; // True for any resource
          return next();
        }

        // 1. CHECK GENERAL PERMISSION WITHOUT CONSIDERING OWNERSHIP OR ANY SPECIAL RELATIONSHIP TO THE RESOURCE (TO FAIL FAST)
        if (!role.hasPermission(action, requestedScope, resource))
          return next(
            new AppError(
              "You don't have enough permissions to do this action!",
              403,
            ),
          );

        // 2. HANDLE RESTRICTED RESOURCE CHECK
        // If the resource is restrictable (can be restricted for admins only), check whether the user has access to restrictable resources
        // Set the default to 'false' which is more
        const {
          accessingSingleResource,
          canAccessRestrictedResource,
          singleResourceIsRestricted,
        } = await AuthController.checkAccessToRestrictedResource(
          req,
          role,
          action,
          resource,
          modelClass,
        );
        req.hasAccessToRestrictedResource = canAccessRestrictedResource;

        if (
          accessingSingleResource &&
          !canAccessRestrictedResource &&
          singleResourceIsRestricted
        )
          return next(
            new AppError(
              `You don't have enough permissions to access this restricted resource!`,
              403,
            ),
          );

        // 3. HANDLE SPECIFIC RELATIONSHIPS/SCOPES
        const { grantAccess, error: scopeError } =
          await AuthController.checkResourceScope(
            req,
            requestedScope,
            modelClass,
          );

        if (grantAccess) return next();

        return next(scopeError);
      },
    );
  };

  static logout = catchAsync(async function (
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    // 1) Clear the cookie
    const cookieOptions: CookieOptions = {
      maxAge: 0, // Set to 0 to delete the cookie
      httpOnly: true,
    };

    if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

    res.cookie('jwt', '', cookieOptions);

    // 2) Send the response
    res.status(200).send({
      status: 'success',
      message: 'Logged out successfully.',
    });
  });
}

import { NextFunction, Request, Response } from 'express';
import catchAsync from '../utils/catchAsync';
import UserModel from '../models/User';
import AppError from '../utils/AppError';
import userSchema, { UserQueryParamInput } from '../schema/user.schema';
import { QueryParamsService } from '../utils/QueryParamsService';
import NotificationService from '../utils/NotificationService';
import DeviceModel from '../models/Device';

export default class UserController {
  private static extractAndValidateId(req: Request): number {
    const id = Number.parseInt(req.params.id);

    if (Number.isNaN(id))
      throw new AppError('Invalid user ID. Must be an integer.', 400);

    return id;
  }

  public static getMe = catchAsync(async function (
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    req.params.id = req.user.id.toString();

    next();
  });

  public static getUser = catchAsync(async function (
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const id = UserController.extractAndValidateId(req);

    const user = await UserModel.findOneById(id, req.query);

    res.status(200).json({
      status: 'success',
      data: {
        user,
      },
    });
  });

  public static getAllUsers = catchAsync(async function (
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const [users, total] = await UserModel.findMany(req.query);

    res.status(200).json({
      status: 'success',
      totalCount: total,
      data: {
        users,
      },
    });
  });

  private static async extractDataForTokenOperation(oldUser: UserModel) {
    // Fetch user devices
    const devices = oldUser.toJSON().devices;

    // If the user has at least one device
    const deviceTokens = devices.map((device: any) => device.token) as string[];
    const tokenToDeviceId = new Map(
      devices.map((device: any) => [device.token, device.id]),
    ) as Map<string, number>;

    return { deviceTokens, tokenToDeviceId };
  }

  private static async moveTopicSubscriptionToNewYear(
    oldUser: UserModel,
    newYearId: number,
  ) {
    const { deviceTokens, tokenToDeviceId } =
      await UserController.extractDataForTokenOperation(oldUser);

    await Promise.all([
      NotificationService.unsubscribeDevicesFromTopic(
        deviceTokens,
        tokenToDeviceId,
        oldUser.yearId.toString(),
      ),
      NotificationService.subscribeDevicesToTopic(
        deviceTokens,
        tokenToDeviceId,
        newYearId.toString(),
      ),
    ]);
  }

  private static checkUserIsNotUpdatingTheirOwnRole(
    req: Request,
    userId: number,
  ) {
    const roleId = req.body.roleId;

    if (roleId === undefined) return;

    const loggedInUserId = req.user.id;

    if (loggedInUserId === userId)
      throw new AppError('A user cannot modify their own role.', 403);
  }

  public static updateUser = catchAsync(async function (
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const id = UserController.extractAndValidateId(req);
    const newYearId = Number.parseInt(req.body.yearId);

    UserController.checkUserIsNotUpdatingTheirOwnRole(req, id);

    let oldUser: UserModel | undefined = undefined;
    if (!Number.isNaN(newYearId))
      oldUser = (await UserModel.findOneById(id, {
        include: 'devices',
      })) as UserModel;

    const updatedUser = await UserModel.updateOne(id, req.body, req.query);

    if (oldUser && oldUser.yearId !== newYearId)
      UserController.moveTopicSubscriptionToNewYear(oldUser, newYearId);

    res.status(200).json({
      status: 'success',
      data: {
        user: updatedUser,
      },
    });
  });

  public static assignRole = catchAsync(async function (
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const userId = UserController.extractAndValidateId(req);

    const roleId = Number.parseInt(req.body.roleId);
    if (Number.isNaN(roleId))
      throw new AppError('Invalid role ID. Must be an integer.', 400);

    const queryParams = QueryParamsService.parse<UserQueryParamInput>(
      userSchema,
      req.query,
      {
        projection: true,
      },
    );

    const updatedUser = await UserModel.updateRole(userId, roleId, queryParams);

    res.status(200).json({
      status: 'success',
      data: {
        user: updatedUser,
      },
    });
  });

  public static deleteUser = catchAsync(async function (
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const id = UserController.extractAndValidateId(req);

    const user = await UserModel.deleteOne(id);

    res.status(200).json({
      status: 'success',
      data: { user },
    });
  });
}

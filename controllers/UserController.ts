import { NextFunction, Request, Response } from 'express';
import catchAsync from '../utils/catchAsync';
import UserModel from '../models/User';
import AppError from '../utils/AppError';
import userSchema, { UserQueryParamInput } from '../schema/user.schema';
import { QueryParamsService } from '../utils/QueryParamsService';

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

  public static updateUser = catchAsync(async function (
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const id = UserController.extractAndValidateId(req);

    const user =
      req.user.id === id ? req.user : await UserModel.findOneById(id, {});

    const updatedUser = await UserModel.updateOne(id, req.body, req.query);

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

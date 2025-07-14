import { NextFunction, Request, Response } from 'express';
import catchAsync from '../utils/catchAsync';
import UserModel from '../models/User';
import AppError from '../utils/AppError';

export default class UserController {
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
    const id = Number.parseInt(req.params.id);
    const user = await UserModel.findOneById(id);

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
    const users = await UserModel.findMany({});

    res.status(200).json({
      status: 'success',
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
    const id = Number.parseInt(req.params.id);

    const updatedUser = await UserModel.updateOne(id, req.body);

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
    const userId = Number.parseInt(req.params.id);
    const body = req.body;

    if (typeof body.roleId !== 'number')
      throw new AppError('Invalid roleId.', 400);

    const updatedUser = await UserModel.updateRole(userId, body.roleId);

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
    const id = Number.parseInt(req.params.id);

    await UserModel.deleteOne(id);

    res.status(204).json({
      status: 'success',
      data: null,
    });
  });
}

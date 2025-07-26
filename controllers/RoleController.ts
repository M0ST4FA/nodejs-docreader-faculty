import catchAsync from '../utils/catchAsync';
import { Request, Response, NextFunction } from 'express';
import RoleModel from '../models/Role';
import AppError from '../utils/AppError';

export default class RoleController {
  private static extractRoleId(req: Request): number {
    const id =
      Number.parseInt(req.params.id) || Number.parseInt(req.params.roleId);

    if (Number.isNaN(id))
      throw new AppError('Invalid role ID: role ID must be an integer.', 400);

    return id;
  }

  public static createRole = catchAsync(async function (
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    req.body.creatorId = req.user.id;

    const role = await RoleModel.createOne(req.body, req.query);

    res.status(201).json({
      status: 'success',
      data: {
        role,
      },
    });
  });

  public static getAllRoles = catchAsync(async function (
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const roles = await RoleModel.findMany({}, req.query);

    res.status(200).json({
      status: 'success',
      totalCount: roles.length,
      data: {
        roles,
      },
    });
  });

  public static getRole = catchAsync(async function (
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const id = RoleController.extractRoleId(req);

    const role = await RoleModel.findOneById(id, req.query);

    res.status(200).json({
      status: 'success',
      data: {
        role,
      },
    });
  });

  public static updateRole = catchAsync(async function (
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const id = RoleController.extractRoleId(req);

    const updatedRole = await RoleModel.updateOne(id, req.body, req.query);

    res.status(200).json({
      status: 'success',
      data: {
        role: updatedRole,
      },
    });
  });

  public static deleteRole = catchAsync(async function (
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const id = RoleController.extractRoleId(req);

    await RoleModel.deleteOne(id);

    res.status(204).json({
      status: 'success',
      data: null,
    });
  });

  public static assignPermissions = catchAsync(async function (
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const id = RoleController.extractRoleId(req);

    const permissions: number[] = req.body.permissions
      ? [...req.body.permissions]
      : [];

    await new RoleModel({ id }).addPermissions(permissions);

    res.status(204).json({
      status: 'success',
      data: null,
    });
  });

  public static deletePermissions = catchAsync(async function (
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const id = RoleController.extractRoleId(req);

    const permissions: number[] = req.body.permissions
      ? [...req.body.permissions]
      : [];

    await new RoleModel({ id }).removePermissions(permissions);

    res.status(204).json({
      status: 'success',
      data: null,
    });
  });
}

import catchAsync from '../utils/catchAsync';
import { Request, Response, NextFunction } from 'express';
import PermissionModel from '../models/Permission';
import AppError from '../utils/AppError';
import db from '../prisma/db';

export default class PermissionController {
  private static extractRoleId(req: Request): number {
    if (req.body.roleId)
      throw new AppError(
        "Body cannot contain 'roleId' field as its value comes from the path.",
        400,
      );

    const id = Number.parseInt(req.params.roleId);

    return id;
  }

  private static extractPermissionId(req: Request): number {
    const id = Number.parseInt(req.params.id);

    if (Number.isNaN(id))
      throw new AppError(
        'Invalid permission ID: permission ID must be an integer.',
        400,
      );

    return id;
  }

  public static getAllPermissions = catchAsync(async function (
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const roleId = PermissionController.extractRoleId(req);
    let permissions: any[] = [];

    if (roleId)
      permissions = await PermissionModel.findPermissionsForRole(
        roleId,
        req.query,
      );
    else permissions = await PermissionModel.findMany({}, req.query);

    res.status(200).json({
      status: 'success',
      totalCount: permissions.length,
      data: {
        permissions,
      },
    });
  });

  public static getPermission = catchAsync(async function (
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const id = PermissionController.extractPermissionId(req);

    const permission = await PermissionModel.findOneById(id, req.query);

    res.status(200).json({
      status: 'success',
      data: {
        permission,
      },
    });
  });
}

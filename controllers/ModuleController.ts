import catchAsync from '../utils/catchAsync';
import { Request, Response, NextFunction } from 'express';
import ModuleModel from '../models/Module';
import AppError from '../utils/AppError';

export default class ModuleController {
  private static extractYearID(req: Request): number {
    if (req.body.yearId)
      throw new AppError(
        "Body cannot contain 'yearId' field as its value comes from the path.",
        400,
      );

    // This will always exist as it is used in nested routes only
    const yearId = Number.parseInt(req.params.yearId);

    if (Number.isNaN(yearId))
      throw new AppError('Invalid year ID: year ID must be an integer.', 400);

    return yearId;
  }

  private static extractModuleID(req: Request): number {
    const id = Number.parseInt(req.params.id);

    if (Number.isNaN(id))
      throw new AppError(
        'Invalid module ID: module ID must be an integer.',
        400,
      );

    return id;
  }

  public static createModule = catchAsync(async function (
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const yearId = ModuleController.extractYearID(req);
    req.body.yearId = yearId;
    req.body.creatorId = req.user.id;

    const module = await ModuleModel.createOne(req.body, req.query);

    res.status(201).json({
      status: 'success',
      data: {
        module,
      },
    });
  });

  public static getAllModules = catchAsync(async function (
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const yearId = ModuleController.extractYearID(req);

    const modules = await ModuleModel.findMany(
      {
        yearId,
      },
      req.query,
    );

    res.status(200).json({
      status: 'success',
      totalCount: modules.length,
      data: {
        modules,
      },
    });
  });

  public static getModule = catchAsync(async function (
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const id = ModuleController.extractModuleID(req);

    const module = await ModuleModel.findOneById(id, req.query);

    res.status(200).json({
      status: 'success',
      data: {
        module,
      },
    });
  });

  public static updateModule = catchAsync(async function (
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const id = ModuleController.extractModuleID(req);

    const updateModule = await ModuleModel.updateOne(id, req.body, req.query);

    res.status(200).json({
      status: 'success',
      data: {
        module: updateModule,
      },
    });
  });

  public static deleteModule = catchAsync(async function (
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const id = ModuleController.extractModuleID(req);

    await ModuleModel.deleteOne(id);

    res.status(204).json({
      status: 'success',
      data: null,
    });
  });
}

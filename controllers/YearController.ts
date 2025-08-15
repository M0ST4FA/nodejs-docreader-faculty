import catchAsync from '../utils/catchAsync';
import { Request, Response, NextFunction } from 'express';
import YearModel from '../models/Year';
import AppError from '../utils/AppError';

export default class YearController {
  private static extractFacultyID(req: Request): number {
    if (req.body.facultyId)
      throw new AppError(
        "Body cannot contain 'facultyId' field as its value comes from the path.",
        400,
      );

    // This will always exist as it is used in nested routes only
    const facultyId = Number.parseInt(req.params.facultyId);

    if (Number.isNaN(facultyId))
      throw new AppError(
        'Invalid faculty ID: faculty ID must be an integer.',
        400,
      );

    return facultyId;
  }

  private static extractYearID(req: Request): number {
    const id = Number.parseInt(req.params.id);

    if (Number.isNaN(id))
      throw new AppError('Invalid year ID: year ID must be an integer.', 400);

    return id;
  }

  public static createYear = catchAsync(async function (
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const facultyId = YearController.extractFacultyID(req);
    req.body.facultyId = facultyId;
    req.body.creatorId = req.user.id;

    const year = await YearModel.createOne(req.body, req.query);

    res.status(201).json({
      status: 'success',
      data: {
        year,
      },
    });
  });

  public static getYears = catchAsync(async function (
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const facultyId = YearController.extractFacultyID(req);
    req.body.facultyId = facultyId;

    const years = await YearModel.findMany(
      {
        facultyId,
      },
      req.query,
    );

    res.status(200).json({
      status: 'success',
      totalCount: years.length,
      data: {
        years,
      },
    });
  });

  public static getYear = catchAsync(async function (
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const id = YearController.extractYearID(req);

    const year = await YearModel.findOneById(id, req.query);

    res.status(200).json({
      status: 'success',
      data: {
        year,
      },
    });
  });

  public static updateYear = catchAsync(async function (
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const id = YearController.extractYearID(req);

    const updatedYear = await YearModel.updateOne(id, req.body, req.query);

    res.status(200).json({
      status: 'success',
      data: {
        year: updatedYear,
      },
    });
  });

  public static deleteYear = catchAsync(async function (
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const id = YearController.extractYearID(req);

    await YearModel.deleteOne(id);

    res.status(204).json({
      status: 'success',
      data: null,
    });
  });
}

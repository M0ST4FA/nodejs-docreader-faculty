import catchAsync from '../utils/catchAsync';
import { Request, Response, NextFunction } from 'express';
import SubjectModel from '../models/Subject';
import AppError from '../utils/AppError';

export default class SubjectController {
  private static extractModuleID(req: Request): number {
    if (req.body.facultyId)
      throw new AppError(
        "Body cannot contain 'moduleId' field as its value comes from the path.",
        400,
      );

    // This will always exist as it is used in nested routes only
    const moduleId = Number.parseInt(req.params.moduleId);

    if (Number.isNaN(moduleId))
      throw new AppError(
        'Invalid module ID: module ID must be an integer.',
        400,
      );

    return moduleId;
  }

  private static extractSubjectID(req: Request): number {
    const id = Number.parseInt(req.params.roleId);

    if (Number.isNaN(id))
      throw new AppError(
        'Invalid subject ID: subject ID must be an integer.',
        400,
      );

    return id;
  }

  public static createSubject = catchAsync(async function (
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const moduleId = SubjectController.extractModuleID(req);

    req.body.moduleId = moduleId;
    req.body.creatorId = req.user.id;

    const subject = await SubjectModel.createOne(req.body, req.query);

    res.status(201).json({
      status: 'success',
      data: {
        subject,
      },
    });
  });

  public static getAllSubjects = catchAsync(async function (
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const moduleId = SubjectController.extractModuleID(req);

    const subjects = await SubjectModel.findMany(
      {
        moduleId,
      },
      req.query,
    );

    res.status(200).json({
      status: 'success',
      totalCount: subjects.length,
      data: {
        subjects,
      },
    });
  });

  public static getSubject = catchAsync(async function (
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const id = SubjectController.extractSubjectID(req);

    const subject = await SubjectModel.findOneById(id, req.query);

    res.status(200).json({
      status: 'success',
      data: {
        subject,
      },
    });
  });

  public static updateSubject = catchAsync(async function (
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const id = SubjectController.extractSubjectID(req);

    const updatedSubject = await SubjectModel.updateOne(
      id,
      req.body,
      req.query,
    );

    res.status(200).json({
      status: 'success',
      data: {
        subject: updatedSubject,
      },
    });
  });

  public static deleteSubject = catchAsync(async function (
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const id = SubjectController.extractSubjectID(req);

    await SubjectModel.deleteOne(id);

    res.status(204).json({
      status: 'success',
      data: null,
    });
  });
}

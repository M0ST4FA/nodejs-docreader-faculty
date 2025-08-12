import catchAsync from '../utils/catchAsync';
import { Request, Response, NextFunction } from 'express';
import LectureModel from '../models/Lecture';
import AppError from '../utils/AppError';
import buildInclude from '../utils/buildInclude';

export default class LectureController {
  private static extractSubjectID(req: Request): number {
    if (req.body.subjectId)
      throw new AppError(
        "Body cannot contain 'subjectId' field as its value comes from the path.",
        400,
      );

    // This will always exist as it is used in nested routes only
    const subjectId = Number.parseInt(req.params.subjectId);

    if (Number.isNaN(subjectId))
      throw new AppError(
        'Invalid subject ID: subject ID must be an integer.',
        400,
      );

    return subjectId;
  }

  private static extractLectureID(req: Request): number {
    const id = Number.parseInt(req.params.id);

    if (Number.isNaN(id))
      throw new AppError(
        'Invalid lecture ID: lecture ID must be an integer.',
        400,
      );

    return id;
  }

  private static extractYearID(req: Request): number {
    const id = Number.parseInt(req.params.yearId);

    if (Number.isNaN(id))
      throw new AppError('Invalid year ID: year ID must be an integer.', 400);

    return id;
  }

  public static createLecture = catchAsync(async function (
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const subjectId = LectureController.extractSubjectID(req);
    req.body.subjectId = subjectId;
    req.body.creatorId = req.user.id;

    const lecture = await LectureModel.createOne(req.body, req.query);

    res.status(201).json({
      status: 'success',
      data: {
        lecture,
      },
    });
  });

  public static getLectures = catchAsync(async function (
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const subjectId = LectureController.extractSubjectID(req);

    const lectures = await LectureModel.findMany(
      {
        subjectId,
      },
      req.query,
    );

    res.status(200).json({
      status: 'success',
      totalCount: lectures.length,
      data: {
        lectures,
      },
    });
  });

  public static getYearLectures = catchAsync(async function (
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const yearId = LectureController.extractYearID(req);

    const lectures = await LectureModel.findMany(
      {
        subject: { module: { yearId } },
        type: 'Normal',
      },
      { ...req.query, include: LectureModel.PATH_INCLUDE },
    );

    res.status(200).json({
      status: 'success',
      totalCount: lectures.length,
      data: {
        lectures,
      },
    });
  });

  public static getLecture = catchAsync(async function (
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const id = LectureController.extractLectureID(req);

    const lecture = await LectureModel.findOneById(id, {
      ...req.query,
      include: LectureModel.PATH_INCLUDE,
    });

    res.status(200).json({
      status: 'success',
      data: {
        lecture,
      },
    });
  });

  public static updateLecture = catchAsync(async function (
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const id = LectureController.extractLectureID(req);

    const updatedLecture = await LectureModel.updateOne(
      id,
      req.body,
      req.query,
    );

    res.status(200).json({
      status: 'success',
      data: {
        lecture: updatedLecture,
      },
    });
  });

  public static deleteLecture = catchAsync(async function (
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const id = LectureController.extractLectureID(req);

    const lecture = await LectureModel.deleteOne(id);

    res.status(200).json({
      status: 'success',
      data: { lecture },
    });
  });
}

import catchAsync from '../utils/catchAsync';
import { Request, Response, NextFunction } from 'express';
import LectureModel from '../models/Lecture';
import AppError from '../utils/AppError';

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

  public static createLecture = catchAsync(async function (
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const subjectId = LectureController.extractSubjectID(req);
    req.body.subjectId = subjectId;

    console.log(req.body);

    const lecture = await LectureModel.createOne(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        lecture,
      },
    });
  });

  public static getAllLectures = catchAsync(async function (
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const subjectId = LectureController.extractSubjectID(req);

    const lectures = await LectureModel.findMany({
      where: {
        subjectId,
      },
    });

    res.status(200).json({
      status: 'success',
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

    const lecture = await LectureModel.findOneById(id!);

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

    const updatedLecture = await LectureModel.updateOne(id, req.body);

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

    await LectureModel.deleteOne(id);

    res.status(204).json({
      status: 'success',
      data: null,
    });
  });
}

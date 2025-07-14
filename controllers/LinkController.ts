import catchAsync from '../utils/catchAsync';
import { Request, Response, NextFunction } from 'express';
import LinkModel from '../models/Link';
import AppError from '../utils/AppError';

export default class LinkController {
  private static extractLectureID(req: Request): number {
    if (req.body.subjectId)
      throw new AppError(
        "Body cannot contain 'lectureId' field as its value comes from the path.",
        400,
      );

    // This will always exist as it is used in nested routes only
    const lectureId = Number.parseInt(req.params.lectureId);

    if (Number.isNaN(lectureId))
      throw new AppError(
        'Invalid lecture ID: lecture ID must be an integer.',
        400,
      );

    return lectureId;
  }

  private static extractLinkID(req: Request): number {
    const id = Number.parseInt(req.params.id);

    if (Number.isNaN(id))
      throw new AppError(
        'Invalid lecture link ID: lecture link ID must be an integer.',
        400,
      );

    return id;
  }

  public static createLink = catchAsync(async function (
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const lectureId = LinkController.extractLectureID(req);
    req.body.lectureId = lectureId;
    req.body.creatorId = req.user.id;

    const link = await LinkModel.createOne(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        link,
      },
    });
  });

  public static getAllLinks = catchAsync(async function (
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const lectureId = LinkController.extractLectureID(req);

    const links = await LinkModel.findMany({
      where: {
        lectureId,
      },
    });

    res.status(200).json({
      status: 'success',
      data: {
        links,
      },
    });
  });

  public static getLecture = catchAsync(async function (
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const id = LinkController.extractLinkID(req);

    const link = await LinkModel.findOneById(id!);

    res.status(200).json({
      status: 'success',
      data: {
        link,
      },
    });
  });

  public static updateLecture = catchAsync(async function (
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const id = LinkController.extractLinkID(req);

    const updatedLink = await LinkModel.updateOne(id, req.body);

    res.status(200).json({
      status: 'success',
      data: {
        link: updatedLink,
      },
    });
  });

  public static deleteLecture = catchAsync(async function (
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const id = LinkController.extractLinkID(req);

    await LinkModel.deleteOne(id);

    res.status(204).json({
      status: 'success',
      data: null,
    });
  });
}

import catchAsync from '../utils/catchAsync';
import { Request, Response, NextFunction } from 'express';
import QuestionAttemptModel from '../models/QuestionAttempt';
import AppError from '../utils/AppError';

export default class QuestionAttemptController {
  private static extractQuizAttemptID(req: Request): number {
    if (req.body.quizAttemptId)
      throw new AppError(
        "Body cannot contain 'quizAttemptId' field as its value comes from the path.",
        400,
      );

    // This will always exist as it is used in nested routes only
    const quizAttemptId = Number.parseInt(req.params.quizAttemptId);

    if (Number.isNaN(quizAttemptId))
      throw new AppError(
        'Invalid quiz attempt ID: quiz attempt ID must be an integer.',
        400,
      );

    return quizAttemptId;
  }

  private static extractQuestionAttemptID(req: Request): number {
    const id = Number.parseInt(req.params.id);

    if (Number.isNaN(id))
      throw new AppError(
        'Invalid question attempt ID: question attempt ID must be an integer.',
        400,
      );

    return id;
  }

  public static createAttempts = catchAsync(async function (
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const quizAttemptId = QuestionAttemptController.extractQuizAttemptID(req);

    req.body.quizAttemptId = quizAttemptId;

    const count = await QuestionAttemptModel.createMany(req.body);

    res.status(201).json({
      status: 'success',
      totalCount: count,
      data: {
        attempt: null,
      },
    });
  });

  public static getAllAttempts = catchAsync(async function (
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const quizAttemptId = QuestionAttemptController.extractQuizAttemptID(req);

    const attempts = await QuestionAttemptModel.findMany(
      { quizAttemptId },
      req.query,
    );

    res.status(200).json({
      status: 'success',
      totalCount: attempts.length,
      data: {
        attempts,
      },
    });
  });

  public static getAttempt = catchAsync(async function (
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const id = QuestionAttemptController.extractQuestionAttemptID(req);

    const attempt = await QuestionAttemptModel.findOneById(id, req.query);

    res.status(200).json({
      status: 'success',
      data: {
        attempt,
      },
    });
  });

  public static updateAttempt = catchAsync(async function (
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const id = QuestionAttemptController.extractQuestionAttemptID(req);

    const updatedAttempt = await QuestionAttemptModel.updateOne(
      id,
      req.body,
      req.query,
    );

    res.status(200).json({
      status: 'success',
      data: {
        attempt: updatedAttempt,
      },
    });
  });

  public static deleteAttempt = catchAsync(async function (
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const id = QuestionAttemptController.extractQuestionAttemptID(req);

    await QuestionAttemptModel.deleteOne(id);

    res.status(204).json({
      status: 'success',
      data: null,
    });
  });
}

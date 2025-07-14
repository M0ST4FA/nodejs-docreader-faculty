import catchAsync from '../utils/catchAsync';
import { Request, Response, NextFunction } from 'express';
import QuizModel from '../models/Quiz';
import AppError from '../utils/AppError';

export default class QuizController {
  private static extractLectureID(req: Request): number {
    if (req.body.lectureId)
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

  private static extractQuizID(req: Request): number {
    const id = Number.parseInt(req.params.id);

    if (Number.isNaN(id))
      throw new AppError('Invalid quiz ID: quiz ID must be an integer.', 400);

    return id;
  }

  public static createQuiz = catchAsync(async function (
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const lectureId = QuizController.extractLectureID(req);

    req.body.lectureId = lectureId;
    req.body.creatorId = req.user.id;

    const quiz = await QuizModel.createOne(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        quiz,
      },
    });
  });

  public static getAllQuizzes = catchAsync(async function (
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const lectureId = QuizController.extractLectureID(req);

    const quizzes = await QuizModel.findMany({
      where: {
        lectureId,
      },
    });

    res.status(200).json({
      status: 'success',
      data: {
        quizzes,
      },
    });
  });

  public static getQuiz = catchAsync(async function (
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const id = QuizController.extractQuizID(req);

    const quiz = await QuizModel.findOneById(id!);

    res.status(200).json({
      status: 'success',
      data: {
        quiz,
      },
    });
  });

  public static updateQuiz = catchAsync(async function (
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const id = QuizController.extractQuizID(req);

    const updatedQuiz = await QuizModel.updateOne(id, req.body);

    res.status(200).json({
      status: 'success',
      data: {
        quiz: updatedQuiz,
      },
    });
  });

  public static deleteQuiz = catchAsync(async function (
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const id = QuizController.extractQuizID(req);

    await QuizModel.deleteOne(id);

    res.status(204).json({
      status: 'success',
      data: null,
    });
  });
}

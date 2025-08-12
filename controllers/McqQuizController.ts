import catchAsync from '../utils/catchAsync';
import { Request, Response, NextFunction } from 'express';
import McqQuizModel from '../models/McqQuiz';
import AppError from '../utils/AppError';
import McqQuestionModel from '../models/McqQuestion';

export default class McqQuizController {
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

  private static extractQuestionID(req: Request): number {
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
    const lectureId = McqQuizController.extractLectureID(req);

    req.body.lectureId = lectureId;
    req.body.creatorId = req.user.id;

    const mcqQuiz = await McqQuizModel.createOne(req.body, req.query);

    res.status(201).json({
      status: 'success',
      data: {
        mcqQuiz,
      },
    });
  });

  public static getQuizzes = catchAsync(async function (
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const lectureId = McqQuizController.extractLectureID(req);

    const mcqQuizzes = await McqQuizModel.findMany(
      {
        lectureId,
      },
      req.query,
    );

    res.status(200).json({
      status: 'success',
      totalCount: mcqQuizzes.length,
      data: {
        mcqQuizzes,
      },
    });
  });

  public static getQuiz = catchAsync(async function (
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const id = McqQuizController.extractQuizID(req);

    const mcqQuiz = await McqQuizModel.findOneById(id, {
      ...req.query,
      include: 'questions,' + McqQuizModel.PATH_INCLUDE,
    });

    res.status(200).json({
      status: 'success',
      data: {
        mcqQuiz,
      },
    });
  });

  public static updateQuiz = catchAsync(async function (
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const id = McqQuizController.extractQuizID(req);

    const updatedQuiz = await McqQuizModel.updateOne(
      id,
      { ...req.body, notifiable: true },
      req.query,
    );

    res.status(200).json({
      status: 'success',
      data: {
        mcqQuiz: updatedQuiz,
      },
    });
  });

  public static deleteQuiz = catchAsync(async function (
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const id = McqQuizController.extractQuizID(req);

    const mcqQuiz = await McqQuizModel.deleteOne(id);

    res.status(200).json({
      status: 'success',
      data: { mcqQuiz },
    });
  });

  public static createQuestions = catchAsync(async function (
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const quizId = McqQuizController.extractQuizID(req);

    const mcqQuestions = await McqQuestionModel.createMany(
      quizId,
      req.user.id,
      req.body,
      {},
    );

    await McqQuizModel.updateOne(quizId, { notifiable: true }, {});

    res.status(201).json({
      status: 'success',
      totalCount: mcqQuestions.count,
      data: { mcqQuestions },
    });
  });

  public static updateQuestion = catchAsync(async function (
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const id = McqQuizController.extractQuestionID(req);

    const updatedQuestion = await McqQuestionModel.updateOne(id, req.body, {});

    await McqQuizModel.updateOne(
      updatedQuestion.quizId,
      {
        notifiable: true,
      },
      {},
    );

    res.status(200).json({
      status: 'success',
      data: {
        mcqQuestion: updatedQuestion,
      },
    });
  });

  public static deleteQuestion = catchAsync(async function (
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const id = McqQuizController.extractQuestionID(req);

    const mcqQuestion = await McqQuestionModel.deleteOne(id);

    await McqQuizModel.updateOne(
      mcqQuestion.quizId,
      {
        notifiable: true,
      },
      {},
    );

    res.status(200).json({
      status: 'success',
      data: { mcqQuestion },
    });
  });
}

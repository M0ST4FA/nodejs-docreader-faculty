import path from 'path';
import catchAsync from '../utils/catchAsync';
import { Request, Response, NextFunction } from 'express';
import WrittenQuizModel from '../models/WrittenQuiz';
import AppError from '../utils/AppError';
import WrittenQuestionModel from '../models/WrittenQuesiton';
import sharp from 'sharp';
import db from '../prisma/db';

export default class WrittenQuizController {
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
    const lectureId = WrittenQuizController.extractLectureID(req);

    req.body.lectureId = lectureId;
    req.body.creatorId = req.user.id;

    const writtenQuiz = await WrittenQuizModel.createOne(req.body, req.query);

    res.status(201).json({
      status: 'success',
      data: {
        writtenQuiz,
      },
    });
  });

  public static getQuizzes = catchAsync(async function (
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const lectureId = WrittenQuizController.extractLectureID(req);

    const writtenQuizzes = await WrittenQuizModel.findMany(
      {
        lectureId,
      },
      req.query,
    );

    res.status(200).json({
      status: 'success',
      totalCount: writtenQuizzes.length,
      data: {
        writtenQuizzes,
      },
    });
  });

  public static getQuiz = catchAsync(async function (
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const id = WrittenQuizController.extractQuizID(req);

    const writtenQuiz = await WrittenQuizModel.findOneById(id, {
      ...req.query,
      include:
        'questions,questions.tapes,questions.masks,questions.subQuestions,' +
        WrittenQuizModel.PATH_INCLUDE,
    });

    res.status(200).json({
      status: 'success',
      data: {
        writtenQuiz,
      },
    });
  });

  public static updateQuiz = catchAsync(async function (
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const id = WrittenQuizController.extractQuizID(req);

    const updatedQuiz = await WrittenQuizModel.updateOne(
      id,
      { ...req.body, notifiable: true },
      req.query,
    );

    res.status(200).json({
      status: 'success',
      data: {
        writtenQuiz: updatedQuiz,
      },
    });
  });

  public static deleteQuiz = catchAsync(async function (
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const id = WrittenQuizController.extractQuizID(req);

    const writtenQuiz = await WrittenQuizModel.deleteOne(id);

    res.status(200).json({
      status: 'success',
      data: { writtenQuiz },
    });
  });

  public static createQuestion = catchAsync(async function (
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const quizId = WrittenQuizController.extractQuizID(req);

    let filename, image, width, height;
    if (req.file) {
      filename = `${Math.floor(
        Math.random() * 1_000_000_000,
      )}-${Date.now()}.jpeg`;
      const outputPath = path.join(__dirname, '../public/image', filename);
      const compressed = await sharp(req.file.buffer)
        .toFormat('jpeg')
        .jpeg({ quality: 80 })
        .toFile(outputPath);
      image = filename;
      width = compressed.width;
      height = compressed.height;
    }

    const tapes = JSON.parse(req.body.tapes);
    const masks = JSON.parse(req.body.masks);
    const subQuestions = JSON.parse(req.body.subQuestions);

    const writtenQuestion = (await WrittenQuestionModel.createOne(
      {
        quizId,
        creatorId: req.user.id,
        image,
        width,
        height,
      },
      {},
    )) as WrittenQuestionModel;

    await WrittenQuestionModel.updateOne(writtenQuestion.id, req.user.id, {
      tapes,
      masks,
      subQuestions,
    });

    res.status(201).json({
      status: 'success',
      data: {
        writtenQuestion,
      },
    });
  });

  public static updateQuestion = catchAsync(async function (
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const id = WrittenQuizController.extractQuestionID(req);

    await WrittenQuestionModel.updateOne(id, req.user.id, req.body);

    const writtenQuestion = (await WrittenQuestionModel.findOneById(
      id,
      {},
    )) as WrittenQuestionModel;

    await WrittenQuizModel.updateOne(
      writtenQuestion.quizId,
      {
        notifiable: true,
      },
      {},
    );

    res.status(200).json({
      status: 'success',
      data: {
        writtenQuestion,
      },
    });
  });

  public static deleteQuestion = catchAsync(async function (
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const id = WrittenQuizController.extractQuestionID(req);

    const writtenQuestion = await WrittenQuestionModel.deleteOne(id);

    await WrittenQuizModel.updateOne(
      writtenQuestion.quizId,
      {
        notifiable: true,
      },
      {},
    );

    res.status(200).json({
      status: 'success',
      data: { writtenQuestion },
    });
  });
}

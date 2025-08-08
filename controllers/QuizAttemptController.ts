import catchAsync from '../utils/catchAsync';
import { Request, Response, NextFunction } from 'express';
import QuizAttemptModel from '../models/QuizAttempt';
import AppError from '../utils/AppError';
import db from '../prisma/db';

export default class QuizAttemptController {
  private static extractQuizID(req: Request): number {
    if (req.body.quizId)
      throw new AppError(
        "Body cannot contain 'quizId' field as its value comes from the path.",
        400,
      );

    // This will always exist as it is used in nested routes only
    const quizId = Number.parseInt(req.params.quizId);

    if (Number.isNaN(quizId))
      throw new AppError('Invalid quiz ID: quiz ID must be an integer.', 400);

    return quizId;
  }

  private static extractAttemptID(req: Request): number {
    const id = Number.parseInt(req.params.id);

    if (Number.isNaN(id))
      throw new AppError(
        'Invalid quiz attempt ID: quiz attempt ID must be an integer.',
        400,
      );

    return id;
  }

  private static async calculateScoreAndSubmitAttempt(quizAttemptId: number) {
    const result = await db.$transaction(async tx => {
      const attempt = await tx.quizAttempt.findUnique({
        where: { id: quizAttemptId },
      });

      if (!attempt)
        throw new AppError(
          `Couldn't find attempt with ID ${quizAttemptId} for submission.`,
          404,
        );

      // 1. BULK MARK CORRECT QUESTION ATTEMPTS
      await tx.$executeRaw`
      UPDATE "QuestionAttempt" qa
      SET    "isCorrect" = (q."correctAnswerIndex" IS NOT DISTINCT FROM qa."answerIndex")
      FROM    "Question" q
      WHERE   qa."questionId" = q."id"
        AND   qa."quizAttemptId"     = ${quizAttemptId}
    `;

      // 2. GET TOTAL QUESTIONS IN QUIZ
      const totalQuestionCount = await tx.question.count({
        where: { quizId: attempt.quizId },
      });

      // 3. GET TOTAL CORRECT ANSWERS
      const correctAnswerCount = await tx.questionAttempt.count({
        where: { quizAttemptId, isCorrect: true },
      });

      // 4. CALCULATE SCORE
      const score =
        totalQuestionCount > 0
          ? Math.round((correctAnswerCount / totalQuestionCount) * 10000) / 100
          : 0;

      // 5. UPDATE QUIZ ATTEMPT
      return await tx.quizAttempt.update({
        where: { id: quizAttemptId },
        data: {
          correctAnswerCount,
          score,
          status: 'SUBMITTED',
          submittedAt: new Date(),
        },
      });
    });

    return result;
  }

  public static createAttempt = catchAsync(async function (
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const quizId = QuizAttemptController.extractQuizID(req);

    req.body.quizId = quizId;
    req.body.userId = req.user.id;

    const attemptNumbers: number[] = (
      await QuizAttemptModel.findMany(
        { quizId, userId: req.user.id },
        { fields: 'attemptNumber' },
      )
    ).map(attempt => attempt.attemptNumber);

    let maxAttemptNumber = 0;

    if (attemptNumbers.length > 0)
      maxAttemptNumber = Math.max(...attemptNumbers);

    req.body.attemptNumber = maxAttemptNumber + 1;

    const attempt = await QuizAttemptModel.createOne(req.body, req.query);

    res.status(201).json({
      status: 'success',
      data: {
        attempt,
      },
    });
  });

  public static getAllAttempts = catchAsync(async function (
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const quizId = QuizAttemptController.extractQuizID(req);

    const attempts = await QuizAttemptModel.findMany({ quizId }, req.query);

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
    const id = QuizAttemptController.extractAttemptID(req);

    const attempt = await QuizAttemptModel.findOneById(id, req.query);

    res.status(200).json({
      status: 'success',
      data: {
        attempt,
      },
    });
  });

  public static blockIfAlreadySubmitted = catchAsync(async function (
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const id = QuizAttemptController.extractAttemptID(req);
    const attempt = (await QuizAttemptModel.findOneById(
      id,
      {},
    )) as QuizAttemptModel;

    if (attempt.isSubmitted());
  });

  public static submitAttempt = catchAsync(async function (
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const id = QuizAttemptController.extractAttemptID(req);

    const updatedAttempt =
      await QuizAttemptController.calculateScoreAndSubmitAttempt(id);

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
    const id = QuizAttemptController.extractAttemptID(req);

    await QuizAttemptModel.deleteOne(id);

    res.status(204).json({
      status: 'success',
      data: null,
    });
  });
}

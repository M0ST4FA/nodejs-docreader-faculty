import quizAttemptSchema from '../schema/quizAttempt.schema';
import { QuizAttempt as PrismaQuizAttempt } from '@prisma/client';
import db from '../prisma/db';
import { ModelFactory } from './ModelFactory';
import AppError from '../utils/AppError';

export default class QuizAttemptModel {
  private data: Partial<PrismaQuizAttempt>;

  private static wrapper(data: PrismaQuizAttempt): QuizAttemptModel {
    return new QuizAttemptModel(data);
  }

  constructor(data: Partial<PrismaQuizAttempt>) {
    this.data = data;
  }

  toJSON() {
    return this.data;
  }

  get attemptNumber(): number {
    return this.data.attemptNumber || 0;
  }

  public isSubmitted(): boolean {
    if (this.data.status === undefined)
      throw new AppError("Quiz attempt 'status' field is undefined.", 500);

    return this.data.status === 'SUBMITTED';
  }

  static createOne = ModelFactory.createOne(
    db.quizAttempt,
    quizAttemptSchema,
    QuizAttemptModel.wrapper,
  );

  static findMany = ModelFactory.findMany(
    db.quizAttempt,
    quizAttemptSchema,
    QuizAttemptModel.wrapper,
  );

  static findOneById = ModelFactory.findOneById(
    db.quizAttempt,
    quizAttemptSchema,
    QuizAttemptModel.wrapper,
  );

  static updateOne = ModelFactory.updateOne(
    db.quizAttempt,
    quizAttemptSchema,
    QuizAttemptModel.wrapper,
  );

  static deleteOne = ModelFactory.deleteOne(
    db.quizAttempt,
    QuizAttemptModel.wrapper,
  );
}

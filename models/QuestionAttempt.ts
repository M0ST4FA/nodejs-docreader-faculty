import questionAttemptSchema, {
  createManySchema,
  QuestionAttemptCreateManyInput,
} from '../schema/questionAttempt.schema';
import { QuestionAttempt as PrismaQuestionAttempt } from '@prisma/client';
import db from '../prisma/db';
import { ModelFactory } from './ModelFactory';
import AppError from '../utils/AppError';

export default class QuestionAttemptModel {
  private data: Partial<PrismaQuestionAttempt>;

  private static wrapper(data: PrismaQuestionAttempt): QuestionAttemptModel {
    return new QuestionAttemptModel(data);
  }

  constructor(data: Partial<PrismaQuestionAttempt>) {
    this.data = data;
  }

  toJSON() {
    return this.data;
  }

  static createOne = ModelFactory.createOne(
    db.questionAttempt,
    questionAttemptSchema,
    QuestionAttemptModel.wrapper,
  );

  static async createMany(data: QuestionAttemptCreateManyInput) {
    // 1. VALIDATE INPUT
    const validatedCreationBody = createManySchema.safeParse(data);

    if (!validatedCreationBody.success) {
      throw new AppError(
        `Invalid create input: [ ${validatedCreationBody.error.issues.map(
          issue => issue.message,
        )} ]}`,
        400,
      );
    }

    // 2. INSERT QUESTION ATTEMPTS
    let result;
    const fullAttempts = data.questionAttempts.map(attempt => {
      const quizAttemptId = data.quizAttemptId;

      return { quizAttemptId, ...attempt };
    });

    // 2a. OLDEST SYNC OVERRIDES NEWEST ONE
    if (data.oldestSyncWins)
      result = await db.questionAttempt.createMany({
        data: fullAttempts,
        skipDuplicates: true,
      });
    // 2b. NEWEST SYNC OVERRIDES OLDEST ONE
    else {
      result = (
        await db.$transaction([
          db.questionAttempt.deleteMany({
            where: {
              quizAttemptId: data.quizAttemptId,
              questionId: {
                in: data.questionAttempts.map(attempt => attempt.questionId),
              },
            },
          }),

          db.questionAttempt.createMany({
            data: fullAttempts,
            skipDuplicates: false,
          }),
        ])
      )[1];
    }

    return result.count;
  }

  static findMany = ModelFactory.findMany(
    db.questionAttempt,
    questionAttemptSchema,
    QuestionAttemptModel.wrapper,
  );

  static findOneById = ModelFactory.findOneById(
    db.questionAttempt,
    questionAttemptSchema,
    QuestionAttemptModel.wrapper,
  );

  static updateOne = ModelFactory.updateOne(
    db.questionAttempt,
    questionAttemptSchema,
    QuestionAttemptModel.wrapper,
  );

  static deleteOne = ModelFactory.deleteOne(
    db.questionAttempt,
    QuestionAttemptModel.wrapper,
  );
}

import quizSchema, { QuizFindInput } from '../schema/quiz.schema';
import { Quiz as PrismaQuiz } from '@prisma/client';
import db from '../prisma/db';
import AppError from '../utils/AppError';
import { ModelFactory } from './ModelFactory';

export default class QuizModel {
  private data: Partial<PrismaQuiz>;

  constructor(data: Partial<PrismaQuiz>) {
    this.data = data;

    if (!this.data.id)
      throw new AppError('Cannot create quiz without ID.', 400);
  }

  toJSON() {
    return this.data;
  }

  static createOne = ModelFactory.createOne(
    db.quiz,
    quizSchema,
    data => new QuizModel(data),
  );

  static async findMany(findObj: QuizFindInput) {
    const validatedFind = quizSchema.find.safeParse(findObj);

    if (!validatedFind.success)
      throw new AppError(
        `Invalid query object: ${JSON.stringify(
          validatedFind.error.issues,
          null,
          2,
        )}`,
        400,
      );

    const quizzes = await db.quiz.findMany({
      where: validatedFind.data.where,
      select: validatedFind.data.select,
      orderBy: validatedFind.data.orderBy,
      skip: validatedFind.data.pagination?.skip,
      take: validatedFind.data.pagination?.take,
    });

    if (quizzes.length === 0)
      throw new AppError(
        `Couldn't find any quiz based on provided criteria.`,
        404,
      );

    return quizzes.map(quiz => new QuizModel(quiz));
  }

  static async findOneById(id: number): Promise<QuizModel> {
    const quiz = await db.quiz.findUnique({
      where: {
        id,
      },
    });

    if (!quiz) throw new AppError(`Couldn't find quiz with ID ${id}.`, 404);

    return new QuizModel(quiz);
  }

  static findCreatorIdById = ModelFactory.findCreatorIdById(db.quiz);

  static updateOne = ModelFactory.updateOne(
    db.quiz,
    quizSchema,
    data => new QuizModel(data),
  );

  static deleteOne = ModelFactory.deleteOne(
    db.quiz,
    data => new QuizModel(data),
  );
}

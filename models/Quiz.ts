import quizSchema from '../schema/quiz.schema';
import { Quiz as PrismaQuiz } from '@prisma/client';
import db from '../prisma/db';
import { ModelFactory } from './ModelFactory';

export default class QuizModel {
  private data: Partial<PrismaQuiz>;

  private static wrapper(data: PrismaQuiz): QuizModel {
    return new QuizModel(data);
  }

  constructor(data: Partial<PrismaQuiz>) {
    this.data = data;
  }

  toJSON() {
    return this.data;
  }

  static createOne = ModelFactory.createOne(
    db.quiz,
    quizSchema,
    data => new QuizModel(data),
  );

  static findMany = ModelFactory.findMany(
    db.quiz,
    quizSchema,
    QuizModel.wrapper,
  );

  static findOneById = ModelFactory.findOneById(
    db.quiz,
    quizSchema,
    QuizModel.wrapper,
  );

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

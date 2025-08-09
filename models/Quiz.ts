import quizSchema from '../schema/quiz.schema';
import { Quiz as PrismaQuiz } from '@prisma/client';
import db from '../prisma/db';
import { ModelFactory } from './ModelFactory';
import buildInclude from '../utils/buildInclude';

export default class QuizModel {
  public static PATH_INCLUDE =
    'lectureData.id,lectureData.title,lectureData.subject.id,lectureData.subject.name,lectureData.subject.module.id,lectureData.subject.module.name,lectureData.subject.module.semesterName';
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

  static findNotifiable = async function (yearId: number) {
    return await db.quiz.findMany({
      where: {
        notifiable: true,
        lectureData: { subject: { module: { yearId } } },
      },
      include: buildInclude(QuizModel.PATH_INCLUDE),
    });
  };

  static ignore = async function (yearId: number, ids: number[]) {
    await db.quiz.updateMany({
      where: {
        AND: [
          { id: { in: ids } },
          { lectureData: { subject: { module: { yearId } } } },
        ],
      },
      data: { notifiable: false },
    });
  };

  static notify = async function (yearId: number, ids: number[]) {
    const where = {
      AND: [
        { id: { in: ids } },
        { lectureData: { subject: { module: { yearId } } } },
      ],
    };
    await db.quiz.updateMany({
      where,
      data: { notifiable: false },
    });
    return await db.quiz.findMany({
      where,
      include: buildInclude(QuizModel.PATH_INCLUDE),
    });
  };
}

import quizSchema from '../schema/mcqQuiz.schema';
import {
  McqQuiz as PrismaQuiz,
  McqQuestion as PrismaQuestion,
} from '@prisma/client';
import db from '../prisma/db';
import { ModelFactory } from './ModelFactory';
import buildInclude from '../utils/buildInclude';

export default class McqQuizModel {
  public static PATH_INCLUDE =
    'lectureData.id,lectureData.title,lectureData.subject.id,lectureData.subject.name,lectureData.subject.module.id,lectureData.subject.module.name,lectureData.subject.module.semesterName';
  private data: Partial<PrismaQuiz>;

  private static wrapper(data: PrismaQuiz): McqQuizModel {
    return new McqQuizModel(data);
  }

  constructor(data: Partial<PrismaQuiz>) {
    this.data = data;
  }

  toJSON() {
    return this.data;
  }

  static createOne = ModelFactory.createOne(
    db.mcqQuiz,
    quizSchema,
    data => new McqQuizModel(data),
  );

  static findMany = ModelFactory.findMany(
    db.mcqQuiz,
    quizSchema,
    McqQuizModel.wrapper,
  );

  static findOneById = ModelFactory.findOneById(
    db.mcqQuiz,
    quizSchema,
    McqQuizModel.wrapper,
  );

  static findCreatorIdById = ModelFactory.findCreatorIdById(db.mcqQuiz);

  static updateOne = ModelFactory.updateOne(
    db.mcqQuiz,
    quizSchema,
    data => new McqQuizModel(data),
  );

  static deleteOne = ModelFactory.deleteOne(
    db.mcqQuiz,
    data => new McqQuizModel(data),
  );

  static findNotifiable = async function (yearId: number) {
    return await db.mcqQuiz.findMany({
      where: {
        notifiable: true,
        lectureData: { subject: { module: { yearId } } },
      },
      include: buildInclude(McqQuizModel.PATH_INCLUDE),
    });
  };

  static ignore = async function (yearId: number, ids: number[]) {
    await db.mcqQuiz.updateMany({
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
    await db.mcqQuiz.updateMany({
      where,
      data: { notifiable: false },
    });
    return await db.mcqQuiz.findMany({
      where,
      include: buildInclude(McqQuizModel.PATH_INCLUDE),
    });
  };
}

import quizSchema from '../schema/writtenQuiz.schema';
import { WrittenQuiz as PrismaQuiz } from '@prisma/client';
import db from '../prisma/db';
import { ModelFactory } from './ModelFactory';
import buildInclude from '../utils/buildInclude';
import path from 'path';
import ImageUtils from '../utils/ImageUtils';
import WrittenQuestionModel from './WrittenQuesiton';
import AppError from '../utils/AppError';
import { QueryParamsService } from '../utils/QueryParamsService';

export default class WrittenQuizModel {
  public static PATH_INCLUDE =
    'lectureData.id,lectureData.title,lectureData.subject.id,lectureData.subject.name,lectureData.subject.module.id,lectureData.subject.module.name,lectureData.subject.module.semesterName';
  private data: Partial<PrismaQuiz>;

  private static wrapper(data: PrismaQuiz): WrittenQuizModel {
    return new WrittenQuizModel(data);
  }

  constructor(data: Partial<PrismaQuiz>) {
    this.data = data;
  }

  toJSON() {
    return this.data;
  }

  static createOne = ModelFactory.createOne(
    db.writtenQuiz,
    quizSchema,
    data => new WrittenQuizModel(data),
  );

  static findMany = ModelFactory.findMany(
    db.writtenQuiz,
    quizSchema,
    WrittenQuizModel.wrapper,
  );

  static findOneById = ModelFactory.findOneById(
    db.writtenQuiz,
    quizSchema,
    WrittenQuizModel.wrapper,
  );

  // static async findOneById(id: number, queryParams: any) {
  //   if (Number.isNaN(id))
  //     throw new AppError('Invalid resource ID. Must be an integer.', 400);

  //   QueryParamsService.parse<typeof quizSchema.query>(
  //     quizSchema,
  //     queryParams,
  //     {},
  //   );

  //   const writtenQuiz = await db.writtenQuiz.findUnique({
  //     where: {
  //       id,
  //     },
  //     include: {
  //       ...buildInclude(WrittenQuizModel.PATH_INCLUDE),
  //       questions: {
  //         orderBy: { id: 'asc' },
  //         include: {
  //           tapes: true,
  //           masks: true,
  //           subQuestions: {
  //             orderBy: { id: 'asc' },
  //           },
  //         },
  //       },
  //     },
  //   });

  //   if (!writtenQuiz)
  //     throw new AppError(`Couldn't find resource with ID ${id}.`, 404);

  //   return new WrittenQuizModel(writtenQuiz);
  // }

  static findCreatorIdById = ModelFactory.findCreatorIdById(db.writtenQuiz);

  static updateOne = ModelFactory.updateOne(
    db.writtenQuiz,
    quizSchema,
    data => new WrittenQuizModel(data),
  );

  static async deleteOne(id: number) {
    const writtenQuestions = await db.writtenQuestion.findMany({
      where: { quizId: id },
      select: { id: true },
    });
    await Promise.all(
      writtenQuestions.map(({ id }) => WrittenQuestionModel.deleteOne(id)),
    );
    return await db.writtenQuiz.delete({
      where: { id },
    });
  }

  static findNotifiable = async function (yearId: number) {
    return await db.writtenQuiz.findMany({
      where: {
        notifiable: true,
        lectureData: { subject: { module: { yearId } } },
      },
      include: buildInclude(WrittenQuizModel.PATH_INCLUDE),
    });
  };

  static ignore = async function (yearId: number, ids: number[]) {
    await db.writtenQuiz.updateMany({
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
    await db.writtenQuiz.updateMany({
      where,
      data: { notifiable: false },
    });
    return await db.writtenQuiz.findMany({
      where,
      include: buildInclude(WrittenQuizModel.PATH_INCLUDE),
    });
  };
}

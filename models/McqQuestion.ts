import z from 'zod';
import questionSchema from '../schema/mcqQuestion.schema';
import { McqQuestion as PrismaQuestion } from '@prisma/client';
import db from '../prisma/db';
import { ModelFactory } from './ModelFactory';
import AppError from '../utils/AppError';
import { QueryParamsService } from '../utils/QueryParamsService';

export default class McqQuestionModel {
  private data: Partial<PrismaQuestion>;

  private static wrapper(data: PrismaQuestion): McqQuestionModel {
    return new McqQuestionModel(data);
  }

  constructor(data: Partial<PrismaQuestion>) {
    this.data = data;
  }

  toJSON() {
    return this.data;
  }

  get quizId(): number {
    if (this.data.quizId === undefined)
      throw new AppError('Written quiz id field is undefined.', 500);

    return this.data.quizId;
  }

  static createMany = async function (
    quizId: number,
    creatorId: number,
    data: any,
    queryParams: any,
  ) {
    const validatedCreationBody = z
      .array(questionSchema.create)
      .safeParse(data);

    if (!validatedCreationBody.success) {
      throw new AppError(
        `Invalid create input: [ ${validatedCreationBody.error.issues.map(
          issue => issue.message,
        )} ]}`,
        400,
      );
    }
    QueryParamsService.parse<typeof questionSchema.query>(
      questionSchema,
      queryParams,
      {},
    );
    const created = await db.mcqQuestion.createMany({
      data: data.map((question: any) => ({
        ...question,
        quizId,
        creatorId,
      })),
    });
    return created;
  };

  static findMany = ModelFactory.findMany(
    db.mcqQuestion,
    questionSchema,
    McqQuestionModel.wrapper,
  );

  static findOneById = ModelFactory.findOneById(
    db.mcqQuestion,
    questionSchema,
    McqQuestionModel.wrapper,
  );

  static findCreatorIdById = ModelFactory.findCreatorIdById(db.mcqQuestion);

  static updateOne = ModelFactory.updateOne(
    db.mcqQuestion,
    questionSchema,
    data => new McqQuestionModel(data),
  );

  static deleteOne = ModelFactory.deleteOne(
    db.mcqQuestion,
    data => new McqQuestionModel(data),
  );
}

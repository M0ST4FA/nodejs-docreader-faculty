import yearSchema from '../schema/year.schema';
import { StudyingYear as PrismaYear } from '@prisma/client';
import db from '../prisma/db';
import { ModelFactory } from './ModelFactory';
import AppError from '../utils/AppError';

export default class YearModel {
  private data: Partial<PrismaYear>;

  private static wrapper(data: PrismaYear): YearModel {
    return new YearModel(data);
  }

  constructor(data: Partial<PrismaYear>) {
    this.data = data;
  }

  toJSON() {
    return this.data;
  }

  get id(): number {
    if (this.data.id === undefined)
      throw new AppError("'id' field not defined on year!", 500);

    return this.data.id;
  }

  get title(): string {
    if (this.data.title === undefined)
      throw new AppError("'title' field not defined on year!", 500);

    return this.data.title;
  }

  static createOne = ModelFactory.createOne(
    db.studyingYear,
    yearSchema,
    YearModel.wrapper,
  );

  static findMany = ModelFactory.findMany(
    db.studyingYear,
    yearSchema,
    YearModel.wrapper,
  );

  static findOneById = ModelFactory.findOneById(
    db.studyingYear,
    yearSchema,
    YearModel.wrapper,
  );

  static findCreatorIdById = ModelFactory.findCreatorIdById(db.studyingYear);

  static updateOne = ModelFactory.updateOne(
    db.studyingYear,
    yearSchema,
    YearModel.wrapper,
  );

  static deleteOne = ModelFactory.deleteOne(db.studyingYear, YearModel.wrapper);
}

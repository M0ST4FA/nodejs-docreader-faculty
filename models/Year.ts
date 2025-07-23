import yearSchema from '../schema/year.schema';
import { StudyingYear as PrismaYear } from '@prisma/client';
import db from '../prisma/db';
import { ModelFactory } from './ModelFactory';

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

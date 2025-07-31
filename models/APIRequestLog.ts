import logSchema from '../schema/log.schema';
import { APIRequestLog as PrismaAPIRequestLog } from '@prisma/client';
import db from '../prisma/db';
import { ModelFactory } from './ModelFactory';
import AppError from '../utils/AppError';

export default class LogModel {
  private data: Partial<PrismaAPIRequestLog>;

  private static wrapper(data: PrismaAPIRequestLog): LogModel {
    return new LogModel(data);
  }

  constructor(data: Partial<PrismaAPIRequestLog>) {
    this.data = data;
  }

  get id(): number {
    if (this.data.id === undefined)
      throw new AppError(`Log 'id' field is undefined.`, 500);

    return this.data.id;
  }

  toJSON() {
    return this.data;
  }

  static createOne = ModelFactory.createOne(
    db.aPIRequestLog,
    logSchema,
    LogModel.wrapper,
  );

  static findMany = ModelFactory.findMany(
    db.aPIRequestLog,
    logSchema,
    LogModel.wrapper,
  );

  static findOneById = ModelFactory.findOneById(
    db.aPIRequestLog,
    logSchema,
    LogModel.wrapper,
  );

  static deleteOne = ModelFactory.deleteOne(db.aPIRequestLog, LogModel.wrapper);
}

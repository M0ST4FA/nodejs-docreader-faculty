import userActivitySchema from '../schema/activity.schema';
import { UserActivity as PrismaUserActivity } from '@prisma/client';
import db from '../prisma/db';
import { ModelFactory } from './ModelFactory';

export default class UserActivityModel {
  private data: Partial<PrismaUserActivity>;

  private static wrapper(data: PrismaUserActivity): UserActivityModel {
    return new UserActivityModel(data);
  }

  constructor(data: Partial<PrismaUserActivity>) {
    this.data = data;
  }

  toJSON() {
    return this.data;
  }

  static createOne = ModelFactory.createOne(
    db.userActivity,
    userActivitySchema,
    UserActivityModel.wrapper,
  );

  static findMany = ModelFactory.findMany(
    db.userActivity,
    userActivitySchema,
    UserActivityModel.wrapper,
  );

  static findOneById = ModelFactory.findOneById(
    db.userActivity,
    userActivitySchema,
    UserActivityModel.wrapper,
  );

  static updateOne = ModelFactory.updateOne(
    db.userActivity,
    userActivitySchema,
    UserActivityModel.wrapper,
  );

  static deleteOne = ModelFactory.deleteOne(
    db.userActivity,
    UserActivityModel.wrapper,
  );
}

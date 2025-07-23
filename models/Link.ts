import linkSchema from '../schema/link.schema';
import { LectureLink as PrismaLink } from '@prisma/client';
import db from '../prisma/db';
import { ModelFactory } from './ModelFactory';

export default class LinkModel {
  private data: Partial<PrismaLink>;

  private static wrapper(data: PrismaLink): LinkModel {
    return new LinkModel(data);
  }

  constructor(data: Partial<PrismaLink>) {
    this.data = data;
  }

  toJSON() {
    return this.data;
  }

  static createOne = ModelFactory.createOne(
    db.lectureLink,
    linkSchema,
    LinkModel.wrapper,
  );

  static findMany = ModelFactory.findMany(
    db.lectureLink,
    linkSchema,
    LinkModel.wrapper,
  );

  static findOneById = ModelFactory.findOneById(
    db.lectureLink,
    linkSchema,
    LinkModel.wrapper,
  );

  static findCreatorIdById = ModelFactory.findCreatorIdById(db.lectureLink);

  static updateOne = ModelFactory.updateOne(
    db.lectureLink,
    linkSchema,
    LinkModel.wrapper,
  );

  static deleteOne = ModelFactory.deleteOne(db.lectureLink, LinkModel.wrapper);
}

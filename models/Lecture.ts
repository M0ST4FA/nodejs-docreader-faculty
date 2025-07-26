import lectureSchema from '../schema/lecture.schema';
import { Lecture as PrismaLecture } from '@prisma/client';
import db from '../prisma/db';
import { ModelFactory } from './ModelFactory';

export default class LectureModel {
  private data: Partial<PrismaLecture>;

  private static wrapper(data: PrismaLecture): LectureModel {
    return new LectureModel(data);
  }

  constructor(data: Partial<PrismaLecture>) {
    this.data = data;
  }

  toJSON() {
    return this.data;
  }

  static createOne = ModelFactory.createOne(
    db.lecture,
    lectureSchema,
    LectureModel.wrapper,
  );

  static findMany = ModelFactory.findMany(
    db.lecture,
    lectureSchema,
    LectureModel.wrapper,
  );

  static findOneById = ModelFactory.findOneById(
    db.lecture,
    lectureSchema,
    LectureModel.wrapper,
  );

  static findCreatorIdById = ModelFactory.findCreatorIdById(db.lecture);

  static updateOne = ModelFactory.updateOne(
    db.lecture,
    lectureSchema,
    LectureModel.wrapper,
  );

  static deleteOne = ModelFactory.deleteOne(db.lecture, LectureModel.wrapper);
}

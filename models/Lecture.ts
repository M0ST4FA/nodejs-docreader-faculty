import lectureSchema from '../schema/lecture.schema';
import { Lecture as PrismaLecture } from '@prisma/client';
import db from '../prisma/db';
import { ModelFactory } from './ModelFactory';
import AppError from '../utils/AppError';

export default class LectureModel {
  public static PATH_INCLUDE =
    'subject.id,subject.name,subject.module.id,subject.module.semesterName,subject.module.name';
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

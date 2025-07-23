import subjectSchema from '../schema/subject.schema';
import { Subject as PrismaSubject } from '@prisma/client';
import db from '../prisma/db';
import { ModelFactory } from './ModelFactory';

export default class SubjectModel {
  private data: Partial<PrismaSubject>;

  private static wrapper(data: PrismaSubject): SubjectModel {
    return new SubjectModel(data);
  }

  constructor(data: Partial<PrismaSubject>) {
    this.data = data;
  }

  toJSON() {
    return this.data;
  }

  static createOne = ModelFactory.createOne(
    db.subject,
    subjectSchema,
    SubjectModel.wrapper,
  );

  static findMany = ModelFactory.findMany(
    db.subject,
    subjectSchema,
    SubjectModel.wrapper,
  );

  static findOneById = ModelFactory.findOneById(
    db.subject,
    subjectSchema,
    SubjectModel.wrapper,
  );

  static findCreatorIdById = ModelFactory.findCreatorIdById(db.subject);

  static updateOne = ModelFactory.updateOne(
    db.subject,
    subjectSchema,
    SubjectModel.wrapper,
  );

  static deleteOne = ModelFactory.deleteOne(db.subject, SubjectModel.wrapper);
}

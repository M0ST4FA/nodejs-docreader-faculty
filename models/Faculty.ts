import facultySchema from '../schema/faculty.schema';
import { Faculty as PrismaFaculty } from '@prisma/client';
import db from '../prisma/db';
import { ModelFactory } from './ModelFactory';

export default class FacultyModel {
  private data: Partial<PrismaFaculty>;

  private static wrapper(data: PrismaFaculty): FacultyModel {
    return new FacultyModel(data);
  }

  constructor(data: Partial<PrismaFaculty>) {
    this.data = data;
  }

  toJSON() {
    return this.data;
  }

  static createOne = ModelFactory.createOne(
    db.faculty,
    facultySchema,
    FacultyModel.wrapper,
  );

  static findMany = ModelFactory.findMany(
    db.faculty,
    facultySchema,
    FacultyModel.wrapper,
  );

  static findOneById = ModelFactory.findOneById(
    db.faculty,
    facultySchema,
    FacultyModel.wrapper,
  );

  static findCreatorIdById = ModelFactory.findCreatorIdById(db.faculty);

  static updateOne = ModelFactory.updateOne(
    db.faculty,
    facultySchema,
    FacultyModel.wrapper,
  );

  static deleteOne = ModelFactory.deleteOne(db.faculty, FacultyModel.wrapper);
}

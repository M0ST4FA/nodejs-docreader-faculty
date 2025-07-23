import facultySchema, {
  FacultyFindInput,
  FacultyQueryParamInput,
  FacultyWhereInput,
} from '../schema/faculty.schema';
import { Faculty as PrismaFaculty } from '@prisma/client';
import db from '../prisma/db';
import AppError from '../utils/AppError';
import { ModelFactory } from './ModelFactory';
import { QueryParamsService } from '../utils/QueryParamsService';

export default class FacultyModel {
  private data: Partial<PrismaFaculty>;

  constructor(data: Partial<PrismaFaculty>) {
    this.data = data;
  }

  toJSON() {
    return this.data;
  }

  static createOne = ModelFactory.createOne(
    db.faculty,
    facultySchema,
    data => new FacultyModel(data),
  );

  static findMany = ModelFactory.findMany(
    db.faculty,
    facultySchema,
    data => new FacultyModel(data),
  );

  static findOneById = ModelFactory.findOneById<
    FacultyFindInput,
    PrismaFaculty,
    FacultyModel
  >(db.faculty, facultySchema, data => new FacultyModel(data));

  static findCreatorIdById = ModelFactory.findCreatorIdById(db.faculty);

  static updateOne = ModelFactory.updateOne(
    db.faculty,
    facultySchema,
    data => new FacultyModel(data),
  );

  static deleteOne = ModelFactory.deleteOne(
    db.faculty,
    data => new FacultyModel(data),
  );
}

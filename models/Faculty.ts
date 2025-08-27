import facultySchema from '../schema/faculty.schema';
import { Faculty as PrismaFaculty } from '@prisma/client';
import db from '../prisma/db';
import { ModelFactory } from './ModelFactory';
import AppError from '../utils/AppError';
import TopicModel from './Topic';

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

  get id(): number {
    if (this.data.id === undefined)
      throw new AppError("'id' field not defined on faculty!", 500);

    return this.data.id;
  }

  get name(): string {
    if (this.data.name === undefined)
      throw new AppError("'name' field not defined on faculty!", 500);

    return this.data.name;
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

  static deleteOne = async function (id: number) {
    const [result, __] = await Promise.all([
      db.faculty.delete({ where: { id } }),
      TopicModel.deleteAllFacultyTopics(id),
    ]);

    return new FacultyModel(result);
  };
}

import lectureSchema from '../schema/lecture.schema';
import { Lecture as PrismaLecture } from '@prisma/client';
import db from '../prisma/db';
import { ModelFactory } from './ModelFactory';
import AppError from '../utils/AppError';
import { QueryParamsService } from '../utils/QueryParamsService';

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

  static async findMany(where: any, query: any) {
    const search = query?.search;
    delete query?.search;

    const validatedQueryParams: any = QueryParamsService.parse<
      typeof lectureSchema.query
    >(lectureSchema, query, {
      pagination: true,
      projection: true,
      sorting: true,
      joining: true,
    });

    let lectures;

    const updatedWhere: any = {
      title: {
        contains: search,
        mode: 'insensitive',
      },
      ...where,
    };

    if (validatedQueryParams.include)
      lectures = await db.lecture.findMany({
        where: updatedWhere,
        include: validatedQueryParams.include,
        orderBy: validatedQueryParams.orderBy,
        skip: validatedQueryParams.skip,
        take: validatedQueryParams.take,
      });
    else
      lectures = await db.lecture.findMany({
        where: updatedWhere,
        orderBy: validatedQueryParams.orderBy,
        skip: validatedQueryParams.skip,
        take: validatedQueryParams.take,
      });

    return lectures;
  }

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

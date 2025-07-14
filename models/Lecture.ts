import lectureSchema, { LectureFindInput } from '../schema/lecture.schema';
import { Lecture as PrismaLecture } from '@prisma/client';
import db from '../prisma/db';
import AppError from '../utils/AppError';
import { ModelFactory } from './ModelFactory';

export default class LectureModel {
  private data: Partial<PrismaLecture>;

  constructor(data: Partial<PrismaLecture>) {
    this.data = data;

    if (!this.data.id)
      throw new AppError('Cannot create lecture without ID.', 400);
  }

  toJSON() {
    return this.data;
  }

  static createOne = ModelFactory.createOne(
    db.lecture,
    lectureSchema,
    data => new LectureModel(data),
  );

  static async findMany(findObj: LectureFindInput) {
    const validatedFind = lectureSchema.find.safeParse(findObj);

    if (!validatedFind.success)
      throw new AppError(
        `Invalid query object: ${JSON.stringify(
          validatedFind.error.issues,
          null,
          2,
        )}`,
        400,
      );

    const lectures = await db.lecture.findMany({
      where: validatedFind.data.where,
      select: validatedFind.data.select,
      orderBy: validatedFind.data.orderBy,
      skip: validatedFind.data.pagination?.skip,
      take: validatedFind.data.pagination?.take,
    });

    if (lectures.length === 0)
      throw new AppError(
        `Couldn't find any lecture based on provided criteria.`,
        404,
      );

    return lectures.map(lecture => new LectureModel(lecture));
  }

  static async findOneById(id: number): Promise<LectureModel> {
    const lecture = await db.lecture.findUnique({
      where: {
        id,
      },
    });

    if (!lecture)
      throw new AppError(`Couldn't find lecture with ID ${id}.`, 404);

    return new LectureModel(lecture);
  }

  static findCreatorIdById = ModelFactory.findCreatorIdById(db.lecture);

  static updateOne = ModelFactory.updateOne(
    db.lecture,
    lectureSchema,
    data => new LectureModel(data),
  );

  static deleteOne = ModelFactory.deleteOne(
    db.lecture,
    data => new LectureModel(data),
  );
}

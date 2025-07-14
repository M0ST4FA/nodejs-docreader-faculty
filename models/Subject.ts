import subjectSchema, { SubjectFindInput } from '../schema/subject.schema';
import { Subject as PrismaSubject } from '@prisma/client';
import db from '../prisma/db';
import AppError from '../utils/AppError';
import { ModelFactory } from './ModelFactory';

export default class SubjectModel {
  private data: Partial<PrismaSubject>;

  constructor(data: Partial<PrismaSubject>) {
    this.data = data;

    if (!this.data.id)
      throw new AppError('Cannot create subject without ID.', 400);
  }

  toJSON() {
    return this.data;
  }

  static createOne = ModelFactory.createOne(
    db.subject,
    subjectSchema,
    data => new SubjectModel(data),
  );

  static async findMany(findObj: SubjectFindInput) {
    const validatedFind = subjectSchema.find.safeParse(findObj);

    if (!validatedFind.success)
      throw new AppError(
        `Invalid query object: ${JSON.stringify(
          validatedFind.error.issues,
          null,
          2,
        )}`,
        400,
      );

    const subjects = await db.subject.findMany({
      where: validatedFind.data.where,
      select: validatedFind.data.select,
      orderBy: validatedFind.data.orderBy,
      skip: validatedFind.data.pagination?.skip,
      take: validatedFind.data.pagination?.take,
    });

    if (subjects.length === 0)
      throw new AppError(
        `Couldn't find any subject based on provided criteria.`,
        404,
      );

    return subjects.map(subject => new SubjectModel(subject));
  }

  static async findOneById(id: number): Promise<SubjectModel> {
    const subject = await db.subject.findUnique({
      where: {
        id,
      },
      include: {
        lectures: {
          select: {
            id: true,
            title: true,
            subTitle: true,
            type: true,
            date: true,
          },
        },
      },
    });

    if (!subject)
      throw new AppError(`Couldn't find subject with ID ${id}.`, 404);

    return new SubjectModel(subject);
  }

  static findCreatorIdById = ModelFactory.findCreatorIdById(db.subject);

  static updateOne = ModelFactory.updateOne(
    db.subject,
    subjectSchema,
    data => new SubjectModel(data),
  );

  static deleteOne = ModelFactory.deleteOne(
    db.subject,
    data => new SubjectModel(data),
  );
}

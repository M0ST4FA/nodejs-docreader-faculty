import yearSchema, { YearFindInput } from '../schema/year.schema';
import { StudyingYear as PrismaYear } from '@prisma/client';
import db from '../prisma/db';
import AppError from '../utils/AppError';
import { ModelFactory } from './ModelFactory';

export default class YearModel {
  private data: Partial<PrismaYear>;

  constructor(data: Partial<PrismaYear>) {
    this.data = data;

    if (!this.data.id)
      throw new AppError('Cannot create module without ID.', 400);
  }

  toJSON() {
    return this.data;
  }

  static createOne = ModelFactory.createOne(
    db.studyingYear,
    yearSchema,
    data => new YearModel(data),
  );

  static async findMany(findObj: YearFindInput) {
    const validatedFind = yearSchema.find.safeParse(findObj);

    if (!validatedFind.success)
      throw new AppError(
        `Invalid query object: ${JSON.stringify(
          validatedFind.error.issues,
          null,
          2,
        )}`,
        400,
      );

    const years = await db.studyingYear.findMany({
      where: validatedFind.data.where,
      select: validatedFind.data.select,
      orderBy: validatedFind.data.orderBy,
      skip: validatedFind.data.pagination?.skip,
      take: validatedFind.data.pagination?.take,
    });

    if (years.length === 0)
      throw new AppError(
        `Couldn't find any module based on provided criteria.`,
        404,
      );

    return years.map(year => new YearModel(year));
  }

  static async findOneById(id: number): Promise<YearModel> {
    const year = await db.studyingYear.findUnique({
      where: {
        id,
      },
      include: {
        modules: true, // Whenever you fetch a year, you will almost always need its modules
      },
    });

    if (!year)
      throw new AppError(`Couldn't find studying year with ID ${id}.`, 404);

    return new YearModel(year);
  }

  static findCreatorIdById = ModelFactory.findCreatorIdById(db.studyingYear);

  static updateOne = ModelFactory.updateOne(
    db.studyingYear,
    yearSchema,
    data => new YearModel(data),
  );

  static deleteOne = ModelFactory.deleteOne(
    db.studyingYear,
    data => new YearModel(data),
  );
}

import linkSchema, { LinkFindInput } from '../schema/link.schema';
import { LectureLink as PrismaLink } from '@prisma/client';
import db from '../prisma/db';
import AppError from '../utils/AppError';
import { ModelFactory } from './ModelFactory';

export default class LinkModel {
  private data: Partial<PrismaLink>;

  constructor(data: Partial<PrismaLink>) {
    this.data = data;

    if (!this.data.id)
      throw new AppError('Cannot create link without ID.', 400);
  }

  toJSON() {
    return this.data;
  }

  static createOne = ModelFactory.createOne(
    db.lectureLink,
    linkSchema,
    data => new LinkModel(data),
  );

  static async findMany(findObj: LinkFindInput) {
    const validatedFind = linkSchema.find.safeParse(findObj);

    if (!validatedFind.success)
      throw new AppError(
        `Invalid query object: ${JSON.stringify(
          validatedFind.error.issues,
          null,
          2,
        )}`,
        400,
      );

    const links = await db.lectureLink.findMany({
      where: validatedFind.data.where,
      select: validatedFind.data.select,
      orderBy: validatedFind.data.orderBy,
      skip: validatedFind.data.pagination?.skip,
      take: validatedFind.data.pagination?.take,
    });

    if (links.length === 0)
      throw new AppError(
        `Couldn't find any lecture link based on provided criteria.`,
        404,
      );

    return links.map(link => new LinkModel(link));
  }

  static async findOneById(id: number): Promise<LinkModel> {
    const link = await db.lectureLink.findUnique({
      where: {
        id,
      },
    });

    if (!link)
      throw new AppError(`Couldn't find lecture link with ID ${id}.`, 404);

    return new LinkModel(link);
  }

  static findCreatorIdById = ModelFactory.findCreatorIdById(db.lectureLink);

  static updateOne = ModelFactory.updateOne(
    db.lectureLink,
    linkSchema,
    data => new LinkModel(data),
  );

  static deleteOne = ModelFactory.deleteOne(
    db.lectureLink,
    data => new LinkModel(data),
  );
}

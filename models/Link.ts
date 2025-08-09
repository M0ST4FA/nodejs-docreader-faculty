import linkSchema from '../schema/link.schema';
import { LectureLink as PrismaLink } from '@prisma/client';
import db from '../prisma/db';
import { ModelFactory } from './ModelFactory';
import buildInclude from '../utils/buildInclude';

export default class LinkModel {
  public static PATH_INCLUDE =
    'lectureData.id,lectureData.title,lectureData.subject.id,lectureData.subject.name,lectureData.subject.module.id,lectureData.subject.module.name,lectureData.subject.module.semesterName';
  private data: Partial<PrismaLink>;

  private static wrapper(data: PrismaLink): LinkModel {
    return new LinkModel(data);
  }

  constructor(data: Partial<PrismaLink>) {
    this.data = data;
  }

  toJSON() {
    return this.data;
  }

  static createOne = ModelFactory.createOne(
    db.lectureLink,
    linkSchema,
    LinkModel.wrapper,
  );

  static findMany = ModelFactory.findMany(
    db.lectureLink,
    linkSchema,
    LinkModel.wrapper,
  );

  static findOneById = ModelFactory.findOneById(
    db.lectureLink,
    linkSchema,
    LinkModel.wrapper,
  );

  static findCreatorIdById = ModelFactory.findCreatorIdById(db.lectureLink);

  static updateOne = ModelFactory.updateOne(
    db.lectureLink,
    linkSchema,
    LinkModel.wrapper,
  );

  static deleteOne = ModelFactory.deleteOne(db.lectureLink, LinkModel.wrapper);

  static findNotifiable = async function (yearId: number) {
    return await db.lectureLink.findMany({
      where: {
        notifiable: true,
        lectureData: { subject: { module: { yearId } } },
      },
      include: buildInclude(LinkModel.PATH_INCLUDE),
    });
  };

  static ignore = async function (yearId: number, ids: number[]) {
    await db.lectureLink.updateMany({
      where: {
        AND: [
          { id: { in: ids } },
          { lectureData: { subject: { module: { yearId } } } },
        ],
      },
      data: { notifiable: false },
    });
  };

  static notify = async function (yearId: number, ids: number[]) {
    const where = {
      AND: [
        { id: { in: ids } },
        { lectureData: { subject: { module: { yearId } } } },
      ],
    };
    await db.lectureLink.updateMany({
      where,
      data: { notifiable: false },
    });
    return await db.lectureLink.findMany({
      where,
      include: buildInclude(LinkModel.PATH_INCLUDE),
    });
  };
}

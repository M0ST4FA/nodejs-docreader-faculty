import topicSchema, { TopicUpdateInput } from '../schema/topic.schema';
import { Topic as PrismaTopic } from '@prisma/client';
import db from '../prisma/db';
import { ModelFactory } from './ModelFactory';
import AppError from '../utils/AppError';
import { QueryParamsService } from '../utils/QueryParamsService';
import fcmService from '../utils/FCMService';

export default class TopicModel {
  private data: Partial<PrismaTopic>;

  private static wrapper(data: PrismaTopic): TopicModel {
    return new TopicModel(data);
  }

  private static async unsubscribeAllDevicesFromTopic(name: string) {
    const devicesSubscribedToTopic = await db.deviceTopic.findMany({
      where: { topic: { name } },
      include: { device: { select: { token: true } } },
    });

    if (devicesSubscribedToTopic.length === 0)
      return {
        failedTokens: [],
        successfulTokens: [],
      };

    const deviceTokens = devicesSubscribedToTopic.map(
      device => device.device.token,
    );

    return await fcmService.unsubscribeDevicesFromTopic(deviceTokens, name);
  }

  constructor(data: Partial<PrismaTopic>) {
    this.data = data;
  }

  get name(): string {
    if (this.data.name === undefined)
      throw new AppError('Topic name field is undefined.', 500);

    return this.data.name;
  }

  get id(): number {
    if (this.data.id === undefined)
      throw new AppError(`Topic 'id' field is undefined.`, 500);

    return this.data.id;
  }

  get public(): Boolean | null {
    return typeof this.data.public === 'boolean' ? this.data.public : null;
  }

  toJSON() {
    return this.data;
  }

  static createOne = ModelFactory.createOne(
    db.topic,
    topicSchema,
    TopicModel.wrapper,
  );

  static findMany = ModelFactory.findMany(
    db.topic,
    topicSchema,
    TopicModel.wrapper,
  );

  static async findManyByDeviceIds(deviceIds: number[]) {
    const deviceTopics = await db.deviceTopic.findMany({
      where: {
        deviceId: { in: deviceIds },
      },
      include: {
        topic: true,
      },
    });

    return deviceTopics.map(topic => new TopicModel(topic));
  }

  static async findOneByName(name: string, queryParams: any) {
    const validatedQueryParams: any = QueryParamsService.parse(
      topicSchema,
      queryParams,
      { projection: true, joining: true },
    );

    let object: any = {};

    if (validatedQueryParams.include)
      object = await db.topic.findUnique({
        where: {
          name,
        },
        include: validatedQueryParams.include,
      });
    else
      object = await db.topic.findUnique({
        where: {
          name,
        },
        select: validatedQueryParams.select,
      });

    if (!object)
      throw new AppError(`Couldn't find a topic with name '${name}'.`, 404);

    return new TopicModel(object);
  }

  static findCreatorIdById = ModelFactory.findCreatorIdById(db.topic);

  static async updateOne(
    name: string,
    update: TopicUpdateInput,
    queryParams: any,
  ) {
    const validatedUpdate = topicSchema.update.safeParse(update);

    if (!validatedUpdate.success) {
      throw new AppError(
        `Invalid update input: [ ${validatedUpdate.error.issues.map(
          issue => issue.message,
        )} ]`,
        400,
      );
    }

    const validatedQueryParams: any = QueryParamsService.parse(
      topicSchema,
      queryParams,
      { projection: true },
    ); // Both parses and validates

    const updated = await db.topic.update({
      where: { name },
      data: validatedUpdate.data,
      select: validatedQueryParams.select,
    });

    if (!updated) {
      throw new AppError(`Topic with name ${name} not found.`, 404);
    }

    return new TopicModel(updated);
  }

  static async deleteOne(name: string) {
    const { failedTokens, successfulTokens } =
      await TopicModel.unsubscribeAllDevicesFromTopic(name);

    const result = await db.topic.delete({
      where: { name },
    });

    return {
      deletedTopic: new TopicModel(result),
      failedTokens,
      successfulTokens,
    };
  }
}

import deviceSchema from '../schema/device.schema';
import { Device as PrismaDevice } from '@prisma/client';
import db from '../prisma/db';
import { ModelFactory } from './ModelFactory';
import AppError from '../utils/AppError';

export default class DeviceModel {
  private data: Partial<PrismaDevice>;

  private static wrapper(data: PrismaDevice): DeviceModel {
    return new DeviceModel(data);
  }

  constructor(data: Partial<PrismaDevice>) {
    this.data = data;
  }

  toJSON() {
    return this.data;
  }

  static createOne = ModelFactory.createOne(
    db.device,
    deviceSchema,
    DeviceModel.wrapper,
  );

  static findMany = ModelFactory.findMany(
    db.device,
    deviceSchema,
    DeviceModel.wrapper,
  );

  static findOneById = ModelFactory.findOneById(
    db.device,
    deviceSchema,
    DeviceModel.wrapper,
  );

  static async findCreatorIdById(id: number): Promise<number> {
    if (!Number.isInteger(id))
      throw new AppError('Invalid ID. Must be an integer.', 400);

    const object = await db.device.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!object)
      throw new AppError(`Couldn't find resource with ID ${id}`, 404);

    return object.userId;
  }

  static updateOne = ModelFactory.updateOne(
    db.device,
    deviceSchema,
    DeviceModel.wrapper,
  );

  static deleteOne = ModelFactory.deleteOne(db.device, DeviceModel.wrapper);
}

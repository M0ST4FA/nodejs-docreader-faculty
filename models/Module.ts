import moduleSchema from '../schema/module.schema';
import { Module as PrismaModule } from '@prisma/client';
import db from '../prisma/db';
import { ModelFactory } from './ModelFactory';

export default class ModuleModel {
  private data: Partial<PrismaModule>;

  private static wrapper(data: PrismaModule): ModuleModel {
    return new ModuleModel(data);
  }

  constructor(data: Partial<PrismaModule>) {
    this.data = data;
  }

  toJSON() {
    return this.data;
  }

  static createOne = ModelFactory.createOne(
    db.module,
    moduleSchema,
    ModuleModel.wrapper,
  );

  static findMany = ModelFactory.findMany(
    db.module,
    moduleSchema,
    ModuleModel.wrapper,
  );

  static findOneById = ModelFactory.findOneById(
    db.module,
    moduleSchema,
    ModuleModel.wrapper,
  );

  static findCreatorIdById = ModelFactory.findCreatorIdById(db.module);

  static updateOne = ModelFactory.updateOne(
    db.module,
    moduleSchema,
    ModuleModel.wrapper,
  );

  static deleteOne = ModelFactory.deleteOne(db.module, ModuleModel.wrapper);
}

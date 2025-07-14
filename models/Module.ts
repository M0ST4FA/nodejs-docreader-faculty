import moduleSchema, { ModuleFindInput } from '../schema/module.schema';
import { Module as PrismaModule } from '@prisma/client';
import db from '../prisma/db';
import AppError from '../utils/AppError';
import { ModelFactory } from './ModelFactory';

export default class ModuleModel {
  private data: Partial<PrismaModule>;

  constructor(data: Partial<PrismaModule>) {
    this.data = data;

    if (!this.data.id)
      throw new AppError('Cannot create module without ID.', 400);
  }

  toJSON() {
    return this.data;
  }

  static createOne = ModelFactory.createOne(
    db.module,
    moduleSchema,
    data => new ModuleModel(data),
  );

  static async findMany(findObj: ModuleFindInput) {
    const validatedFind = moduleSchema.find.safeParse(findObj);

    if (!validatedFind.success)
      throw new AppError(
        `Invalid query object: ${JSON.stringify(
          validatedFind.error.issues,
          null,
          2,
        )}`,
        400,
      );

    const modules = await db.module.findMany({
      where: validatedFind.data.where,
      select: validatedFind.data.select,
      orderBy: validatedFind.data.orderBy,
      skip: validatedFind.data.pagination?.skip,
      take: validatedFind.data.pagination?.take,
    });

    if (modules.length === 0)
      throw new AppError(
        `Couldn't find any module based on provided criteria.`,
        404,
      );

    return modules.map(module => new ModuleModel(module));
  }

  static async findOneById(id: number): Promise<ModuleModel> {
    const module = await db.module.findUnique({
      where: {
        id,
      },
    });

    if (!module) throw new AppError(`Couldn't find module with ID ${id}.`, 404);

    return new ModuleModel(module);
  }

  static findCreatorIdById = ModelFactory.findCreatorIdById(db.module);

  static updateOne = ModelFactory.updateOne(
    db.module,
    moduleSchema,
    data => new ModuleModel(data),
  );

  static deleteOne = ModelFactory.deleteOne(
    db.module,
    data => new ModuleModel(data),
  );
}

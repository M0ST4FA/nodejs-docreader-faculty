import AppError from '../utils/AppError';
import {
  FactorySchema,
  PrismaUpdateModel,
  PrismaDeleteModel,
} from '../types/Factory.types';

export class ModelFactory {
  static createOne<TCreateInput, TCreateResult, TInstance>(
    prismaModel: {
      create(args: { data: TCreateInput }): Promise<TCreateResult>;
    },
    schema: FactorySchema<any, any, any, any, TCreateInput>,
    wrap?: (data: TCreateResult) => TInstance,
  ) {
    return async (data: TCreateInput): Promise<TInstance | TCreateResult> => {
      console.log(data);

      const validated = schema.create.safeParse(data);

      if (!validated.success) {
        throw new AppError(
          `Invalid create input: ${JSON.stringify(
            validated.error.issues,
            null,
            2,
          )}`,
          400,
        );
      }

      const created = await prismaModel.create({
        data: validated.data,
      });

      return wrap ? wrap(created) : created;
    };
  }

  static findCreatorIdById(prismaModel: {
    findUnique: (args: {
      where: { id: number };
      select: { creatorId: true };
    }) => Promise<{ creatorId: number | null } | null>;
  }) {
    return async function (id: number): Promise<number> {
      const object = await prismaModel.findUnique({
        where: { id },
        select: { creatorId: true },
      });

      if (!object)
        throw new AppError(`Couldn't find resource with ID ${id}`, 404);

      // 0 means no creatorId set (for old resources)
      if (object?.creatorId === null) return 0;

      return object.creatorId;
    };
  }

  static updateOne<TUpdateInput, TUpdateResult, TInstance>(
    prismaModel: PrismaUpdateModel<TUpdateResult>,
    schema: FactorySchema<TUpdateInput>,
    wrap?: (data: TUpdateResult) => TInstance,
  ) {
    return async (
      id: number,
      update: TUpdateInput,
      select?: Record<string, boolean>,
    ): Promise<TInstance | TUpdateResult> => {
      const validatedUpdate = schema.update.safeParse(update);
      const validatedSelect =
        schema.select && select ? schema.select.parse(select) : undefined;

      if (!validatedUpdate.success) {
        throw new AppError(
          `Invalid update input: ${JSON.stringify(
            validatedUpdate.error.issues,
            null,
            2,
          )}`,
          400,
        );
      }

      const updated = await prismaModel.update({
        where: { id },
        data: validatedUpdate.data,
        select: validatedSelect,
      });

      if (!updated) {
        throw new AppError(`Record with ID ${id} not found.`, 404);
      }

      return wrap ? wrap(updated) : updated;
    };
  }

  static deleteOne<TDeleteResult, TInstance>(
    prismaModel: PrismaDeleteModel<TDeleteResult>,
    wrap?: (data: TDeleteResult) => TInstance,
  ) {
    return async (id: number): Promise<TInstance | TDeleteResult> => {
      const result = await prismaModel.delete({
        where: { id },
      });

      return wrap ? wrap(result) : result;
    };
  }
}

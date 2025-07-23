import AppError from '../utils/AppError';
import {
  FactorySchema,
  PrismaUpdateModel,
  PrismaDeleteModel,
  PrismaFindManyModel,
  PrismaFindUniqueModel,
} from '../types/Factory.types';
import { QueryParamsService } from '../utils/QueryParamsService';

export class ModelFactory {
  static createOne<TCreateInput, TCreateResult, TInstance>(
    prismaModel: {
      create(args: { data: TCreateInput }): Promise<TCreateResult>;
    },
    schema: FactorySchema<any, any, any, TCreateInput>,
    wrap?: (data: TCreateResult) => TInstance,
  ) {
    return async (data: TCreateInput): Promise<TInstance | TCreateResult> => {
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
        data,
      });

      return wrap ? wrap(created) : created;
    };
  }

  static findMany<TFindInput, TFindResult, TInstance>(
    prismaModel: PrismaFindManyModel<TFindResult>,
    schema: FactorySchema<TFindInput>,
    wrap?: (data: TFindResult) => TInstance,
  ) {
    return async function (
      where: TFindInput,
      queryParams: any,
    ): Promise<Array<TInstance> | Array<TFindResult>> {
      const validatedWhere = schema.where.safeParse(where);

      if (validatedWhere.error)
        throw new AppError(
          `Invalid filter object. Issues: ${JSON.stringify(
            validatedWhere.error.issues,
          )}`,
          400,
        );

      const validatedQueryParams: any = QueryParamsService.parse<
        typeof schema.query
      >(schema, queryParams, {
        pagination: true,
        projection: true,
        sorting: true,
      });

      const objects: any = await prismaModel.findMany({
        where: validatedWhere.data,
        select: validatedQueryParams.select,
        orderBy: validatedQueryParams.orderBy,
        skip: validatedQueryParams.skip,
        take: validatedQueryParams.take,
      });

      return wrap ? objects.map(object => wrap(object)) : objects;
    };
  }

  static findOneById<TFindInput, TFindResult, TInstance>(
    prismaModel: PrismaFindUniqueModel<TFindResult>,
    schema: FactorySchema<TFindInput>,
    wrap: (data: TFindResult) => TInstance,
  ) {
    return async function (
      id: number,
      queryParams: any,
    ): Promise<TFindResult | TInstance> {
      if (Number.isNaN(id))
        throw new AppError('Invalid resource ID. Must be an integer.', 400);

      const validatedQueryParams: any = QueryParamsService.parse<
        typeof schema.query
      >(schema, queryParams, { projection: true });

      const object = await prismaModel.findUnique({
        where: {
          id,
        },
        select: validatedQueryParams.select,
      });

      if (!object)
        throw new AppError(`Couldn't find resource with ID ${id}.`, 404);

      return wrap ? wrap(object) : object;
    };
  }

  static findCreatorIdById(prismaModel: {
    findUnique: (args: {
      where: { id: number };
      select: { creatorId: true };
    }) => Promise<{ creatorId: number | null } | null>;
  }) {
    return async function (id: number): Promise<number> {
      if (!Number.isInteger(id))
        throw new AppError('Invalid ID. Must be an integer.', 400);

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
      queryParams: any, // Comes from req.query
    ): Promise<TInstance | TUpdateResult> => {
      if (!Number.isInteger(id))
        throw new AppError('Invalid ID. Must be an integer.', 400);

      const validatedUpdate = schema.update.safeParse(update);

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

      const validatedQueryParams: any = QueryParamsService.parse<
        typeof schema.query
      >(schema, queryParams, {}); // Both parses and validates

      const updated = await prismaModel.update({
        where: { id },
        data: validatedUpdate.data,
        select: validatedQueryParams.select,
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

// models/Factory.types.ts

import { ZodSchema } from 'zod';

/**
 * Schema container that holds validation schemas used by factory functions.
 */
export interface FactorySchema<
  TWhere = any,
  TQuery = any,
  TUpdate = any,
  TCreate = any,
> {
  where: ZodSchema<TWhere>;
  query: ZodSchema<TQuery>;
  update: ZodSchema<TUpdate>;
  create: ZodSchema<TCreate>;
}

/**
 * Prisma findMany function type for a given model.
 */
export interface PrismaFindManyModel<TFindResult> {
  findMany(args: {
    where: any;
    select?: any;
    orderBy?: any;
    skip?: any;
    take?: any;
  }): Promise<TFindResult[]>;
}
/**
 * Prisma findUnique function type for a given model.
 */
export interface PrismaFindUniqueModel<TFindResult> {
  findUnique(args: {
    where: { id: number };
    select?: any;
  }): Promise<TFindResult | null>;
}

/**
 * Prisma update function type for a given model.
 */
export interface PrismaUpdateModel<TUpdateResult> {
  update(args: {
    where: { id: number };
    data: any;
    select?: any;
  }): Promise<TUpdateResult>;
}

/**
 * Prisma delete function type for a given model.
 */
export interface PrismaDeleteModel<TDeleteResult> {
  delete(args: { where: { id: number } }): Promise<TDeleteResult>;
}

import { AnyZodObject, ZodError, ZodObject } from 'zod';
import AppError from './AppError';

export type QueryFeatureSet = {
  pagination?: boolean;
  projection?: boolean;
  sorting?: boolean;
};

export class QueryParamsService {
  static parse<ReturnT>(
    modelSchema: {
      query: any;
    },
    queryParams: any,
    features: QueryFeatureSet = {
      pagination: false,
      projection: false,
      sorting: false,
    },
  ): ReturnT {
    // Step 1: Error checking for req.query for unsupported features
    if (!features.pagination) {
      if (queryParams.page)
        throw new AppError(
          `Invalid query parameter: 'page'. Pagination is not permitted in this endpoint.`,
          400,
        );

      if (queryParams.size)
        throw new AppError(
          `Invalid query parameter: 'size'. Pagination is not permitted in this endpoint.`,
          400,
        );
    }

    if (!features.projection)
      if (queryParams.fields)
        throw new AppError(
          `Invalid query parameter: 'fields'. Projection is not permitted in this endpoint.`,
          400,
        );

    if (!features.sorting)
      if (queryParams.sort)
        throw new AppError(
          `Invalid query parameter: 'sort'. Sorting is not permitted in this endpoint.`,
          400,
        );

    // Step 2: Parsing the query parameters object
    const parsed = modelSchema.query.safeParse(queryParams);

    if (parsed.error)
      throw new AppError(
        `Invalid query parameters object. Issues: ${JSON.stringify(
          parsed.error.issues,
        )}`,
        400,
      );

    return parsed.data as ReturnT;
  }
}

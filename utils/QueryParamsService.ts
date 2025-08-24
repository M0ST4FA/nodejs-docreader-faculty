import AppError from './AppError';

export type QueryFeatureSet = {
  pagination?: boolean;
  projection?: boolean;
  sorting?: boolean;
  joining?: boolean;
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
      joining: false,
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

    if (!features.joining)
      if (queryParams.include)
        throw new AppError(
          `Invalid query parameter: 'include'. Joining is not permitted in this endpoint.`,
          400,
        );

    if (features.joining && features.projection)
      if (queryParams.include && queryParams.fields)
        throw new AppError(
          `Invalid query parameter combination: 'fields' and 'include'. You cannot project and join at the same time.`,
          400,
        );

    // Step 2: Parsing the query parameters object
    const parsed = modelSchema.query.safeParse(queryParams);

    if (parsed.error)
      throw new AppError(
        `Invalid query parameters object. Issues: [ ${parsed.error.issues.map(
          (issue: any) => issue.message,
        )} ]`,
        400,
      );

    return parsed.data as ReturnT;
  }

  static addFieldsToList(
    queryObj: any,
    listName: string,
    fields: string[],
  ): string {
    if (!fields || fields.length === 0) return queryObj[listName] ?? '';

    if (queryObj[listName] === undefined) {
      queryObj[listName] = fields.join(',');
      return queryObj[listName];
    }

    // Split existing fields into an array
    const existing = queryObj.select
      .split(',')
      .map((f: string) => f.trim())
      .filter((f: string) => f.length > 0);

    // Merge and deduplicate
    const merged = Array.from(new Set([...existing, ...fields]));

    queryObj[listName] = merged.join(',');
    return queryObj[listName];
  }
}

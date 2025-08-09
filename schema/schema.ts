import { z, ZodObject, ZodRawShape } from 'zod';
import buildInclude from '../utils/buildInclude';

export default function createModelSchema<
  T extends ZodRawShape,
  RK extends keyof T,
  OK extends keyof T = never,
  UK extends keyof T = never,
>(
  fullSchema: ZodObject<T>,
  create: {
    required: readonly RK[];
    optional?: readonly OK[];
  },
  update: readonly UK[],
  queryConfig: {
    defaultPage?: number;
    defaultSize?: number;
    maxPageSize?: number;
    defaultFields?: (keyof T)[];
    projectableFields: (keyof T)[];
    sortableFields: (keyof T)[];
    includableFields?: string[];
  },
) {
  // Extract query config
  const {
    defaultPage = 1,
    defaultSize = 10,
    maxPageSize: maxSize = 100,
    defaultFields = queryConfig.projectableFields,
    projectableFields = Object.keys(fullSchema.shape) as (keyof T)[],
    sortableFields = Object.keys(fullSchema.shape) as (keyof T)[],
    includableFields = [],
  } = queryConfig || {};

  // Normalize key sets
  const requiredKeys = create.required as readonly (keyof T)[];
  const optionalKeys = (create.optional ?? []) as readonly (keyof T)[];
  const updateKeys = update as readonly (keyof T)[];
  const requiredSet = new Set(requiredKeys);
  const filteredOptionalKeys = optionalKeys.filter(
    key => !requiredSet.has(key),
  );

  // --- CREATE schema ---
  const requiredObject = z
    .object(
      Object.fromEntries(
        requiredKeys.map(key => [key, fullSchema.shape[key]]),
      ) as { [K in RK]: T[K] },
    )
    .required();

  const optionalObject = z
    .object(
      Object.fromEntries(
        filteredOptionalKeys.map(key => [key, fullSchema.shape[key]]),
      ) as { [K in OK]: T[K] },
    )
    .partial();

  const createSchema = requiredObject.merge(optionalObject).strict();

  // --- UPDATE schema ---
  const updateShape = Object.fromEntries(
    updateKeys.map(key => [key, fullSchema.shape[key]]),
  ) as { [K in UK]: T[K] };

  const updateSchema = z.object(updateShape).partial().strict();

  // --- QUERY object ---

  const query = z
    .object({
      page: z
        .string()
        .optional()
        .transform(v => (v ? parseInt(v) : defaultPage || 1))
        .refine(v => v > 0, { message: 'Page must be greater than 0' }),

      size: z
        .string()
        .optional()
        .transform(v => (v ? parseInt(v) : defaultSize || 10))
        .refine(v => v > 0 && v <= maxSize, {
          message: `Size must be between 1 and ${maxSize}`,
        }),

      fields: z
        .union([z.string(), z.array(z.string())])
        .optional()
        .transform(val => (typeof val === 'string' ? val.split(',') : val))
        .refine(
          val =>
            !val || val.every(f => projectableFields.includes(f as keyof T)),
          {
            message: `Invalid fields. Allowed: ${projectableFields.join(', ')}`,
          },
        ),

      sort: z
        .union([z.string(), z.array(z.string())])
        .optional()
        .transform(val => (typeof val === 'string' ? val.split(',') : val))
        .refine(
          val =>
            !val ||
            val.every(field => {
              const key = field.startsWith('-') ? field.slice(1) : field;
              return sortableFields.includes(key as keyof T);
            }),
          {
            message: `Invalid sort fields. Allowed: ${sortableFields.join(
              ', ',
            )}`,
          },
        ),
      include: z
        .string()
        .refine(
          val => {
            const parts = val.split(',');
            if (parts.find(part => !includableFields.includes(part)))
              return false;
            return true;
          },
          {
            message: `Field used in join is not permitted.`,
          },
        )
        .optional(),
    })
    .strict({ message: 'Unrecognized ' })
    .transform(({ page, size, fields, sort, include }, ctx) => {
      if (include && fields)
        return ctx.addIssue({
          code: 'custom',
          message: 'Cannot project and joint at the same time.',
          fatal: true,
        });

      const skip = (page - 1) * size;
      const take = size;

      const select =
        fields && fields.length > 0
          ? Object.fromEntries(fields.map(f => [f, true]))
          : Object.fromEntries(defaultFields.map(f => [f, true]));

      const orderBy =
        sort && sort.length > 0
          ? sort.map(s => {
              const desc = s.startsWith('-');
              const field = desc ? s.slice(1) : s;
              return { [field]: desc ? 'desc' : 'asc' };
            })
          : undefined;

      return {
        skip,
        take,
        select,
        orderBy,
        include: include && buildInclude(include),
      };
    });
  // --- Final output ---
  return {
    where: fullSchema.partial().strict(),
    query,
    create: createSchema,
    update: updateSchema,
  };
}

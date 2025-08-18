import z from 'zod';
import createModelSchema from './schema';

const fullSchema = z
  .object({
    id: z.number().int({ message: 'ID must be integer.' }),
    name: z
      .string()
      .trim()
      .min(1, { message: 'Name is required.' })
      .max(255, { message: 'Cannot be greater than 255 characters.' }),
    semesterName: z
      .number()
      .int('The name of the semester must be an integer.'),
    yearId: z.number().int(),
    icon: z
      .string()
      .url({ message: 'The icon field must contain the url of an icon.' }),

    creatorId: z.number().int({ message: 'Creator ID must be an integer.' }),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .strict();

const moduleSchema = createModelSchema(
  fullSchema,
  {
    required: ['name', 'semesterName', 'yearId', 'icon', 'creatorId'],
    optional: [],
  },
  ['name', 'semesterName', 'yearId', 'icon'],
  {
    defaultPage: 1,
    defaultSize: Number.POSITIVE_INFINITY,
    maxPageSize: Number.POSITIVE_INFINITY,
    projectableFields: [
      'id',
      'name',
      'semesterName',
      'yearId',
      'icon',
      'creatorId',
      'updatedAt',
      'createdAt',
    ],
    defaultFields: [
      'id',
      'name',
      'semesterName',
      'yearId',
      'icon',
      'creatorId',
    ],
    sortableFields: ['name', 'createdAt', 'updatedAt'],
    includableFields: ['year.faculty'],
  },
);

// --- Type Exports ---
export type ModuleWhereInput = z.infer<typeof moduleSchema.where>;
export type ModuleQueryInput = z.infer<typeof moduleSchema.query>;
export type ModuleUpdateInput = z.infer<typeof moduleSchema.update>;
export type ModuleCreateInput = z.infer<typeof moduleSchema.create>;

export default moduleSchema;

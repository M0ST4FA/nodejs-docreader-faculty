import z from 'zod';
import createModelSchema from './schema';

const fullSchema = z
  .object({
    id: z.number().int({ message: 'ID must be integer.' }),
    title: z
      .string()
      .trim()
      .min(1, { message: 'Title is required.' })
      .max(255, { message: 'Cannot be greater than 255 characters.' }),
    facultyId: z.number().int({ message: 'Faculty ID must be an integer.' }),

    creatorId: z.number().int({ message: 'Creator ID must be an integer.' }),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .strict();

const yearSchema = createModelSchema(
  fullSchema,
  { required: ['id', 'title', 'facultyId', 'creatorId'], optional: [] },
  ['title', 'facultyId'],
  {
    defaultPage: 1,
    defaultSize: 10,
    maxPageSize: 100,
    allowedFields: [
      'id',
      'title',
      'facultyId',
      'creatorId',
      'updatedAt',
      'createdAt',
    ],
    defaultFields: ['id', 'title', 'facultyId', 'creatorId'],
    sortableFields: ['title', 'createdAt', 'updatedAt'],
  },
);

// --- Type Exports ---
export type YearWhereInput = z.infer<typeof yearSchema.where>;
export type YearQueryInput = z.infer<typeof yearSchema.query>;
export type YearUpdateInput = z.infer<typeof yearSchema.update>;
export type YearCreateInput = z.infer<typeof yearSchema.create>;

export default yearSchema;

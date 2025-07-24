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
    city: z
      .string()
      .min(1, { message: 'City is required.' })
      .max(255, { message: 'Cannot be greater than 255 characters.' })
      .optional(),

    creatorId: z.number().int({ message: 'Creator ID must be an integer.' }),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .strict();

const facultySchema = createModelSchema(
  fullSchema,
  { required: ['name', 'city', 'creatorId'] },
  ['name', 'city'],
  {
    defaultPage: 0,
    defaultSize: 10,
    maxPageSize: 100,
    allowedFields: [
      'id',
      'name',
      'city',
      'creatorId',
      'updatedAt',
      'createdAt',
    ],
    defaultFields: ['id', 'name', 'city', 'creatorId'],
    sortableFields: ['name', 'city', 'createdAt', 'updatedAt'],
  },
);

// --- Type Exports ---
export type FacultyWhereInput = z.infer<typeof facultySchema.where>;
export type FacultyQueryParamInput = z.infer<typeof facultySchema.query>;
export type FacultyUpdateInput = z.infer<typeof facultySchema.update>;
export type FacultyCreateInput = z.infer<typeof facultySchema.create>;

export default facultySchema;

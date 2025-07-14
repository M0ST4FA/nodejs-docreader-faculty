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
);

// --- Type Exports ---
export type FacultyWhereInput = z.infer<typeof facultySchema.where>;
export type FacultySelectInput = z.infer<typeof facultySchema.select>;
export type FacultyOrderByInput = z.infer<typeof facultySchema.orderBy>;
export type FacultyFindInput = z.infer<typeof facultySchema.find>;
export type FacultyUpdateInput = z.infer<typeof facultySchema.update>;
export type FacultyCreateInput = z.infer<typeof facultySchema.create>;

export default facultySchema;

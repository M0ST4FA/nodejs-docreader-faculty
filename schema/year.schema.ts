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
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .strict();

const yearSchema = createModelSchema(
  fullSchema,
  { required: ['id', 'title', 'facultyId'], optional: [] },
  ['title', 'facultyId'],
);

// --- Type Exports ---
export type YearWhereInput = z.infer<typeof yearSchema.where>;
export type YearSelectInput = z.infer<typeof yearSchema.select>;
export type YearOrderByInput = z.infer<typeof yearSchema.orderBy>;
export type YearFindInput = z.infer<typeof yearSchema.find>;
export type YearUpdateInput = z.infer<typeof yearSchema.update>;
export type YearCreateInput = z.infer<typeof yearSchema.create>;

export default yearSchema;

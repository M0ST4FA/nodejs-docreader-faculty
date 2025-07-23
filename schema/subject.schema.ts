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
    icon: z.string().url({ message: 'Icon must be a URL.' }),
    moduleId: z.number().int({ message: 'Module ID must be an integer.' }),

    creatorId: z.number().int({ message: 'Creator ID must be an integer.' }),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .strict();

const subjectSchema = createModelSchema(
  fullSchema,
  { required: ['name', 'icon', 'moduleId', 'creatorId'], optional: [] },
  ['name', 'icon', 'moduleId'],
  {
    defaultPage: 1,
    defaultSize: 10,
    maxPageSize: 100,
    allowedFields: ['id', 'name', 'icon', 'moduleId', 'creatorId'],
    sortableFields: ['name', 'createdAt', 'updatedAt'],
  },
);

// --- Type Exports ---
export type SubjectWhereInput = z.infer<typeof subjectSchema.where>;
export type SubjectQueryInput = z.infer<typeof subjectSchema.query>;
export type SubjectUpdateInput = z.infer<typeof subjectSchema.update>;
export type SubjectCreateInput = z.infer<typeof subjectSchema.create>;

export default subjectSchema;

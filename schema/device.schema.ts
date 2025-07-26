import z from 'zod';
import createModelSchema from './schema';

const fullSchema = z
  .object({
    id: z.number().int({ message: 'ID must be integer.' }),
    token: z
      .string()
      .trim()
      .min(1, { message: 'Token is required.' })
      .max(255, { message: 'Cannot be greater than 255 characters.' }),
    userId: z.number().int({ message: 'ID must be integer.' }),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .strict();

const deviceSchema = createModelSchema(
  fullSchema,
  {
    required: ['token', 'userId'],
    optional: [],
  },
  ['token'],
  {
    defaultPage: 1,
    defaultSize: 10,
    maxPageSize: 100,
    projectableFields: ['id', 'token', 'userId', 'createdAt', 'updatedAt'],
    defaultFields: ['id', 'token', 'userId'],
    sortableFields: ['createdAt', 'updatedAt'],
  },
);

// --- Type Exports ---
export type DeviceWhereInput = z.infer<typeof deviceSchema.where>;
export type DeviceQueryInput = z.infer<typeof deviceSchema.query>;
export type DeviceUpdateInput = z.infer<typeof deviceSchema.update>;
export type DeviceCreateInput = z.infer<typeof deviceSchema.create>;

export default deviceSchema;

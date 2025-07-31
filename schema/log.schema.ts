import z from 'zod';
import createModelSchema from './schema';

const fullSchema = z
  .object({
    id: z.number().int({ message: 'ID must be integer.' }),
    userId: z.number().int({ message: 'User ID must be integer.' }),
    method: z
      .string()
      .trim()
      .min(1, { message: 'Method name is required.' })
      .max(255, { message: 'Cannot be greater than 255 characters.' }),
    endpoint: z.string().trim().min(1, { message: 'Endpoint is required.' }),
    statusCode: z.number().int({ message: `'statusCode' must be integer.` }),
    responseTime: z
      .number()
      .int({ message: `'responseTime' must be integer.` }),
    ip: z.string().trim().min(1, { message: 'IP address is required.' }),
    userAgent: z.string().trim().min(1, { message: 'User agent is required.' }),
    createdAt: z.date(),
  })
  .strict();

const logSchema = createModelSchema(
  fullSchema,
  {
    required: [
      'userId',
      'method',
      'endpoint',
      'statusCode',
      'responseTime',
      'userAgent',
    ],
    optional: ['ip'],
  },
  [],
  {
    defaultPage: 1,
    defaultSize: 10,
    maxPageSize: 100,
    projectableFields: [
      'id',
      'userId',
      'method',
      'endpoint',
      'statusCode',
      'responseTime',
      'userAgent',
    ],
    defaultFields: [
      'id',
      'userId',
      'method',
      'endpoint',
      'statusCode',
      'responseTime',
      'userAgent',
    ],
    sortableFields: ['method', 'responseTime', 'userAgent', 'createdAt'],
  },
);

// --- Type Exports ---
export type LogWhereInput = z.infer<typeof logSchema.where>;
export type LogQueryInput = z.infer<typeof logSchema.query>;
export type LogUpdateInput = z.infer<typeof logSchema.update>;
export type LogCreateInput = z.infer<typeof logSchema.create>;

export default logSchema;

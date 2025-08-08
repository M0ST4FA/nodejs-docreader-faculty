import z from 'zod';
import createModelSchema from './schema';
import { UserActivityType } from '@prisma/client';

const fullSchema = z
  .object({
    id: z.number().int({ message: 'ID must be integer.' }),
    userId: z.number().int({ message: 'User ID must be integer.' }),

    activityType: z
      .string()
      .trim()
      .min(1, { message: 'Method name is required.' })
      .max(255, { message: 'Cannot be greater than 255 characters.' }),

    resourceId: z.number().int({ message: 'Resource ID must be integer.' }),
    resourceType: z.nativeEnum(UserActivityType, {
      message: 'Invalid activity.',
    }),

    details: z.object(
      {},
      { message: 'UserActivity details must be a valid json object.' },
    ),

    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .strict();

const userActivitySchema = createModelSchema(
  fullSchema,
  {
    required: ['userId', 'activityType', 'resourceType', 'resourceId'],
    optional: ['details'],
  },
  [],
  {
    defaultPage: 1,
    defaultSize: 10,
    maxPageSize: 100,
    projectableFields: [
      'id',
      'userId',
      'activityType',
      'resourceType',
      'resourceId',
      'details',
      'createdAt',
      'updatedAt',
    ],
    defaultFields: [
      'id',
      'userId',
      'activityType',
      'resourceType',
      'resourceId',
      'details',
    ],
    sortableFields: ['activityType', 'resourceType', 'updatedAt', 'createdAt'],
  },
);

// --- Type Exports ---
export type UserActivityWhereInput = z.infer<typeof userActivitySchema.where>;
export type UserActivityQueryInput = z.infer<typeof userActivitySchema.query>;
export type UserActivityUpdateInput = z.infer<typeof userActivitySchema.update>;
export type UserActivityCreateInput = z.infer<typeof userActivitySchema.create>;

export default userActivitySchema;

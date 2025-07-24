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
    description: z
      .string()
      .trim()
      .min(1, { message: 'Description is required.' })
      .max(255, 'Cannot be greater than 255 characters.'),
    creatorId: z.number().int({ message: 'Creator ID must be an integer.' }),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .strict();

const roleSchema = createModelSchema(
  fullSchema,
  {
    required: ['name', 'creatorId'],
    optional: ['description'],
  },
  ['name', 'description'],
  {
    defaultPage: 1,
    defaultSize: 10,
    maxPageSize: 100,
    allowedFields: [
      'id',
      'name',
      'description',
      'creatorId',
      'updatedAt',
      'createdAt',
    ],
    defaultFields: ['id', 'name', 'description', 'creatorId'],
    sortableFields: ['name', 'createdAt', 'updatedAt'],
  },
);

export const permissionArrayInputSchema = z.array(
  z.number({ message: 'Permission IDs must be integers.' }),
  { message: 'Permissions to add or remove must be an array.' },
);

// --- Type Exports ---
export type RoleWhereInput = z.infer<typeof roleSchema.where>;
export type RoleQueryInput = z.infer<typeof roleSchema.query>;
export type RoleUpdateInput = z.infer<typeof roleSchema.update>;
export type RoleCreateInput = z.infer<typeof roleSchema.create>;

export type PermissionArrayInput = z.infer<typeof permissionArrayInputSchema>;

export default roleSchema;

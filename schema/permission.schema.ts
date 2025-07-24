import z from 'zod';
import createModelSchema from './schema';
import {
  PermissionAction,
  PermissionResource,
  PermissionScope,
} from '@prisma/client';

const fullSchema = z
  .object({
    id: z.number().int({ message: 'ID must be integer.' }),
    description: z
      .string()
      .trim()
      .min(1, { message: 'Description is required.' })
      .max(255, { message: 'Cannot be greater than 255 characters.' }),
    action: z.nativeEnum(PermissionAction, {
      message: `Permission action can only be: 'CREATE', 'READ', 'UPDATE', or 'DELETE'.`,
    }),
    scope: z.nativeEnum(PermissionScope, {
      message: `Permission scope can only be: 'OWN' or 'ANY'.`,
    }),
    resource: z.nativeEnum(PermissionResource, {
      message: `Invalid permission scope.`,
    }),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .strict();

const permissionSchema = createModelSchema(
  fullSchema,
  {
    required: ['action', 'scope', 'resource'],
    optional: ['description'],
  },
  ['description'],
  {
    defaultPage: 1,
    defaultSize: 10,
    maxPageSize: 100,
    allowedFields: [
      'id',
      'description',
      'action',
      'scope',
      'resource',
      'updatedAt',
      'createdAt',
    ],
    defaultFields: ['id', 'description', 'action', 'scope', 'resource'],
    sortableFields: ['action'],
  },
);

// --- Type Exports ---
export type PermissionWhereInput = z.infer<typeof permissionSchema.where>;
export type PermissionQueryInput = z.infer<typeof permissionSchema.query>;
export type PermissionUpdateInput = z.infer<typeof permissionSchema.update>;
export type PermissionCreateInput = z.infer<typeof permissionSchema.create>;

export default permissionSchema;

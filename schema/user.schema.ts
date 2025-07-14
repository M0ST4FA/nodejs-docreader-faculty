import { z } from 'zod';
import { deviceSchema } from './device.schema';
import { paginationSchema } from './pagination.schema';
import createModelSchema from './schema';

const fullSchema = z.object({
  id: z.number().optional(),
  googleSubId: z.string({ message: 'Invalid Google subject identifier.' }),
  givenName: z.string({ message: 'First name not provided.' }),
  familyName: z.string({ message: 'Family name not provided.' }),
  email: z.string().trim().email({ message: 'Invalid Email.' }),
  picture: z.string().url({ message: 'Invalid picture URL.' }),
  status: z.boolean({ message: 'Invalid status.' }).default(false),
  roleId: z.number().int({ message: 'Role ID can only be an integer.' }).min(1),
  facultyId: z.number().gt(0),
  yearId: z.number().gt(0),
  // devices: deviceSchema.array(),

  createdAt: z
    .date({ message: 'Invalid creation date.' })
    .default(new Date(Date.now())),
  updatedAt: z
    .date({ message: 'Invalid update date.' })
    .default(new Date(Date.now())),
});

const userSchema = createModelSchema(
  fullSchema,
  {
    required: [
      'googleSubId',
      'familyName',
      'givenName',
      'email',
      'picture',
      'status',
      'roleId',
    ],
    optional: [],
  },
  ['status', 'facultyId', 'yearId'],
);

// --- Type Exports ---
export type UserWhereInput = z.infer<typeof userSchema.where>;
export type UserSelectInput = z.infer<typeof userSchema.select>;
export type UserOrderByInput = z.infer<typeof userSchema.orderBy>;
export type UserFindInput = z.infer<typeof userSchema.find>;
export type UserUpdateInput = z.infer<typeof userSchema.update>;
export type UserCreateInput = z.infer<typeof userSchema.create>;

export default userSchema;

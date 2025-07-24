import { z } from 'zod';
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
  {
    defaultPage: 0,
    defaultSize: 10,
    maxPageSize: 100,
    defaultFields: [
      // Personal info
      'id',
      'roleId',
      'email',
      'givenName',
      'familyName',
      'picture',

      // Scholar info
      'yearId',
      'facultyId',
    ],
    allowedFields: [
      // Personal info
      'id',
      'roleId',
      'email',
      'givenName',
      'familyName',
      'picture',

      // Scholar info
      'yearId',
      'facultyId',

      // Dates
      'updatedAt',
      'createdAt',
    ],
    sortableFields: ['givenName', 'email', 'createdAt', 'updatedAt'],
  },
);

// --- Type Exports ---
export type UserWhereInput = z.infer<typeof userSchema.where>;
export type UserQueryParamInput = z.infer<typeof userSchema.query>;
export type UserUpdateInput = z.infer<typeof userSchema.update>;
export type UserCreateInput = z.infer<typeof userSchema.create>;

export default userSchema;

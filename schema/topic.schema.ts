import z from 'zod';
import createModelSchema from './schema';

const fullSchema = z
  .object({
    id: z.number().int({ message: 'ID must be integer.' }),
    name: z
      .string()
      .trim()
      .min(1, { message: 'Topic name is required.' })
      .max(255, { message: 'Cannot be greater than 255 characters.' }),
    description: z
      .string()
      .trim()
      .min(1, { message: 'Description is required.' })
      .max(255, { message: 'Cannot be greater than 255 characters.' }),
    public: z.boolean({ message: 'Must be a boolean value.' }).default(true),
    creatorId: z.number().int({ message: 'creatorId must be integer.' }),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .strict();

const topicSchema = createModelSchema(
  fullSchema,
  {
    required: ['name', 'creatorId'],
    optional: ['description', 'public'],
  },
  ['description'],
  {
    defaultPage: 1,
    defaultSize: 10,
    maxPageSize: 100,
    projectableFields: [
      'id',
      'name',
      'description',
      'public',
      'creatorId',
      'createdAt',
      'updatedAt',
    ],
    defaultFields: ['id', 'name', 'creatorId', 'description'],
    sortableFields: ['name', 'createdAt', 'updatedAt'],
  },
);

// --- Type Exports ---
export type TopicWhereInput = z.infer<typeof topicSchema.where>;
export type TopicQueryInput = z.infer<typeof topicSchema.query>;
export type TopicUpdateInput = z.infer<typeof topicSchema.update>;
export type TopicCreateInput = z.infer<typeof topicSchema.create>;

export default topicSchema;

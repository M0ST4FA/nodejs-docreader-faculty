import z from 'zod';
import createModelSchema from './schema';
import { CategoryType, DataType } from '@prisma/client';

const fullSchema = z
  .object({
    id: z.number().int({ message: 'ID must be integer.' }),
    title: z
      .string()
      .trim()
      .min(1, { message: 'Title is required.' })
      .max(255, { message: 'Cannot be greater than 255 characters.' }),
    subTitle: z
      .string()
      .trim()
      .min(1, { message: 'Subtitle is required.' })
      .max(255, 'Cannot be greater than 255 characters.'),
    url: z.string().url({ message: 'Link URL is not a valid URL.' }),
    type: z.nativeEnum(DataType, {
      message:
        "Invalid link type. Link type must be one of these: 'Data', 'PDF', 'Record', 'Video'",
    }),
    category: z.nativeEnum(CategoryType, {
      message:
        "Invalid category. Category must be one of these: 'College', 'Data', 'Summary', 'Questions'.",
    }),
    lectureId: z.number().int({ message: 'Lecture ID must be an integer.' }),
    notifiable: z.boolean(),

    creatorId: z.number().int({ message: 'Creator ID must be an integer.' }),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .strict();

const linkSchema = createModelSchema(
  fullSchema,
  {
    required: ['title', 'url', 'category', 'type', 'lectureId', 'creatorId'],
    optional: [],
  },
  ['title', 'subTitle', 'url', 'category', 'type', 'lectureId'],
  {
    defaultPage: 1,
    defaultSize: 10,
    maxPageSize: 100,
    allowedFields: [
      'id',
      'type',
      'category',
      'notifiable',
      'title',
      'subTitle',
      'url',
      'lectureId',
      'creatorId',
      'updatedAt',
      'createdAt',
    ],
    defaultFields: [
      'id',
      'type',
      'category',
      'notifiable',
      'title',
      'subTitle',
      'url',
      'lectureId',
      'creatorId',
    ],
    sortableFields: ['title', 'subTitle', 'createdAt', 'updatedAt'],
  },
);

// --- Type Exports ---
export type LinkWhereInput = z.infer<typeof linkSchema.where>;
export type LinkQueryInput = z.infer<typeof linkSchema.query>;
export type LinkUpdateInput = z.infer<typeof linkSchema.update>;
export type LinkCreateInput = z.infer<typeof linkSchema.create>;

export default linkSchema;

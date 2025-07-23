import z from 'zod';
import createModelSchema from './schema';
import { LectureType } from '@prisma/client';

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
      .max(255, 'Cannot be greater than 255 characters.')
      .optional(),
    subjectId: z.number().int({ message: 'Subject ID must be an integer.' }),
    type: z.nativeEnum(LectureType, {
      message:
        "Lecture type can only be: 'Normal', 'Practical', or 'FinalRevision'",
    }),
    date: z.date({ message: 'Lecture date is required.', coerce: true }),

    creatorId: z.number().int({ message: 'Creator ID must be an integer.' }),

    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .strict();

const lectureSchema = createModelSchema(
  fullSchema,
  {
    required: ['title', 'subjectId', 'creatorId', 'date', 'type'],
    optional: ['subTitle'],
  },
  ['title', 'subTitle', 'subjectId', 'date', 'type'],
  {
    defaultPage: 1,
    defaultSize: 10,
    maxPageSize: 100,
    allowedFields: [
      'id',
      'type',
      'title',
      'subTitle',
      'subjectId',
      'date',
      'creatorId',
    ],
    sortableFields: ['title', 'subTitle', 'date', 'createdAt', 'updatedAt'],
  },
);

// --- Type Exports ---
export type LectureWhereInput = z.infer<typeof lectureSchema.where>;
export type LectureQueryInput = z.infer<typeof lectureSchema.query>;
export type LectureUpdateInput = z.infer<typeof lectureSchema.update>;
export type LectureCreateInput = z.infer<typeof lectureSchema.create>;

export default lectureSchema;

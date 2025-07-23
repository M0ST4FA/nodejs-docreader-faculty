import z from 'zod';
import createModelSchema from './schema';

const fullSchema = z
  .object({
    id: z.number().int({ message: 'ID must be integer.' }),
    lectureId: z.number().int({ message: 'ID must be integer.' }),
    title: z
      .string()
      .trim()
      .min(1, { message: 'Title is required.' })
      .max(255, { message: 'Cannot be greater than 255 characters.' }),
    notifiable: z.boolean(),

    creatorId: z.number().int({ message: 'Creator ID must be an integer.' }),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .strict();

const quizSchema = createModelSchema(
  fullSchema,
  { required: ['lectureId', 'title', 'creatorId'], optional: [] },
  ['lectureId', 'title', 'notifiable'],
  {
    defaultPage: 1,
    defaultSize: 10,
    maxPageSize: 100,
    allowedFields: ['id', 'lectureId', 'title', 'notifiable', 'creatorId'],
    sortableFields: ['title', 'createdAt', 'updatedAt'],
  },
);

// --- Type Exports ---
export type QuizWhereInput = z.infer<typeof quizSchema.where>;
export type QuizQueryInput = z.infer<typeof quizSchema.query>;
export type QuizUpdateInput = z.infer<typeof quizSchema.update>;
export type QuizCreateInput = z.infer<typeof quizSchema.create>;

export default quizSchema;

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
);

// --- Type Exports ---
export type QuizWhereInput = z.infer<typeof quizSchema.where>;
export type QuizSelectInput = z.infer<typeof quizSchema.select>;
export type QuizOrderByInput = z.infer<typeof quizSchema.orderBy>;
export type QuizFindInput = z.infer<typeof quizSchema.find>;
export type QuizUpdateInput = z.infer<typeof quizSchema.update>;
export type QuizCreateInput = z.infer<typeof quizSchema.create>;

export default quizSchema;

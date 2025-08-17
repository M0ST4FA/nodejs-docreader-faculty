import z from 'zod';
import createModelSchema from './schema';

const fullSchema = z
  .object({
    id: z.number().int({ message: 'ID must be integer.' }),
    quizId: z.number().int({ message: 'ID must be integer.' }),
    image: z.string().trim().optional(),
    explanation: z.string().trim().optional(),
    text: z.string().trim().min(1, { message: 'Text is required.' }),
    options: z.array(z.string().trim()),
    correctOptionIndex: z.number(),
    creatorId: z.number().int({ message: 'Creator ID must be an integer.' }),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .strict();

const questionSchema = createModelSchema(
  fullSchema,
  {
    required: ['text', 'options', 'correctOptionIndex'],
    optional: ['image', 'explanation'],
  },
  ['image', 'explanation', 'text', 'options', 'correctOptionIndex'],
  {
    defaultPage: 1,
    defaultSize: 10,
    maxPageSize: 100,
    projectableFields: ['id', 'creatorId', 'updatedAt', 'createdAt'],
    defaultFields: [
      'id',
      'image',
      'explanation',
      'text',
      'options',
      'correctOptionIndex',
      'quizId',
      'creatorId',
    ],
    sortableFields: ['createdAt', 'updatedAt'],
  },
);

// --- Type Exports ---
export type QuestionWhereInput = z.infer<typeof questionSchema.where>;
export type QuestionQueryInput = z.infer<typeof questionSchema.query>;
export type QuestionUpdateInput = z.infer<typeof questionSchema.update>;
export type QuestionCreateInput = z.infer<typeof questionSchema.create>;

export default questionSchema;

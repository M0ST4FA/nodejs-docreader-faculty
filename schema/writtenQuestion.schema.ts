import z from 'zod';
import createModelSchema from './schema';

const rect = z.object({
  id: z.number().int({ message: 'ID must be integer.' }).optional(),
  x: z.number(),
  y: z.number(),
  w: z.number(),
  h: z.number(),
});

const subQuestion = z.object({
  id: z.number().int({ message: 'ID must be integer.' }).optional(),
  text: z.string(),
  answer: z.string(),
});

const fullSchema = z
  .object({
    id: z.number().int({ message: 'ID must be integer.' }),
    quizId: z.number().int({ message: 'ID must be integer.' }),
    image: z.string().trim().optional(),
    width: z.number().optional(),
    height: z.number().optional(),
    tapes: z.array(rect),
    masks: z.array(rect),
    subQuestions: z.array(subQuestion),
    creatorId: z.number().int({ message: 'Creator ID must be an integer.' }),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .strict();

const questionSchema = createModelSchema(
  fullSchema,
  {
    required: ['quizId', 'creatorId'],
    optional: ['image', 'width', 'height'],
  },
  ['tapes', 'masks', 'subQuestions'],
  {
    defaultPage: 1,
    defaultSize: 10,
    maxPageSize: 100,
    projectableFields: ['id', 'creatorId', 'updatedAt', 'createdAt'],
    defaultFields: [
      'id',
      'image',
      'width',
      'height',
      'tapes',
      'masks',
      'subQuestions',
      'quizId',
      'creatorId',
    ],
    sortableFields: ['id', 'createdAt', 'updatedAt'],
    includableFields: ['tapes', 'masks', 'subQuestions'],
  },
);

// --- Type Exports ---
export type QuestionWhereInput = z.infer<typeof questionSchema.where>;
export type QuestionQueryInput = z.infer<typeof questionSchema.query>;
export type QuestionUpdateInput = z.infer<typeof questionSchema.update>;
export type QuestionCreateInput = z.infer<typeof questionSchema.create>;

export default questionSchema;

import z from 'zod';
import createModelSchema from './schema';

const fullSchema = z
  .object({
    id: z.number().int({ message: 'ID must be integer.' }),

    quizAttemptId: z
      .number()
      .int({ message: 'Quiz attempt ID must be integer.' }),

    questionId: z.number().int({ message: 'Question ID must be integer.' }),

    answerIndex: z
      .number()
      .int({ message: 'Answer index must be an integer.' }),
    isCorrect: z.boolean({ message: "'isCorrect' must be a bool." }),

    answeredAt: z.date(),
  })
  .strict();

const questionAttemptSchema = createModelSchema(
  fullSchema,
  {
    required: ['quizAttemptId', 'questionId', 'answerIndex', 'isCorrect'],
  },
  [],
  {
    defaultPage: 1,
    defaultSize: 10,
    maxPageSize: 100,
    projectableFields: [
      'quizAttemptId',
      'questionId',
      'answerIndex',
      'isCorrect',
      'answeredAt',
    ],
    defaultFields: ['answerIndex', 'isCorrect'],
    sortableFields: ['answeredAt'],
  },
);

export const createManySchema = z
  .object({
    quizAttemptId: z
      .number()
      .int({ message: 'Quiz attempt ID must be integer.' }),
    questionAttempts: z.array(
      fullSchema
        .pick({ questionId: true, answerIndex: true })
        .required()
        .strict(),
    ),
    oldestSyncWins: z
      .boolean({ message: `'oldestSyncWins' must be boolean.` })
      .default(true)
      .optional(),
  })
  .strict({
    message: `Unexpected fields. Expected only: 'quizAttemptId', 'questionAttempts' and 'oldestSyncWins'`,
  });

// --- Type Exports ---
export type QuestionAttemptWhereInput = z.infer<
  typeof questionAttemptSchema.where
>;
export type QuestionAttemptQueryInput = z.infer<
  typeof questionAttemptSchema.query
>;
export type QuestionAttemptUpdateInput = z.infer<
  typeof questionAttemptSchema.update
>;
export type QuestionAttemptCreateInput = z.infer<
  typeof questionAttemptSchema.create
>;
export type QuestionAttemptCreateManyInput = z.infer<typeof createManySchema>;

export default questionAttemptSchema;

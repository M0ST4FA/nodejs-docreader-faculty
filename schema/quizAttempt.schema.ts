import z from 'zod';
import createModelSchema from './schema';
import { QuizAttemptStatus } from '@prisma/client';

const fullSchema = z
  .object({
    id: z.number().int({ message: 'ID must be integer.' }),
    status: z
      .nativeEnum(QuizAttemptStatus, {
        message: 'Invalid quiz status.',
      })
      .default('STARTED'),
    attemptNumber: z
      .number({ message: 'Attempt number is required.' })
      .int({ message: 'Attempt number must be an integer.' }),

    userId: z
      .number({ message: 'User ID is required.' })
      .int({ message: 'User ID must be integer.' }),

    quizId: z
      .number({ message: 'Quiz ID is required.' })
      .int({ message: 'Quiz ID must be integer.' }),

    correctAnswerCount: z
      .number({ message: 'Correct answer count is required.' })
      .int({ message: 'Correct answer count must be an integer.' }),

    score: z.number({ message: 'Score is required and must be a number.' }),

    startedAt: z.date(),
    submittedAt: z.date(),
  })
  .strict();

const quizAttemptSchema = createModelSchema(
  fullSchema,
  {
    required: ['attemptNumber', 'userId', 'quizId'],
    optional: ['status', 'correctAnswerCount', 'score'],
  },
  ['status', 'submittedAt'],
  {
    defaultPage: 1,
    defaultSize: 10,
    maxPageSize: 100,
    projectableFields: [
      'id',
      'status',
      'attemptNumber',
      'userId',
      'quizId',
      'correctAnswerCount',
      'score',
      'startedAt',
      'submittedAt',
    ],
    defaultFields: ['id', 'quizId', 'status', 'correctAnswerCount', 'score'],
    sortableFields: [
      'attemptNumber',
      'correctAnswerCount',
      'score',
      'startedAt',
      'submittedAt',
    ],
  },
);

// --- Type Exports ---
export type QuizAttemptWhereInput = z.infer<typeof quizAttemptSchema.where>;
export type QuizAttemptQueryInput = z.infer<typeof quizAttemptSchema.query>;
export type QuizAttemptUpdateInput = z.infer<typeof quizAttemptSchema.update>;
export type QuizAttemptCreateInput = z.infer<typeof quizAttemptSchema.create>;

export default quizAttemptSchema;

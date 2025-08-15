import questionSchema from '../schema/writtenQuestion.schema';
import { WrittenQuestion as PrismaQuestion } from '@prisma/client';
import db from '../prisma/db';
import { ModelFactory } from './ModelFactory';
import AppError from '../utils/AppError';
import ImageUtils from '../utils/ImageUtils';

interface NewRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface OldRect extends NewRect {
  id: number;
}

interface NewWrittenQuestion {
  text: string;
  answer: string;
}

interface OldWrittenQuestion extends NewWrittenQuestion {
  id: number;
}

export default class WrittenQuestionModel {
  private data: Partial<PrismaQuestion>;

  private static wrapper(data: PrismaQuestion): WrittenQuestionModel {
    return new WrittenQuestionModel(data);
  }

  constructor(data: Partial<PrismaQuestion>) {
    this.data = data;
  }

  toJSON() {
    return this.data;
  }

  get id(): number {
    if (this.data.id === undefined)
      throw new AppError('Written question id field is undefined.', 500);

    return this.data.id;
  }

  get quizId(): number {
    if (this.data.quizId === undefined)
      throw new AppError('Written quiz id field is undefined.', 500);

    return this.data.quizId;
  }

  static createOne = ModelFactory.createOne(
    db.writtenQuestion,
    questionSchema,
    WrittenQuestionModel.wrapper,
  );

  static async updateOne(questionId: number, creatorId: number, data: any) {
    const validatedData = questionSchema.update.safeParse(data);

    if (validatedData.error)
      throw new AppError(
        `Invalid data object. Issues: [ ${validatedData.error.issues.map(
          issue => issue.message,
        )} ]`,
        400,
      );

    const { masks, tapes, subQuestions } = validatedData.data;

    const newMasks: NewRect[] = [];
    const updatedMasks: OldRect[] = [];
    const newTapes: NewRect[] = [];
    const updatedTapes: OldRect[] = [];
    const newSubQuestions: NewWrittenQuestion[] = [];
    const updatedSubQuestions: OldWrittenQuestion[] = [];

    masks!.forEach(mask =>
      mask.id
        ? updatedMasks.push(mask as OldRect)
        : newMasks.push(mask as NewRect),
    );
    tapes!.forEach(tape =>
      tape.id
        ? updatedTapes.push(tape as OldRect)
        : newTapes.push(tape as NewRect),
    );
    subQuestions!.forEach(subQuestion =>
      subQuestion.id
        ? updatedSubQuestions.push(subQuestion as OldWrittenQuestion)
        : newSubQuestions.push(subQuestion as NewWrittenQuestion),
    );

    // DELETE

    await db.rect.deleteMany({
      where: {
        tapeQuestionId: questionId,
        id: { notIn: updatedTapes.map(({ id }) => id) },
      },
    });

    await db.rect.deleteMany({
      where: {
        maskQuestionId: questionId,
        id: { notIn: updatedMasks.map(({ id }) => id) },
      },
    });

    const deletedSubQuestions = await db.subQuestion.findMany({
      where: {
        questionId: questionId,
        id: { notIn: updatedSubQuestions.map(({ id }) => id) },
      },
      select: { answer: true },
    });

    for (const sq of deletedSubQuestions)
      ImageUtils.deleteImagesInHtml(sq.answer);

    await db.subQuestion.deleteMany({
      where: {
        questionId: questionId,
        id: { notIn: updatedSubQuestions.map(({ id }) => id) },
      },
    });

    // CREATE NEW

    await db.rect.createMany({
      data: newMasks.map(mask => ({
        ...mask,
        maskQuestionId: questionId,
        creatorId,
      })),
    });

    await db.rect.createMany({
      data: newTapes.map(tape => ({
        ...tape,
        tapeQuestionId: questionId,
        creatorId,
      })),
    });

    for (const sq of newSubQuestions)
      sq.answer = await ImageUtils.processHtmlImages(sq.answer);

    await db.subQuestion.createMany({
      data: newSubQuestions.map(question => ({
        ...question,
        questionId,
        creatorId,
      })),
    });

    // UPDATE OLD

    await Promise.all(
      updatedMasks.map(({ id, ...mask }) =>
        db.rect.update({ where: { id }, data: { ...mask } }),
      ),
    );

    await Promise.all(
      updatedTapes.map(({ id, ...tape }) =>
        db.rect.update({ where: { id }, data: { ...tape } }),
      ),
    );

    const oldSubQuestions = await db.subQuestion.findMany({
      where: { questionId },
    });

    await Promise.all(
      updatedSubQuestions.map(async sq => {
        sq.answer = await ImageUtils.processHtmlImages(sq.answer);
        ImageUtils.deleteOldImages(
          oldSubQuestions.find(({ id }) => sq.id === id)?.answer || '',
          sq.answer,
        );
      }),
    );

    await Promise.all(
      updatedSubQuestions.map(({ id, ...subQuestion }) =>
        db.subQuestion.update({ where: { id }, data: { ...subQuestion } }),
      ),
    );
  }

  static async deleteOne(id: number) {
    const writtenQuestion = await db.writtenQuestion.delete({
      where: { id },
      include: {
        subQuestions: true,
      },
    });
    await db.writtenQuiz.update({
      where: { id: writtenQuestion.quizId },
      data: { notifiable: true },
    });
    ImageUtils.deleteFile(`/image/${writtenQuestion.image}`);
    for (const subQuestion of writtenQuestion.subQuestions)
      ImageUtils.deleteImagesInHtml(subQuestion.answer);
    return writtenQuestion;
  }

  static findMany = ModelFactory.findMany(
    db.writtenQuestion,
    questionSchema,
    WrittenQuestionModel.wrapper,
  );

  static findOneById = ModelFactory.findOneById(
    db.writtenQuestion,
    questionSchema,
    WrittenQuestionModel.wrapper,
  );

  static findCreatorIdById = ModelFactory.findCreatorIdById(db.mcqQuestion);
}

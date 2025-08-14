import questionSchema from '../schema/writtenQuestion.schema';
import { WrittenQuestion as PrismaQuestion } from '@prisma/client';
import db from '../prisma/db';
import { ModelFactory } from './ModelFactory';
import AppError from '../utils/AppError';
import { unlink } from 'fs/promises';
import path from 'path';
import { JSDOM } from 'jsdom';
import {
  deleteFile,
  deleteImagesInHtml,
  processHtmlImages,
} from '../utils/imageUtils';

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
    const oldMasks: OldRect[] = [];
    const newTapes: NewRect[] = [];
    const oldTapes: OldRect[] = [];
    const newSubQuestions: NewWrittenQuestion[] = [];
    const oldSubQuestions: OldWrittenQuestion[] = [];

    masks!.forEach(mask =>
      mask.id ? oldMasks.push(mask as OldRect) : newMasks.push(mask as NewRect),
    );
    tapes!.forEach(tape =>
      tape.id ? oldTapes.push(tape as OldRect) : newTapes.push(tape as NewRect),
    );
    subQuestions!.forEach(subQuestion =>
      subQuestion.id
        ? oldSubQuestions.push(subQuestion as OldWrittenQuestion)
        : newSubQuestions.push(subQuestion as NewWrittenQuestion),
    );

    // DELETE

    await db.rect.deleteMany({
      where: {
        tapeQuestionId: questionId,
        id: { notIn: oldTapes.map(({ id }) => id) },
      },
    });

    await db.rect.deleteMany({
      where: {
        maskQuestionId: questionId,
        id: { notIn: oldMasks.map(({ id }) => id) },
      },
    });

    const deletedSubQuestions = await db.subQuestion.findMany({
      where: {
        questionId: questionId,
        id: { notIn: oldSubQuestions.map(({ id }) => id) },
      },
      select: { answer: true },
    });

    for (const sq of deletedSubQuestions) deleteImagesInHtml(sq.answer);

    await db.subQuestion.deleteMany({
      where: {
        questionId: questionId,
        id: { notIn: oldSubQuestions.map(({ id }) => id) },
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
      sq.answer = await processHtmlImages(sq.answer);

    await db.subQuestion.createMany({
      data: newSubQuestions.map(question => ({
        ...question,
        questionId,
        creatorId,
      })),
    });

    // UPDATE OLD

    await Promise.all(
      oldMasks.map(({ id, ...mask }) =>
        db.rect.update({ where: { id }, data: { ...mask } }),
      ),
    );

    await Promise.all(
      oldTapes.map(({ id, ...tape }) =>
        db.rect.update({ where: { id }, data: { ...tape } }),
      ),
    );

    for (const sq of oldSubQuestions) {
      const oldImgs: string[] = [];
      const dom = new JSDOM(sq.answer);
      const imgs = Array.from(dom.window.document.querySelectorAll('img'));
      for (const img of imgs) {
        const src = img.getAttribute('src');
        if (src && !src.startsWith('data:image/'))
          oldImgs.push(src.replace(/^\/public\//, ''));
      }
      sq.answer = await processHtmlImages(sq.answer, oldImgs);
    }

    await Promise.all(
      oldSubQuestions.map(({ id, ...subQuestion }) =>
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
    deleteFile(`/image/${writtenQuestion.image}`);
    for (const subQuestion of writtenQuestion.subQuestions)
      deleteImagesInHtml(subQuestion.answer);
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

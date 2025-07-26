import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();
export default db;

export const MODULE_ORDER_BY: any = { createdAt: 'asc' };

export const SUBJECT_INCLUDE = {
  module: { select: { id: true, semesterName: true, name: true } },
};
export const SUBJECT_ORDER_BY: any = { id: 'asc' };

export function findSubjectMany(where?: any) {
  return db.subject.findMany({
    where,
    include: {
      _count: { select: { lectures: { where: { type: 'Normal' } } } },
    },
    orderBy: SUBJECT_ORDER_BY,
  });
}

export function findSubjectUnique(where?: any) {
  return db.subject.findUnique({
    where,
    include: SUBJECT_INCLUDE,
  });
}

export const LECTURE_INCLUDE = {
  subject: { select: { id: true, name: true, ...SUBJECT_INCLUDE } },
};
export const LECTURE_ORDER_BY: any = [{ date: 'asc' }, { createdAt: 'asc' }];

export function findLectureMany(where?: any) {
  return db.lecture.findMany({
    where,
    orderBy: LECTURE_ORDER_BY,
  });
}

export function findLectureUnique(where?: any) {
  return db.lecture.findUnique({
    where,
    include: LECTURE_INCLUDE,
  });
}

export const LINK_INCLUDE = {
  lectureData: {
    select: { id: true, title: true, ...LECTURE_INCLUDE },
  },
};
export const LINK_ORDER_BY: any = { id: 'asc' };

export function findLinkMany(where?: any) {
  return db.lectureLink.findMany({
    where,
    orderBy: LINK_ORDER_BY,
  });
}

export function findLinkManyWithPath(where?: any) {
  return db.lectureLink.findMany({
    where,
    include: LINK_INCLUDE,
    orderBy: LINK_ORDER_BY,
  });
}

export function findLinkUnique(where?: any) {
  return db.lectureLink.findUnique({
    where,
    include: LINK_INCLUDE,
  });
}

export const QUIZ_INCLUDE: any = {
  questions: {
    orderBy: { id: 'asc' },
  },
  lectureData: { select: { id: true, title: true, ...LECTURE_INCLUDE } },
};
export const QUIZ_ORDER_BY: any = { createdAt: 'asc' };

export async function findQuizMany(where?: any) {
  return db.quiz.findMany({
    where,
    orderBy: QUIZ_ORDER_BY,
  });
}

export async function findQuizManyWithPath(where?: any) {
  return db.quiz.findMany({
    where,
    include: QUIZ_INCLUDE,
    orderBy: QUIZ_ORDER_BY,
  });
}

export function findQuizUnique(where?: any) {
  return db.quiz.findUnique({
    where,
    include: QUIZ_INCLUDE,
  });
}

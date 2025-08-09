import catchAsync from '../utils/catchAsync';
import { Request, Response, NextFunction } from 'express';
import AppError from '../utils/AppError';
import notificationSchema from '../schema/notification.schema';
import LinkModel from '../models/Link';
import QuizModel from '../models/Quiz';
import getUniqueObjectsById from '../utils/getUniqueObjectsById';
import bolderizeWord from '../utils/bolderizeWord';
import { messaging } from '../utils/firebase';

export default class NotificationController {
  private static extractYearID(req: Request): number {
    const id = Number.parseInt(req.params.yearId);

    if (Number.isNaN(id))
      throw new AppError('Invalid year ID: year ID must be an integer.', 400);

    return id;
  }

  public static getNotifiable = catchAsync(async function (
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const yearId = NotificationController.extractYearID(req);
    const links = await LinkModel.findNotifiable(yearId);
    const quizzes = await QuizModel.findNotifiable(yearId);
    res.status(200).json({
      status: 'success',
      data: { links, quizzes },
    });
  });

  public static notify = catchAsync(async function (
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const yearId = NotificationController.extractYearID(req);
    const validatedBody = notificationSchema.action.safeParse(req.body);

    if (validatedBody.error)
      throw new AppError(
        `Invalid ignore input: [ ${validatedBody.error.issues.map(
          issue => issue.message,
        )} ]`,
        400,
      );

    const links = await LinkModel.notify(yearId, validatedBody.data.links);
    const quizzes = await QuizModel.notify(yearId, validatedBody.data.quizzes);
    const practicalQuizzes: any[] = [];
    const lectures = getUniqueObjectsById(
      [...links, ...quizzes, ...practicalQuizzes].map(
        ({
          lectureId,
          lectureData: {
            title: lectureTitle,
            subject: {
              id: subjectId,
              name: subjectName,
              module: { name: moduleName },
            },
          },
        }) => ({
          id: lectureId,
          title: lectureTitle,
          subjectId,
          subjectName,
          moduleName,
        }),
      ),
    ).map(lecture => ({
      ...lecture,
      links: links.filter(link => link.lectureId === lecture.id),
      quizzes: quizzes.filter(quiz => quiz.lectureId === lecture.id),
      practicalQuizzes: practicalQuizzes.filter(
        quiz => quiz.lectureId === lecture.id,
      ),
    }));

    let message = '';

    for (const lecture of lectures) {
      message += '👈 ';
      if (lecture.title === 'Practical Data')
        message +=
          'في عملي مادة ' +
          bolderizeWord(lecture.subjectName) +
          ' موديول ' +
          bolderizeWord(lecture.moduleName);
      else if (lecture.title === 'Final Revision Data')
        message +=
          'في المراجعة النهائية لمادة ' +
          bolderizeWord(lecture.subjectName) +
          ' موديول ' +
          bolderizeWord(lecture.moduleName);
      else message += 'في محاضرة ' + bolderizeWord(lecture.title);
      message += ` تم إضافة المصادر التالية:\n${[
        ...lecture.links,
        ...lecture.quizzes,
        ...lecture.practicalQuizzes,
      ]
        .map(({ title }) => `💥 ${title}\n`)
        .join('')}`;
    }

    await messaging.send({
      notification: {
        title: 'تم إضافة مصادر جديدة 🔥',
        body: message,
      },
      data: { id: lectures[0].id.toString(), title: lectures[0].title },
      webpush: {
        fcmOptions: {
          link: `${process.env.FRONTEND_URL}/lectures/${lectures[0].id}`,
        },
      },
      topic: yearId.toString(),
    });

    return res.status(200).json({
      status: 'success',
      message: 'Notification was sent successfully',
    });
  });

  public static ignore = catchAsync(async function (
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const yearId = NotificationController.extractYearID(req);
    const validatedBody = notificationSchema.action.safeParse(req.body);

    if (validatedBody.error)
      throw new AppError(
        `Invalid ignore input: [ ${validatedBody.error.issues.map(
          issue => issue.message,
        )} ]`,
        400,
      );

    LinkModel.ignore(yearId, validatedBody.data.links);
    QuizModel.ignore(yearId, validatedBody.data.quizzes);

    res
      .status(200)
      .json({ status: 'success', message: 'Links where ignored successfully' });
  });
}

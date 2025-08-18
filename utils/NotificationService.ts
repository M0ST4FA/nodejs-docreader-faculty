import LinkModel from '../models/Link';
import McqQuizModel from '../models/McqQuiz';
import WrittenQuizModel from '../models/WrittenQuiz';
import { NotificationSchemaType } from '../schema/notification.schema';
import fcmService from './FCMService';

type NotificationBody = {
  notification: {
    title?: string | undefined;
    body?: string | undefined;
    imageUrl?: string | undefined;
  };
  data?: {} | undefined;
  webpush: any;
};

type ResourceIds = {
  links: number[];
  mcqQuizzes: number[];
  writtenQuizzes: number[];
};

class NotificationService {
  private static removeDuplicateResources<T extends { id: number }>(
    array: T[],
  ): T[] {
    const uniqueMap = new Map();

    array.forEach(item => {
      if (!uniqueMap.has(item.id)) {
        uniqueMap.set(item.id, item);
      }
    });

    return Array.from(uniqueMap.values());
  }

  private static makeWordBold(word: string): string {
    const upperDiff = '𝗔'.codePointAt(0)! - 'A'.codePointAt(0)!;
    const lowerDiff = '𝗮'.codePointAt(0)! - 'a'.codePointAt(0)!;

    const isUpper = (n: number) => n >= 65 && n < 91;
    const isLower = (n: number) => n >= 97 && n < 123;

    const makeCharacterBold = (char: string) => {
      const n = char.charCodeAt(0);
      if (isUpper(n)) return String.fromCodePoint(n + upperDiff);
      if (isLower(n)) return String.fromCodePoint(n + lowerDiff);
      return char;
    };

    const characters = [...word];

    return characters.map(makeCharacterBold).join('');
  }

  private static async fetchResources(
    yearId: number,
    resourceIds: ResourceIds,
  ) {
    const links = await LinkModel.markAllNotifiedAndReturn(
      yearId,
      resourceIds.links,
    );
    const mcqQuizzes = await McqQuizModel.markAllNotifiedAndReturn(
      yearId,
      resourceIds.mcqQuizzes,
    );
    const practicalQuizzes = await WrittenQuizModel.markAllNotifiedAndReturn(
      yearId,
      resourceIds.writtenQuizzes,
    );
    return { links, mcqQuizzes, practicalQuizzes };
  }

  private static buildLecturesWithResources(
    links: any[],
    mcqQuizzes: any[],
    practicalQuizzes: any[],
  ) {
    return NotificationService.removeDuplicateResources(
      [...links, ...mcqQuizzes, ...practicalQuizzes].map(
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
      mcqQuizzes: mcqQuizzes.filter(quiz => quiz.lectureId === lecture.id),
      practicalQuizzes: practicalQuizzes.filter(
        quiz => quiz.lectureId === lecture.id,
      ),
    }));
  }

  private static buildNotificationMessage(lectures: any[]): string {
    let message = '';
    for (const lecture of lectures) {
      message += '👈 ';
      if (lecture.title === 'Practical Data')
        message += `في عملي مادة ${NotificationService.makeWordBold(
          lecture.subjectName,
        )} موديول ${NotificationService.makeWordBold(lecture.moduleName)}`;
      else if (lecture.title === 'Final Revision Data')
        message += `في المراجعة النهائية لمادة ${NotificationService.makeWordBold(
          lecture.subjectName,
        )} موديول ${NotificationService.makeWordBold(lecture.moduleName)}`;
      else
        message += `في محاضرة ${NotificationService.makeWordBold(
          lecture.title,
        )}`;
      message += ` تم إضافة المصادر التالية:\n${[
        ...lecture.links,
        ...lecture.mcqQuizzes,
        ...lecture.practicalQuizzes,
      ]
        .map(({ title }) => `💥 ${title}\n`)
        .join('')}`;
    }
    return message;
  }

  private static buildNotificationBody(
    lecture: any,
    message: string,
  ): NotificationBody {
    return {
      notification: {
        title: 'تم إضافة مصادر جديدة 🔥',
        body: message,
      },
      data: {
        id: lecture.id.toString(),
        title: lecture.title,
      },
      webpush: {
        fcmOptions: {
          link: `${process.env.FRONTEND_URL}/lectures/${lecture.id}`,
        },
      },
    };
  }

  private static async buildLectureNotification(
    yearId: number,
    resourceIds: ResourceIds,
  ): Promise<NotificationBody> {
    // Step 1: Fetch resources
    const { links, mcqQuizzes, practicalQuizzes } =
      await NotificationService.fetchResources(yearId, resourceIds);

    // Step 2: Group lectures and attach resources
    const lectures = NotificationService.buildLecturesWithResources(
      links,
      mcqQuizzes,
      practicalQuizzes,
    );

    // Step 3: Build message
    const message = NotificationService.buildNotificationMessage(lectures);

    // Step 4: Return notification body
    return NotificationService.buildNotificationBody(lectures[0], message);
  }

  private static broadcastAutogeneratedNotification = async (
    yearId: number,
    resourceIds: ResourceIds,
  ) => {
    const body = await NotificationService.buildLectureNotification(
      yearId,
      resourceIds,
    );
    return await fcmService.broadcastNotificationToTopic(
      body,
      yearId.toString(),
    );
  };

  private static ignoreNotificationForResources = async function (
    yearId: number,
    resourceIds: ResourceIds,
  ) {
    await Promise.all([
      LinkModel.markAllNotified(yearId, resourceIds.links),
      McqQuizModel.markAllNotified(yearId, resourceIds.mcqQuizzes),
    ]);
  };

  private static handleAutogeneratedNotification = async function (
    yearId: number,
    notifyResources: ResourceIds,
    ignoreResources: ResourceIds,
  ) {
    const result = await Promise.all([
      NotificationService.broadcastAutogeneratedNotification(
        yearId,
        notifyResources,
      ),
      NotificationService.ignoreNotificationForResources(
        yearId,
        ignoreResources,
      ),
    ]);

    const messageId = result[0];

    return messageId;
  };

  public static broadcastToTopic = async function (
    notification: NotificationSchemaType,
    topic: string,
  ) {
    let messageId: string;

    if (notification.type === 'custom')
      // Broadcast notification to all topic subscribers
      messageId = await fcmService.broadcastNotificationToTopic(
        notification.body,
        topic,
      );
    else
      messageId = await NotificationService.handleAutogeneratedNotification(
        notification.yearId,
        notification.notify,
        notification.ignore,
      );

    return messageId;
  };
}

export default NotificationService;

import LinkModel from '../models/Link';
import McqQuizModel from '../models/McqQuiz';
import TopicModel from '../models/Topic';
import { TopicCreateInput } from '../schema/topic.schema';
import WrittenQuizModel from '../models/WrittenQuiz';
import db from '../prisma/db';
import { NotificationSchemaType } from '../schema/notification.schema';
import AppError from './AppError';
import fcmService from './FCMService';
import { DeviceCreateInput } from '../schema/device.schema';
import DeviceModel from '../models/Device';

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

type SubscriptionResult = {
  successfulTokens: string[];
  failedTokens: { token: string | null; message: string; errorCode: any }[];
  removedInvalidTokensCount: number;
};

interface FailedTokenDetails {
  token: string | null;
  message: string;
  errorCode?: string;
}
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

    const writtenQuizzes = await WrittenQuizModel.markAllNotifiedAndReturn(
      yearId,
      resourceIds.writtenQuizzes,
    );

    return { links, mcqQuizzes, writtenQuizzes };
  }

  private static buildLecturesWithResources(
    links: any[],
    mcqQuizzes: any[],
    writtenQuizzes: any[],
  ) {
    return NotificationService.removeDuplicateResources(
      [...links, ...mcqQuizzes, ...writtenQuizzes].map(
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
      writtenQuizzes: writtenQuizzes.filter(
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
    const { links, mcqQuizzes, writtenQuizzes } =
      await NotificationService.fetchResources(yearId, resourceIds);

    // Step 2: Group lectures and attach resources
    const lectures = NotificationService.buildLecturesWithResources(
      links,
      mcqQuizzes,
      writtenQuizzes,
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
      WrittenQuizModel.markAllNotified(yearId, resourceIds.writtenQuizzes),
    ]);
  };

  private static handleAutogeneratedNotification = async function (
    yearId: number,
    notifyResources: ResourceIds,
    ignoreResources: ResourceIds,
  ) {
    let messageId = '';
    if (notifyResources) {
      messageId = await NotificationService.broadcastAutogeneratedNotification(
        yearId,
        notifyResources,
      );
    }

    if (ignoreResources) {
      await NotificationService.ignoreNotificationForResources(
        yearId,
        ignoreResources,
      );
    }

    return messageId;
  };

  private static async cleanUpInvalidDevices(
    failedTokens: FailedTokenDetails[],
    tokenToDeviceId: Map<string, number>,
  ): Promise<number> {
    const tokensToRemoveFromDb: string[] = [];

    failedTokens.forEach(failed => {
      // Identify tokens that should be removed from your database based on FCM error codes
      if (
        failed.errorCode === 'messaging/invalid-argument' ||
        failed.errorCode === 'messaging/registration-token-not-registered' ||
        failed.errorCode === 'messaging/invalid-registration-token' ||
        failed.errorCode === 'messaging/unregistered' // Older code, but good to include
      ) {
        if (failed.token) {
          tokensToRemoveFromDb.push(failed.token);
        }
      }
    });

    if (tokensToRemoveFromDb.length > 0) {
      const deviceIdsToRemove = tokensToRemoveFromDb
        .map(token => tokenToDeviceId.get(token))
        .filter((id): id is number => id !== undefined); // Filter out any undefined/null device IDs

      if (deviceIdsToRemove.length > 0)
        try {
          await db.device.deleteMany({
            where: {
              id: {
                in: deviceIdsToRemove,
              },
            },
          });
        } catch {
          throw new AppError(
            'Failed to remove invalid FCM devices from database.',
            500,
          );
        }
    }

    return tokensToRemoveFromDb.length;
  }

  // TOPIC FUNCTIONS
  public static createTopic = async function (
    data: TopicCreateInput,
    queryParams: any,
  ) {
    return await TopicModel.createOne(data, queryParams);
  };

  public static deleteTopic = async function (topicName: string) {
    // 1. Extract all devices subscribed to 'topicName'
    const devicesSubscribedToTopic = (
      await db.deviceTopic.findMany({
        where: { topic: { name: topicName } },
        include: { device: { select: { id: true, token: true } } },
      })
    ).map(deviceTopic => deviceTopic.device);

    const deviceTokens = devicesSubscribedToTopic.map(device => device.token);
    const tokenToDeviceId = new Map(
      devicesSubscribedToTopic.map(device => [device.token, device.id]),
    );

    return (
      await Promise.all([
        // 2. Unsubscribe all the devices from the topic
        NotificationService.unsubscribeDevicesFromTopic(
          deviceTokens,
          tokenToDeviceId,
          topicName,
        ),

        // 3. Delete the topic from the database
        await TopicModel.deleteOne(topicName),
      ])
    )[0];
  };

  public static broadcastToTopic = async function (
    notification: NotificationSchemaType,
    topic: string,
  ) {
    let messageId: string;

    if (notification.type === 'custom')
      // Broadcast notification to all topic subscribers
      messageId = await fcmService.broadcastNotificationToTopic(
        notification.body!,
        topic,
      );
    else
      messageId = await NotificationService.handleAutogeneratedNotification(
        notification.yearId!,
        notification.notify!,
        notification.ignore!,
      );

    return messageId;
  };

  // DEVICE FUNCTIONS
  public static createDevice = async function (
    data: DeviceCreateInput,
    queryParams: any,
  ) {
    return await DeviceModel.createOne(data, queryParams);
  };

  public static deleteDevice = async function (id: number) {
    // IMPORTANT: This only deletes the device (and its associated deviceTopic entries) from the database.
    // The frontend has the responsibility of unregistering the device with FCM.
    // Unsubscribing from topics at FCM level happens automatically when FCM deletes the device.

    return await DeviceModel.deleteOne(id);
  };

  public static subscribeDevicesToTopic = async function (
    deviceTokens: string[],
    tokenToDeviceId: Map<string, number>,
    topicName: string,
  ): Promise<SubscriptionResult> {
    // Short-circuit. Required, as fcmService would give an error otherwise.
    if (deviceTokens.length === 0)
      return {
        successfulTokens: [],
        failedTokens: [],
        removedInvalidTokensCount: 0,
      };

    // 1. Make sure the topic exists first
    const topic = await TopicModel.findOneByName(topicName, {});

    // Group successes and failures
    const { failedTokens, successfulTokens } =
      await fcmService.subscribeDevicesToTopic(deviceTokens, topicName);

    // 2. Remove any invalid token
    const removedInvalidTokensCount =
      await NotificationService.cleanUpInvalidDevices(
        failedTokens,
        tokenToDeviceId,
      );

    // 3. Add device-topic association to database
    await db.deviceTopic.createMany({
      data: successfulTokens.map(token => ({
        deviceId: tokenToDeviceId.get(token)!,
        topicId: topic.id,
      })),
      skipDuplicates: true,
    });

    return { successfulTokens, failedTokens, removedInvalidTokensCount };
  };

  public static unsubscribeDevicesFromTopic = async function (
    deviceTokens: string[],
    tokenToDeviceId: Map<string, number>,
    topicName: string,
  ): Promise<SubscriptionResult> {
    // Short-circuit. Required, as fcmService would give an error otherwise.
    if (deviceTokens.length === 0)
      return {
        successfulTokens: [],
        failedTokens: [],
        removedInvalidTokensCount: 0,
      };

    // 1. Group response into successes and failures
    const { failedTokens, successfulTokens } =
      await fcmService.unsubscribeDevicesFromTopic(deviceTokens, topicName);

    // Make sure topic already exists. Note: All of their errors will be handled by global error handler
    const topic = await TopicModel.findOneByName(topicName, {});

    // 2. Remove any invalid token
    const removedInvalidTokensCount =
      await NotificationService.cleanUpInvalidDevices(
        failedTokens,
        tokenToDeviceId,
      );

    // 3. Remove device-topic associations from database
    await db.deviceTopic.deleteMany({
      where: {
        deviceId: {
          in: successfulTokens.map(token => tokenToDeviceId.get(token)!),
        },
        topicId: topic.id,
      },
    });

    return { successfulTokens, failedTokens, removedInvalidTokensCount };
  };
}

export default NotificationService;

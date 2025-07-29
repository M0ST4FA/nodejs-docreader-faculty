import catchAsync from '../utils/catchAsync';
import { Request, Response, NextFunction } from 'express';
import fcmService from '../utils/FCMService';
import AppError from '../utils/AppError';
import DeviceModel from '../models/Device';
import notificationBodySchema from '../schema/notification.schema';
import TopicModel from '../models/Topic';

type NotificationBody = {
  notification: {
    title?: string | undefined;
    body?: string | undefined;
    imageUrl?: string | undefined;
  };
  data?: {} | undefined;
};

export default class NotificationController {
  private static extractTopicName(req: Request): string {
    const name = req.params.name;

    if (name === undefined)
      throw new AppError(
        'Invalid topic name: topic name must be a string.',
        400,
      );

    return name;
  }

  private static async extractCurrentUserDevices(
    req: Request,
  ): Promise<Partial<DeviceModel[]>> {
    const devices = (await DeviceModel.findMany(
      {
        userId: req.user.id,
      },
      { fields: 'token' },
    )) as DeviceModel[];

    if (devices.length === 0)
      throw new AppError(
        'The logged in user account does not have any device associated with them.',
        400,
      );

    return devices;
  }

  private static async validateNotificationBody(
    body: any,
  ): Promise<NotificationBody> {
    const validatedNotificationBody = notificationBodySchema.safeParse(body);

    if (validatedNotificationBody.error)
      throw new AppError(
        `Invalid notification body: [ ${validatedNotificationBody.error.issues.map(
          issue => issue.message,
        )} ]`,
        400,
      );

    return validatedNotificationBody.data;
  }

  static setGlobalTopic = catchAsync(async function (
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    req.params.name = 'global_announcements';

    next();
  });

  static broadcastToTopic = catchAsync(async function (
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    // Extract topic name
    const topicName = NotificationController.extractTopicName(req);

    // Check whether the topic already exists (an exception is thrown if it doesn't)
    const topic = await TopicModel.findOneByName(topicName, {});

    // Extract and validate notification body
    const notificationBody =
      await NotificationController.validateNotificationBody(req.body);

    // Broadcast notification to all topic subscribers
    const messageId = await fcmService.broadcastNotificationToTopic(
      notificationBody,
      topic.name,
    );

    res.status(200).json({
      status: 'success',
      data: {
        messageId,
      },
    });
  });

  static test = catchAsync(async function (
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const devices = (await NotificationController.extractCurrentUserDevices(
      req,
    )) as Partial<DeviceModel>[];
    const notificationBody =
      await NotificationController.validateNotificationBody(req.body);

    const result = await fcmService.multicastNotification(
      notificationBody,
      devices.map(device => device.token!),
    );

    res.status(207).json({
      status: 'partial',
      totalCount: result.successCount + result.failureCount,
      successCount: result.successCount,
      failureCount: result.failureCount,
      data: {
        successfulTokens: result.successfulTokens,
        failedTokens: result.failedTokens,
      },
    });
  });
}

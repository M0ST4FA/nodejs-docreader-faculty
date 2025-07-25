import catchAsync from '../utils/catchAsync';
import { Request, Response, NextFunction } from 'express';
import { firebaseAdminSDK, notificationMessaging } from '../utils/firebase';
import AppError from '../utils/AppError';
import DeviceModel from '../models/Device';
import notificationBodySchema from '../schema/notification.schema';

type NotificationBody = {
  notification: {
    title?: string | undefined;
    body?: string | undefined;
    imageUrl?: string | undefined;
  };
  data?: {} | undefined;
};

export default class NotificationController {
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

  private static async multicastNotification(
    devices: Partial<DeviceModel>[],
    notificationBody: NotificationBody,
  ) {
    const response = await notificationMessaging.sendEachForMulticast(
      {
        tokens: devices.map((device: any) => device.token),
        notification: notificationBody.notification,
        data: notificationBody.data,
      },
      true,
    );

    console.log(response);
  }

  static broadcastToTopic = catchAsync(function (
    req: Request,
    res: Response,
  ) {});

  static broadcast = catchAsync(function (
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    notificationMessaging.sendEachForMulticast({
      tokens: [],
      notification: {},
      data: {},
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

    await NotificationController.multicastNotification(
      devices,
      notificationBody,
    );

    res.status(204).json({
      status: 'success',
      data: null,
    });
  });
}

import catchAsync from '../utils/catchAsync';
import { Request, Response, NextFunction } from 'express';
import { notificationMessaging } from '../utils/firebase';
import AppError from '../utils/AppError';
import DeviceModel from '../models/Device';
import notificationBodySchema from '../schema/notification.schema';

export default class NotificationController {
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
    const devices = await DeviceModel.findMany(
      {
        userId: req.user.id,
      },
      { fields: 'token' },
    );

    if (devices.length === 0)
      throw new AppError(
        'The logged in user account does not have any device associated with them.',
        400,
      );

    const validatedNotificationBody = notificationBodySchema.safeParse(
      req.body,
    );

    if (validatedNotificationBody.error)
      throw new AppError(
        `Invalid notification body: [ ${validatedNotificationBody.error.issues.map(
          issue => issue.message,
        )} ]`,
        400,
      );

    const response = await notificationMessaging.sendEachForMulticast(
      {
        tokens: devices.map(device => device.token),
        notification: validatedNotificationBody.data.notification,
        data: validatedNotificationBody.data.data,
      },
      true,
    );

    console.log(response);

    res.status(204).json({
      status: 'success',
      data: null,
    });
  });
}

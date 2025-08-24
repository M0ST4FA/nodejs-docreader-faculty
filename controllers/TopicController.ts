import catchAsync from '../utils/catchAsync';
import { Request, Response, NextFunction } from 'express';
import TopicModel from '../models/Topic';
import AppError from '../utils/AppError';
import fcmService from '../utils/FCMService';
import DeviceModel from '../models/Device';
import db from '../prisma/db';
import NotificationService from '../utils/NotificationService';

interface FailedTokenDetails {
  token: string | null;
  message: string;
  errorCode?: string;
}

export default class TopicController {
  private static extractTopicName(req: Request): string {
    const name = req.params.name;

    if (name === undefined)
      throw new AppError(
        'Invalid topic name: topic name must be a string.',
        400,
      );

    return name;
  }

  private static async extractDataForTokenOperation(req: Request) {
    // Fetch user devices
    const userId = req.user.id;
    const topicName = TopicController.extractTopicName(req);
    const devices = await DeviceModel.findMany(
      { userId },
      { fields: 'token,id' },
    );

    // If the user has at least one device
    const deviceTokens = devices.map(device => device.token) as string[];
    const tokenToDeviceId = new Map(
      devices.map(device => [device.token, device.id]),
    ) as Map<string, number>;

    return { topicName, deviceTokens, tokenToDeviceId };
  }

  public static createTopic = catchAsync(async function (
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    req.body.creatorId = req.user.id;

    const topic = (await TopicModel.createOne(
      req.body,
      req.query,
    )) as TopicModel;

    res.status(201).json({
      status: 'success',
      data: {
        topic,
      },
    });
  });

  public static getAllTopics = catchAsync(async function (
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    let topics: any[];

    if (req.userMostPermissiveScope === 'RESTRICTED')
      topics = await TopicModel.findMany({}, req.query);
    else topics = await TopicModel.findMany({ public: true }, req.query);

    res.status(200).json({
      status: 'success',
      totalCount: topics.length,
      data: {
        topics,
      },
    });
  });

  public static getTopic = catchAsync(async function (
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const name = TopicController.extractTopicName(req);

    const topic = await TopicModel.findOneByName(name, req.query);

    res.status(200).json({
      status: 'success',
      data: {
        topic,
      },
    });
  });

  public static getUserDevicesTopics = catchAsync(async function (
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const userId = req.user.id;
    const userDevices = await DeviceModel.findMany({ userId }, {});
    const topics = await TopicModel.findManyByDeviceIds(
      userDevices.map(device => device.id),
    );

    res.status(200).json({
      status: 'success',
      totalCount: topics.length,
      data: {
        topics,
      },
    });
  });

  public static updateTopic = catchAsync(async function (
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const name = TopicController.extractTopicName(req);

    const updatedTopic = await TopicModel.updateOne(name, req.body, req.query);

    res.status(200).json({
      status: 'success',
      data: {
        topic: updatedTopic,
      },
    });
  });

  public static deleteTopic = catchAsync(async function (
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const name = TopicController.extractTopicName(req);

    const { failedTokens, successfulTokens } = await TopicModel.deleteOne(name);

    res.status(207).json({
      status: 'partial',
      totalDeletedTokens: failedTokens.length + successfulTokens.length,
      successCount: successfulTokens.length,
      failureCount: failedTokens.length,
      data: {
        successfulTokens,
        failedTokens,
      },
    });
  });

  public static subscribeUserDevicesToTopic = catchAsync(async function (
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const { topicName, deviceTokens, tokenToDeviceId } =
      await TopicController.extractDataForTokenOperation(req);

    // If the user has no devices
    if (deviceTokens.length === 0)
      return res.status(200).json({
        status: 'success',
        message: "You don't have any devices to subscribe to any topic.",
      });

    // Note: All of their errors will be handled by global error handler
    const { successfulTokens, failedTokens, removedInvalidTokensCount } =
      await NotificationService.subscribeDevicesToTopic(
        deviceTokens,
        tokenToDeviceId,
        topicName,
      );

    res.status(207).json({
      status: 'partial',
      totalCount: deviceTokens.length,
      successCount: successfulTokens.length,
      failureCount: failedTokens.length,
      data: {
        successes: successfulTokens,
        failures: failedTokens,
        removedInvalidTokensCount: removedInvalidTokensCount,
      },
    });
  });

  public static unsubscribeUserDevicesFromTopic = catchAsync(async function (
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const { topicName, deviceTokens, tokenToDeviceId } =
      await TopicController.extractDataForTokenOperation(req);

    // If the user has no devices
    if (deviceTokens.length === 0)
      return res.status(200).json({
        status: 'success',
        message: "You don't have any devices subscribed to this topic.",
      });

    const { successfulTokens, failedTokens, removedInvalidTokensCount } =
      await NotificationService.unsubscribeDevicesFromTopic(
        deviceTokens,
        tokenToDeviceId,
        topicName,
      );

    res.status(207).json({
      status: 'partial',
      totalCount: deviceTokens.length,
      successCount: successfulTokens.length,
      failureCount: failedTokens.length,
      data: {
        successes: successfulTokens,
        failures: failedTokens,
        removedInvalidTokensCount: removedInvalidTokensCount,
      },
    });
  });
}

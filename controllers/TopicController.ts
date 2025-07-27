import catchAsync from '../utils/catchAsync';
import { Request, Response, NextFunction } from 'express';
import TopicModel from '../models/Topic';
import AppError from '../utils/AppError';
import { notificationMessaging } from '../utils/firebase';
import DeviceModel from '../models/Device';
import db from '../prisma/db';
import { MessagingTopicManagementResponse } from 'firebase-admin/lib/messaging/messaging-api';

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

  private static splitFCMResults(
    deviceTokens: string[],
    response: MessagingTopicManagementResponse,
  ) {
    const failedIndices = new Set(response.errors.map(e => e.index));
    const successfulTokens = deviceTokens.filter(
      (_, i) => !failedIndices.has(i),
    );

    const failedTokens = response.errors.map(e => ({
      token: e.index !== undefined ? deviceTokens[e.index] : null,
      message: e.error?.message || 'Unknown FCM error',
    }));

    return { successfulTokens, failedTokens };
  }

  public static createTopic = catchAsync(async function (
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    req.body.userId = req.user.id;

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
    const topics = await TopicModel.findMany({}, req.query);

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
    const id = TopicController.extractTopicName(req);

    const updatedTopic = await TopicModel.updateOne(id, req.body, req.query);

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

    await TopicModel.deleteOne(name);

    res.status(204).json({
      status: 'success',
      data: null,
    });
  });

  public static subscribeUserDevicesToTopic = catchAsync(async function (
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    // Fetch user devices
    const userId = req.user.id;
    const topicName = TopicController.extractTopicName(req);
    const devices = await DeviceModel.findMany(
      { userId },
      { fields: 'token,id' },
    );

    // If the user has no devices
    if (devices.length === 0)
      return res.status(204).json({
        status: 'success',
        message: 'No devices to subscribe to topic.',
      });

    // If the user has at least one device
    const deviceTokens = devices.map(device => device.token) as string[];
    const tokenToDeviceId = new Map(
      devices.map(device => [device.token, device.id]),
    );

    const response = await notificationMessaging.subscribeToTopic(
      deviceTokens,
      topicName,
    );

    // Group successes and failures
    const { failedTokens, successfulTokens } = TopicController.splitFCMResults(
      deviceTokens,
      response,
    );

    // Note: All of their errors will be handled by global error handler
    const topic = await TopicModel.findOneByName(topicName, {});

    await db.deviceTopic.createMany({
      data: successfulTokens.map(token => ({
        deviceId: tokenToDeviceId.get(token)!,
        topicId: topic.id,
      })),
      skipDuplicates: true,
    });

    if (failedTokens.length === 0)
      return res.status(204).json({
        status: 'success',
        data: null,
      });

    res.status(207).json({
      status: 'partial',
      totalCount: deviceTokens.length,
      data: {
        successes: successfulTokens,
        failures: failedTokens,
      },
    });
  });

  public static unsubscribeUserDevicesFromTopic = catchAsync(async function (
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    // Fetch user devices
    const userId = req.user.id;
    const topicName = TopicController.extractTopicName(req);
    const devices = await DeviceModel.findMany(
      { userId },
      { fields: 'token,id' },
    );

    // If the user has no devices
    if (devices.length === 0) return;

    // If the user has at least one device
    const deviceTokens = devices.map(device => device.token) as string[];
    const tokenToDeviceId = new Map(
      devices.map(device => [device.token, device.id]),
    );

    const response = await notificationMessaging.unsubscribeFromTopic(
      deviceTokens,
      topicName,
    );

    // Group response into successes and failures
    const { failedTokens, successfulTokens } = TopicController.splitFCMResults(
      deviceTokens,
      response,
    );

    // Note: All of their errors will be handled by global error handler
    const topic = await TopicModel.findOneByName(topicName, {});

    await db.deviceTopic.deleteMany({
      where: {
        deviceId: {
          in: successfulTokens.map(token => tokenToDeviceId.get(token)!),
        },
        topicId: topic.id,
      },
    });

    if (failedTokens.length === 0)
      return res.status(204).json({
        status: 'success',
        data: null,
      });

    res.status(207).json({
      status: 'partial',
      totalCount: deviceTokens.length,
      data: {
        successes: successfulTokens,
        failures: failedTokens,
      },
    });
  });

  public static broadcast = catchAsync(async function (
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const name = TopicController.extractTopicName(req);
  });
}

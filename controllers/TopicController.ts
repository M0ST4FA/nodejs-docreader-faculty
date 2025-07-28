import catchAsync from '../utils/catchAsync';
import { Request, Response, NextFunction } from 'express';
import TopicModel from '../models/Topic';
import AppError from '../utils/AppError';
import fcmService from '../utils/FCMService';
import DeviceModel from '../models/Device';
import db from '../prisma/db';

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

    if (req.hasAccessToRestrictedResource)
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
    if (deviceTokens.length === 0) return res.status(204);

    // Group successes and failures
    const { failedTokens, successfulTokens } =
      await fcmService.subscribeDevicesToTopic(deviceTokens, topicName);

    // Note: All of their errors will be handled by global error handler
    const topic = await TopicModel.findOneByName(topicName, {});

    // Remove any invalid token
    const removedInvalidTokensCount =
      await TopicController.cleanUpInvalidDevices(
        failedTokens,
        tokenToDeviceId,
      );

    await db.deviceTopic.createMany({
      data: successfulTokens.map(token => ({
        deviceId: tokenToDeviceId.get(token)!,
        topicId: topic.id,
      })),
      skipDuplicates: true,
    });

    res.status(207).json({
      status: 'partial',
      totalCount: deviceTokens.length,
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
    if (deviceTokens.length === 0) return res.status(204).send();

    // Group response into successes and failures
    const { failedTokens, successfulTokens } =
      await fcmService.unsubscribeDevicesFromTopic(deviceTokens, topicName);

    // Note: All of their errors will be handled by global error handler
    const topic = await TopicModel.findOneByName(topicName, {});

    // Remove any invalid token
    const removedInvalidTokensCount =
      await TopicController.cleanUpInvalidDevices(
        failedTokens,
        tokenToDeviceId,
      );

    await db.deviceTopic.deleteMany({
      where: {
        deviceId: {
          in: successfulTokens.map(token => tokenToDeviceId.get(token)!),
        },
        topicId: topic.id,
      },
    });

    res.status(207).json({
      status: 'partial',
      totalCount: deviceTokens.length,
      data: {
        successes: successfulTokens,
        failures: failedTokens,
        removedInvalidTokensCount: removedInvalidTokensCount,
      },
    });
  });
}

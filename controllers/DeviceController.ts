import catchAsync from '../utils/catchAsync';
import { Request, Response, NextFunction } from 'express';
import DeviceModel from '../models/Device';
import AppError from '../utils/AppError';
import { messaging } from '../utils/firebase';

export default class DeviceController {
  private static extractDeviceId(req: Request): number {
    const id = Number.parseInt(req.params.id);

    if (Number.isNaN(id))
      throw new AppError(
        'Invalid device ID: device ID must be an integer.',
        400,
      );

    return id;
  }

  public static createDevice = catchAsync(async function (
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    req.body.userId = req.user.id;

    const device = (await DeviceModel.createOne(
      req.body,
      req.query,
    )) as DeviceModel;

    if (req.user.yearId)
      messaging.subscribeToTopic(device.token, req.user.yearId.toString());

    res.status(201).json({
      status: 'success',
      data: {
        device,
      },
    });
  });

  public static getAllDevices = catchAsync(async function (
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const devices = await DeviceModel.findMany({}, req.query);

    res.status(200).json({
      status: 'success',
      totalCount: devices.length,
      data: {
        devices,
      },
    });
  });

  public static getDevices = catchAsync(async function (
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const userId = req.user.id;

    const devices = await DeviceModel.findMany(
      {
        userId,
      },
      req.query,
    );

    res.status(200).json({
      status: 'success',
      totalCount: devices.length,
      data: {
        devices,
      },
    });
  });

  public static updateDevice = catchAsync(async function (
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const id = DeviceController.extractDeviceId(req);

    const updatedDevice = await DeviceModel.updateOne(id, req.body, req.query);

    res.status(200).json({
      status: 'success',
      data: {
        device: updatedDevice,
      },
    });
  });

  public static deleteDevice = catchAsync(async function (
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const id = DeviceController.extractDeviceId(req);

    const device = await DeviceModel.deleteOne(id);

    res.status(200).json({
      status: 'success',
      data: { device },
    });
  });
}

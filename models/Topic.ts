import catchAsync from '../utils/catchAsync';
import { notificationMessaging } from '../utils/firebase';
import DeviceModel from './Device';

class TopicModel {
  static subscribeToTopic = catchAsync(async function (
    device: DeviceModel,
    topicName: string,
  ) {
    const response = await notificationMessaging.subscribeToTopic(
      device.token as string,
      topicName,
    );
  });
}

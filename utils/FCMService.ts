import admin from 'firebase-admin';
import { Messaging } from 'firebase-admin/lib/messaging/messaging';
import fs from 'node:fs';
import { MessagingTopicManagementResponse } from 'firebase-admin/lib/messaging/messaging-api';

type NotificationBody = {
  notification: {
    title?: string | undefined;
    body?: string | undefined;
    imageUrl?: string | undefined;
  };
  data?: {} | undefined;
};

interface FailedTokenDetails {
  token: string | null; // The token that failed
  message: string; // The error message
  errorCode?: string; // The Firebase error code (e.g., 'messaging/unregistered')
}

class FCMService {
  #app: admin.app.App;
  #messaging: Messaging;

  private static splitFCMTopicResults(
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
      errorCode: (e.error as any)?.code || undefined, // Cast to any to access code, or define a more specific error interface
    }));

    return { successfulTokens, failedTokens };
  }

  private static splitFCMMulticastResults(
    deviceTokens: string[],
    response: admin.messaging.BatchResponse,
  ) {
    const successfulTokens: string[] = [];
    const failedTokens: FailedTokenDetails[] = [];

    response.responses.forEach((res, index) => {
      const token = deviceTokens[index]; // Get the original token for this response

      if (res.success) {
        successfulTokens.push(token);
      } else {
        // Extract error details
        failedTokens.push({
          token: token,
          message: res.error?.message || 'Unknown multicast error',
          errorCode: (res.error as any)?.code || undefined, // Cast to any to access code
        });
      }
    });

    return { successfulTokens, failedTokens };
  }

  constructor() {
    const privateKey = fs
      .readFileSync(process.env.FIREBASE_PRIVATE_KEY_PATH!)
      .toString();
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL!;
    const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!;

    const cert = admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    });

    // Do not create a new app if one already exists
    if (admin.apps.length > 0) this.#app = admin.app();
    else
      this.#app = admin.initializeApp({
        credential: cert,
        projectId,
        storageBucket,
      });

    this.#messaging = this.#app.messaging();
  }

  public async unsubscribeDevicesFromTopic(
    deviceTokens: string[],
    topicName: string,
  ) {
    const response = await this.#messaging.unsubscribeFromTopic(
      deviceTokens,
      topicName,
    );

    // Group response into successes and failures
    const { failedTokens, successfulTokens } = FCMService.splitFCMTopicResults(
      deviceTokens,
      response,
    );

    return { failedTokens, successfulTokens };
  }

  public async subscribeDevicesToTopic(
    deviceTokens: string[],
    topicName: string,
  ) {
    const response = await this.#messaging.subscribeToTopic(
      deviceTokens,
      topicName,
    );

    // Group successes and failures
    const { failedTokens, successfulTokens } = FCMService.splitFCMTopicResults(
      deviceTokens,
      response,
    );

    return { failedTokens, successfulTokens };
  }

  public async broadcastNotificationToTopic(
    notification: NotificationBody,
    topicName: string,
  ) {
    const messageId = await this.#messaging.send({
      topic: topicName,
      notification: notification.notification,
      data: notification.data,
    });

    return messageId;
  }

  public async multicastNotification(
    notification: NotificationBody,
    deviceTokens: string[],
  ) {
    // -------------------------------------------------------------
    // IMPORTANT: Batching for multicast!
    // sendEachForMulticast handles up to 500 tokens at a time.
    // -------------------------------------------------------------
    const BATCH_SIZE = 500; // FCM recommends batches of up to 500 for multicast
    const allSuccessfulTokens: string[] = [];
    const allFailedTokens: FailedTokenDetails[] = [];

    for (let i = 0; i < deviceTokens.length; i += BATCH_SIZE) {
      const batch = deviceTokens.slice(i, i + BATCH_SIZE);

      try {
        const response = await this.#messaging.sendEachForMulticast(
          {
            tokens: batch,
            notification: notification.notification,
            data: notification.data,
          },
          // Set `dryRun` to false for actual sending
          false,
        );

        // Process the batch response
        const {
          successfulTokens: batchSuccesses,
          failedTokens: batchFailures,
        } = FCMService.splitFCMMulticastResults(batch, response);

        allSuccessfulTokens.push(...batchSuccesses);
        allFailedTokens.push(...batchFailures);
      } catch (error: any) {
        batch.forEach(token =>
          allFailedTokens.push({
            token,
            message: error.message || 'Batch multicast operation failed',
            errorCode: error.code || 'UNKNOWN_BATCH_ERROR',
          }),
        );
      }
    }

    return {
      successfulTokens: allSuccessfulTokens,
      failedTokens: allFailedTokens,
      totalCount: deviceTokens.length,
      successCount: allSuccessfulTokens.length,
      failureCount: allFailedTokens.length,
    };
  }
}

const fcmService = new FCMService();

export default fcmService;

import { Router } from 'express';
import AuthController from '../controllers/AuthController';
import NotificationController from '../controllers/NotificationController';
import TopicController from '../controllers/TopicController';
import TopicModel from '../models/Topic';

const router = Router({ mergeParams: true });

router.use(AuthController.protect);

// Notification endpoints
router
  .route('/')
  .post(
    AuthController.requirePermission('SEND', 'ANY', 'NOTIFICATION'),
    NotificationController.setGlobalTopic,
    NotificationController.broadcastToTopic,
  );
router
  .route('/test')
  .post(
    AuthController.requirePermission('SEND', 'ANY', 'NOTIFICATION'),
    NotificationController.test,
  );

// Topic endpoints
router
  .route('/topics')
  .get(
    AuthController.requirePermission('READ', 'ANY', 'TOPIC'),
    AuthController.checkAccessToRestrictedResource(TopicModel),
    TopicController.getAllTopics,
  )
  .post(
    AuthController.requirePermission('CREATE', 'ANY', 'TOPIC'),
    TopicController.createTopic,
  );

router
  .route('/topics/:name')
  .patch(
    AuthController.requirePermission('UPDATE', 'OWN', 'TOPIC'),
    AuthController.checkUserIsResourceCreator(TopicModel),
    TopicController.updateTopic,
  )
  .post(
    AuthController.requirePermission('SEND', 'ANY', 'NOTIFICATION'),
    NotificationController.broadcastToTopic,
  )
  .delete(
    AuthController.requirePermission('DELETE', 'OWN', 'TOPIC'),
    AuthController.checkUserIsResourceCreator(TopicModel),
    TopicController.deleteTopic,
  );

export default router;

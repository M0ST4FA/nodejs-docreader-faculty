import { Router } from 'express';
import AuthController from '../controllers/AuthController';
import NotificationController from '../controllers/NotificationController';
import TopicController from '../controllers/TopicController';

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
    TopicController.updateTopic,
  )
  .post(
    AuthController.requirePermission('SEND', 'ANY', 'NOTIFICATION'),
    NotificationController.broadcastToTopic,
  )
  .delete(
    AuthController.requirePermission('DELETE', 'OWN', 'TOPIC'),
    TopicController.deleteTopic,
  );

export default router;

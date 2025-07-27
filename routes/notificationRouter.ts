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
    NotificationController.setGlobalTopic,
    NotificationController.broadcastToTopic,
  );
router.route('/test').post(NotificationController.test);

// Topic endpoints
router
  .route('/topics')
  .get(TopicController.getAllTopics)
  .post(TopicController.createTopic);

router
  .route('/topics/:name')
  .patch(TopicController.updateTopic)
  .post(NotificationController.broadcastToTopic)
  .delete(TopicController.deleteTopic);

export default router;

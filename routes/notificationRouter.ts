import { Router } from 'express';
import AuthController from '../controllers/AuthController';
import NotificationController from '../controllers/NotificationController';

const router = Router({ mergeParams: true });

router.use(AuthController.protect);
router.route('/').post(NotificationController.broadcast);
router.route('/test').post(NotificationController.test);

export default router;

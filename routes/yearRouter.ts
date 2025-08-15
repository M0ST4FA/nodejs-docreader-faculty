import { Router } from 'express';
import AuthController from '../controllers/AuthController';
import YearController from '../controllers/YearController';
import ModuleController from '../controllers/ModuleController';
import YearModel from '../models/Year';
import ModuleModel from '../models/Module';
import NotificationController from '../controllers/NotificationController';
import LectureController from '../controllers/LectureController';

const router = Router();

router.use(AuthController.protect);

router
  .route('/:id')
  .get(
    AuthController.requirePermission('READ', 'ANY', 'YEAR'),
    YearController.getYear,
  )
  .patch(
    AuthController.requirePermission('UPDATE', 'OWN', 'YEAR'),
    AuthController.checkUserIsResourceCreator(YearModel),
    YearController.updateYear,
  )
  .delete(
    AuthController.requirePermission('DELETE', 'OWN', 'YEAR'),
    AuthController.checkUserIsResourceCreator(YearModel),
    YearController.deleteYear,
  );

// Nested notifications routes
router.route('/:yearId/notifiable').get(
  // AuthController.requirePermission('READ', 'ANY', 'YEAR', YearModel),
  NotificationController.getNotifiable,
);
router.route('/:yearId/ignore').post(
  // AuthController.requirePermission('READ', 'ANY', 'YEAR', YearModel),
  NotificationController.ignore,
);
router.route('/:yearId/notify').post(
  // AuthController.requirePermission('READ', 'ANY', 'YEAR', YearModel),
  NotificationController.notify,
);

// Nested module routes
router
  .route('/:yearId/modules/')
  .get(
    AuthController.requirePermission('READ', 'ANY', 'MODULE'),
    ModuleController.getModules,
  )
  .post(
    AuthController.requirePermission('CREATE', 'ANY', 'MODULE'),
    AuthController.checkUserIsResourceCreator(ModuleModel),
    ModuleController.createModule,
  );

// Nested lecture routes
router.route('/:yearId/lectures').get(LectureController.getYearLectures);

export default router;

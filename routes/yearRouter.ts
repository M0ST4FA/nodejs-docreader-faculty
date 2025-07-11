import { Router } from 'express';
import AuthController from '../controllers/AuthController';
import YearController from '../controllers/YearController';
import ModuleController from '../controllers/ModuleController';

const router = Router();

router.use(AuthController.protect);

router
  .route('/:id')
  .get(AuthController.requirePermission('year:view'), YearController.getYear)
  .patch(
    AuthController.requirePermission('year:update'),
    YearController.updateYear,
  )
  .delete(
    AuthController.requirePermission('year:delete'),
    YearController.deleteYear,
  );

// Nested module routes
router
  .route('/:yearId/modules/')
  .get(
    AuthController.requirePermission('module:view'),
    ModuleController.getAllModules,
  )
  .post(
    AuthController.requirePermission('module:create'),
    ModuleController.createModule,
  );

export default router;

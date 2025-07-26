import { Router } from 'express';
import AuthController from '../controllers/AuthController';
import YearController from '../controllers/YearController';
import ModuleController from '../controllers/ModuleController';
import YearModel from '../models/Year';
import ModuleModel from '../models/Module';

const router = Router();

router.use(AuthController.protect);

router
  .route('/:id')
  .get(
    AuthController.requirePermission('READ', 'ANY', 'YEAR'),
    YearController.getYear,
  )
  .patch(
    AuthController.requirePermission('UPDATE', 'OWN', 'YEAR', YearModel),
    YearController.updateYear,
  )
  .delete(
    AuthController.requirePermission('DELETE', 'OWN', 'YEAR', YearModel),
    YearController.deleteYear,
  );

// Nested module routes
router
  .route('/:yearId/modules/')
  .get(
    AuthController.requirePermission('READ', 'ANY', 'MODULE'),
    ModuleController.getAllModules,
  )
  .post(
    AuthController.requirePermission('CREATE', 'ANY', 'MODULE', ModuleModel),
    ModuleController.createModule,
  );

export default router;

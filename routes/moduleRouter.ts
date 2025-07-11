import { Router } from 'express';
import AuthController from '../controllers/AuthController';
import ModuleController from '../controllers/ModuleController';
import SubjectController from '../controllers/SubjectController';

const router = Router();

router.use(AuthController.protect);

router
  .route('/:id')
  .get(
    AuthController.requirePermission('module:view'),
    ModuleController.getModule,
  )
  .patch(
    AuthController.requirePermission('module:update'),
    ModuleController.updateModule,
  )
  .delete(
    AuthController.requirePermission('module:delete'),
    ModuleController.deleteModule,
  );

// Nested Subject Routes
router
  .route('/:moduleId/subjects')
  .get(
    AuthController.requirePermission('subject:view'),
    SubjectController.getAllSubjects,
  )
  .post(
    AuthController.requirePermission('subject:create'),
    SubjectController.createSubject,
  );

export default router;

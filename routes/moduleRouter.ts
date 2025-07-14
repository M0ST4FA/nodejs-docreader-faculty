import { Router } from 'express';
import AuthController from '../controllers/AuthController';
import ModuleController from '../controllers/ModuleController';
import SubjectController from '../controllers/SubjectController';
import ModuleModel from '../models/Module';

const router = Router();

router.use(AuthController.protect);

router
  .route('/:id')
  .get(
    AuthController.requirePermission('READ', 'ANY', 'MODULE'),
    ModuleController.getModule,
  )
  .patch(
    AuthController.requirePermission('UPDATE', 'OWN', 'MODULE', ModuleModel),
    ModuleController.updateModule,
  )
  .delete(
    AuthController.requirePermission('DELETE', 'OWN', 'MODULE', ModuleModel),
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

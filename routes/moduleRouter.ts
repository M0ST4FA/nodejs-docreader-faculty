import { Router } from 'express';
import AuthController from '../controllers/AuthController';
import ModuleController from '../controllers/ModuleController';
import SubjectController from '../controllers/SubjectController';
import ModuleModel from '../models/Module';
import SubjectModel from '../models/Subject';

const router = Router();

router.use(AuthController.protect);

router.route('/').get(ModuleController.getAllModules);

router
  .route('/:id')
  .get(
    // AuthController.requirePermission('READ', 'ANY', 'MODULE'),
    ModuleController.getModule,
  )
  .patch(
    AuthController.requirePermission('UPDATE', 'OWN', 'MODULE'),
    AuthController.checkUserIsResourceCreator(ModuleModel),
    ModuleController.updateModule,
  )
  .delete(
    AuthController.requirePermission('DELETE', 'OWN', 'MODULE'),
    AuthController.checkUserIsResourceCreator(ModuleModel),
    ModuleController.deleteModule,
  );

// Nested Subject Routes
router
  .route('/:moduleId/subjects')
  .get(
    AuthController.requirePermission('READ', 'ANY', 'SUBJECT'),
    SubjectController.getSubjects,
  )
  .post(
    AuthController.requirePermission('CREATE', 'ANY', 'SUBJECT'),
    AuthController.checkUserIsResourceCreator(SubjectModel),
    SubjectController.createSubject,
  );

export default router;

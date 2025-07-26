import { Router } from 'express';
import AuthController from '../controllers/AuthController';
import PermissionController from '../controllers/PermissionController';

const router = Router({ mergeParams: true });

router.use(AuthController.protect);
router
  .route('/')
  .get(
    AuthController.requirePermission('READ', 'ANY', 'ROLE'),
    PermissionController.getAllPermissions,
  );

router
  .route('/:id')
  .get(
    AuthController.requirePermission('READ', 'ANY', 'ROLE'),
    PermissionController.getPermission,
  );

export default router;

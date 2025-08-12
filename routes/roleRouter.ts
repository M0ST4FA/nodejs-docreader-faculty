import { Router } from 'express';
import AuthController from '../controllers/AuthController';
import RoleController from '../controllers/RoleController';
import RoleModel from '../models/Role';
import PermissionController from '../controllers/PermissionController';

const router = Router({ mergeParams: true });

router.use(AuthController.protect);

router
  .route('/')
  .get(
    AuthController.requirePermission('READ', 'ANY', 'ROLE'),
    RoleController.getAllRoles,
  )
  .post(
    AuthController.requirePermission('CREATE', 'ANY', 'ROLE'),
    RoleController.createRole,
  );

router
  .route('/:id')
  .get(
    AuthController.requirePermission('READ', 'ANY', 'ROLE'),
    RoleController.getRole,
  )
  .patch(
    AuthController.requirePermission('UPDATE', 'OWN', 'ROLE', RoleModel),
    RoleController.updateRole,
  )
  .delete(
    AuthController.requirePermission('DELETE', 'OWN', 'ROLE', RoleModel),
    RoleController.deleteRole,
  );

// Nested permission routes. Permissions routes inherit role permissions.
router
  .route('/:roleId/permissions')
  .get(
    AuthController.requirePermission('READ', 'ANY', 'ROLE'),
    PermissionController.getPermissions,
  )
  .post(
    AuthController.requirePermission('CREATE', 'ANY', 'ROLE'),
    RoleController.assignPermissions,
  )
  .delete(
    AuthController.requirePermission('DELETE', 'ANY', 'ROLE'),
    RoleController.deletePermissions,
  );

export default router;

import { Router } from 'express';
import AuthController from '../controllers/AuthController';
import FacultyController from '../controllers/FacultyController';
import YearController from '../controllers/YearController';
import {
  PermissionAction,
  PermissionResource,
  PermissionScope,
} from '@prisma/client';

const router = Router();

// The permission for these is ANY because only a SuperAdmin would be able to create them anyways, and this is more optimized
router.use(AuthController.protect);
router
  .route('/')
  .get(
    AuthController.requirePermission(
      PermissionAction.READ,
      PermissionScope.ANY,
      PermissionResource.FACULTY,
    ),
    FacultyController.getAllFaculties,
  )
  .post(
    AuthController.requirePermission(
      PermissionAction.CREATE,
      PermissionScope.ANY,
      PermissionResource.FACULTY,
    ),
    FacultyController.createFaculty,
  );

router
  .route('/:id')
  .get(
    AuthController.requirePermission(
      PermissionAction.READ,
      PermissionScope.ANY,
      PermissionResource.FACULTY,
    ),
    FacultyController.getFaculty,
  )
  .patch(
    AuthController.requirePermission(
      PermissionAction.UPDATE,
      PermissionScope.ANY,
      PermissionResource.FACULTY,
    ),
    FacultyController.updateFaculty,
  )
  .delete(
    AuthController.requirePermission(
      PermissionAction.DELETE,
      PermissionScope.ANY,
      PermissionResource.FACULTY,
    ),
    FacultyController.deleteFaculty,
  );

// Nested years route
router
  .route('/:facultyId/years')
  .get(
    AuthController.requirePermission(
      PermissionAction.READ,
      PermissionScope.ANY,
      PermissionResource.YEAR,
    ),
    YearController.getAllYears,
  )
  .post(
    AuthController.requirePermission(
      PermissionAction.CREATE,
      PermissionScope.ANY,
      PermissionResource.YEAR,
    ),
    YearController.createYear,
  );

export default router;

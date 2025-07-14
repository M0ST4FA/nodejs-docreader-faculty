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
    AuthController.requirePermission('READ', 'ANY', 'FACULTY'),
    FacultyController.getAllFaculties,
  )
  .post(
    AuthController.requirePermission('CREATE', 'ANY', 'FACULTY'),
    FacultyController.createFaculty,
  );

router
  .route('/:id')
  .get(
    AuthController.requirePermission('READ', 'ANY', 'FACULTY'),
    FacultyController.getFaculty,
  )
  .patch(
    AuthController.requirePermission('UPDATE', 'ANY', 'FACULTY'),
    FacultyController.updateFaculty,
  )
  .delete(
    AuthController.requirePermission('DELETE', 'ANY', 'FACULTY'),
    FacultyController.deleteFaculty,
  );

// Nested years route
router
  .route('/:facultyId/years')
  .get(
    AuthController.requirePermission('READ', 'ANY', 'YEAR'),
    YearController.getAllYears,
  )
  .post(
    AuthController.requirePermission('CREATE', 'ANY', 'YEAR'),
    YearController.createYear,
  );

export default router;

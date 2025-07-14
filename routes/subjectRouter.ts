import { Router } from 'express';
import AuthController from '../controllers/AuthController';
import SubjectController from '../controllers/SubjectController';
import LectureController from '../controllers/LectureController';
import {
  PermissionAction,
  PermissionResource,
  PermissionScope,
} from '@prisma/client';

const router = Router({ mergeParams: true });

router.use(AuthController.protect);

router
  .route('/:id')
  .get(
    AuthController.requirePermission('READ', 'OWN', 'SUBJECT'),
    SubjectController.getSubject,
  )
  .patch(
    AuthController.requirePermission('UPDATE', 'OWN', 'SUBJECT'),
    SubjectController.updateSubject,
  )
  .delete(
    AuthController.requirePermission('DELETE', 'ANY', 'SUBJECT'),
    SubjectController.deleteSubject,
  );

// Nested lecture routes
router
  .route('/:subjectId/lectures')
  .get(
    AuthController.requirePermission('READ', 'ANY', PermissionResource.LECTURE),
    LectureController.getAllLectures,
  )
  .post(
    AuthController.requirePermission(
      'CREATE',
      'ANY',
      PermissionResource.LECTURE,
    ),
    LectureController.createLecture,
  );

export default router;

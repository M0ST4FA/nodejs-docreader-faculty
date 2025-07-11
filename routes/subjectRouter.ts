import { Router } from 'express';
import AuthController from '../controllers/AuthController';
import SubjectController from '../controllers/SubjectController';
import LectureController from '../controllers/LectureController';

const router = Router({ mergeParams: true });

router.use(AuthController.protect);

router
  .route('/:id')
  .get(
    AuthController.requirePermission('subject:view'),
    SubjectController.getSubject,
  )
  .patch(
    AuthController.requirePermission('subject:update_any'),
    SubjectController.updateSubject,
  )
  .delete(
    AuthController.requirePermission('subject:delete_any'),
    SubjectController.deleteSubject,
  );

// Nested lecture routes
router
  .route('/:subjectId/lectures')
  .get(
    AuthController.requirePermission('lecture:view'),
    LectureController.getAllLectures,
  )
  .post(
    AuthController.requirePermission('lecture:create'),
    LectureController.createLecture,
  );

export default router;

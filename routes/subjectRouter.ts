import { Router } from 'express';
import AuthController from '../controllers/AuthController';
import SubjectController from '../controllers/SubjectController';
import LectureController from '../controllers/LectureController';

const router = Router({ mergeParams: true });

router.use(AuthController.protect);

router.route('/').get(SubjectController.getAllSubjects);

router
  .route('/:id')
  .get(
    // AuthController.requirePermission('READ', 'ANY', 'SUBJECT'),
    SubjectController.getSubject,
  )
  .patch(
    AuthController.requirePermission('UPDATE', 'OWN', 'SUBJECT'),
    AuthController.checkUserIsResourceCreator(SubjectModel),
    SubjectController.updateSubject,
  )
  .delete(
    AuthController.requirePermission('DELETE', 'OWN', 'SUBJECT'),
    AuthController.checkUserIsResourceCreator(SubjectModel),
    SubjectController.deleteSubject,
  );

// Nested lecture routes
router
  .route('/:subjectId/lectures')
  .get(
    AuthController.requirePermission('READ', 'ANY', 'LECTURE'),
    LectureController.getLectures,
  )
  .post(
    AuthController.requirePermission('CREATE', 'ANY', 'LECTURE'),
    LectureController.createLecture,
  );

export default router;

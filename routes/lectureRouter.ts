import { Router } from 'express';
import AuthController from '../controllers/AuthController';
import LectureController from '../controllers/LectureController';
import QuizController from '../controllers/QuizController';
import LinkController from '../controllers/LinkController';
import LectureModel from '../models/Lecture';
import FacultyModel from '../models/Faculty';

const router = Router();

router.use(AuthController.protect);
router
  .route('/:id')
  .get(
    AuthController.requirePermission('READ', 'ANY', 'LECTURE'),
    LectureController.getLecture,
  )
  .patch(
    AuthController.requirePermission('UPDATE', 'OWN', 'LECTURE'),
    AuthController.checkUserIsResourceCreator(LectureModel),
    LectureController.updateLecture,
  )
  .delete(
    AuthController.requirePermission('DELETE', 'OWN', 'LECTURE'),
    AuthController.checkUserIsResourceCreator(FacultyModel),
    LectureController.deleteLecture,
  );

// Nested quiz routes
router
  .route('/:lectureId/quizzes')
  .get(
    AuthController.requirePermission('READ', 'ANY', 'QUIZ'),
    QuizController.getAllQuizzes,
  )
  .post(
    AuthController.requirePermission('CREATE', 'ANY', 'QUIZ'),
    QuizController.createQuiz,
  );

// Nested link routes
router
  .route('/:lectureId/links')
  .get(
    AuthController.requirePermission('READ', 'ANY', 'LINK'),
    LinkController.getAllLinks,
  )
  .post(
    AuthController.requirePermission('CREATE', 'ANY', 'LINK'),
    LinkController.createLink,
  );

export default router;

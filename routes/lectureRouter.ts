import { Router } from 'express';
import AuthController from '../controllers/AuthController';
import LectureController from '../controllers/LectureController';
import QuizController from '../controllers/QuizController';
import LinkController from '../controllers/LinkController';

const router = Router();

router.use(AuthController.protect);
router
  .route('/:id')
  .get(
    AuthController.requirePermission('lecture:view'),
    LectureController.getLecture,
  )
  .patch(
    AuthController.requirePermission('lecture:update'),
    LectureController.updateLecture,
  )
  .delete(
    AuthController.requirePermission('lecture:delete'),
    LectureController.deleteLecture,
  );

// Nested quiz routes

router
  .route('/:lectureId/quizzes')
  .get(
    AuthController.requirePermission('quiz:view'),
    QuizController.getAllQuizzes,
  )
  .post(
    AuthController.requirePermission('quiz:create'),
    QuizController.createQuiz,
  );

router
  .route('/:lectureId/links')
  .get(
    AuthController.requirePermission('link:view'),
    LinkController.getAllLinks,
  )
  .post(
    AuthController.requirePermission('link:create'),
    LinkController.createLink,
  );

export default router;

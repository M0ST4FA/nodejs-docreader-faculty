import { Router } from 'express';
import AuthController from '../controllers/AuthController';
import LectureController from '../controllers/LectureController';
import QuizController from '../controllers/QuizController';
import LectureModel from '../models/Lecture';
import QuizModel from '../models/Quiz';

const router = Router();

router.use(AuthController.protect);
router
  .route('/:id')
  .get(
    AuthController.requirePermission('READ', 'ANY', 'LECTURE'),
    LectureController.getLecture,
  )
  .patch(
    AuthController.requirePermission('UPDATE', 'OWN', 'LECTURE', LectureModel),
    LectureController.updateLecture,
  )
  .delete(
    AuthController.requirePermission('DELETE', 'OWN', 'LECTURE', LectureModel),
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
    AuthController.requirePermission('CREATE', 'ANY', 'QUIZ', QuizModel),
    QuizController.createQuiz,
  );

export default router;

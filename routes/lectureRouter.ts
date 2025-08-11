import { Router } from 'express';
import AuthController from '../controllers/AuthController';
import LectureController from '../controllers/LectureController';
import McqQuizController from '../controllers/McqQuizController';
import LinkController from '../controllers/LinkController';
import LectureModel from '../models/Lecture';
import McqQuizModel from '../models/McqQuiz';
import LinkModel from '../models/Link';
import WrittenQuizController from '../controllers/WrittenQuizController';

const router = Router();

router.use(AuthController.protect);
router
  .route('/:id')
  .get(
    // AuthController.requirePermission('READ', 'ANY', 'LECTURE'),
    LectureController.getLecture,
  )
  .patch(
    // AuthController.requirePermission('UPDATE', 'OWN', 'LECTURE', LectureModel),
    LectureController.updateLecture,
  )
  .delete(
    // AuthController.requirePermission('DELETE', 'OWN', 'LECTURE', LectureModel),
    LectureController.deleteLecture,
  );

// Nested quiz routes
router
  .route('/:lectureId/mcq-quizzes')
  .get(
    AuthController.requirePermission('READ', 'ANY', 'QUIZ'),
    McqQuizController.getAllQuizzes,
  )
  .post(
    // AuthController.requirePermission('CREATE', 'ANY', 'QUIZ', McqQuizModel),
    McqQuizController.createQuiz,
  );
router
  .route('/:lectureId/written-quizzes')
  .get(
    AuthController.requirePermission('READ', 'ANY', 'QUIZ'),
    WrittenQuizController.getAllQuizzes,
  )
  .post(
    // AuthController.requirePermission('CREATE', 'ANY', 'QUIZ', McqQuizModel),
    WrittenQuizController.createQuiz,
  );

// Nested link routes
router
  .route('/:lectureId/links')
  .get(
    AuthController.requirePermission('READ', 'ANY', 'LINK'),
    LinkController.getAllLinks,
  )
  .post(
    // AuthController.requirePermission('CREATE', 'ANY', 'LINK', LinkModel),
    LinkController.createLink,
  );

export default router;

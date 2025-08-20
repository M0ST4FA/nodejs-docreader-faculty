import { Router } from 'express';
import AuthController from '../controllers/AuthController';
import LectureController from '../controllers/LectureController';
import McqQuizController from '../controllers/McqQuizController';
import LinkController from '../controllers/LinkController';
import LectureModel from '../models/Lecture';
import WrittenQuizController from '../controllers/WrittenQuizController';

const router = Router();

router.use(AuthController.protect);

router.get('/', LectureController.getAllLectures);

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
    AuthController.checkUserIsResourceCreator(LectureModel),
    LectureController.deleteLecture,
  );

// Nested quiz routes
router
  .route('/:lectureId/mcq-quizzes')
  .get(
    AuthController.requirePermission('READ', 'ANY', 'QUIZ'),
    McqQuizController.getQuizzes,
  )
  .post(
    AuthController.requirePermission('CREATE', 'ANY', 'QUIZ'),
    McqQuizController.createQuiz,
  );
router
  .route('/:lectureId/written-quizzes')
  .get(
    AuthController.requirePermission('READ', 'ANY', 'QUIZ'),
    WrittenQuizController.getQuizzes,
  )
  .post(
    AuthController.requirePermission('CREATE', 'ANY', 'QUIZ'),
    McqQuizController.createQuiz,
  );

// Nested link routes
router
  .route('/:lectureId/links')
  .get(
    AuthController.requirePermission('READ', 'ANY', 'LINK'),
    LinkController.getLinks,
  )
  .post(
    AuthController.requirePermission('CREATE', 'ANY', 'LINK'),
    LinkController.createLink,
  );

export default router;

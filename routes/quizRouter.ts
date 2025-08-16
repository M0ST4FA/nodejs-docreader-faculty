import { Router } from 'express';
import AuthController from '../controllers/AuthController';
import QuizController from '../controllers/McqQuizController';
import QuizModel from '../models/McqQuiz';

const router = Router();

router.use(AuthController.protect);
router
  .route('/:id')
  .get(
    AuthController.requirePermission('READ', 'ANY', 'QUIZ'),
    QuizController.getQuiz,
  )
  .patch(
    AuthController.requirePermission('UPDATE', 'OWN', 'QUIZ'),
    AuthController.checkUserIsResourceCreator(QuizModel),
    QuizController.updateQuiz,
  )
  .delete(
    AuthController.requirePermission('DELETE', 'OWN', 'QUIZ'),
    AuthController.checkUserIsResourceCreator(QuizModel),
    QuizController.deleteQuiz,
  );

export default router;

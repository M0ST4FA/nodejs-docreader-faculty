import { Router } from 'express';
import AuthController from '../controllers/AuthController';
import QuizController from '../controllers/QuizController';
import QuizModel from '../models/Quiz';

const router = Router();

router.use(AuthController.protect);
router
  .route('/:id')
  .get(
    // AuthController.requirePermission('READ', 'ANY', 'QUIZ'),
    QuizController.getQuiz,
  )
  .patch(
    AuthController.requirePermission('UPDATE', 'OWN', 'QUIZ', QuizModel),
    QuizController.updateQuiz,
  )
  .delete(
    AuthController.requirePermission('DELETE', 'OWN', 'QUIZ', QuizModel),
    QuizController.deleteQuiz,
  );

export default router;

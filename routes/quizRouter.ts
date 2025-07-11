import { Router } from 'express';
import AuthController from '../controllers/AuthController';
import QuizController from '../controllers/QuizController';

const router = Router();

router.use(AuthController.protect);
router
  .route('/:id')
  .get(AuthController.requirePermission('quiz:view'), QuizController.getQuiz)
  .patch(
    AuthController.requirePermission('quiz:update'),
    QuizController.updateQuiz,
  )
  .delete(
    AuthController.requirePermission('quiz:delete'),
    QuizController.deleteQuiz,
  );

export default router;

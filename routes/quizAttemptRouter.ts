import { Router } from 'express';
import AuthController from '../controllers/AuthController';
import QuizAttemptController from '../controllers/QuizAttemptController';
import QuestionAttemptController from '../controllers/QuestionAttemptController';

const router = Router();

router.use(AuthController.protect);

router
  .route('/:id')
  .get(QuizAttemptController.getAttempt)
  .delete(QuizAttemptController.deleteAttempt);

router.post('/:id/submit', QuizAttemptController.submitAttempt);

// QUESTION ATTEMPT ROUTES
router
  .route('/:quizAttemptId/answers')
  .get(QuestionAttemptController.getAllAttempts)
  .post(QuestionAttemptController.createAttempts);

router.get('/:quizAttemptId/answers/:id', QuestionAttemptController.getAttempt);

export default router;

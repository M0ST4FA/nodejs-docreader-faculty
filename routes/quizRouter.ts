import { Router } from 'express';
import AuthController from '../controllers/AuthController';
import QuizController from '../controllers/QuizController';
import QuizModel from '../models/Quiz';
import QuizAttemptController from '../controllers/QuizAttemptController';
import QuestionAttemptController from '../controllers/QuestionAttemptController';

const router = Router();

// QUIZ ROUTES
router.use(AuthController.protect);
router
  .route('/:id')
  .get(
    AuthController.requirePermission('READ', 'ANY', 'QUIZ'),
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

// QUIZ ATTEMPT ROUTES
router
  .route('/:quizId/attempts')
  .get(QuizAttemptController.getAllAttempts)
  .post(QuizAttemptController.createAttempt);

router
  .route('/attempts/:id')
  .get(QuizAttemptController.getAttempt)
  .patch(QuizAttemptController.submitAttempt)
  .delete(QuizAttemptController.deleteAttempt);

// QUESTION ATTEMPT ROUTES
router
  .route('/attempts/:attemptId/answers')
  .get(QuestionAttemptController.getAllAttempts)
  .post(QuestionAttemptController.createAttempts);

router.get(
  '/attempts/:attemptId/answers/:answerId',
  QuestionAttemptController.getAttempt,
);

export default router;

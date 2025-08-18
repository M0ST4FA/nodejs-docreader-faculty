import { Router } from 'express';
import AuthController from '../controllers/AuthController';
import McqQuizController from '../controllers/McqQuizController';
import McqQuizModel from '../models/McqQuiz';
import McqQuestionModel from '../models/McqQuestion';

const router = Router();

router.use(AuthController.protect);
router.route('/mcq-quizzes').get(McqQuizController.getAllQuizzes);
router
  .route('/mcq-quizzes/:id')
  .get(
    AuthController.requirePermission('READ', 'ANY', 'QUIZ'),
    McqQuizController.getQuiz,
  )
  .patch(
    AuthController.requirePermission('UPDATE', 'OWN', 'QUIZ'),
    AuthController.checkUserIsResourceCreator(McqQuizModel),
    McqQuizController.updateQuiz,
  )
  .delete(
    AuthController.requirePermission('DELETE', 'OWN', 'QUIZ'),
    AuthController.checkUserIsResourceCreator(McqQuizModel),
    McqQuizController.deleteQuiz,
  );

router
  .route('/mcq-quizzes/:id/questions')
  .post(McqQuizController.createQuestions);

router
  .route('/mcq-questions/:id')
  .patch(
    AuthController.requirePermission('UPDATE', 'OWN', 'QUESTION'),
    AuthController.checkUserIsResourceCreator(McqQuestionModel),
    McqQuizController.updateQuestion,
  )
  .delete(
    AuthController.requirePermission('DELETE', 'OWN', 'QUESTION'),
    AuthController.checkUserIsResourceCreator(McqQuestionModel),
    McqQuizController.deleteQuestion,
  );

export default router;

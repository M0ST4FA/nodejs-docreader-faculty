import { Router } from 'express';
import AuthController from '../controllers/AuthController';
import WrittenQuizController from '../controllers/WrittenQuizController';
import multer from 'multer';
import WrittenQuizModel from '../models/WrittenQuiz';
const storage = multer.memoryStorage();
const upload = multer({ storage });

const router = Router();

router.use(AuthController.protect);
router
  .route('/written-quizzes/:id')
  .get(
    AuthController.requirePermission('READ', 'ANY', 'QUIZ'),
    WrittenQuizController.getQuiz,
  )
  .patch(
    AuthController.requirePermission('UPDATE', 'OWN', 'QUIZ'),
    AuthController.checkUserIsResourceCreator(WrittenQuizModel),
    WrittenQuizController.updateQuiz,
  )
  .delete(
    AuthController.requirePermission('DELETE', 'OWN', 'QUIZ'),
    AuthController.checkUserIsResourceCreator(WrittenQuizModel),
    WrittenQuizController.deleteQuiz,
  );

router
  .route('/written-quizzes/:id/questions')
  .post(upload.single('image'), WrittenQuizController.createQuestion);

router
  .route('/written-questions/:id')
  .patch(
    AuthController.requirePermission('UPDATE', 'OWN', 'QUESTION'),
    WrittenQuizController.updateQuestion,
  )
  .delete(
    AuthController.requirePermission('UPDATE', 'OWN', 'QUESTION'),
    WrittenQuizController.deleteQuestion,
  );

export default router;

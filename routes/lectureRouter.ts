import { Router } from 'express';
import AuthController from '../controllers/AuthController';
import LectureController from '../controllers/LectureController';
import QuizController from '../controllers/QuizController';
import LinkController from '../controllers/LinkController';
import {
  PermissionAction,
  PermissionScope,
  PermissionResource,
} from '@prisma/client';
import LectureModel from '../models/Lecture';

const router = Router();

router.use(AuthController.protect);
router
  .route('/:id')
  .get(
    AuthController.requirePermission(
      PermissionAction.READ,
      PermissionScope.ANY,
      PermissionResource.LECTURE,
    ),
    LectureController.getLecture,
  )
  .patch(
    AuthController.requirePermission(
      PermissionAction.UPDATE,
      PermissionScope.OWN,
      PermissionResource.LECTURE,
      LectureModel,
    ),
    LectureController.updateLecture,
  )
  .delete(
    AuthController.requirePermission(
      PermissionAction.DELETE,
      PermissionScope.OWN,
      PermissionResource.LECTURE,
      LectureModel,
    ),
    LectureController.deleteLecture,
  );

// Nested quiz routes

router
  .route('/:lectureId/quizzes')
  .get(
    AuthController.requirePermission(
      PermissionAction.READ,
      PermissionScope.ANY,
      PermissionResource.QUIZ,
    ),
    QuizController.getAllQuizzes,
  )
  .post(
    AuthController.requirePermission(
      PermissionAction.CREATE,
      PermissionScope.ANY,
      PermissionResource.QUIZ,
    ),
    QuizController.createQuiz,
  );

router
  .route('/:lectureId/links')
  .get(
    AuthController.requirePermission(
      PermissionAction.READ,
      PermissionScope.ANY,
      PermissionResource.LINK,
    ),
    LinkController.getAllLinks,
  )
  .post(
    AuthController.requirePermission(
      PermissionAction.CREATE,
      PermissionScope.ANY,
      PermissionResource.LINK,
    ),
    LinkController.createLink,
  );

export default router;

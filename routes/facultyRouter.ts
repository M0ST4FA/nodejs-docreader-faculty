import { Router } from 'express';
import AuthController from '../controllers/AuthController';
import FacultyController from '../controllers/FacultyController';
import YearController from '../controllers/YearController';

const router = Router();

router.use(AuthController.protect);
router
  .route('/')
  .get(
    AuthController.requirePermission('faculty:view'),
    FacultyController.getAllFaculties,
  )
  .post(
    AuthController.requirePermission('faculty:create'),
    FacultyController.createFaculty,
  );

router
  .route('/:id')
  .get(
    AuthController.requirePermission('faculty:view'),
    FacultyController.getFaculty,
  )
  .patch(
    AuthController.requirePermission('faculty:update'),
    FacultyController.updateFaculty,
  )
  .delete(
    AuthController.requirePermission('faculty:delete'),
    FacultyController.deleteFaculty,
  );

// Nested years route
router
  .route('/:facultyId/years')
  .get(
    AuthController.requirePermission('year:view'),
    YearController.getAllYears,
  )
  .post(
    AuthController.requirePermission('year:create'),
    YearController.createYear,
  );

export default router;

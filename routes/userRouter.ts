import { Router } from 'express';
import UserController from '../controllers/UserController';
import AuthController from '../controllers/AuthController';

const router = Router();

router.use(AuthController.protect);

// ME ROUTES
router.get('/me', UserController.getMe, UserController.getUser);
router.patch('/updateMe', UserController.getMe, UserController.updateUser);
router.delete('/deleteMe', UserController.getMe, UserController.deleteUser); // Deletion doesn't require a permission to not lock the user in the app

// USER ROUTES
router
  .route('/')
  .get(
    AuthController.requirePermission('READ', 'ANY', 'USER'),
    UserController.getAllUsers,
  );

router
  .route('/:id')
  .get(
    AuthController.requirePermission('READ', 'ANY', 'USER'),
    UserController.getUser,
  )
  .patch(
    AuthController.requirePermission('UPDATE', 'ANY', 'USER'),
    UserController.updateUser,
  )
  .delete(
    AuthController.requirePermission('DELETE', 'ANY', 'USER'),
    UserController.deleteUser,
  );

router.route('/:id/assignRole').patch(
  // You must be able to create roles to be able to assign them (there is no "assign" action, so that is an indirect permission)
  AuthController.requirePermission('CREATE', 'ANY', 'ROLE'),
  UserController.assignRole,
);

export default router;

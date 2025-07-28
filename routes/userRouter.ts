import { Router } from 'express';
import UserController from '../controllers/UserController';
import AuthController from '../controllers/AuthController';
import DeviceController from '../controllers/DeviceController';
import DeviceModel from '../models/Device';
import TopicController from '../controllers/TopicController';

const router = Router();

router.use(AuthController.protect);

// ME ROUTES
router
  .route('/me')
  .get(UserController.getMe, UserController.getUser)
  .patch(UserController.getMe, UserController.updateUser)
  .delete(UserController.getMe, UserController.deleteUser);

// DEVICE ROUTES
router
  .route('/me/devices')
  .get(DeviceController.getDevices)
  .post(
    AuthController.requirePermission('CREATE', 'ANY', 'DEVICE'),
    DeviceController.createDevice,
  );

router.delete(
  '/me/devices/:id',
  AuthController.requirePermission('DELETE', 'OWN', 'DEVICE', DeviceModel),
  DeviceController.deleteDevice,
);

// TOPIC ROUTES
router.get('/me/topics', TopicController.getUserDevicesTopics);

router
  .route('/me/topics/:name')
  .post(TopicController.subscribeUserDevicesToTopic)
  .delete(TopicController.unsubscribeUserDevicesFromTopic);

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

router.route('/:id/assignRole').put(
  // You must be able to create roles to be able to assign them (there is no "assign" action, so that is an indirect permission)
  AuthController.requirePermission('ASSIGN', 'ANY', 'ROLE'),
  UserController.assignRole,
);

export default router;

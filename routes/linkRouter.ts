import { Router } from 'express';
import AuthController from '../controllers/AuthController';
import LinkModel from '../models/Link';
import LinkController from '../controllers/LinkController';

const router = Router();

router.use(AuthController.protect);
router
  .route('/:id')
  .get(
    AuthController.requirePermission('READ', 'ANY', 'LINK'),
    LinkController.getLink,
  )
  .patch(
    AuthController.requirePermission('UPDATE', 'OWN', 'LINK', LinkModel),
    LinkController.updateLink,
  )
  .delete(
    AuthController.requirePermission('DELETE', 'OWN', 'LINK', LinkModel),
    LinkController.deleteLink,
  );

export default router;

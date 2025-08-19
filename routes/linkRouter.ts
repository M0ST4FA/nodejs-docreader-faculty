import { Router } from 'express';
import AuthController from '../controllers/AuthController';
import LinkController from '../controllers/LinkController';
import LinkModel from '../models/Link';

const router = Router();

router.use(AuthController.protect);
router
  .route('/:id')
  .get(
    AuthController.requirePermission('READ', 'ANY', 'LINK'),
    LinkController.getLink,
  )
  .patch(
    AuthController.requirePermission('UPDATE', 'OWN', 'LINK'),
    AuthController.checkUserIsResourceCreator(LinkModel),
    LinkController.updateLink,
  )
  .delete(
    AuthController.requirePermission('DELETE', 'OWN', 'LINK'),
    AuthController.checkUserIsResourceCreator(LinkModel),
    LinkController.deleteLink,
  );

export default router;

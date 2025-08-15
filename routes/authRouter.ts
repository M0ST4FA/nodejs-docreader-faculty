import { Router } from 'express';

import AuthController from '../controllers/AuthController';

const router = Router();

router.post(
  '/continueWithGoogle',
  AuthController.extractAndVerifyGoogleJWT,
  AuthController.createOrFetchUser,
);
router.post('/logout', AuthController.protect, AuthController.logout);

export default router;

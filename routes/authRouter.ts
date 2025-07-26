import { Router } from 'express';

import AuthController from '../controllers/AuthController';

const router = Router();

router.post('/continueWithGoogle', AuthController.continueWithGoogle);
router.get(
  '/googleCallback',
  AuthController.extractOAuth2Tokens,
  AuthController.extractAndVerifyGoogleJWT,
  AuthController.createOrFetchUser,
);

export default router;

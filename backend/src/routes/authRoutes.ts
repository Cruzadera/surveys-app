import { Router } from 'express';
import {
	standaloneLoginHandler,
	startEmailLoginHandler,
	verifyEmailLoginHandler,
	autologinHandler,
	verifyMagicLinkHandler,
	registerHandler,
	loginHandler,
	forgotPasswordHandler,
	resetPasswordHandler
} from '../controllers/authController';

const router = Router();

router.post('/register', registerHandler);
router.post('/login', loginHandler);
router.post('/password/forgot', forgotPasswordHandler);
router.post('/password/reset', resetPasswordHandler);
router.get('/autologin', autologinHandler);
router.post('/magic-link/verify', verifyMagicLinkHandler);
router.post('/standalone', standaloneLoginHandler);
router.post('/email/start', startEmailLoginHandler);
router.get('/email/verify', verifyEmailLoginHandler);

export default router;

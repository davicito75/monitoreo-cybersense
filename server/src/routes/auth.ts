import { Router } from 'express';
import { loginController, meController } from '../controllers/auth';
import { authMiddleware } from '../auth/middleware';
import * as userNotificationsCtrl from '../controllers/userNotifications';

const router = Router();

router.post('/login', loginController);
router.get('/me', authMiddleware, meController);

// User Pushbullet configuration
router.get('/pushbullet/config', authMiddleware, userNotificationsCtrl.getUserPushbulletConfig);
router.patch('/pushbullet/config', authMiddleware, userNotificationsCtrl.updateUserPushbulletToken);

export default router;

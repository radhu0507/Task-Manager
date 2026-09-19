import { Router } from 'express';
import { AuthRequest, authenticate } from '../middleware/auth';
import { notificationService } from '../services/notification.service';
import { sendSuccess } from '../utils/response';

const router = Router();

router.use(authenticate);

router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const notifications = await notificationService.getByUser(req.user!.id);
    sendSuccess(res, notifications);
  } catch (err) { next(err); }
});

router.patch('/:id/read', async (req: AuthRequest, res, next) => {
  try {
    const notification = await notificationService.markRead(req.params.id, req.user!.id);
    sendSuccess(res, notification);
  } catch (err) { next(err); }
});

router.patch('/read-all', async (req: AuthRequest, res, next) => {
  try {
    await notificationService.markAllRead(req.user!.id);
    sendSuccess(res, null, 'All notifications marked as read');
  } catch (err) { next(err); }
});

export default router;

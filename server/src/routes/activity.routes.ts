import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getTaskActivities } from '../services/activity.service';
import { sendSuccess } from '../utils/response';

const router = Router();

router.get('/tasks/:id/activity', authenticate, async (req, res, next) => {
  try {
    const activities = await getTaskActivities(req.params.id);
    sendSuccess(res, activities);
  } catch (err) { next(err); }
});

export default router;

import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { userService } from '../services/user.service';
import { sendSuccess } from '../utils/response';

const router = Router();

router.use(authenticate);

router.get('/', async (_req, res, next) => {
  try {
    const users = await userService.getAll();
    sendSuccess(res, users);
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const user = await userService.getById(req.params.id);
    if (!user) return sendSuccess(res, null, 'User not found', 404);
    sendSuccess(res, user);
  } catch (err) { next(err); }
});

export default router;

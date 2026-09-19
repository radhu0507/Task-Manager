import { Router } from 'express';
import { AuthRequest, authenticate } from '../middleware/auth';
import { taskService } from '../services/task.service';
import { sendSuccess } from '../utils/response';
import { validate } from '../middleware/validate';
import { createTaskSchema, updateTaskSchema, taskIdSchema, taskQuerySchema } from '../validators/task.validator';

const router = Router();

router.use(authenticate);

router.get('/', validate(taskQuerySchema), async (req: AuthRequest, res, next) => {
  try {
    const result = await taskService.getAll(req.query as never, req.user!.id);
    sendSuccess(res, result);
  } catch (err) { next(err); }
});

router.post('/', validate(createTaskSchema), async (req: AuthRequest, res, next) => {
  try {
    const task = await taskService.create(req.body, req.user!.id);
    sendSuccess(res, task, 'Task created', 201);
  } catch (err) { next(err); }
});

router.get('/:id', validate(taskIdSchema), async (req, res, next) => {
  try {
    const task = await taskService.getById(req.params.id);
    sendSuccess(res, task);
  } catch (err) { next(err); }
});

router.patch('/:id', validate(updateTaskSchema), async (req: AuthRequest, res, next) => {
  try {
    const task = await taskService.update(req.params.id, req.body, req.user!.id, req.user!.role);
    sendSuccess(res, task, 'Task updated');
  } catch (err) { next(err); }
});

router.delete('/:id', validate(taskIdSchema), async (req: AuthRequest, res, next) => {
  try {
    const result = await taskService.delete(req.params.id, req.user!.id, req.user!.role);
    sendSuccess(res, result.message);
  } catch (err) { next(err); }
});

export default router;

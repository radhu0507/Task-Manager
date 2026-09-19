import { Router } from 'express';
import { AuthRequest, authenticate } from '../middleware/auth';
import { commentService } from '../services/comment.service';
import { sendSuccess } from '../utils/response';
import { validate } from '../middleware/validate';
import { createCommentSchema, updateCommentSchema, commentIdSchema } from '../validators/comment.validator';

const router = Router();

router.get('/tasks/:id/comments', authenticate, async (req, res, next) => {
  try {
    const comments = await commentService.getByTaskId(req.params.id);
    sendSuccess(res, comments);
  } catch (err) { next(err); }
});

router.post('/tasks/:id/comments', authenticate, validate(createCommentSchema), async (req: AuthRequest, res, next) => {
  try {
    const comment = await commentService.create(req.params.id, req.body.content, req.user!.id);
    sendSuccess(res, comment, 'Comment added', 201);
  } catch (err) { next(err); }
});

router.patch('/comments/:commentId', authenticate, validate(updateCommentSchema), async (req: AuthRequest, res, next) => {
  try {
    const comment = await commentService.update(req.params.commentId, req.body.content, req.user!.id, req.user!.role);
    sendSuccess(res, comment, 'Comment updated');
  } catch (err) { next(err); }
});

router.delete('/comments/:commentId', authenticate, validate(commentIdSchema), async (req: AuthRequest, res, next) => {
  try {
    const result = await commentService.delete(req.params.commentId, req.user!.id, req.user!.role);
    sendSuccess(res, result.message);
  } catch (err) { next(err); }
});

export default router;

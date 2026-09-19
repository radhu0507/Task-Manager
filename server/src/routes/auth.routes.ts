import { Router } from 'express';
import { AuthRequest, authenticate } from '../middleware/auth';
import { authService } from '../services/auth.service';
import { sendSuccess } from '../utils/response';
import { validate } from '../middleware/validate';
import { signupSchema, loginSchema } from '../validators/auth.validator';
import rateLimit from 'express-rate-limit';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, error: { code: 'RATE_LIMIT', message: 'Too many attempts, try again later' } },
});

router.post('/signup', authLimiter, validate(signupSchema), async (req, res, next) => {
  try {
    const { email, name, password } = req.body;
    const result = await authService.signup(email, name, password);
    res.cookie('token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    sendSuccess(res, { user: result.user, token: result.token }, 'Account created', 201);
  } catch (err) { next(err); }
});

router.post('/login', authLimiter, validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    res.cookie('token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    sendSuccess(res, { user: result.user, token: result.token }, 'Logged in successfully');
  } catch (err) { next(err); }
});

router.post('/logout', (_req, res) => {
  res.clearCookie('token');
  sendSuccess(res, null, 'Logged out');
});

router.get('/me', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const user = await authService.getMe(req.user!.id);
    sendSuccess(res, user);
  } catch (err) { next(err); }
});

export default router;

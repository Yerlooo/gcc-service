import { Router } from 'express';
import { asyncHandler } from '../../lib/async-handler';
import { requireAuth } from '../../middleware/auth';
import { loginLimiter } from '../../middleware/rate-limit';
import { validate } from '../../middleware/validate';
import { loginSchema } from './auth.schema';
import * as controller from './auth.controller';

export const authRoutes = Router();

authRoutes.post('/login', loginLimiter, validate(loginSchema), asyncHandler(controller.login));
authRoutes.post('/refresh', asyncHandler(controller.refresh));
authRoutes.post('/logout', asyncHandler(controller.logout));
authRoutes.get('/me', requireAuth, asyncHandler(controller.me));

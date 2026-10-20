import { Router } from 'express';
import { asyncHandler } from '../../lib/async-handler';
import { validate } from '../../middleware/validate';
import { trackLimiter, gatewayLimiter } from '../../middleware/rate-limit';
import { createSnapSchema, midtransNotificationSchema } from './payments.schema';
import * as controller from './payments.controller';

export const paymentsRoutes = Router();
paymentsRoutes.post('/snap', trackLimiter, validate(createSnapSchema), asyncHandler(controller.createSnap));
paymentsRoutes.post(
  '/midtrans/notification',
  gatewayLimiter,
  validate(midtransNotificationSchema),
  asyncHandler(controller.notification),
);

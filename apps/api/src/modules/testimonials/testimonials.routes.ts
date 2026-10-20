import { Router } from 'express';
import { asyncHandler } from '../../lib/async-handler';
import { validate } from '../../middleware/validate';
import { trackLimiter } from '../../middleware/rate-limit';
import {
  testimonialCreateSchema,
  testimonialQuerySchema,
  testimonialSubmitSchema,
  testimonialUpdateSchema,
} from './testimonials.schema';
import * as controller from './testimonials.controller';

export const testimonialsRoutes = Router();
testimonialsRoutes.get(
  '/',
  validate(testimonialQuerySchema, 'query'),
  asyncHandler(controller.publicList),
);
testimonialsRoutes.post(
  '/submit',
  trackLimiter,
  validate(testimonialSubmitSchema),
  asyncHandler(controller.submit),
);

export const adminTestimonialsRoutes = Router();
adminTestimonialsRoutes.get('/', asyncHandler(controller.adminList));
adminTestimonialsRoutes.post('/', validate(testimonialCreateSchema), asyncHandler(controller.create));
adminTestimonialsRoutes.patch(
  '/:id',
  validate(testimonialUpdateSchema),
  asyncHandler(controller.update),
);
adminTestimonialsRoutes.delete('/:id', asyncHandler(controller.remove));

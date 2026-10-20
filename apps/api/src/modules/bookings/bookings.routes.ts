import { Router } from 'express';
import { asyncHandler } from '../../lib/async-handler';
import { validate } from '../../middleware/validate';
import { bookingLimiter, trackLimiter } from '../../middleware/rate-limit';
import {
  adminBookingQuerySchema,
  assignTechnicianSchema,
  availabilityQuerySchema,
  createBookingSchema,
  paymentUpdateSchema,
  statusUpdateSchema,
} from './bookings.schema';
import * as controller from './bookings.controller';

/** Public booking flow. No authentication, rate limited. */
export const bookingsRoutes = Router();
bookingsRoutes.get(
  '/availability',
  validate(availabilityQuerySchema, 'query'),
  asyncHandler(controller.availability),
);
bookingsRoutes.post(
  '/',
  bookingLimiter,
  validate(createBookingSchema),
  asyncHandler(controller.create),
);
bookingsRoutes.get('/track/:code', trackLimiter, asyncHandler(controller.track));

/** Admin booking desk. Mounted behind requireAuth + requireRole('ADMIN'). */
export const adminBookingsRoutes = Router();
adminBookingsRoutes.get(
  '/',
  validate(adminBookingQuerySchema, 'query'),
  asyncHandler(controller.adminList),
);
adminBookingsRoutes.get('/:id', asyncHandler(controller.detail));
adminBookingsRoutes.patch(
  '/:id/status',
  validate(statusUpdateSchema),
  asyncHandler(controller.updateStatus),
);
adminBookingsRoutes.patch(
  '/:id/assign',
  validate(assignTechnicianSchema),
  asyncHandler(controller.assign),
);
adminBookingsRoutes.patch(
  '/:id/payment',
  validate(paymentUpdateSchema),
  asyncHandler(controller.updatePayment),
);

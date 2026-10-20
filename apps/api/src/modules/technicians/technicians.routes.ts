import { Router } from 'express';
import { asyncHandler } from '../../lib/async-handler';
import { validate } from '../../middleware/validate';
import {
  technicianCreateSchema,
  technicianQuerySchema,
  technicianUpdateSchema,
} from './technicians.schema';
import * as controller from './technicians.controller';

export const techniciansRoutes = Router();
techniciansRoutes.get('/', asyncHandler(controller.publicList));

export const adminTechniciansRoutes = Router();
adminTechniciansRoutes.get(
  '/',
  validate(technicianQuerySchema, 'query'),
  asyncHandler(controller.adminList),
);
adminTechniciansRoutes.post('/', validate(technicianCreateSchema), asyncHandler(controller.create));
adminTechniciansRoutes.patch(
  '/:id',
  validate(technicianUpdateSchema),
  asyncHandler(controller.update),
);
adminTechniciansRoutes.delete('/:id', asyncHandler(controller.remove));

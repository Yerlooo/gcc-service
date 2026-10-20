import { Router } from 'express';
import { asyncHandler } from '../../lib/async-handler';
import { validate } from '../../middleware/validate';
import {
  inventoryItemCreateSchema,
  inventoryItemUpdateSchema,
  inventoryQuerySchema,
  stockMovementSchema,
} from './inventory.schema';
import * as controller from './inventory.controller';

export const adminInventoryRoutes = Router();
adminInventoryRoutes.get('/', validate(inventoryQuerySchema, 'query'), asyncHandler(controller.list));
adminInventoryRoutes.get('/categories', asyncHandler(controller.categories));
adminInventoryRoutes.post('/', validate(inventoryItemCreateSchema), asyncHandler(controller.create));
adminInventoryRoutes.patch(
  '/:id',
  validate(inventoryItemUpdateSchema),
  asyncHandler(controller.update),
);
adminInventoryRoutes.delete('/:id', asyncHandler(controller.remove));
adminInventoryRoutes.get('/:id/movements', asyncHandler(controller.movements));
adminInventoryRoutes.post(
  '/:id/movements',
  validate(stockMovementSchema),
  asyncHandler(controller.movement),
);

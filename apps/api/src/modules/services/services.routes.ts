import { Router } from 'express';
import { asyncHandler } from '../../lib/async-handler';
import { validate } from '../../middleware/validate';
import {
  categoryCreateSchema,
  categoryUpdateSchema,
  serviceCreateSchema,
  serviceQuerySchema,
  serviceUpdateSchema,
  variantInputSchema,
  variantUpdateSchema,
} from './services.schema';
import * as controller from './services.controller';

export const servicesRoutes = Router();
servicesRoutes.get('/', validate(serviceQuerySchema, 'query'), asyncHandler(controller.catalogue));
servicesRoutes.get('/:slug', asyncHandler(controller.detail));

export const adminServicesRoutes = Router();
adminServicesRoutes.get('/', asyncHandler(controller.adminList));
adminServicesRoutes.post('/', validate(serviceCreateSchema), asyncHandler(controller.create));
adminServicesRoutes.patch('/:id', validate(serviceUpdateSchema), asyncHandler(controller.update));
adminServicesRoutes.delete('/:id', asyncHandler(controller.remove));
adminServicesRoutes.post(
  '/:id/variants',
  validate(variantInputSchema),
  asyncHandler(controller.createVariant),
);
adminServicesRoutes.patch(
  '/:id/variants/:variantId',
  validate(variantUpdateSchema),
  asyncHandler(controller.updateVariant),
);
adminServicesRoutes.delete('/:id/variants/:variantId', asyncHandler(controller.removeVariant));

export const adminCategoriesRoutes = Router();
adminCategoriesRoutes.get('/', asyncHandler(controller.adminCategories));
adminCategoriesRoutes.post('/', validate(categoryCreateSchema), asyncHandler(controller.createCategory));
adminCategoriesRoutes.patch(
  '/:id',
  validate(categoryUpdateSchema),
  asyncHandler(controller.updateCategory),
);

import { Router } from 'express';
import { asyncHandler } from '../../lib/async-handler';
import { validate } from '../../middleware/validate';
import { settingsUpdateSchema } from './settings.schema';
import * as controller from './settings.controller';

export const settingsRoutes = Router();
settingsRoutes.get('/public', asyncHandler(controller.publicSettings));

export const adminSettingsRoutes = Router();
adminSettingsRoutes.get('/', asyncHandler(controller.adminGet));
adminSettingsRoutes.put('/', validate(settingsUpdateSchema), asyncHandler(controller.adminUpdate));

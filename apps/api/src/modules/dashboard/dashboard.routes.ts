import { Router } from 'express';
import { asyncHandler } from '../../lib/async-handler';
import * as controller from './dashboard.controller';

export const adminDashboardRoutes = Router();
adminDashboardRoutes.get('/', asyncHandler(controller.overview));

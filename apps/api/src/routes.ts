import { Router } from 'express';
import { prisma } from './lib/prisma';
import { sendOk } from './lib/http';
import { requireAuth, requireRole } from './middleware/auth';
import { authRoutes } from './modules/auth/auth.routes';
import { servicesRoutes, adminServicesRoutes, adminCategoriesRoutes } from './modules/services/services.routes';
import { bookingsRoutes, adminBookingsRoutes } from './modules/bookings/bookings.routes';
import { testimonialsRoutes, adminTestimonialsRoutes } from './modules/testimonials/testimonials.routes';
import { techniciansRoutes, adminTechniciansRoutes } from './modules/technicians/technicians.routes';
import { adminInventoryRoutes } from './modules/inventory/inventory.routes';
import { adminDashboardRoutes } from './modules/dashboard/dashboard.routes';
import { settingsRoutes, adminSettingsRoutes } from './modules/settings/settings.routes';
import { paymentsRoutes } from './modules/payments/payments.routes';

export const apiRoutes = Router();

apiRoutes.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return sendOk(res, {
      status: 'ok',
      database: 'up',
      time: new Date().toISOString(),
    });
  } catch {
    return res.status(503).json({
      success: false,
      error: { code: 'NOT_READY', message: 'Database belum siap.' },
    });
  }
});

apiRoutes.use('/auth', authRoutes);
apiRoutes.use('/services', servicesRoutes);
apiRoutes.use('/bookings', bookingsRoutes);
apiRoutes.use('/testimonials', testimonialsRoutes);
apiRoutes.use('/technicians', techniciansRoutes);
apiRoutes.use('/settings', settingsRoutes);
apiRoutes.use('/payments', paymentsRoutes);

const adminRoutes = Router();
adminRoutes.use(requireAuth, requireRole('ADMIN'));
adminRoutes.use('/dashboard', adminDashboardRoutes);
adminRoutes.use('/bookings', adminBookingsRoutes);
adminRoutes.use('/services', adminServicesRoutes);
adminRoutes.use('/categories', adminCategoriesRoutes);
adminRoutes.use('/technicians', adminTechniciansRoutes);
adminRoutes.use('/testimonials', adminTestimonialsRoutes);
adminRoutes.use('/inventory', adminInventoryRoutes);
adminRoutes.use('/settings', adminSettingsRoutes);

apiRoutes.use('/admin', adminRoutes);

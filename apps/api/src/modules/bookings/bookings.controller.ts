import type { Request, Response } from 'express';
import { parsePagination, paginationMeta, sendCreated, sendOk, sendPaginated } from '../../lib/http';
import * as service from './bookings.service';

export async function availability(req: Request, res: Response) {
  return sendOk(res, await service.getAvailability(String(req.query.date)));
}

export async function create(req: Request, res: Response) {
  return sendCreated(res, await service.createBooking(req.body));
}

export async function track(req: Request, res: Response) {
  const phone = typeof req.query.phone === 'string' ? req.query.phone : undefined;
  return sendOk(res, await service.trackBooking(req.params.code, phone));
}

export async function adminList(req: Request, res: Response) {
  const pagination = parsePagination(req);
  const { rows, total } = await service.listBookings(
    {
      status: req.query.status as never,
      paymentStatus: req.query.paymentStatus as never,
      technicianId: req.query.technicianId as string | undefined,
      from: req.query.from as string | undefined,
      to: req.query.to as string | undefined,
      q: req.query.q as string | undefined,
    },
    pagination,
  );
  return sendPaginated(res, rows, paginationMeta(pagination.page, pagination.limit, total));
}

export async function detail(req: Request, res: Response) {
  return sendOk(res, await service.getBooking(req.params.id));
}

export async function updateStatus(req: Request, res: Response) {
  const data = await service.updateStatus(req.params.id, req.body, {
    userId: req.auth?.sub,
    ip: req.ip,
  });
  return sendOk(res, data);
}

export async function assign(req: Request, res: Response) {
  const data = await service.assignTechnician(req.params.id, req.body, {
    userId: req.auth?.sub,
    ip: req.ip,
  });
  return sendOk(res, data);
}

export async function updatePayment(req: Request, res: Response) {
  const data = await service.updatePayment(req.params.id, req.body, {
    userId: req.auth?.sub,
    ip: req.ip,
  });
  return sendOk(res, data);
}

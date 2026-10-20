import type { Request, Response } from 'express';
import { sendCreated, sendOk } from '../../lib/http';
import * as service from './technicians.service';

export async function publicList(_req: Request, res: Response) {
  return sendOk(res, await service.listPublicTechnicians());
}

export async function adminList(req: Request, res: Response) {
  const date = typeof req.query.date === 'string' ? req.query.date : undefined;
  return sendOk(res, await service.listTechnicians(date));
}

export async function create(req: Request, res: Response) {
  return sendCreated(res, await service.createTechnician(req.body));
}

export async function update(req: Request, res: Response) {
  return sendOk(res, await service.updateTechnician(req.params.id, req.body));
}

export async function remove(req: Request, res: Response) {
  return sendOk(res, await service.deactivateTechnician(req.params.id));
}

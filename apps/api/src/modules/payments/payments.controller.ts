import type { Request, Response } from 'express';
import { sendCreated, sendOk } from '../../lib/http';
import * as service from './payments.service';

export async function createSnap(req: Request, res: Response) {
  const data = await service.createSnap(req.body, { ip: req.ip });
  return sendCreated(res, data);
}

export async function notification(req: Request, res: Response) {
  const data = await service.handleNotification(req.body, { ip: req.ip });
  return sendOk(res, data);
}

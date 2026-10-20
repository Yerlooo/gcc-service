import type { Request, Response } from 'express';
import { sendOk } from '../../lib/http';
import * as service from './settings.service';

export async function publicSettings(_req: Request, res: Response) {
  return sendOk(res, await service.getPublicSettings());
}

export async function adminGet(_req: Request, res: Response) {
  return sendOk(res, await service.getSettings());
}

export async function adminUpdate(req: Request, res: Response) {
  const data = await service.updateSettings(req.body, {
    userId: req.auth?.sub,
    ip: req.ip,
  });
  return sendOk(res, data);
}

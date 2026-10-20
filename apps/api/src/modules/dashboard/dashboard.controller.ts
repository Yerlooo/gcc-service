import type { Request, Response } from 'express';
import { sendOk } from '../../lib/http';
import * as service from './dashboard.service';

export async function overview(req: Request, res: Response) {
  const range = req.query.range === '30d' ? '30d' : '7d';
  return sendOk(res, await service.getDashboard(range));
}

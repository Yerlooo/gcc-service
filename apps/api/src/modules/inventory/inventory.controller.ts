import type { Request, Response } from 'express';
import { sendCreated, sendOk } from '../../lib/http';
import * as service from './inventory.service';

export async function list(req: Request, res: Response) {
  return sendOk(
    res,
    await service.listItems({
      q: typeof req.query.q === 'string' ? req.query.q : undefined,
      category: typeof req.query.category === 'string' ? req.query.category : undefined,
      lowStock: req.query.lowStock === 'true',
    }),
  );
}

export async function categories(_req: Request, res: Response) {
  return sendOk(res, await service.listCategories());
}

export async function create(req: Request, res: Response) {
  return sendCreated(res, await service.createItem(req.body));
}

export async function update(req: Request, res: Response) {
  return sendOk(res, await service.updateItem(req.params.id, req.body));
}

export async function remove(req: Request, res: Response) {
  return sendOk(res, await service.deactivateItem(req.params.id));
}

export async function movement(req: Request, res: Response) {
  const data = await service.recordMovement(req.params.id, req.body, {
    userId: req.auth?.sub,
  });
  return sendCreated(res, data);
}

export async function movements(req: Request, res: Response) {
  const limit = Math.min(Number(req.query.limit ?? 30) || 30, 100);
  return sendOk(res, await service.listMovements(req.params.id, limit));
}

import type { Request, Response } from 'express';
import { sendCreated, sendOk } from '../../lib/http';
import * as service from './testimonials.service';

export async function publicList(req: Request, res: Response) {
  const { featured, limit } = req.query as unknown as { featured?: string; limit: number };
  return sendOk(res, await service.listPublished(featured === 'true', limit));
}

export async function submit(req: Request, res: Response) {
  return sendCreated(res, await service.submitTestimonial(req.body));
}

export async function adminList(_req: Request, res: Response) {
  return sendOk(res, await service.listAdmin());
}

export async function create(req: Request, res: Response) {
  return sendCreated(res, await service.createTestimonial(req.body));
}

export async function update(req: Request, res: Response) {
  return sendOk(res, await service.updateTestimonial(req.params.id, req.body));
}

export async function remove(req: Request, res: Response) {
  return sendOk(res, await service.deleteTestimonial(req.params.id));
}

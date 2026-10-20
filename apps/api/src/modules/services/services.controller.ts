import type { Request, Response } from 'express';
import { sendCreated, sendOk } from '../../lib/http';
import * as service from './services.service';

export async function catalogue(req: Request, res: Response) {
  const featured =
    req.query.featured === 'true' ? true : req.query.featured === 'false' ? false : undefined;
  const data = await service.getPublicCatalogue({
    category: typeof req.query.category === 'string' ? req.query.category : undefined,
    featured,
  });
  return sendOk(res, data);
}

export async function detail(req: Request, res: Response) {
  const data = await service.getPublicServiceBySlug(req.params.slug);
  return sendOk(res, data);
}

export async function adminList(_req: Request, res: Response) {
  return sendOk(res, await service.listAdminServices());
}

export async function adminCategories(_req: Request, res: Response) {
  return sendOk(res, await service.listAdminCategories());
}

export async function createCategory(req: Request, res: Response) {
  return sendCreated(res, await service.createCategory(req.body));
}

export async function updateCategory(req: Request, res: Response) {
  return sendOk(res, await service.updateCategory(req.params.id, req.body));
}

export async function create(req: Request, res: Response) {
  return sendCreated(res, await service.createService(req.body));
}

export async function update(req: Request, res: Response) {
  return sendOk(res, await service.updateService(req.params.id, req.body));
}

export async function remove(req: Request, res: Response) {
  return sendOk(res, await service.deactivateService(req.params.id));
}

export async function createVariant(req: Request, res: Response) {
  return sendCreated(res, await service.createVariant(req.params.id, req.body));
}

export async function updateVariant(req: Request, res: Response) {
  return sendOk(res, await service.updateVariant(req.params.id, req.params.variantId, req.body));
}

export async function removeVariant(req: Request, res: Response) {
  return sendOk(res, await service.deactivateVariant(req.params.id, req.params.variantId));
}

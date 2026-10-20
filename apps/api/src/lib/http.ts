import type { Request, Response } from 'express';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function sendOk<T>(res: Response, data: T, statusCode = 200): Response {
  return res.status(statusCode).json({ success: true, data });
}

export function sendCreated<T>(res: Response, data: T): Response {
  return sendOk(res, data, 201);
}

export function sendPaginated<T>(
  res: Response,
  data: T,
  meta: PaginationMeta,
): Response {
  return res.status(200).json({ success: true, data, meta });
}

export function parsePagination(req: Request, defaultLimit = 20, maxLimit = 100) {
  const rawPage = Number(req.query.page ?? 1);
  const rawLimit = Number(req.query.limit ?? defaultLimit);

  const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1;
  const limit =
    Number.isFinite(rawLimit) && rawLimit > 0
      ? Math.min(Math.floor(rawLimit), maxLimit)
      : defaultLimit;

  return { page, limit, skip: (page - 1) * limit };
}

export function paginationMeta(page: number, limit: number, total: number): PaginationMeta {
  return {
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

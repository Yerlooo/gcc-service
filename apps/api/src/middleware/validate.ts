import type { NextFunction, Request, Response } from 'express';
import type { AnyZodObject, ZodTypeAny } from 'zod';
import { UnprocessableError } from '../lib/errors';

type Source = 'body' | 'query' | 'params';

/**
 * Parse, strip unknown keys and replace the request source with validated data.
 * Handlers can then trust `req.body` completely.
 */
export function validate(schema: ZodTypeAny, source: Source = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      return next(UnprocessableError.fromZod(result.error));
    }
    // Express 4 allows replacing query/params objects.
    (req as unknown as Record<Source, unknown>)[source] = result.data;
    next();
  };
}

export type { AnyZodObject };

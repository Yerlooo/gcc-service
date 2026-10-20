import type { AccessPayload } from '../lib/jwt';

declare global {
  namespace Express {
    interface Request {
      auth?: AccessPayload;
    }
  }
}

export {};

import { JwtPayload } from 'src/modules/common/types';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export {};

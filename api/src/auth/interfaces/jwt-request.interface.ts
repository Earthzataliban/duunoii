import { Request } from 'express';

export interface JwtPayload {
  sub: string;
  email: string;
  iat: number;
  exp: number;
}

export interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
  };
}

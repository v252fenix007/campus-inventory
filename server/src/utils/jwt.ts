import jwt from 'jsonwebtoken';
import { RoleType } from '../config/constants.js';

export interface TokenPayload {
  userId: string;
  email: string;
  role: RoleType;
  department?: string;
  name: string;
}

const JWT_SECRET = process.env.JWT_SECRET || 'campusflow_super_secure_jwt_secret_dev_2026_key';
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || '7d') as any;

export const signToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
};

export const verifyToken = (token: string): TokenPayload => {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
};

import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../utils/jwt.js';
import { sendError } from '../utils/apiResponse.js';
import { User } from '../models/User.js';
import { RoleType } from '../config/constants.js';

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload & { _id: string };
    }
  }
}

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    let token: string | undefined;

    // Check authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return sendError(res, 'Authentication required. No token provided.', 401);
    }

    const decoded = verifyToken(token);
    
    // Check if user still exists and is active
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return sendError(res, 'User account not found or deactivated.', 401);
    }

    req.user = {
      ...decoded,
      _id: decoded.userId,
    };

    next();
  } catch (error: any) {
    return sendError(res, 'Invalid or expired authentication token.', 401);
  }
};

export const authorizeRoles = (...roles: RoleType[]) => {
  return (req: Request, res: Response, next: NextFunction): any => {
    if (!req.user) {
      return sendError(res, 'Authentication required.', 401);
    }

    if (!roles.includes(req.user.role)) {
      return sendError(
        res,
        `Access denied. Requires one of roles: [${roles.join(', ')}]. Current role: ${req.user.role}`,
        403
      );
    }

    next();
  };
};

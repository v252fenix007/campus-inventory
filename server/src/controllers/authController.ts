import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { User, IUser } from '../models/User.js';
import { Department } from '../models/Department.js';
import { ClassSection } from '../models/ClassSection.js';
import { signToken } from '../utils/jwt.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { loginSchema, forgotPasswordSchema, resetPasswordSchema } from '../validators/index.js';
import { ROLES } from '../config/constants.js';

export class AuthController {
  static async login(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const { email, password } = loginSchema.parse(req.body);

      const user = await User.findOne({ email: email.toLowerCase() })
        .select('+password')
        .populate('department', 'code name')
        .populate('classSection', 'name semester');

      if (!user) {
        return sendError(res, 'Invalid credentials. User not found.', 401);
      }

      if (!user.isActive) {
        return sendError(res, 'Your account has been deactivated. Please contact the administrator.', 403);
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return sendError(res, 'Invalid credentials. Incorrect password.', 401);
      }

      const token = signToken({
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
        department: user.department?._id?.toString(),
        name: user.name,
      });

      // Set HTTP-only cookie
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      const userObj = user.toObject();
      delete userObj.password;

      return sendSuccess(
        res,
        {
          token,
          user: userObj,
        },
        'Login successful'
      );
    } catch (err) {
      next(err);
    }
  }

  static async logout(_req: Request, res: Response): Promise<any> {
    res.clearCookie('token');
    return sendSuccess(res, null, 'Logged out successfully');
  }

  static async me(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      if (!req.user) {
        return sendError(res, 'Not authenticated', 401);
      }

      const user = await User.findById(req.user.userId)
        .populate('department', 'code name')
        .populate('classSection', 'name semester facultyAdvisor');

      if (!user) {
        return sendError(res, 'User not found', 404);
      }

      return sendSuccess(res, user, 'User profile fetched');
    } catch (err) {
      next(err);
    }
  }

  static async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const { email } = forgotPasswordSchema.parse(req.body);

      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        return sendSuccess(
          res,
          null,
          'If an account exists with this email, a password reset link has been dispatched.'
        );
      }

      const resetToken = crypto.randomBytes(32).toString('hex');
      user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
      user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      await user.save();

      // In development, return the token for quick verification
      return sendSuccess(
        res,
        {
          message: 'Password reset token generated.',
          token: resetToken,
        },
        'If an account exists with this email, a password reset link has been dispatched.'
      );
    } catch (err) {
      next(err);
    }
  }

  static async resetPassword(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const { token, newPassword } = resetPasswordSchema.parse(req.body);
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

      const user = await User.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpires: { $gt: new Date() },
      });

      if (!user) {
        return sendError(res, 'Invalid or expired password reset token.', 400);
      }

      user.password = newPassword;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();

      return sendSuccess(res, null, 'Password successfully reset. You can now login with your new password.');
    } catch (err) {
      next(err);
    }
  }

  static async getDemoUsers(_req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const demoUsers = await User.find({
        email: { $in: [
          'student@campusflow.edu',
          'faculty@campusflow.edu',
          'hod@campusflow.edu',
          'admin@campusflow.edu',
        ] },
      }).select('name email role registerNumber staffId');

      return sendSuccess(res, demoUsers, 'Demo credentials fetched');
    } catch (err) {
      next(err);
    }
  }
}

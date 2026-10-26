import multer from 'multer';
import path from 'path';
import fs from 'fs';

import os from 'os';

export const getUploadDir = (): string => {
  if (process.env.VERCEL) {
    const tmpDir = path.resolve(os.tmpdir(), 'campusflow-uploads');
    if (!fs.existsSync(tmpDir)) {
      try {
        fs.mkdirSync(tmpDir, { recursive: true });
      } catch (err) {
        console.warn('[Upload] Failed to create tmp upload dir:', err);
      }
    }
    return tmpDir;
  }

  const localDir = path.resolve(process.cwd(), 'uploads');
  if (!fs.existsSync(localDir)) {
    try {
      fs.mkdirSync(localDir, { recursive: true });
    } catch {
      // In case local filesystem is read-only
      const fallbackDir = path.resolve(os.tmpdir(), 'campusflow-uploads');
      if (!fs.existsSync(fallbackDir)) {
        fs.mkdirSync(fallbackDir, { recursive: true });
      }
      return fallbackDir;
    }
  }
  return localDir;
};

const uploadDir = getUploadDir();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `doc-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (
  _req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, JPG, and PNG documents are allowed.'));
  }
};

export const uploadDocument = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
});

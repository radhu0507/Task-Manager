import { Router } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { AuthRequest, authenticate } from '../middleware/auth';
import { uploadService } from '../services/upload.service';
import { sendSuccess } from '../utils/response';
import { config } from '../config';
import { createError } from '../middleware/errorHandler';
import { prisma } from '../utils/prisma';

const router = Router();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, config.uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const fileFilter = (_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.doc', '.docx', '.txt', '.csv', '.xlsx', '.zip'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(createError(400, 'VALIDATION_ERROR', `File type ${ext} not allowed`));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: config.maxFileSize },
});

router.post('/tasks/:taskId', authenticate, upload.single('file'), async (req: AuthRequest, res, next) => {
  try {
    if (!req.file) return next(createError(400, 'VALIDATION_ERROR', 'No file provided'));
    const attachment = await uploadService.upload(req.params.taskId, req.file, req.user!.id);
    sendSuccess(res, attachment, 'File uploaded', 201);
  } catch (err) { next(err); }
});

router.get('/:filename', async (req, res, next) => {
  try {
    const attachment = await prisma.attachment.findUnique({ where: { filename: req.params.filename } });
    if (!attachment) return next(createError(404, 'NOT_FOUND', 'Attachment not found'));
    const filePath = path.resolve(config.uploadDir, attachment.filename);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(attachment.originalName)}"`);
    res.sendFile(filePath);
  } catch (err) { next(err); }
});

router.delete('/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const result = await uploadService.delete(req.params.id, req.user!.id, req.user!.role);
    sendSuccess(res, result.message);
  } catch (err) { next(err); }
});

export default router;
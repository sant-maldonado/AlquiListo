import { Router } from 'express';
import upload from '../middleware/uploadMiddleware.js';
import uploadContextMiddleware from '../middleware/uploadContextMiddleware.js';
import { DocumentController } from '../controllers/documentController.js';
import { optionalAuthMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

router.use(optionalAuthMiddleware);

router.post(
  '/',
  upload.single('file'),
  uploadContextMiddleware,
  DocumentController.upload,
);

router.get('/:id', DocumentController.getOne);
router.delete('/:id', DocumentController.remove);

export default router;

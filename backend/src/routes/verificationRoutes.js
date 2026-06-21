import { Router } from 'express';
import { VerificationController } from '../controllers/verificationController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authMiddleware);

router.post('/', VerificationController.create);
router.get('/queue', VerificationController.listQueue);
router.post('/:id/review', VerificationController.review);
router.get('/', VerificationController.list);
router.get('/document/:documentId', VerificationController.getByDocument);

export default router;

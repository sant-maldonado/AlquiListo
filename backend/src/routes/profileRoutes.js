import { Router } from 'express';
import { ProfileController } from '../controllers/profileController.js';
import { DocumentController } from '../controllers/documentController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authMiddleware);

router.post('/me', ProfileController.createMyProfile);
router.get('/me', ProfileController.getMyProfile);
router.put('/me', ProfileController.updateMyProfile);
router.get('/me/score', ProfileController.getMyScore);
router.get('/:id/documents', DocumentController.listForProfile);
router.get('/:id', ProfileController.getPublicProfile);

export default router;

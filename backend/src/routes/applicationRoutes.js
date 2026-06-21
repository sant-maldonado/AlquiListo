import { Router } from 'express';
import { ApplicationController } from '../controllers/applicationController.js';
import { authMiddleware, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authMiddleware);

router.post('/', requireRole('inquilino'), ApplicationController.create);
router.get('/mine', requireRole('inquilino'), ApplicationController.listMine);
router.get('/mine-as-owner', requireRole('propietario', 'admin'), ApplicationController.listForOwner);

router.get('/property/:propertyId', requireRole('propietario', 'admin'), ApplicationController.listForProperty);
router.post('/:id/accept', requireRole('propietario', 'admin'), ApplicationController.accept);
router.post('/:id/reject', requireRole('propietario', 'admin'), ApplicationController.reject);

export default router;

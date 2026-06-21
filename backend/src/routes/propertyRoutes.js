import { Router } from 'express';
import { PropertyController } from '../controllers/propertyController.js';
import { authMiddleware, requireRole, optionalAuthMiddleware } from '../middleware/authMiddleware.js';
import { uploadPhotosMiddleware } from '../middleware/uploadPhotosMiddleware.js';

const router = Router();

router.get('/', PropertyController.listPublished);

router.get('/mine', authMiddleware, requireRole('propietario', 'admin'), PropertyController.listMine);

router.get('/:id', optionalAuthMiddleware, PropertyController.getOne);

router.use(authMiddleware, requireRole('propietario', 'admin'));

router.post('/', PropertyController.create);
router.put('/:id', PropertyController.update);
router.patch('/:id/status', PropertyController.updateStatus);
router.delete('/:id', PropertyController.remove);

router.post('/:id/photos', uploadPhotosMiddleware, PropertyController.uploadPhotos);
router.delete('/:id/photos/:photoId', PropertyController.removePhoto);

export default router;

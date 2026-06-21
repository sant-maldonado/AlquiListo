import { Router } from 'express';
import { GuarantorController } from '../controllers/guarantorController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/invite/:token', GuarantorController.getByInviteToken);

router.use(authMiddleware);

router.post('/', GuarantorController.create);
router.get('/', GuarantorController.listMine);
router.get('/:id', GuarantorController.getOne);
router.delete('/:id', GuarantorController.remove);
router.post('/:id/resend-invite', GuarantorController.resendInvite);

export default router;

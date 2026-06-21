import { GuarantorModel } from '../models/guarantorModel.js';
import { ProfileModel } from '../models/profileModel.js';
import { EmailService } from '../services/emailService.js';

export const GuarantorController = {
  async create(req, res) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: 'No autenticado' });

      const profile = await ProfileModel.findByUserId(userId);
      if (!profile) return res.status(404).json({ error: 'Perfil no encontrado' });

      const { type, full_name, dni, email, phone } = req.body;
      if (!type || !full_name) {
        return res.status(400).json({ error: 'type y full_name son requeridos' });
      }

      const validTypes = ['propietaria', 'caucion', 'recibo_tercero'];
      if (!validTypes.includes(type)) {
        return res.status(400).json({ error: 'type debe ser propietaria, caucion o recibo_tercero' });
      }

      const guarantor = await GuarantorModel.create({
        profile_id: profile.id,
        type,
        full_name,
        dni,
        email,
        phone,
      });

      const inviteLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/invite/${guarantor.invite_token}`;

      EmailService.sendGuarantorInvite(guarantor.email, guarantor.full_name, inviteLink);

      res.status(201).json({ guarantor, invite_link: inviteLink });
    } catch (err) {
      console.error('guarantor create error:', err);
      res.status(500).json({ error: 'Error al crear garante' });
    }
  },

  async listMine(req, res) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: 'No autenticado' });

      const profile = await ProfileModel.findByUserId(userId);
      if (!profile) return res.status(404).json({ error: 'Perfil no encontrado' });

      const guarantors = await GuarantorModel.findByProfileId(profile.id);
      res.json({ guarantors });
    } catch (err) {
      console.error('guarantor listMine error:', err);
      res.status(500).json({ error: 'Error al listar garantes' });
    }
  },

  async getOne(req, res) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: 'No autenticado' });

      const { id } = req.params;
      const guarantor = await GuarantorModel.findById(id);
      if (!guarantor) return res.status(404).json({ error: 'Garante no encontrado' });

      const profile = await ProfileModel.findByUserId(userId);
      if (!profile || !(await GuarantorModel.belongsToProfile(id, profile.id))) {
        return res.status(403).json({ error: 'No tienes permiso para ver este garante' });
      }

      res.json({ guarantor });
    } catch (err) {
      console.error('guarantor getOne error:', err);
      res.status(500).json({ error: 'Error al obtener garante' });
    }
  },

  async remove(req, res) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: 'No autenticado' });

      const { id } = req.params;
      const guarantor = await GuarantorModel.findById(id);
      if (!guarantor) return res.status(404).json({ error: 'Garante no encontrado' });

      const profile = await ProfileModel.findByUserId(userId);
      if (!profile || !(await GuarantorModel.belongsToProfile(id, profile.id))) {
        return res.status(403).json({ error: 'No tienes permiso para eliminar este garante' });
      }

      await GuarantorModel.delete(id);
      res.json({ message: 'Garante eliminado' });
    } catch (err) {
      console.error('guarantor remove error:', err);
      res.status(500).json({ error: 'Error al eliminar garante' });
    }
  },

  async resendInvite(req, res) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: 'No autenticado' });

      const profile = await ProfileModel.findByUserId(userId);
      if (!profile) return res.status(404).json({ error: 'Perfil no encontrado' });

      const { id } = req.params;
      const belongs = await GuarantorModel.belongsToProfile(id, profile.id);
      if (!belongs) return res.status(403).json({ error: 'No tienes permiso' });

      const guarantor = await GuarantorModel.regenerateInviteToken(id);
      const inviteLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/invite/${guarantor.invite_token}`;

      EmailService.sendGuarantorInvite(guarantor.email, guarantor.full_name, inviteLink);

      res.json({ guarantor, invite_link: inviteLink });
    } catch (err) {
      console.error('guarantor resendInvite error:', err);
      res.status(500).json({ error: 'Error al regenerar invitación' });
    }
  },

  async getByInviteToken(req, res) {
    try {
      const { token } = req.params;
      const guarantor = await GuarantorModel.findByInviteToken(token);
      if (!guarantor) return res.status(404).json({ error: 'Invitación no encontrada' });

      const { profile_id, ...publicData } = guarantor;
      res.json({ guarantor: publicData });
    } catch (err) {
      console.error('guarantor getByInviteToken error:', err);
      res.status(500).json({ error: 'Error al obtener invitación' });
    }
  },
};

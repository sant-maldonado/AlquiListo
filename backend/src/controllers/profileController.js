import { ProfileModel } from '../models/profileModel.js';

export const ProfileController = {
  async createMyProfile(req, res) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: 'No autenticado' });

      if (req.user.role !== 'inquilino') {
        return res.status(403).json({ error: 'Solo los inquilinos pueden crear un perfil' });
      }

      const existing = await ProfileModel.findByUserId(userId);
      if (existing) return res.status(409).json({ error: 'Ya tienes un perfil creado' });

      const { first_name, last_name, dni, monthly_income } = req.body;
      if (!first_name || !last_name) {
        return res.status(400).json({ error: 'first_name y last_name son requeridos' });
      }

      const profile = await ProfileModel.create({
        user_id: userId, first_name, last_name, dni, monthly_income,
      });

      res.status(201).json({ profile });
    } catch (err) {
      console.error('createMyProfile error:', err);
      res.status(500).json({ error: 'Error al crear perfil' });
    }
  },

  async getMyProfile(req, res) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: 'No autenticado' });

      const profile = await ProfileModel.findByUserId(userId);
      if (!profile) return res.status(404).json({ error: 'Perfil no encontrado' });

      res.json({ profile });
    } catch (err) {
      console.error('getMyProfile error:', err);
      res.status(500).json({ error: 'Error al obtener perfil' });
    }
  },

  async updateMyProfile(req, res) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: 'No autenticado' });

      const profile = await ProfileModel.findByUserId(userId);
      if (!profile) return res.status(404).json({ error: 'Perfil no encontrado' });

      const updated = await ProfileModel.update(profile.id, req.body);
      res.json({ profile: updated });
    } catch (err) {
      console.error('updateMyProfile error:', err);
      res.status(500).json({ error: 'Error al actualizar perfil' });
    }
  },

  async getPublicProfile(req, res) {
    try {
      const { id } = req.params;
      const profile = await ProfileModel.findPublicById(id);
      if (!profile) return res.status(404).json({ error: 'Perfil no encontrado' });

      res.json({ profile });
    } catch (err) {
      console.error('getPublicProfile error:', err);
      res.status(500).json({ error: 'Error al obtener perfil' });
    }
  },

  async getMyScore(req, res) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: 'No autenticado' });

      const profile = await ProfileModel.findByUserId(userId);
      if (!profile) return res.status(404).json({ error: 'Perfil no encontrado' });

      res.json({ trust_score: profile.trust_score });
    } catch (err) {
      console.error('getMyScore error:', err);
      res.status(500).json({ error: 'Error al obtener score' });
    }
  },
};

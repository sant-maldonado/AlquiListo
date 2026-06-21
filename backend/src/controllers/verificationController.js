import { VerificationModel } from '../models/verificationModel.js';
import { DocumentModel } from '../models/documentModel.js';
import { ScoringService } from '../services/scoringService.js';

export const VerificationController = {
  async create(req, res) {
    try {
      const { document_id } = req.body;
      if (!document_id) {
        return res.status(400).json({ error: 'document_id es requerido' });
      }

      const document = await DocumentModel.findById(document_id);
      if (!document) {
        return res.status(404).json({ error: 'Documento no encontrado' });
      }

      const verification = await VerificationModel.create({ documentId: document_id });

      res.status(201).json({ verification });
    } catch (err) {
      console.error('verification create error:', err);
      res.status(500).json({ error: 'Error al crear verificación' });
    }
  },

  async review(req, res) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: 'No autenticado' });

      const userRole = req.user?.role;
      if (userRole !== 'admin') {
        return res.status(403).json({ error: 'Solo administradores pueden revisar verificaciones' });
      }

      const { id } = req.params;
      const { result, notes } = req.body;

      if (!result || !['approved', 'rejected'].includes(result)) {
        return res.status(400).json({ error: 'result debe ser approved o rejected' });
      }

      const verification = await VerificationModel.findById(id);
      if (!verification) {
        return res.status(404).json({ error: 'Verificación no encontrada' });
      }

      const updated = await VerificationModel.review(id, {
        result,
        notes,
        reviewedBy: req.user.email,
      });

      const aiStatus = result === 'approved' ? 'auto_approved' : 'flagged';
      await DocumentModel.updateAiStatus(verification.document_id, { aiStatus, aiConfidence: null });

      if (verification.profile_id) {
        await ScoringService.recalculate(verification.profile_id);
      }

      res.json({ verification: updated });
    } catch (err) {
      console.error('verification review error:', err);
      res.status(500).json({ error: 'Error al revisar verificación' });
    }
  },

  async listQueue(req, res) {
    try {
      if (!req.user) return res.status(401).json({ error: 'No autenticado' });
      if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Solo administradores pueden ver la cola' });
      }

      const verifications = await VerificationModel.findAllPending();
      res.json({ verifications });
    } catch (err) {
      console.error('verification queue error:', err);
      res.status(500).json({ error: 'Error al obtener cola de verificación' });
    }
  },

  async list(req, res) {
    try {
      const verifications = await VerificationModel.findAll();
      res.json({ verifications });
    } catch (err) {
      console.error('verification list error:', err);
      res.status(500).json({ error: 'Error al listar verificaciones' });
    }
  },

  async getByDocument(req, res) {
    try {
      const { documentId } = req.params;
      const verifications = await VerificationModel.findByDocumentId(documentId);
      res.json({ verifications });
    } catch (err) {
      console.error('verification getByDocument error:', err);
      res.status(500).json({ error: 'Error al obtener verificaciones' });
    }
  },
};

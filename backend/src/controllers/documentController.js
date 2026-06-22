import { extname } from 'path';
import { DocumentModel } from '../models/documentModel.js';
import { ProfileModel } from '../models/profileModel.js';
import { GuarantorModel } from '../models/guarantorModel.js';
import { StorageService } from '../services/storageService.js';
import { VerificationOrchestratorService } from '../services/verificationOrchestratorService.js';

const VALID_TYPES = ['dni', 'dni_front', 'dni_back', 'recibo_sueldo', 'escritura', 'poliza_caucion', 'contrato_anterior', 'otro'];

export const DocumentController = {
  async upload(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No se recibió ningún archivo' });
      }

      if (!req.uploadContext || (!req.uploadContext.profileId && !req.uploadContext.guarantorId)) {
        return res.status(401).json({ error: 'No autenticado' });
      }

      const { type } = req.body;
      if (!type || !VALID_TYPES.includes(type)) {
        return res.status(400).json({ error: `type debe ser uno de: ${VALID_TYPES.join(', ')}` });
      }

      const { profileId, guarantorId } = req.uploadContext;
      const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(req.file.originalname)}`;
      const fileUrl = await StorageService.uploadFile(req.file.buffer, uniqueName);

      const document = await DocumentModel.create({
        profileId,
        guarantorId,
        type,
        fileUrl,
      });

      VerificationOrchestratorService.runAiCheck(document.id).catch((err) => {
        console.error('Error inesperado disparando runAiCheck:', err);
      });

      return res.status(201).json({ document });
    } catch (err) {
      console.error('Error en upload document:', err);
      return res.status(500).json({ error: 'Error al subir el documento' });
    }
  },

  async getOne(req, res) {
    try {
      const document = await DocumentModel.findById(req.params.id);
      if (!document) {
        return res.status(404).json({ error: 'Documento no encontrado' });
      }

      if (req.user.role !== 'admin') {
        const profile = await ProfileModel.findByUserId(req.user.id);
        const guarantors = profile ? await GuarantorModel.findByProfileId(profile.id) : [];
        const guarantorIds = guarantors.map((g) => g.id);

        const owns = await DocumentModel.belongsToUser(document.id, profile?.id, guarantorIds);
        if (!owns) {
          return res.status(403).json({ error: 'No tenés acceso a este documento' });
        }
      }

      return res.json({ document });
    } catch (err) {
      console.error('Error en getOne document:', err);
      return res.status(500).json({ error: 'Error al obtener el documento' });
    }
  },

  async remove(req, res) {
    try {
      const document = await DocumentModel.findById(req.params.id);
      if (!document) {
        return res.status(404).json({ error: 'Documento no encontrado' });
      }

      if (document.ai_status === 'auto_approved') {
        return res.status(400).json({ error: 'No se puede eliminar un documento ya verificado' });
      }

      const profile = await ProfileModel.findByUserId(req.user.id);
      const guarantors = profile ? await GuarantorModel.findByProfileId(profile.id) : [];
      const guarantorIds = guarantors.map((g) => g.id);

      const owns = await DocumentModel.belongsToUser(document.id, profile?.id, guarantorIds);
      if (!owns) {
        return res.status(403).json({ error: 'No tenés acceso a este documento' });
      }

      await DocumentModel.delete(document.id);
      return res.status(204).send();
    } catch (err) {
      console.error('Error en remove document:', err);
      return res.status(500).json({ error: 'Error al eliminar el documento' });
    }
  },

  async listForProfile(req, res) {
    try {
      const targetProfileId = req.params.id;

      if (req.user.role === 'inquilino') {
        const profile = await ProfileModel.findByUserId(req.user.id);
        if (!profile || profile.id !== targetProfileId) {
          return res.status(403).json({ error: 'No tenés acceso a estos documentos' });
        }
      }

      const documents = await DocumentModel.findAllForProfile(targetProfileId);
      return res.json({ documents });
    } catch (err) {
      console.error('Error en listForProfile:', err);
      return res.status(500).json({ error: 'Error al listar documentos' });
    }
  },
};

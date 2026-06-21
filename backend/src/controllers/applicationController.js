import { ApplicationModel } from '../models/applicationModel.js';
import { ProfileModel } from '../models/profileModel.js';
import { PropertyModel } from '../models/propertyModel.js';
import { EmailService } from '../services/emailService.js';

export const ApplicationController = {
  async create(req, res) {
    try {
      const { property_id } = req.body;
      if (!property_id) {
        return res.status(400).json({ error: 'Falta property_id' });
      }

      const profile = await ProfileModel.findByUserId(req.user.id);
      if (!profile) {
        return res.status(404).json({ error: 'Necesitás crear tu perfil antes de postularte' });
      }

      if (profile.verification_status !== 'verified') {
        return res.status(403).json({
          error: 'Tu perfil todavía no está verificado. Completá tu documentación para poder postularte.',
        });
      }

      const property = await PropertyModel.findById(property_id);
      if (!property || property.status !== 'published') {
        return res.status(404).json({ error: 'Propiedad no encontrada o ya no está disponible' });
      }

      const application = await ApplicationModel.create({
        propertyId: property_id,
        profileId: profile.id,
        trustScoreSnapshot: profile.trust_score,
      });

      const ownerProfile = await ProfileModel.findByUserId(property.owner_id);
      if (ownerProfile) {
        const ownerName = `${ownerProfile.first_name} ${ownerProfile.last_name}`;
        const tenantName = `${profile.first_name} ${profile.last_name}`;
        EmailService.sendNewApplication(ownerProfile.email, ownerName, property.title, tenantName);
      }

      return res.status(201).json({ application });
    } catch (err) {
      console.error('Error en create application:', err);
      return res.status(500).json({ error: 'Error al postularte' });
    }
  },

  async listMine(req, res) {
    try {
      const profile = await ProfileModel.findByUserId(req.user.id);
      if (!profile) {
        return res.status(404).json({ error: 'No tenés un perfil creado todavía' });
      }
      const applications = await ApplicationModel.findByProfileId(profile.id);
      return res.json({ applications });
    } catch (err) {
      console.error('Error en listMine applications:', err);
      return res.status(500).json({ error: 'Error al listar tus postulaciones' });
    }
  },

  async listForOwner(req, res) {
    try {
      const applications = await ApplicationModel.findByOwnerId(req.user.id);
      return res.json({ applications });
    } catch (err) {
      console.error('Error en listForOwner:', err);
      return res.status(500).json({ error: 'Error al listar las postulaciones' });
    }
  },

  async listForProperty(req, res) {
    try {
      const owns = await PropertyModel.belongsToOwner(req.params.propertyId, req.user.id);
      if (!owns) {
        return res.status(403).json({ error: 'No tenés acceso a esta propiedad' });
      }

      const applications = await ApplicationModel.findByPropertyId(req.params.propertyId);
      return res.json({ applications });
    } catch (err) {
      console.error('Error en listForProperty:', err);
      return res.status(500).json({ error: 'Error al listar los postulantes' });
    }
  },

  async accept(req, res) {
    try {
      const owns = await ApplicationModel.belongsToPropertyOwner(req.params.id, req.user.id);
      if (!owns) {
        return res.status(403).json({ error: 'No tenés acceso a esta postulación' });
      }

      const application = await ApplicationModel.findById(req.params.id);
      if (!application) {
        return res.status(404).json({ error: 'Postulación no encontrada' });
      }
      if (application.status !== 'pending') {
        return res.status(400).json({ error: 'Esta postulación ya fue resuelta' });
      }

      const accepted = await ApplicationModel.accept(req.params.id);
      await ApplicationModel.rejectOthersForProperty(application.property_id, application.id);
      await PropertyModel.updateStatus(application.property_id, 'rented');

      const prop = await PropertyModel.findById(application.property_id);

      const acceptedProfile = await ProfileModel.findById(accepted.profile_id);
      if (acceptedProfile) {
        const tenantName = `${acceptedProfile.first_name} ${acceptedProfile.last_name}`;
        EmailService.sendApplicationAccepted(acceptedProfile.email, tenantName, prop.title);
      }

      const allApps = await ApplicationModel.findByPropertyId(application.property_id);
      for (const app of allApps) {
        if (app.id === application.id) continue;
        const rejectedProfile = await ProfileModel.findById(app.profile_id);
        if (rejectedProfile) {
          const rName = `${rejectedProfile.first_name} ${rejectedProfile.last_name}`;
          EmailService.sendApplicationRejected(rejectedProfile.email, rName, prop.title);
        }
      }

      return res.json({ application: accepted });
    } catch (err) {
      console.error('Error en accept application:', err);
      return res.status(500).json({ error: 'Error al aceptar la postulación' });
    }
  },

  async reject(req, res) {
    try {
      const owns = await ApplicationModel.belongsToPropertyOwner(req.params.id, req.user.id);
      if (!owns) {
        return res.status(403).json({ error: 'No tenés acceso a esta postulación' });
      }

      const application = await ApplicationModel.findById(req.params.id);
      if (!application) {
        return res.status(404).json({ error: 'Postulación no encontrada' });
      }
      if (application.status !== 'pending') {
        return res.status(400).json({ error: 'Esta postulación ya fue resuelta' });
      }

      const rejected = await ApplicationModel.reject(req.params.id);

      const rejectedProfile = await ProfileModel.findById(rejected.profile_id);
      if (rejectedProfile) {
        const tenantName = `${rejectedProfile.first_name} ${rejectedProfile.last_name}`;
        const prop = await PropertyModel.findById(application.property_id);
        EmailService.sendApplicationRejected(rejectedProfile.email, tenantName, prop.title);
      }

      return res.json({ application: rejected });
    } catch (err) {
      console.error('Error en reject application:', err);
      return res.status(500).json({ error: 'Error al rechazar la postulación' });
    }
  },
};

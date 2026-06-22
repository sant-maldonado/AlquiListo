import crypto from 'crypto';
import { extname } from 'path';
import { PropertyModel } from '../models/propertyModel.js';
import { StorageService } from '../services/storageService.js';

const VALID_AMENITIES = ['balcon', 'cochera', 'pileta', 'parrilla', 'terraza', 'lavadero', 'aire_acondicionado', 'amueblado', 'seguridad_24hs', 'gimnasio'];

export const PropertyController = {
  async create(req, res) {
    try {
      const { title, description, price, expenses, rooms, square_meters, age_years, address, neighborhood, accepts_pets, amenities } = req.body;

      if (!title || !price || !rooms || !address) {
        return res.status(400).json({ error: 'Faltan campos requeridos: title, price, rooms, address' });
      }

      if (amenities && !amenities.every((a) => VALID_AMENITIES.includes(a))) {
        return res.status(400).json({ error: `amenities solo puede contener: ${VALID_AMENITIES.join(', ')}` });
      }

      const property = await PropertyModel.create({
        ownerId: req.user.id,
        title,
        description,
        price: Number(price),
        expenses: expenses ? Number(expenses) : null,
        rooms: Number(rooms),
        squareMeters: square_meters ? Number(square_meters) : null,
        ageYears: age_years ? Number(age_years) : null,
        address,
        neighborhood,
        acceptsPets: Boolean(accepts_pets),
      });

      if (amenities?.length) {
        await PropertyModel.setAmenities(property.id, amenities);
      }

      const full = await PropertyModel.findFullById(property.id);
      return res.status(201).json({ property: full });
    } catch (err) {
      console.error('Error en create property:', err);
      return res.status(500).json({ error: 'Error al crear la propiedad' });
    }
  },

  async getOne(req, res) {
    try {
      const property = await PropertyModel.findFullById(req.params.id);
      if (!property) {
        return res.status(404).json({ error: 'Propiedad no encontrada' });
      }

      const isOwner = req.user && property.owner_id === req.user.id;
      const isAdmin = req.user?.role === 'admin';
      if (property.status !== 'published' && !isOwner && !isAdmin) {
        return res.status(404).json({ error: 'Propiedad no encontrada' });
      }

      return res.json({ property });
    } catch (err) {
      console.error('Error en getOne property:', err);
      return res.status(500).json({ error: 'Error al obtener la propiedad' });
    }
  },

  async listMine(req, res) {
    try {
      const properties = await PropertyModel.findByOwnerId(req.user.id);
      return res.json({ properties });
    } catch (err) {
      console.error('Error en listMine properties:', err);
      return res.status(500).json({ error: 'Error al listar tus propiedades' });
    }
  },

  async listPublished(req, res) {
    try {
      const limit = Math.min(Number(req.query.limit) || 20, 50);
      const offset = Number(req.query.offset) || 0;
      const properties = await PropertyModel.findPublished({ limit, offset });
      return res.json({ properties, limit, offset });
    } catch (err) {
      console.error('Error en listPublished:', err);
      return res.status(500).json({ error: 'Error al listar propiedades' });
    }
  },

  async update(req, res) {
    try {
      const owns = await PropertyModel.belongsToOwner(req.params.id, req.user.id);
      if (!owns) {
        return res.status(403).json({ error: 'No tenés acceso a esta propiedad' });
      }

      const { amenities, ...fields } = req.body;
      const numericFields = ['price', 'expenses', 'rooms', 'square_meters', 'age_years'];
      for (const f of numericFields) {
        if (fields[f] !== undefined) fields[f] = Number(fields[f]);
      }

      const property = await PropertyModel.update(req.params.id, fields);

      if (amenities) {
        if (!amenities.every((a) => VALID_AMENITIES.includes(a))) {
          return res.status(400).json({ error: `amenities solo puede contener: ${VALID_AMENITIES.join(', ')}` });
        }
        await PropertyModel.setAmenities(req.params.id, amenities);
      }

      const full = await PropertyModel.findFullById(req.params.id);
      return res.json({ property: full });
    } catch (err) {
      console.error('Error en update property:', err);
      return res.status(500).json({ error: 'Error al actualizar la propiedad' });
    }
  },

  async updateStatus(req, res) {
    try {
      const { status } = req.body;
      const validStatuses = ['draft', 'published', 'paused', 'rented'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: `status debe ser uno de: ${validStatuses.join(', ')}` });
      }

      const owns = await PropertyModel.belongsToOwner(req.params.id, req.user.id);
      if (!owns) {
        return res.status(403).json({ error: 'No tenés acceso a esta propiedad' });
      }

      const property = await PropertyModel.updateStatus(req.params.id, status);
      return res.json({ property });
    } catch (err) {
      console.error('Error en updateStatus property:', err);
      return res.status(500).json({ error: 'Error al actualizar el estado' });
    }
  },

  async remove(req, res) {
    try {
      const owns = await PropertyModel.belongsToOwner(req.params.id, req.user.id);
      if (!owns) {
        return res.status(403).json({ error: 'No tenés acceso a esta propiedad' });
      }
      await PropertyModel.delete(req.params.id);
      return res.status(204).send();
    } catch (err) {
      console.error('Error en remove property:', err);
      return res.status(500).json({ error: 'Error al eliminar la propiedad' });
    }
  },

  async uploadPhotos(req, res) {
    try {
      const owns = await PropertyModel.belongsToOwner(req.params.id, req.user.id);
      if (!owns) {
        return res.status(403).json({ error: 'No tenés acceso a esta propiedad' });
      }

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No se recibió ninguna foto' });
      }

      const existingPhotos = await PropertyModel.getPhotos(req.params.id);
      let nextPosition = existingPhotos.length;

      const created = [];
      for (const file of req.files) {
        const uniqueName = `${crypto.randomUUID()}${extname(file.originalname)}`;
        const fileUrl = await StorageService.uploadFile(file.buffer, uniqueName);
        const photo = await PropertyModel.addPhoto(req.params.id, fileUrl, nextPosition);
        created.push(photo);
        nextPosition++;
      }

      return res.status(201).json({ photos: created });
    } catch (err) {
      console.error('Error en uploadPhotos:', err);
      return res.status(500).json({ error: 'Error al subir las fotos' });
    }
  },

  async removePhoto(req, res) {
    try {
      const owns = await PropertyModel.photoBelongsToOwner(req.params.photoId, req.user.id);
      if (!owns) {
        return res.status(403).json({ error: 'No tenés acceso a esta foto' });
      }
      await PropertyModel.removePhoto(req.params.photoId);
      return res.status(204).send();
    } catch (err) {
      console.error('Error en removePhoto:', err);
      return res.status(500).json({ error: 'Error al eliminar la foto' });
    }
  },
};

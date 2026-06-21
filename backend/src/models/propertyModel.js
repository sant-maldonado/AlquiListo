import { query } from '../config/db.js';

export const PropertyModel = {
  async create({ ownerId, title, description, price, expenses, rooms, squareMeters, ageYears, address, neighborhood, acceptsPets }) {
    const result = await query(
      `INSERT INTO properties
        (owner_id, title, description, price, expenses, rooms, square_meters, age_years, address, neighborhood, accepts_pets)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [ownerId, title, description || null, price, expenses || null, rooms, squareMeters || null, ageYears || null, address, neighborhood || null, acceptsPets || false]
    );
    return result.rows[0];
  },

  async findById(id) {
    const result = await query(`SELECT * FROM properties WHERE id = $1`, [id]);
    return result.rows[0] || null;
  },

  async findByOwnerId(ownerId) {
    const result = await query(
      `SELECT * FROM properties WHERE owner_id = $1 ORDER BY created_at DESC`,
      [ownerId]
    );
    return result.rows;
  },

  async findPublished({ limit = 20, offset = 0 } = {}) {
    const result = await query(
      `SELECT * FROM properties WHERE status = 'published' ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return result.rows;
  },

  async belongsToOwner(propertyId, ownerId) {
    const result = await query(
      `SELECT id FROM properties WHERE id = $1 AND owner_id = $2`,
      [propertyId, ownerId]
    );
    return result.rows.length > 0;
  },

  async update(id, fields) {
    const allowed = [
      'title', 'description', 'price', 'expenses', 'rooms',
      'square_meters', 'age_years', 'address', 'neighborhood', 'accepts_pets',
    ];
    const keys = Object.keys(fields).filter((k) => allowed.includes(k));
    if (keys.length === 0) return this.findById(id);

    const setClause = keys.map((k, i) => `${k} = $${i + 2}`).join(', ');
    const values = keys.map((k) => fields[k]);

    const result = await query(
      `UPDATE properties SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id, ...values]
    );
    return result.rows[0] || null;
  },

  async updateStatus(id, status) {
    const result = await query(
      `UPDATE properties SET status = $2, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id, status]
    );
    return result.rows[0] || null;
  },

  async delete(id) {
    await query(`DELETE FROM properties WHERE id = $1`, [id]);
  },

  async setAmenities(propertyId, amenities) {
    await query(`DELETE FROM property_amenities WHERE property_id = $1`, [propertyId]);
    if (!amenities || amenities.length === 0) return [];

    const values = amenities.map((_, i) => `($1, $${i + 2})`).join(', ');
    const result = await query(
      `INSERT INTO property_amenities (property_id, amenity) VALUES ${values} RETURNING amenity`,
      [propertyId, ...amenities]
    );
    return result.rows.map((r) => r.amenity);
  },

  async getAmenities(propertyId) {
    const result = await query(
      `SELECT amenity FROM property_amenities WHERE property_id = $1`,
      [propertyId]
    );
    return result.rows.map((r) => r.amenity);
  },

  async addPhoto(propertyId, fileUrl, position = 0) {
    const result = await query(
      `INSERT INTO property_photos (property_id, file_url, position) VALUES ($1, $2, $3) RETURNING *`,
      [propertyId, fileUrl, position]
    );
    return result.rows[0];
  },

  async getPhotos(propertyId) {
    const result = await query(
      `SELECT * FROM property_photos WHERE property_id = $1 ORDER BY position ASC, created_at ASC`,
      [propertyId]
    );
    return result.rows;
  },

  async removePhoto(photoId) {
    await query(`DELETE FROM property_photos WHERE id = $1`, [photoId]);
  },

  async photoBelongsToOwner(photoId, ownerId) {
    const result = await query(
      `SELECT pp.id FROM property_photos pp
       JOIN properties p ON p.id = pp.property_id
       WHERE pp.id = $1 AND p.owner_id = $2`,
      [photoId, ownerId]
    );
    return result.rows.length > 0;
  },

  async findFullById(id) {
    const property = await this.findById(id);
    if (!property) return null;
    const [amenities, photos] = await Promise.all([
      this.getAmenities(id),
      this.getPhotos(id),
    ]);
    return { ...property, amenities, photos };
  },
};

import { query } from '../config/db.js';

export const ApplicationModel = {
  async create({ propertyId, profileId, trustScoreSnapshot }) {
    const result = await query(
      `INSERT INTO applications (property_id, profile_id, trust_score_snapshot)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [propertyId, profileId, trustScoreSnapshot]
    );
    return result.rows[0];
  },

  async findById(id) {
    const result = await query(`SELECT * FROM applications WHERE id = $1`, [id]);
    return result.rows[0] || null;
  },

  async findByProfileId(profileId) {
    const result = await query(
      `SELECT a.*, p.title AS property_title, p.address AS property_address, p.price AS property_price
       FROM applications a
       JOIN properties p ON p.id = a.property_id
       WHERE a.profile_id = $1
       ORDER BY a.created_at DESC`,
      [profileId]
    );
    return result.rows;
  },

  async findByPropertyId(propertyId) {
    const result = await query(
      `SELECT
         a.id, a.status, a.trust_score_snapshot, a.created_at, a.decided_at,
         pr.id AS profile_id, pr.first_name, pr.last_name, pr.verification_status
       FROM applications a
       JOIN profiles pr ON pr.id = a.profile_id
       WHERE a.property_id = $1
       ORDER BY a.status = 'pending' DESC, a.trust_score_snapshot DESC, a.created_at ASC`,
      [propertyId]
    );
    return result.rows;
  },

  async existsForPropertyAndProfile(propertyId, profileId) {
    const result = await query(
      `SELECT id FROM applications WHERE property_id = $1 AND profile_id = $2 ORDER BY created_at DESC LIMIT 1`,
      [propertyId, profileId]
    );
    return result.rows[0] || null;
  },

  async accept(id) {
    const result = await query(
      `UPDATE applications SET status = 'accepted', decided_at = NOW() WHERE id = $1 RETURNING *`,
      [id]
    );
    return result.rows[0] || null;
  },

  async rejectOthersForProperty(propertyId, exceptApplicationId) {
    await query(
      `UPDATE applications
       SET status = 'rejected', decided_at = NOW()
       WHERE property_id = $1 AND id != $2 AND status = 'pending'`,
      [propertyId, exceptApplicationId]
    );
  },

  async reject(id) {
    const result = await query(
      `UPDATE applications SET status = 'rejected', decided_at = NOW() WHERE id = $1 RETURNING *`,
      [id]
    );
    return result.rows[0] || null;
  },

  async findByOwnerId(ownerId) {
    const result = await query(
      `SELECT
         a.id, a.status, a.trust_score_snapshot, a.created_at, a.decided_at,
         p.id AS property_id, p.title AS property_title, p.price AS property_price,
         pr.id AS profile_id, pr.first_name, pr.last_name, pr.verification_status
       FROM applications a
       JOIN properties p ON p.id = a.property_id
       JOIN profiles pr ON pr.id = a.profile_id
       WHERE p.owner_id = $1
       ORDER BY a.created_at DESC`,
      [ownerId]
    );
    return result.rows;
  },

  async belongsToPropertyOwner(applicationId, ownerId) {
    const result = await query(
      `SELECT a.id FROM applications a
       JOIN properties p ON p.id = a.property_id
       WHERE a.id = $1 AND p.owner_id = $2`,
      [applicationId, ownerId]
    );
    return result.rows.length > 0;
  },
};

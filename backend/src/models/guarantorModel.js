import { query } from '../config/db.js';

export const GuarantorModel = {
  async create(data) {
    const { profile_id, type, full_name, dni, email, phone } = data;
    const { rows } = await query(
      `INSERT INTO guarantors (profile_id, type, full_name, dni, email, phone)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [profile_id, type, full_name, dni, email, phone]
    );
    return rows[0];
  },

  async findByProfileId(profileId) {
    const { rows } = await query(
      'SELECT * FROM guarantors WHERE profile_id = $1 ORDER BY created_at DESC',
      [profileId]
    );
    return rows;
  },

  async findById(id) {
    const { rows } = await query('SELECT * FROM guarantors WHERE id = $1', [id]);
    return rows[0] || null;
  },

  async findByInviteToken(token) {
    const { rows } = await query(
      'SELECT * FROM guarantors WHERE invite_token = $1',
      [token]
    );
    return rows[0] || null;
  },

  async belongsToProfile(id, profileId) {
    const { rows } = await query(
      'SELECT 1 FROM guarantors WHERE id = $1 AND profile_id = $2',
      [id, profileId]
    );
    return rows.length > 0;
  },

  async updateStatus(id, status) {
    const { rows } = await query(
      'UPDATE guarantors SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    return rows[0] || null;
  },

  async regenerateInviteToken(id) {
    const { rows } = await query(
      `UPDATE guarantors SET invite_token = gen_random_uuid() WHERE id = $1 RETURNING *`,
      [id]
    );
    return rows[0] || null;
  },

  async delete(id) {
    const { rows } = await query(
      'DELETE FROM guarantors WHERE id = $1 RETURNING *',
      [id]
    );
    return rows[0] || null;
  },
};

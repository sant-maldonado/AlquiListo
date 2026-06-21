import { query } from '../config/db.js';

export const ProfileModel = {
  async create(data) {
    const { user_id, first_name, last_name, dni, monthly_income } = data;
    const { rows } = await query(
      `INSERT INTO profiles (user_id, first_name, last_name, dni, monthly_income)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [user_id, first_name, last_name, dni, monthly_income]
    );
    return rows[0];
  },

  async findByUserId(userId) {
    const { rows } = await query(
      `SELECT p.*, u.email, u.role
       FROM profiles p
       JOIN users u ON u.id = p.user_id
       WHERE p.user_id = $1`,
      [userId]
    );
    return rows[0] || null;
  },

  async findById(id) {
    const { rows } = await query(
      `SELECT p.*, u.email, u.role, u.created_at as user_since
       FROM profiles p
       JOIN users u ON u.id = p.user_id
       WHERE p.id = $1`,
      [id]
    );
    return rows[0] || null;
  },

  async findPublicById(id) {
    const { rows } = await query(
      `SELECT p.id, p.first_name, p.last_name, p.verification_status, p.trust_score, p.updated_at
       FROM profiles p
       WHERE p.id = $1`,
      [id]
    );
    return rows[0] || null;
  },

  async update(id, data) {
    const fields = [];
    const values = [];
    let idx = 1;

    for (const key of ['first_name', 'last_name', 'dni', 'monthly_income', 'verification_status']) {
      if (data[key] !== undefined) {
        fields.push(`${key} = $${idx++}`);
        values.push(data[key]);
      }
    }

    if (fields.length === 0) return null;

    fields.push('updated_at = NOW()');
    values.push(id);

    const { rows } = await query(
      `UPDATE profiles SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );
    return rows[0] || null;
  },

  async findByIdWithEmail(id) {
    const { rows } = await query(
      `SELECT p.*, u.email, u.role
       FROM profiles p
       JOIN users u ON u.id = p.user_id
       WHERE p.id = $1`,
      [id]
    );
    return rows[0] || null;
  },

  async updateTrustScore(id, score, status) {
    const { rows } = await query(
      `UPDATE profiles SET trust_score = $1, verification_status = $2, updated_at = NOW() WHERE id = $3 RETURNING *`,
      [score, status, id]
    );
    return rows[0] || null;
  },
};

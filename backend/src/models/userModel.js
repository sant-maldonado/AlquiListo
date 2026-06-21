import { query } from '../config/db.js';

export const UserModel = {
  async findById(id) {
    const { rows } = await query('SELECT * FROM users WHERE id = $1', [id]);
    return rows[0] || null;
  },

  async findByEmail(email) {
    const { rows } = await query('SELECT * FROM users WHERE email = $1', [email]);
    return rows[0] || null;
  },

  async create(data) {
    const { email, password_hash, role } = data;
    const { rows } = await query(
      `INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING *`,
      [email, password_hash, role || 'inquilino']
    );
    return rows[0];
  },
};

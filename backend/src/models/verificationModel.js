import { query } from '../config/db.js';

export const VerificationModel = {
  async create({ documentId }) {
    const { rows } = await query(
      `INSERT INTO verifications (document_id) VALUES ($1) RETURNING *`,
      [documentId]
    );
    return rows[0];
  },

  async review(id, { result, notes, reviewedBy }) {
    const { rows } = await query(
      `UPDATE verifications SET result = $1, notes = $2, reviewed_by = $3, reviewed_at = NOW() WHERE id = $4 RETURNING *`,
      [result, notes, reviewedBy, id]
    );
    return rows[0] || null;
  },

  async findById(id) {
    const { rows } = await query(
      `SELECT v.*, d.type as document_type, d.file_url, d.ai_status, d.ai_confidence, d.profile_id
       FROM verifications v
       JOIN documents d ON d.id = v.document_id
       WHERE v.id = $1`,
      [id]
    );
    return rows[0] || null;
  },

  async findByDocumentId(documentId) {
    const { rows } = await query(
      'SELECT * FROM verifications WHERE document_id = $1 ORDER BY reviewed_at DESC',
      [documentId]
    );
    return rows;
  },

  async findAllPending() {
    const { rows } = await query(
      `SELECT v.*, d.type as document_type, d.file_url, d.ai_status, d.ai_confidence
       FROM verifications v
       JOIN documents d ON d.id = v.document_id
       WHERE v.result IS NULL
       ORDER BY v.reviewed_at ASC`
    );
    return rows;
  },

  async findAll() {
    const { rows } = await query(
      `SELECT v.*, d.type as document_type, d.file_url, d.ai_status, d.ai_confidence
       FROM verifications v
       JOIN documents d ON d.id = v.document_id
       ORDER BY v.reviewed_at DESC`
    );
    return rows;
  },
};

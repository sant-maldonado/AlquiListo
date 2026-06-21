import { query } from '../config/db.js';

export const VerificationModel = {
  async create({ documentId }) {
    const { rows } = await query(
      `INSERT INTO verifications (document_id) VALUES ($1) RETURNING *`,
      [documentId]
    );
    return rows[0];
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

  async findQueue() {
    const { rows } = await query(
      `SELECT
         v.*, d.type AS document_type, d.file_url, d.ai_confidence,
         d.profile_id, d.guarantor_id,
         COALESCE(pr_direct.first_name, pr_via_guarantor.first_name) AS tenant_first_name,
         COALESCE(pr_direct.last_name, pr_via_guarantor.last_name) AS tenant_last_name,
         g.full_name AS guarantor_name
       FROM verifications v
       JOIN documents d ON d.id = v.document_id
       LEFT JOIN profiles pr_direct ON pr_direct.id = d.profile_id
       LEFT JOIN guarantors g ON g.id = d.guarantor_id
       LEFT JOIN profiles pr_via_guarantor ON pr_via_guarantor.id = g.profile_id
       WHERE v.result IS NULL
       ORDER BY v.id ASC`
    );
    return rows;
  },

  async review(id, { result, notes, reviewedBy }) {
    const { rows } = await query(
      `UPDATE verifications SET result = $1, notes = $2, reviewed_by = $3, reviewed_at = NOW() WHERE id = $4 RETURNING *`,
      [result, notes, reviewedBy, id]
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

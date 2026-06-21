import { query } from '../config/db.js';

export const DocumentModel = {
  async create({ profileId, guarantorId, type, fileUrl }) {
    const result = await query(
      `INSERT INTO documents (profile_id, guarantor_id, type, file_url)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [profileId || null, guarantorId || null, type, fileUrl]
    );
    return result.rows[0];
  },

  async findById(id) {
    const result = await query(`SELECT * FROM documents WHERE id = $1`, [id]);
    return result.rows[0] || null;
  },

  async findByProfileId(profileId) {
    const result = await query(
      `SELECT * FROM documents WHERE profile_id = $1 ORDER BY uploaded_at DESC`,
      [profileId]
    );
    return result.rows;
  },

  async findByGuarantorId(guarantorId) {
    const result = await query(
      `SELECT * FROM documents WHERE guarantor_id = $1 ORDER BY uploaded_at DESC`,
      [guarantorId]
    );
    return result.rows;
  },

  async findAllForProfile(profileId) {
    const result = await query(
      `SELECT d.* FROM documents d
       WHERE d.profile_id = $1
       UNION
       SELECT d.* FROM documents d
       JOIN guarantors g ON g.id = d.guarantor_id
       WHERE g.profile_id = $1
       ORDER BY uploaded_at DESC`,
      [profileId]
    );
    return result.rows;
  },

  async updateAiStatus(id, { aiStatus, aiConfidence, aiExtractedData, aiRedFlags }) {
    const result = await query(
      `UPDATE documents
       SET ai_status = $2, ai_confidence = $3, ai_extracted_data = $4, ai_red_flags = $5
       WHERE id = $1
       RETURNING *`,
      [
        id,
        aiStatus,
        aiConfidence ?? null,
        aiExtractedData ? JSON.stringify(aiExtractedData) : null,
        aiRedFlags ? JSON.stringify(aiRedFlags) : null,
      ]
    );
    return result.rows[0] || null;
  },

  async delete(id) {
    await query(`DELETE FROM documents WHERE id = $1`, [id]);
  },

  async belongsToUser(documentId, profileId, guarantorIds = []) {
    const result = await query(`SELECT profile_id, guarantor_id FROM documents WHERE id = $1`, [documentId]);
    const doc = result.rows[0];
    if (!doc) return false;
    if (doc.profile_id === profileId) return true;
    if (doc.guarantor_id && guarantorIds.includes(doc.guarantor_id)) return true;
    return false;
  },

  async resolveOwnerProfileId(documentId) {
    const result = await query(
      `SELECT COALESCE(d.profile_id, g.profile_id) AS profile_id
       FROM documents d
       LEFT JOIN guarantors g ON g.id = d.guarantor_id
       WHERE d.id = $1`,
      [documentId]
    );
    return result.rows[0]?.profile_id || null;
  },
};

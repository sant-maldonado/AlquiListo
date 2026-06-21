import { query } from '../config/db.js';
import { ProfileModel } from '../models/profileModel.js';

const DOCUMENT_WEIGHTS = {
  dni: 15,
  recibo_sueldo: 20,
  escritura: 25,
  poliza_caucion: 30,
  contrato_anterior: 10,
  otro: 5,
};

export const ScoringService = {
  async recalculate(profileId) {
    const result = await query(
      `SELECT type, ai_status FROM documents
       WHERE profile_id = $1 OR guarantor_id IN (
         SELECT id FROM guarantors WHERE profile_id = $1
       )`,
      [profileId]
    );

    const docs = result.rows;

    if (docs.length === 0) {
      await ProfileModel.updateTrustScore(profileId, 0, 'pending');
      return { profileId, score: 0, status: 'pending' };
    }

    let score = 0;
    let hasApproved = false;
    let hasPendingOrFlagged = false;

    for (const doc of docs) {
      const weight = DOCUMENT_WEIGHTS[doc.type] || 5;

      if (doc.ai_status === 'auto_approved') {
        score += weight;
        hasApproved = true;
      } else {
        hasPendingOrFlagged = true;
      }
    }

    score = Math.min(score, 100);

    let status;
    if (hasApproved && !hasPendingOrFlagged) {
      status = 'verified';
    } else {
      status = 'in_review';
    }

    await ProfileModel.updateTrustScore(profileId, score, status);
    return { profileId, score, status };
  },
};

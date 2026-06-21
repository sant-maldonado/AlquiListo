import { DocumentModel } from '../models/documentModel.js';
import { VerificationModel } from '../models/verificationModel.js';
import { VerificationAiService } from './verificationAiService.js';
import { ScoringService } from './scoringService.js';

export const VerificationOrchestratorService = {
  async runAiCheck(documentId) {
    const document = await DocumentModel.findById(documentId);
    if (!document) return;

    try {
      await DocumentModel.updateAiStatus(documentId, { aiStatus: 'processing', aiConfidence: null });

      const aiResult = await VerificationAiService.analyzeDocument({
        type: document.type,
        fileUrl: document.file_url,
      });

      const decision = VerificationAiService.decideStatus(aiResult);

      await DocumentModel.updateAiStatus(documentId, {
        aiStatus: decision,
        aiConfidence: aiResult.confidence ?? null,
        aiExtractedData: aiResult.extracted ?? null,
        aiRedFlags: aiResult.red_flags ?? [],
      });

      if (decision === 'flagged') {
        await VerificationModel.create({ documentId });
      }

      const profileId = await DocumentModel.resolveOwnerProfileId(documentId);
      if (profileId) {
        await ScoringService.recalculate(profileId);
      }
    } catch (err) {
      console.error(`Error analizando documento ${documentId} con IA:`, err.message);
      await DocumentModel.updateAiStatus(documentId, { aiStatus: 'flagged', aiConfidence: null });
      await VerificationModel.create({ documentId });
    }
  },
};

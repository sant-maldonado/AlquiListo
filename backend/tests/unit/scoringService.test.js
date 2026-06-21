import { jest } from '@jest/globals';

const mockQuery = jest.fn();
const mockUpdateTrustScore = jest.fn();

jest.unstable_mockModule('../../src/config/db.js', () => ({
  query: mockQuery,
}));

jest.unstable_mockModule('../../src/models/profileModel.js', () => ({
  ProfileModel: {
    updateTrustScore: mockUpdateTrustScore,
  },
}));

const { ScoringService } = await import('../../src/services/scoringService.js');

describe('ScoringService.recalculate', () => {
  beforeEach(() => {
    mockQuery.mockReset();
    mockUpdateTrustScore.mockReset();
    mockUpdateTrustScore.mockImplementation((profileId, score, status) => ({
      profileId,
      score,
      status,
    }));
  });

  test('perfil sin documentos queda en pending con score 0', async () => {
    mockQuery.mockResolvedValue({ rows: [] });

    const result = await ScoringService.recalculate('profile-1');

    expect(mockUpdateTrustScore).toHaveBeenCalledWith('profile-1', 0, 'pending');
    expect(result.status).toBe('pending');
  });

  test('un documento auto_approved suma su peso y queda verified', async () => {
    mockQuery.mockResolvedValue({
      rows: [{ type: 'dni', ai_status: 'auto_approved' }],
    });

    await ScoringService.recalculate('profile-1');

    expect(mockUpdateTrustScore).toHaveBeenCalledWith('profile-1', 15, 'verified');
  });

  test('mezcla de aprobado + pendiente queda en in_review', async () => {
    mockQuery.mockResolvedValue({
      rows: [
        { type: 'dni', ai_status: 'auto_approved' },
        { type: 'recibo_sueldo', ai_status: 'flagged' },
      ],
    });

    await ScoringService.recalculate('profile-1');

    expect(mockUpdateTrustScore).toHaveBeenCalledWith('profile-1', 15, 'in_review');
  });

  test('el score nunca supera 100 aunque sumen más los pesos', async () => {
    mockQuery.mockResolvedValue({
      rows: [
        { type: 'dni', ai_status: 'auto_approved' },
        { type: 'recibo_sueldo', ai_status: 'auto_approved' },
        { type: 'escritura', ai_status: 'auto_approved' },
        { type: 'poliza_caucion', ai_status: 'auto_approved' },
        { type: 'contrato_anterior', ai_status: 'auto_approved' },
        { type: 'otro', ai_status: 'auto_approved' },
        { type: 'dni', ai_status: 'auto_approved' },
      ],
    });

    await ScoringService.recalculate('profile-1');

    const [, scoreArg] = mockUpdateTrustScore.mock.calls[0];
    expect(scoreArg).toBeLessThanOrEqual(100);
  });

  test('documentos rechazados (flagged sin aprobados) no suman score y quedan in_review', async () => {
    mockQuery.mockResolvedValue({
      rows: [{ type: 'dni', ai_status: 'flagged' }],
    });

    await ScoringService.recalculate('profile-1');

    expect(mockUpdateTrustScore).toHaveBeenCalledWith('profile-1', 0, 'in_review');
  });
});

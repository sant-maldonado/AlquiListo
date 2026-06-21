import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { VerificationService } from '../services/verificationService';
import { getErrorMessage } from '../utils/errors';
import { InlineLoader, LoadError } from '../components/LoadingStates';

const API_ORIGIN = (import.meta.env.VITE_API_URL || 'http://localhost:4000/api').replace(/\/api$/, '');

const DOC_TYPE_LABELS = {
  dni: 'DNI',
  recibo_sueldo: 'Recibo de sueldo',
  escritura: 'Escritura / título de propiedad',
  poliza_caucion: 'Póliza de seguro de caución',
  contrato_anterior: 'Contrato de alquiler anterior',
  otro: 'Otro documento',
};

export default function Admin() {
  const { logout } = useAuth();
  const toast = useToast();
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [notes, setNotes] = useState({});
  const [actingId, setActingId] = useState(null);

  const fetchQueue = useCallback(() => {
    setLoading(true);
    setLoadError(null);
    VerificationService.getQueue()
      .then(setQueue)
      .catch((err) => setLoadError(getErrorMessage(err, 'No pudimos cargar la cola de revisión.')))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  async function handleReview(verification, result) {
    setActingId(verification.id);
    try {
      await VerificationService.review(verification.id, {
        result,
        notes: notes[verification.id] || undefined,
      });
      setQueue((list) => list.filter((v) => v.id !== verification.id));
      toast.success(result === 'approved' ? 'Documento aprobado.' : 'Documento rechazado.');
    } catch (err) {
      toast.error(getErrorMessage(err, 'No pudimos guardar la revisión.'));
    } finally {
      setActingId(null);
    }
  }

  function ownerLabel(item) {
    if (item.guarantor_id) {
      return `${item.tenant_first_name || '?'} ${item.tenant_last_name || ''} (garante: ${item.guarantor_name})`;
    }
    return `${item.tenant_first_name || '?'} ${item.tenant_last_name || ''}`;
  }

  return (
    <div className="min-h-screen px-6 py-10">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between">
          <span className="font-display text-xl font-semibold text-ink">AlquiListo — Admin</span>
          <button onClick={logout} className="font-sans text-sm text-ink/60 hover:text-ink">
            Cerrar sesión
          </button>
        </div>

        <h1 className="mt-10 font-display text-2xl font-medium text-ink">
          Cola de revisión de documentos
        </h1>
        <p className="mt-1 font-sans text-sm text-ink/60">
          Recordá: la IA solo evalúa si la imagen se ve legítima. La
          verificación real de identidad la hacés acá, a ojo.
        </p>

        <div className="mt-8">
          {loading && <InlineLoader label="Cargando cola…" />}
          {loadError && <LoadError message={loadError} onRetry={fetchQueue} />}

          {!loading && !loadError && queue.length === 0 && (
            <div className="rounded-lg border border-dashed border-line bg-white p-8 text-center">
              <p className="font-sans text-sm text-ink/60">
                No hay documentos pendientes de revisión. 🎉
              </p>
            </div>
          )}

          <div className="space-y-6">
            {queue.map((item) => (
              <div key={item.id} className="rounded-lg border border-line bg-white p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-sans text-sm font-medium text-ink">
                      {DOC_TYPE_LABELS[item.document_type] || item.document_type}
                    </p>
                    <p className="mt-0.5 font-sans text-xs text-ink/50">
                      {ownerLabel(item)}
                    </p>
                    {item.ai_confidence != null && (
                      <p className="mt-0.5 font-sans text-xs text-ink/40">
                        Confianza de la IA: {Math.round(item.ai_confidence * 100)}%
                      </p>
                    )}
                  </div>
                </div>

                <a
                  href={`${API_ORIGIN}${item.file_url}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 block overflow-hidden rounded-lg border border-line"
                >
                  <img
                    src={`${API_ORIGIN}${item.file_url}`}
                    alt={DOC_TYPE_LABELS[item.document_type] || 'Documento'}
                    className="max-h-80 w-full object-contain bg-cream"
                  />
                </a>

                <textarea
                  value={notes[item.id] || ''}
                  onChange={(e) => setNotes((n) => ({ ...n, [item.id]: e.target.value }))}
                  placeholder="Notas (opcional)"
                  rows={2}
                  className="mt-3 w-full rounded-lg border border-line bg-white px-3 py-2 font-sans text-sm text-ink placeholder:text-ink/30 outline-none focus:border-forest focus:ring-2 focus:ring-forest/20"
                />

                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => handleReview(item, 'approved')}
                    disabled={actingId === item.id}
                    className="flex-1 rounded-lg bg-forest px-3 py-2 font-sans text-sm font-medium text-cream hover:bg-forest-dark disabled:opacity-50"
                  >
                    Aprobar
                  </button>
                  <button
                    onClick={() => handleReview(item, 'rejected')}
                    disabled={actingId === item.id}
                    className="flex-1 rounded-lg border border-terracotta px-3 py-2 font-sans text-sm font-medium text-terracotta-dark hover:bg-terracotta/5 disabled:opacity-50"
                  >
                    Rechazar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

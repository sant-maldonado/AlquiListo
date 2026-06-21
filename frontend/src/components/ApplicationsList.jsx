import { useState, useEffect, useCallback } from 'react';
import { ApplicationService } from '../services/applicationService';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../utils/errors';
import { InlineLoader, LoadError } from './LoadingStates';

const STATUS_CONFIG = {
  pending: { label: 'Pendiente', className: 'bg-line/60 text-ink/60' },
  accepted: { label: 'Aceptado', className: 'bg-forest/15 text-forest-dark' },
  rejected: { label: 'Rechazado', className: 'bg-terracotta/10 text-terracotta-dark/70' },
};

export default function ApplicationsList({ propertyId, onPropertyRented }) {
  const toast = useToast();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [actingId, setActingId] = useState(null);

  const fetch = useCallback(() => {
    setLoading(true);
    setLoadError(null);
    ApplicationService.listForProperty(propertyId)
      .then(setApplications)
      .catch((err) => setLoadError(getErrorMessage(err, 'No pudimos cargar los postulantes.')))
      .finally(() => setLoading(false));
  }, [propertyId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  async function handleAccept(application) {
    if (!confirm(`¿Elegir a ${application.first_name} ${application.last_name}? Se va a rechazar al resto de los postulantes automáticamente.`)) return;

    setActingId(application.id);
    try {
      await ApplicationService.accept(application.id);
      toast.success(`${application.first_name} fue aceptado. La propiedad ahora figura como alquilada.`);
      fetch();
      onPropertyRented?.();
    } catch (err) {
      toast.error(getErrorMessage(err, 'No pudimos aceptar la postulación.'));
    } finally {
      setActingId(null);
    }
  }

  async function handleReject(application) {
    setActingId(application.id);
    try {
      await ApplicationService.reject(application.id);
      setApplications((list) =>
        list.map((a) => (a.id === application.id ? { ...a, status: 'rejected' } : a))
      );
      toast.success('Postulante rechazado.');
    } catch (err) {
      toast.error(getErrorMessage(err, 'No pudimos rechazar la postulación.'));
    } finally {
      setActingId(null);
    }
  }

  if (loading) return <InlineLoader label="Cargando postulantes…" />;
  if (loadError) return <LoadError message={loadError} onRetry={fetch} />;

  if (applications.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-line bg-white p-6 text-center">
        <p className="font-sans text-sm text-ink/60">Todavía no tenés postulantes.</p>
      </div>
    );
  }

  const hasAccepted = applications.some((a) => a.status === 'accepted');

  return (
    <div className="space-y-3">
      {applications.map((app) => {
        const s = STATUS_CONFIG[app.status];
        const isPending = app.status === 'pending';

        return (
          <div key={app.id} className="rounded-lg border border-line bg-white p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-sans text-sm font-medium text-ink">
                  {app.first_name} {app.last_name}
                </p>
                <p className="mt-0.5 font-sans text-xs text-ink/50">
                  Score de confianza: {app.trust_score_snapshot}/100
                </p>
              </div>
              <span className={`rounded-full px-2.5 py-1 font-sans text-xs font-medium ${s.className}`}>
                {s.label}
              </span>
            </div>

            {isPending && !hasAccepted && (
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => handleAccept(app)}
                  disabled={actingId === app.id}
                  className="flex-1 rounded-lg bg-forest px-3 py-2 font-sans text-sm font-medium text-cream hover:bg-forest-dark disabled:opacity-50"
                >
                  Elegir
                </button>
                <button
                  onClick={() => handleReject(app)}
                  disabled={actingId === app.id}
                  className="flex-1 rounded-lg border border-line px-3 py-2 font-sans text-sm font-medium text-ink/60 hover:text-ink disabled:opacity-50"
                >
                  Rechazar
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

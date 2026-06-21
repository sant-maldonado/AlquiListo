import { useState, useEffect } from 'react';
import Input from './Input';
import { GuarantorService } from '../services/guarantorService';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../utils/errors';
import { InlineLoader, LoadError } from './LoadingStates';

const TYPE_LABELS = {
  propietaria: 'Garante con inmueble',
  caucion: 'Seguro de caución',
  recibo_tercero: 'Garante con recibo de sueldo',
};

const STATUS_LABELS = {
  pending: { label: 'Esperando documentos', dot: 'bg-line' },
  in_review: { label: 'En revisión', dot: 'bg-terracotta' },
  verified: { label: 'Verificado', dot: 'bg-forest' },
  rejected: { label: 'Rechazado', dot: 'bg-terracotta-dark' },
};

export default function StepGarantes({ onContinue }) {
  const toast = useToast();
  const [guarantors, setGuarantors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [lastInviteLink, setLastInviteLink] = useState(null);
  const [removingId, setRemovingId] = useState(null);

  function fetchGuarantors() {
    setLoading(true);
    setLoadError(null);
    GuarantorService.list()
      .then(setGuarantors)
      .catch((err) => setLoadError(getErrorMessage(err, 'No pudimos cargar tus garantes.')))
      .finally(() => setLoading(false));
  }

  useEffect(fetchGuarantors, []);

  async function handleCreated(newGuarantor, inviteLink) {
    setGuarantors((list) => [newGuarantor, ...list]);
    setLastInviteLink(inviteLink);
    setShowForm(false);
    toast.success('Garante agregado.');
  }

  async function handleRemove(id) {
    setRemovingId(id);
    try {
      await GuarantorService.remove(id);
      setGuarantors((list) => list.filter((g) => g.id !== id));
    } catch (err) {
      toast.error(getErrorMessage(err, 'No pudimos quitar este garante.'));
    } finally {
      setRemovingId(null);
    }
  }

  async function handleResend(id) {
    try {
      const { invite_link } = await GuarantorService.resendInvite(id);
      setLastInviteLink(invite_link);
      toast.success('Invitación reenviada.');
    } catch (err) {
      toast.error(getErrorMessage(err, 'No pudimos reenviar la invitación.'));
    }
  }

  if (loading) {
    return <InlineLoader label="Cargando garantes…" />;
  }

  if (loadError) {
    return <LoadError message={loadError} onRetry={fetchGuarantors} />;
  }

  return (
    <div className="space-y-5">
      {guarantors.length === 0 && !showForm && (
        <div className="rounded-lg border border-dashed border-line bg-white p-6 text-center">
          <p className="font-sans text-sm text-ink/60">
            Todavía no agregaste ninguna garantía. Necesitás al menos una para
            postularte a una propiedad.
          </p>
        </div>
      )}

      {guarantors.map((g) => {
        const statusInfo = STATUS_LABELS[g.status] || STATUS_LABELS.pending;
        return (
          <div key={g.id} className="flex items-center justify-between rounded-lg border border-line bg-white p-4">
            <div>
              <p className="font-sans text-sm font-medium text-ink">{g.full_name}</p>
              <p className="font-sans text-xs text-ink/50">{TYPE_LABELS[g.type]}</p>
              <div className="mt-1 flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${statusInfo.dot}`} />
                <span className="font-sans text-xs text-ink/50">{statusInfo.label}</span>
              </div>
            </div>
            <div className="flex gap-2">
              {g.status === 'pending' && (
                <button
                  onClick={() => handleResend(g.id)}
                  className="font-sans text-xs font-medium text-forest hover:underline"
                >
                  Reenviar invitación
                </button>
              )}
              <button
                onClick={() => handleRemove(g.id)}
                disabled={removingId === g.id}
                className="font-sans text-xs font-medium text-terracotta-dark hover:underline disabled:opacity-50"
              >
                {removingId === g.id ? 'Quitando…' : 'Quitar'}
              </button>
            </div>
          </div>
        );
      })}

      {lastInviteLink && (
        <div className="rounded-lg bg-forest/10 px-4 py-3">
          <p className="font-sans text-xs font-medium text-forest-dark">
            Link de invitación generado — compartiselo a tu garante:
          </p>
          <p className="mt-1 break-all font-sans text-xs text-forest-dark/80">{lastInviteLink}</p>
        </div>
      )}

      {showForm ? (
        <AddGuarantorForm onCreated={handleCreated} onCancel={() => setShowForm(false)} />
      ) : (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="w-full rounded-lg border border-dashed border-line px-4 py-3 font-sans text-sm font-medium text-ink/60 transition-colors hover:border-forest hover:text-forest"
        >
          + Agregar garantía
        </button>
      )}

      <button
        type="button"
        onClick={onContinue}
        disabled={guarantors.length === 0}
        className="w-full rounded-lg bg-forest px-4 py-3 font-sans font-medium text-cream transition-colors hover:bg-forest-dark disabled:opacity-40"
      >
        Continuar
      </button>
    </div>
  );
}

function AddGuarantorForm({ onCreated, onCancel }) {
  const [type, setType] = useState('recibo_tercero');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!fullName.trim()) {
      setError('Ingresá el nombre del garante');
      return;
    }

    setSubmitting(true);
    try {
      const { guarantor, invite_link } = await GuarantorService.create({
        type,
        full_name: fullName,
        email: email || undefined,
      });
      onCreated(guarantor, invite_link);
    } catch (err) {
      setError(getErrorMessage(err, 'No pudimos agregar el garante.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-line bg-white p-4">
      <div>
        <span className="font-sans text-sm font-medium text-ink">Tipo de garantía</span>
        <div className="mt-2 space-y-2">
          {Object.entries(TYPE_LABELS).map(([value, label]) => (
            <label key={value} className="flex items-center gap-2 font-sans text-sm text-ink">
              <input
                type="radio"
                name="guarantor-type"
                value={value}
                checked={type === value}
                onChange={() => setType(value)}
                className="accent-forest"
              />
              {label}
            </label>
          ))}
        </div>
      </div>

      <Input
        label={type === 'caucion' ? 'Nombre de la aseguradora' : 'Nombre completo del garante'}
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
      />
      <Input
        label="Email (para enviarle la invitación)"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="opcional, pero recomendado"
      />

      {error && <p className="font-sans text-xs text-terracotta-dark">{error}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-lg border border-line px-4 py-2 font-sans text-sm font-medium text-ink/60 hover:text-ink"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 rounded-lg bg-forest px-4 py-2 font-sans text-sm font-medium text-cream hover:bg-forest-dark disabled:opacity-50"
        >
          {submitting ? 'Agregando…' : 'Agregar'}
        </button>
      </div>
    </form>
  );
}

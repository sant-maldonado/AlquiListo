import { useState, useEffect } from 'react';
import DocumentUploader from './DocumentUploader';
import { GuarantorService } from '../services/guarantorService';
import { getErrorMessage } from '../utils/errors';
import { InlineLoader, LoadError } from './LoadingStates';

const DOC_TYPE_BY_GUARANTOR_TYPE = {
  propietaria: { type: 'escritura', label: 'Escritura o título de propiedad' },
  caucion: { type: 'poliza_caucion', label: 'Póliza de seguro de caución' },
  recibo_tercero: { type: 'recibo_sueldo', label: 'Recibo de sueldo del garante' },
};

export default function StepDocumentos({ onFinish }) {
  const [guarantors, setGuarantors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  function fetchGuarantors() {
    setLoading(true);
    setLoadError(null);
    GuarantorService.list()
      .then(setGuarantors)
      .catch((err) => setLoadError(getErrorMessage(err, 'No pudimos cargar tus garantes.')))
      .finally(() => setLoading(false));
  }

  useEffect(fetchGuarantors, []);

  if (loading) {
    return <InlineLoader label="Cargando…" />;
  }

  if (loadError) {
    return <LoadError message={loadError} onRetry={fetchGuarantors} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-3 font-sans text-sm font-medium text-ink">Tu documentación</p>
        <DocumentUploader label="DNI (frente)" type="dni" />
      </div>

      {guarantors.length > 0 && (
        <div>
          <p className="mb-3 font-sans text-sm font-medium text-ink">Documentación de tus garantes</p>
          <div className="space-y-3">
            {guarantors.map((g) => {
              const docConfig = DOC_TYPE_BY_GUARANTOR_TYPE[g.type];
              return (
                <DocumentUploader
                  key={g.id}
                  label={`${g.full_name} — ${docConfig.label}`}
                  type={docConfig.type}
                  guarantorToken={g.invite_token}
                />
              );
            })}
          </div>
          <p className="mt-2 font-sans text-xs text-ink/40">
            Tip: tus garantes también pueden subir sus propios documentos
            entrando con el link de invitación que les compartiste, sin
            necesitar que vos lo hagas por ellos.
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={onFinish}
        className="w-full rounded-lg bg-forest px-4 py-3 font-sans font-medium text-cream transition-colors hover:bg-forest-dark"
      >
        Listo por ahora
      </button>
    </div>
  );
}

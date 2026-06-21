import { useState, useEffect, useRef } from 'react';
import { DocumentService } from '../services/documentService';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../utils/errors';

const STATUS_CONFIG = {
  idle: { label: 'Sin subir', dot: 'bg-line' },
  uploading: { label: 'Subiendo…', dot: 'bg-forest/50 animate-pulse' },
  pending: { label: 'En cola de análisis…', dot: 'bg-forest/50 animate-pulse' },
  processing: { label: 'Analizando documento…', dot: 'bg-forest/50 animate-pulse' },
  auto_approved: { label: 'Verificado automáticamente', dot: 'bg-forest' },
  flagged: { label: 'En revisión manual', dot: 'bg-terracotta' },
  error: { label: 'Hubo un error, probá de nuevo', dot: 'bg-terracotta' },
};

export default function DocumentUploader({ label, type, guarantorToken, onUploaded, initialStatus }) {
  const toast = useToast();
  const [status, setStatus] = useState(initialStatus || 'idle');
  const [fileName, setFileName] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (initialStatus) setStatus(initialStatus);
  }, [initialStatus]);

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setStatus('uploading');

    try {
      const document = await DocumentService.upload({ file, type, guarantorToken });
      setStatus(document.ai_status || 'pending');

      DocumentService.pollUntilResolved(document.id)
        .then((resolved) => {
          setStatus(resolved.ai_status);
          onUploaded?.(resolved);
        })
        .catch((err) => {
          setStatus('error');
          toast.error(getErrorMessage(err, 'Perdimos la conexión mientras analizábamos el documento.'));
        });
    } catch (err) {
      setStatus('error');
      toast.error(getErrorMessage(err, 'No pudimos subir el archivo.'));
    }
  }

  const config = STATUS_CONFIG[status] || STATUS_CONFIG.idle;

  return (
    <div className="rounded-lg border border-line bg-white p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-sans text-sm font-medium text-ink">{label}</p>
          <div className="mt-1 flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${config.dot}`} />
            <span className="font-sans text-xs text-ink/50">
              {fileName ? `${fileName} — ${config.label}` : config.label}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={status === 'uploading' || status === 'processing'}
          className="shrink-0 rounded-lg border border-line px-3 py-2 font-sans text-sm font-medium text-ink transition-colors hover:border-forest hover:text-forest disabled:opacity-50"
        >
          {fileName ? 'Reemplazar' : 'Subir archivo'}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,application/pdf"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
}

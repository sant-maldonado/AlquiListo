import { useState } from 'react';
import { useToast } from '../context/ToastContext';
import { ApplicationService } from '../services/applicationService';
import { getErrorMessage } from '../utils/errors';

const API_ORIGIN = (import.meta.env.VITE_API_URL || 'http://localhost:4000/api').replace(/\/api$/, '');

const AMENITY_LABELS = {
  balcon: 'Balcón',
  cochera: 'Cochera',
  pileta: 'Pileta',
  parrilla: 'Parrilla',
  terraza: 'Terraza',
  lavadero: 'Lavadero',
  aire_acondicionado: 'Aire acondicionado',
  amueblado: 'Amueblado',
  seguridad_24hs: 'Seguridad 24hs',
  gimnasio: 'Gimnasio',
};

export default function PropertyDetailModal({ property, onClose }) {
  const toast = useToast();
  const [activePhoto, setActivePhoto] = useState(0);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const photos = property.photos || [];

  function prev() {
    setActivePhoto((i) => (i > 0 ? i - 1 : photos.length - 1));
  }

  function next() {
    setActivePhoto((i) => (i < photos.length - 1 ? i + 1 : 0));
  }

  async function handleApply() {
    setApplying(true);
    try {
      const app = await ApplicationService.apply(property.id);
      setApplied(true);
      toast.success('¡Te postulaste correctamente!');
    } catch (err) {
      const msg = getErrorMessage(err, 'No pudimos procesar tu postulación.');
      toast.error(msg);
    } finally {
      setApplying(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-ink/40 px-4 py-8"
      onClick={onClose}
    >
      <div
        className="max-h-full w-full max-w-lg overflow-y-auto rounded-xl bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative aspect-[4/3] bg-cream">
          {photos.length > 0 ? (
            <img
              src={`${API_ORIGIN}${photos[activePhoto].file_url}`}
              alt={property.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center font-sans text-sm text-ink/30">
              Sin fotos todavía
            </div>
          )}

          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-ink/60 font-sans text-cream hover:bg-ink/80"
          >
            ✕
          </button>

          {photos.length > 1 && (
            <>
              <button
                onClick={prev}
                aria-label="Foto anterior"
                className="absolute left-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-ink/40 font-sans text-lg text-cream hover:bg-ink/60"
              >
                ‹
              </button>
              <button
                onClick={next}
                aria-label="Foto siguiente"
                className="absolute right-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-ink/40 font-sans text-lg text-cream hover:bg-ink/60"
              >
                ›
              </button>
              <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
                {photos.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActivePhoto(i)}
                    aria-label={`Ver foto ${i + 1}`}
                    className={`h-1.5 w-1.5 rounded-full ${i === activePhoto ? 'bg-cream' : 'bg-cream/40'}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        <div className="p-6">
          <h2 className="font-display text-xl font-medium text-ink">{property.title}</h2>
          <p className="mt-1 font-sans text-sm text-ink/60">
            {property.address}{property.neighborhood ? `, ${property.neighborhood}` : ''}
          </p>

          <div className="mt-4 flex items-baseline gap-2">
            <span className="font-display text-2xl font-medium text-forest-dark">
              ${Number(property.price).toLocaleString('es-AR')}
            </span>
            {property.expenses && (
              <span className="font-sans text-sm text-ink/50">
                + ${Number(property.expenses).toLocaleString('es-AR')} expensas
              </span>
            )}
          </div>

          {property.match_reason && (
            <p className="mt-3 rounded-lg bg-forest/10 px-3 py-2 font-sans text-sm italic text-forest-dark">
              {property.match_reason}
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-3 font-sans text-sm text-ink/70">
            <span>{property.rooms} ambiente{property.rooms > 1 ? 's' : ''}</span>
            {property.square_meters && <span>· {property.square_meters} m²</span>}
            {property.age_years != null && <span>· {property.age_years === 0 ? 'A estrenar' : `${property.age_years} años`}</span>}
            {property.accepts_pets && <span>· Acepta mascotas</span>}
          </div>

          {property.amenities?.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {property.amenities.map((a) => (
                <span
                  key={a}
                  className="rounded-full bg-cream px-3 py-1 font-sans text-xs text-ink/70"
                >
                  {AMENITY_LABELS[a] || a}
                </span>
              ))}
            </div>
          )}

          {property.description && (
            <p className="mt-5 font-sans text-sm leading-relaxed text-ink/70">
              {property.description}
            </p>
          )}

          <button
            onClick={handleApply}
            disabled={applying || applied}
            className={`mt-6 w-full rounded-lg px-4 py-3 font-sans text-sm font-medium ${
              applied
                ? 'bg-forest/20 text-forest-dark'
                : 'bg-forest text-cream hover:bg-forest-dark'
            } disabled:opacity-60`}
          >
            {applying ? 'Postulando…' : applied ? '✓ Ya te postulaste' : 'Postularme con mi perfil verificado'}
          </button>
        </div>
      </div>
    </div>
  );
}

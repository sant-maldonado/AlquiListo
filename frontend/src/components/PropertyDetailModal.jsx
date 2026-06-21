import { useState } from 'react';
import ApplyButton from './ApplyButton';

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
  const [activePhoto, setActivePhoto] = useState(0);
  const photos = property.photos || [];

  const stats = [
    `${property.rooms} amb.`,
    property.square_meters ? `${property.square_meters} m²` : null,
    property.age_years != null
      ? property.age_years === 0
        ? 'A estrenar'
        : `${property.age_years} años`
      : null,
  ].filter(Boolean);

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
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-ink/60 font-sans text-cream hover:bg-ink/80"
          >
            ✕
          </button>

          {property.accepts_pets && (
            <div className="absolute left-3 top-3 rounded-full bg-forest-dark/90 px-2.5 py-1">
              <span className="font-sans text-[11px] font-medium text-cream">Acepta mascotas</span>
            </div>
          )}

          {photos.length > 1 && (
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
              {photos.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActivePhoto(i)}
                  aria-label={`Ver foto ${i + 1}`}
                  className={`h-1.5 w-1.5 rounded-full transition-colors ${
                    i === activePhoto ? 'bg-cream' : 'bg-cream/40'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="font-display text-xl font-medium leading-tight text-ink">
                {property.title}
              </h2>
              <p className="mt-1 truncate font-sans text-sm text-ink/50">
                {property.address}{property.neighborhood ? `, ${property.neighborhood}` : ''}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="font-display text-2xl font-medium leading-none text-ink">
                ${Number(property.price).toLocaleString('es-AR')}
              </p>
              {property.expenses && (
                <p className="mt-1 font-sans text-xs text-ink/40">
                  + ${Number(property.expenses).toLocaleString('es-AR')} exp.
                </p>
              )}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-x-3 gap-y-1 font-sans text-sm text-ink/60">
            {stats.map((stat, i) => (
              <span key={stat} className="flex items-center gap-3">
                {stat}
                {i < stats.length - 1 && <span className="text-line" aria-hidden="true">·</span>}
              </span>
            ))}
          </div>

          {property.amenities?.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {property.amenities.map((a) => (
                <span
                  key={a}
                  className="rounded-full border border-line px-3 py-1 font-sans text-xs text-ink/60"
                >
                  {AMENITY_LABELS[a] || a}
                </span>
              ))}
            </div>
          )}

          {property.match_reason && (
            <div className="mt-5 border-l-2 border-forest pl-3">
              <p className="font-display text-base italic leading-snug text-forest-dark">
                "{property.match_reason}"
              </p>
            </div>
          )}

          {property.description && (
            <p className="mt-5 font-sans text-sm leading-relaxed text-ink/70">
              {property.description}
            </p>
          )}

          <ApplyButton propertyId={property.id} />
        </div>
      </div>
    </div>
  );
}

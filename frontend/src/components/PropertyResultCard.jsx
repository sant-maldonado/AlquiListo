const API_ORIGIN = (import.meta.env.VITE_API_URL || 'http://localhost:4000/api').replace(/\/api$/, '');

const AMENITY_LABELS = {
  balcon: 'Balcón',
  cochera: 'Cochera',
  pileta: 'Pileta',
  parrilla: 'Parrilla',
  terraza: 'Terraza',
  lavadero: 'Lavadero',
  aire_acondicionado: 'Aire ac.',
  amueblado: 'Amueblado',
  seguridad_24hs: 'Seguridad 24hs',
  gimnasio: 'Gimnasio',
};

export default function PropertyResultCard({ property, onClick }) {
  const coverPhoto = property.photos?.[0];

  return (
    <button
      onClick={() => onClick?.(property)}
      className="group block w-full overflow-hidden rounded-xl border border-line bg-white text-left transition-shadow hover:shadow-[0_4px_24px_-8px_rgba(31,36,33,0.15)]"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-cream">
        {coverPhoto ? (
          <img
            src={`${API_ORIGIN}${coverPhoto.file_url}`}
            alt={property.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center font-sans text-sm text-ink/25">
            Sin foto todavía
          </div>
        )}

        <div className="absolute left-3 top-3 rounded-full bg-cream/95 px-3 py-1.5 shadow-[0_1px_3px_rgba(0,0,0,0.1)]">
          <span className="font-display text-base font-medium leading-none text-ink">
            ${Number(property.price).toLocaleString('es-AR')}
          </span>
        </div>

        {property.accepts_pets && (
          <div className="absolute right-3 top-3 rounded-full bg-forest-dark/90 px-2.5 py-1">
            <span className="font-sans text-[11px] font-medium text-cream">Acepta mascotas</span>
          </div>
        )}
      </div>

      <div className="p-4">
        <p className="truncate font-display text-lg font-medium leading-tight text-ink">
          {property.title}
        </p>
        <p className="mt-1 font-sans text-sm text-ink/50">
          {property.rooms} amb.{property.neighborhood ? ` · ${property.neighborhood}` : ''}
        </p>

        {property.amenities?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {property.amenities.slice(0, 3).map((a) => (
              <span
                key={a}
                className="rounded-full border border-line px-2.5 py-1 font-sans text-[11px] text-ink/60"
              >
                {AMENITY_LABELS[a] || a}
              </span>
            ))}
          </div>
        )}

        {property.match_reason && (
          <div className="mt-3 border-t border-line pt-3">
            <p className="font-display text-sm italic leading-snug text-forest-dark">
              "{property.match_reason}"
            </p>
          </div>
        )}
      </div>
    </button>
  );
}

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
      className="flex w-full gap-4 rounded-lg border border-line bg-white p-4 text-left transition-colors hover:border-forest/40"
    >
      <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-cream">
        {coverPhoto ? (
          <img
            src={`${API_ORIGIN}${coverPhoto.file_url}`}
            alt={property.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center font-sans text-xs text-ink/30">
            Sin foto
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate font-sans text-sm font-medium text-ink">{property.title}</p>
        <p className="mt-0.5 font-sans text-xs text-ink/50">
          ${Number(property.price).toLocaleString('es-AR')} · {property.rooms} amb.
          {property.neighborhood ? ` · ${property.neighborhood}` : ''}
        </p>

        {property.amenities?.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {property.amenities.slice(0, 3).map((a) => (
              <span
                key={a}
                className="rounded-full bg-cream px-2 py-0.5 font-sans text-[11px] text-ink/60"
              >
                {AMENITY_LABELS[a] || a}
              </span>
            ))}
          </div>
        )}

        {property.match_reason && (
          <p className="mt-2 font-sans text-xs italic text-forest-dark">
            {property.match_reason}
          </p>
        )}
      </div>
    </button>
  );
}

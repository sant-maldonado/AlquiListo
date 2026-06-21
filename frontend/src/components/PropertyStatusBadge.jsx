const STATUS_CONFIG = {
  draft: { label: 'Borrador', className: 'bg-line/60 text-ink/60' },
  published: { label: 'Publicada', className: 'bg-forest/15 text-forest-dark' },
  paused: { label: 'Pausada', className: 'bg-terracotta/15 text-terracotta-dark' },
  rented: { label: 'Alquilada', className: 'bg-ink/10 text-ink/60' },
};

export default function PropertyStatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
  return (
    <span className={`inline-block rounded-full px-2.5 py-1 font-sans text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}

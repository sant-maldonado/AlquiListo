const STEPS = [
  { id: 'cuenta', label: 'Creá tu cuenta' },
  { id: 'perfil', label: 'Completá tu perfil' },
  { id: 'garantes', label: 'Sumá tus garantías' },
  { id: 'busqueda', label: 'Empezá a buscar' },
];

export default function TramiteChecklist({ activeStep = 'cuenta' }) {
  const activeIndex = STEPS.findIndex((s) => s.id === activeStep);

  return (
    <div className="hidden lg:flex flex-col justify-center h-full pl-12 pr-8">
      <p className="font-sans text-xs uppercase tracking-[0.2em] text-forest mb-8">
        Tu trámite, sin vueltas
      </p>
      <ol className="space-y-6">
        {STEPS.map((step, i) => {
          const isDone = i < activeIndex;
          const isActive = i === activeIndex;
          return (
            <li key={step.id} className="flex items-start gap-4">
              <span
                className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border font-sans text-xs transition-colors ${
                  isDone
                    ? 'bg-forest border-forest text-cream'
                    : isActive
                    ? 'border-forest text-forest'
                    : 'border-line text-ink/30'
                }`}
              >
                {isDone ? '✓' : i + 1}
              </span>
              <span
                className={`font-sans text-base leading-6 transition-colors ${
                  isActive ? 'text-ink font-medium' : isDone ? 'text-ink/70' : 'text-ink/30'
                }`}
              >
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>
      <div className="mt-12 border-t border-line pt-6">
        <p className="font-display italic text-lg text-ink/70 leading-snug">
          "Llegá con todo listo. El resto es esperar la llave."
        </p>
      </div>
    </div>
  );
}

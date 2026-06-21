export default function Input({ label, error, ...props }) {
  return (
    <label className="block">
      <span className="font-sans text-sm font-medium text-ink">{label}</span>
      <input
        {...props}
        className={`mt-1.5 w-full rounded-lg border bg-white px-4 py-2.5 font-sans text-ink placeholder:text-ink/30 outline-none transition-colors focus:border-forest focus:ring-2 focus:ring-forest/20 ${
          error ? 'border-terracotta' : 'border-line'
        }`}
      />
      {error && <span className="mt-1 block font-sans text-xs text-terracotta-dark">{error}</span>}
    </label>
  );
}

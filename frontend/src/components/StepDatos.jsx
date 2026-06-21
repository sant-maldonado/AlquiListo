import { useState } from 'react';
import Input from './Input';
import { getErrorMessage } from '../utils/errors';

export default function StepDatos({ initialData, onSaved, profileService }) {
  const [form, setForm] = useState({
    first_name: initialData?.first_name || '',
    last_name: initialData?.last_name || '',
    dni: initialData?.dni || '',
    monthly_income: initialData?.monthly_income || '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function validate() {
    const next = {};
    if (!form.first_name.trim()) next.first_name = 'Requerido';
    if (!form.last_name.trim()) next.last_name = 'Requerido';
    if (!/^\d{7,8}$/.test(form.dni)) next.dni = 'DNI inválido (solo números)';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload = { ...form, monthly_income: form.monthly_income ? Number(form.monthly_income) : null };
      const profile = initialData
        ? await profileService.updateMyProfile(payload)
        : await profileService.createMyProfile(payload);
      onSaved(profile);
    } catch (err) {
      setServerError(getErrorMessage(err, 'No pudimos guardar tus datos. Probá de nuevo.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Nombre"
          value={form.first_name}
          onChange={(e) => update('first_name', e.target.value)}
          error={errors.first_name}
        />
        <Input
          label="Apellido"
          value={form.last_name}
          onChange={(e) => update('last_name', e.target.value)}
          error={errors.last_name}
        />
      </div>

      <Input
        label="DNI"
        value={form.dni}
        onChange={(e) => update('dni', e.target.value.replace(/\D/g, ''))}
        error={errors.dni}
        placeholder="Sin puntos, solo números"
        inputMode="numeric"
      />

      <Input
        label="Ingreso mensual (opcional)"
        value={form.monthly_income}
        onChange={(e) => update('monthly_income', e.target.value.replace(/\D/g, ''))}
        placeholder="En pesos, sin puntos"
        inputMode="numeric"
      />

      {serverError && (
        <p className="rounded-lg bg-terracotta/10 px-4 py-3 font-sans text-sm text-terracotta-dark">
          {serverError}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-forest px-4 py-3 font-sans font-medium text-cream transition-colors hover:bg-forest-dark disabled:opacity-50"
      >
        {submitting ? 'Guardando…' : 'Continuar'}
      </button>
    </form>
  );
}

import { useState } from 'react';
import Input from './Input';
import Textarea from './Textarea';
import { PropertyService } from '../services/propertyService';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../utils/errors';

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

export default function PropertyForm({ initialData, onSaved, onCancel }) {
  const toast = useToast();
  const isEditing = Boolean(initialData?.id);

  const [form, setForm] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    price: initialData?.price || '',
    expenses: initialData?.expenses || '',
    rooms: initialData?.rooms || '',
    square_meters: initialData?.square_meters || '',
    age_years: initialData?.age_years || '',
    address: initialData?.address || '',
    neighborhood: initialData?.neighborhood || '',
    accepts_pets: initialData?.accepts_pets || false,
  });
  const [amenities, setAmenities] = useState(initialData?.amenities || []);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function toggleAmenity(amenity) {
    setAmenities((list) =>
      list.includes(amenity) ? list.filter((a) => a !== amenity) : [...list, amenity]
    );
  }

  function validate() {
    const next = {};
    if (!form.title.trim()) next.title = 'Requerido';
    if (!form.price || Number(form.price) <= 0) next.price = 'Ingresá un precio válido';
    if (!form.rooms || Number(form.rooms) <= 0) next.rooms = 'Ingresá la cantidad de ambientes';
    if (!form.address.trim()) next.address = 'Requerido';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        expenses: form.expenses ? Number(form.expenses) : null,
        rooms: Number(form.rooms),
        square_meters: form.square_meters ? Number(form.square_meters) : null,
        age_years: form.age_years ? Number(form.age_years) : null,
        amenities,
      };

      const property = isEditing
        ? await PropertyService.update(initialData.id, payload)
        : await PropertyService.create(payload);

      toast.success(isEditing ? 'Propiedad actualizada.' : 'Propiedad creada como borrador.');
      onSaved(property);
    } catch (err) {
      toast.error(getErrorMessage(err, 'No pudimos guardar la propiedad.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Input
        label="Título del aviso"
        value={form.title}
        onChange={(e) => update('title', e.target.value)}
        error={errors.title}
        placeholder="Ej: Depto 2 ambientes con balcón en Centro"
      />

      <Textarea
        label="Descripción (opcional)"
        rows={4}
        value={form.description}
        onChange={(e) => update('description', e.target.value)}
        placeholder="Contá lo que lo hace especial: luz, distribución, cercanía..."
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Precio mensual"
          value={form.price}
          onChange={(e) => update('price', e.target.value.replace(/\D/g, ''))}
          error={errors.price}
          inputMode="numeric"
          placeholder="En pesos"
        />
        <Input
          label="Expensas (opcional)"
          value={form.expenses}
          onChange={(e) => update('expenses', e.target.value.replace(/\D/g, ''))}
          inputMode="numeric"
          placeholder="En pesos"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Input
          label="Ambientes"
          value={form.rooms}
          onChange={(e) => update('rooms', e.target.value.replace(/\D/g, ''))}
          error={errors.rooms}
          inputMode="numeric"
        />
        <Input
          label="m² (opcional)"
          value={form.square_meters}
          onChange={(e) => update('square_meters', e.target.value.replace(/\D/g, ''))}
          inputMode="numeric"
        />
        <Input
          label="Antigüedad (opcional)"
          value={form.age_years}
          onChange={(e) => update('age_years', e.target.value.replace(/\D/g, ''))}
          inputMode="numeric"
          placeholder="Años"
        />
      </div>

      <Input
        label="Dirección"
        value={form.address}
        onChange={(e) => update('address', e.target.value)}
        error={errors.address}
        placeholder="Calle y altura"
      />

      <Input
        label="Barrio (opcional)"
        value={form.neighborhood}
        onChange={(e) => update('neighborhood', e.target.value)}
        placeholder="Ej: Pichincha, Centro, Echesortu..."
      />

      <label className="flex items-center gap-2 font-sans text-sm text-ink">
        <input
          type="checkbox"
          checked={form.accepts_pets}
          onChange={(e) => update('accepts_pets', e.target.checked)}
          className="h-4 w-4 accent-forest"
        />
        Acepta mascotas
      </label>

      <div>
        <span className="font-sans text-sm font-medium text-ink">Comodidades</span>
        <div className="mt-2 flex flex-wrap gap-2">
          {Object.entries(AMENITY_LABELS).map(([value, label]) => {
            const active = amenities.includes(value);
            return (
              <button
                key={value}
                type="button"
                onClick={() => toggleAmenity(value)}
                className={`rounded-full border px-3 py-1.5 font-sans text-sm transition-colors ${
                  active
                    ? 'border-forest bg-forest/10 text-forest-dark'
                    : 'border-line text-ink/60 hover:border-ink/30'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-lg border border-line px-4 py-3 font-sans text-sm font-medium text-ink/60 hover:text-ink"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 rounded-lg bg-forest px-4 py-3 font-sans text-sm font-medium text-cream transition-colors hover:bg-forest-dark disabled:opacity-50"
        >
          {submitting ? 'Guardando…' : isEditing ? 'Guardar cambios' : 'Crear propiedad'}
        </button>
      </div>
    </form>
  );
}

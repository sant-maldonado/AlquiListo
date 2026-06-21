import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { PropertyService } from '../services/propertyService';
import { getErrorMessage } from '../utils/errors';
import { InlineLoader, LoadError } from '../components/LoadingStates';
import PropertyStatusBadge from '../components/PropertyStatusBadge';
import PropertyForm from '../components/PropertyForm';
import PropertyPhotosManager from '../components/PropertyPhotosManager';
import ApplicationsList from '../components/ApplicationsList';

const STATUS_ACTIONS = {
  draft: [{ to: 'published', label: 'Publicar' }],
  published: [{ to: 'paused', label: 'Pausar' }, { to: 'rented', label: 'Marcar alquilada' }],
  paused: [{ to: 'published', label: 'Reactivar' }],
  rented: [{ to: 'published', label: 'Volver a publicar' }],
};

export default function MisPropiedades() {
  const { user, logout } = useAuth();
  const toast = useToast();

  const [view, setView] = useState('list');
  const [properties, setProperties] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const fetchProperties = useCallback(() => {
    setLoading(true);
    setLoadError(null);
    PropertyService.listMine()
      .then(setProperties)
      .catch((err) => setLoadError(getErrorMessage(err, 'No pudimos cargar tus propiedades.')))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  function handleSaved(property) {
    setProperties((list) => {
      const exists = list.some((p) => p.id === property.id);
      return exists ? list.map((p) => (p.id === property.id ? property : p)) : [property, ...list];
    });
    setSelected(property);
    setView('detail');
  }

  async function handleStatusChange(property, newStatus) {
    try {
      const updated = await PropertyService.updateStatus(property.id, newStatus);
      setProperties((list) => list.map((p) => (p.id === updated.id ? { ...p, status: updated.status } : p)));
      if (selected?.id === updated.id) setSelected((s) => ({ ...s, status: updated.status }));
      toast.success('Estado actualizado.');
    } catch (err) {
      toast.error(getErrorMessage(err, 'No pudimos cambiar el estado.'));
    }
  }

  async function handleDelete(property) {
    if (!confirm(`¿Eliminar "${property.title}"? Esta acción no se puede deshacer.`)) return;
    try {
      await PropertyService.remove(property.id);
      setProperties((list) => list.filter((p) => p.id !== property.id));
      if (selected?.id === property.id) setView('list');
      toast.success('Propiedad eliminada.');
    } catch (err) {
      toast.error(getErrorMessage(err, 'No pudimos eliminar la propiedad.'));
    }
  }

  async function openDetail(property) {
    setSelected(property);
    setView('detail');
    try {
      const full = await PropertyService.getOne(property.id);
      setSelected(full);
    } catch {
    }
  }

  return (
    <div className="min-h-screen px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between">
          <span className="font-display text-xl font-semibold text-ink">AlquiListo</span>
          <button onClick={logout} className="font-sans text-sm text-ink/60 hover:text-ink">
            Cerrar sesión
          </button>
        </div>

        {view === 'list' && (
          <>
            <div className="mt-10 flex items-center justify-between">
              <div>
                <h1 className="font-display text-2xl font-medium text-ink">Tus propiedades</h1>
                <p className="mt-1 font-sans text-sm text-ink/60">
                  Publicá, pausá o editá tus avisos.
                </p>
              </div>
              <div className="flex gap-2">
                <Link
                  to="/postulaciones-recibidas"
                  className="rounded-lg border border-line px-4 py-2.5 font-sans text-sm font-medium text-ink hover:border-forest hover:text-forest"
                >
                  Postulaciones
                </Link>
                <button
                  onClick={() => setView('new')}
                  className="rounded-lg bg-forest px-4 py-2.5 font-sans text-sm font-medium text-cream hover:bg-forest-dark"
                >
                  + Nueva propiedad
                </button>
              </div>
            </div>

            <div className="mt-8">
              {loading && <InlineLoader label="Cargando tus propiedades…" />}
              {loadError && <LoadError message={loadError} onRetry={fetchProperties} />}

              {!loading && !loadError && properties.length === 0 && (
                <div className="rounded-lg border border-dashed border-line bg-white p-8 text-center">
                  <p className="font-sans text-sm text-ink/60">
                    Todavía no publicaste ninguna propiedad.
                  </p>
                </div>
              )}

              <div className="space-y-3">
                {properties.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => openDetail(p)}
                    className="flex w-full items-center justify-between rounded-lg border border-line bg-white p-4 text-left transition-colors hover:border-forest/40"
                  >
                    <div>
                      <p className="font-sans text-sm font-medium text-ink">{p.title}</p>
                      <p className="mt-0.5 font-sans text-xs text-ink/50">
                        ${Number(p.price).toLocaleString('es-AR')} · {p.rooms} amb. · {p.address}
                      </p>
                    </div>
                    <PropertyStatusBadge status={p.status} />
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {view === 'new' && (
          <div className="mt-10">
            <h1 className="font-display text-2xl font-medium text-ink">Nueva propiedad</h1>
            <p className="mt-1 font-sans text-sm text-ink/60">
              Se crea como borrador. La publicás cuando esté lista.
            </p>
            <div className="mt-8">
              <PropertyForm onSaved={handleSaved} onCancel={() => setView('list')} />
            </div>
          </div>
        )}

        {view === 'edit' && selected && (
          <div className="mt-10">
            <h1 className="font-display text-2xl font-medium text-ink">Editar propiedad</h1>
            <div className="mt-8">
              <PropertyForm
                initialData={selected}
                onSaved={handleSaved}
                onCancel={() => openDetail(selected)}
              />
            </div>
          </div>
        )}

        {view === 'detail' && selected && (
          <div className="mt-10">
            <button
              onClick={() => setView('list')}
              className="font-sans text-sm text-ink/50 hover:text-ink"
            >
              ← Volver
            </button>

            <div className="mt-4 flex items-start justify-between">
              <div>
                <h1 className="font-display text-2xl font-medium text-ink">{selected.title}</h1>
                <p className="mt-1 font-sans text-sm text-ink/60">{selected.address}</p>
              </div>
              <PropertyStatusBadge status={selected.status} />
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {(STATUS_ACTIONS[selected.status] || []).map((action) => (
                <button
                  key={action.to}
                  onClick={() => handleStatusChange(selected, action.to)}
                  className="rounded-lg border border-line px-3 py-2 font-sans text-sm font-medium text-ink hover:border-forest hover:text-forest"
                >
                  {action.label}
                </button>
              ))}
              <button
                onClick={() => setView('edit')}
                className="rounded-lg border border-line px-3 py-2 font-sans text-sm font-medium text-ink hover:border-forest hover:text-forest"
              >
                Editar datos
              </button>
              <button
                onClick={() => handleDelete(selected)}
                className="rounded-lg border border-line px-3 py-2 font-sans text-sm font-medium text-terracotta-dark hover:border-terracotta"
              >
                Eliminar
              </button>
            </div>

            <div className="mt-8">
              <p className="mb-3 font-sans text-sm font-medium text-ink">Fotos</p>
              <PropertyPhotosManager
                propertyId={selected.id}
                initialPhotos={selected.photos || []}
                onPhotosChange={(photos) => setSelected((s) => ({ ...s, photos }))}
              />
            </div>

            {selected.description && (
              <p className="mt-8 font-sans text-sm leading-relaxed text-ink/70">{selected.description}</p>
            )}

            {(selected.status === 'published' || selected.status === 'rented') && (
              <div className="mt-10">
                <p className="mb-3 font-sans text-sm font-medium text-ink">Postulantes</p>
                <ApplicationsList
                  propertyId={selected.id}
                  onPropertyRented={() => setSelected((s) => ({ ...s, status: 'rented' }))}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

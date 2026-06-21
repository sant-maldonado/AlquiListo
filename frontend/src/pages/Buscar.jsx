import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SearchService } from '../services/searchService';
import { getErrorMessage } from '../utils/errors';
import Spinner from '../components/Spinner';
import PropertyResultCard from '../components/PropertyResultCard';
import PropertyDetailModal from '../components/PropertyDetailModal';

const EXAMPLES = [
  'Depto de 2 ambientes cerca del centro, hasta 300mil',
  'Algo con balcón y cochera que acepte mascotas',
  'Monoambiente amueblado, lo más barato posible',
];

export default function Buscar() {
  const { user, logout } = useAuth();
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [selectedProperty, setSelectedProperty] = useState(null);

  async function handleSearch(e) {
    e?.preventDefault();
    if (query.trim().length < 3) return;

    setSearching(true);
    setError('');
    try {
      const data = await SearchService.search(query.trim());
      setResults(data);
    } catch (err) {
      setError(getErrorMessage(err, 'No pudimos procesar tu búsqueda. Probá de nuevo.'));
      setResults(null);
    } finally {
      setSearching(false);
    }
  }

  function handleExampleClick(example) {
    setQuery(example);
  }

  return (
    <div className="min-h-screen px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between">
          <span className="font-display text-xl font-semibold text-ink">AlquiListo</span>
          <div className="flex items-center gap-4 font-sans text-sm">
            <Link to="/mis-postulaciones" className="text-ink/60 hover:text-ink">Mis postulaciones</Link>
            <Link to="/perfil" className="text-ink/60 hover:text-ink">Mi perfil</Link>
            <button onClick={logout} className="text-ink/60 hover:text-ink">
              Cerrar sesión
            </button>
          </div>
        </div>

        <h1 className="mt-10 font-display text-3xl font-medium leading-tight text-ink">
          Contanos qué estás buscando
        </h1>
        <p className="mt-2 font-sans text-sm text-ink/60">
          Escribilo como se lo dirías a un amigo. Nosotros lo traducimos en filtros.
        </p>

        <form onSubmit={handleSearch} className="mt-6">
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ej: depto de 2 ambientes cerca del centro, hasta 300mil..."
              className="flex-1 rounded-lg border border-line bg-white px-4 py-3 font-sans text-ink placeholder:text-ink/30 outline-none transition-colors focus:border-forest focus:ring-2 focus:ring-forest/20"
            />
            <button
              type="submit"
              disabled={searching || query.trim().length < 3}
              className="rounded-lg bg-forest px-5 py-3 font-sans text-sm font-medium text-cream transition-colors hover:bg-forest-dark disabled:opacity-50"
            >
              {searching ? 'Buscando…' : 'Buscar'}
            </button>
          </div>

          {!results && !searching && (
            <div className="mt-3 flex flex-wrap gap-2">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => handleExampleClick(ex)}
                  className="rounded-full border border-line px-3 py-1.5 font-sans text-xs text-ink/60 hover:border-forest hover:text-forest"
                >
                  {ex}
                </button>
              ))}
            </div>
          )}
        </form>

        <div className="mt-8">
          {searching && (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <Spinner size="lg" />
              <p className="font-sans text-sm text-ink/50">
                Buscando entre las propiedades publicadas…
              </p>
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-terracotta/30 bg-terracotta/5 p-4 text-center">
              <p className="font-sans text-sm text-terracotta-dark">{error}</p>
            </div>
          )}

          {results && !searching && (
            <>
              {results.results.length === 0 ? (
                <div className="rounded-lg border border-dashed border-line bg-white p-8 text-center">
                  <p className="font-sans text-sm text-ink/60">
                    No encontramos propiedades que encajen con esa búsqueda
                    todavía. Probá con otros criterios.
                  </p>
                </div>
              ) : (
                <>
                  <p className="mb-4 font-sans text-xs text-ink/40">
                    {results.count} resultado{results.count !== 1 ? 's' : ''}
                  </p>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {results.results.map((property) => (
                      <PropertyResultCard
                        key={property.id}
                        property={property}
                        onClick={setSelectedProperty}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {selectedProperty && (
        <PropertyDetailModal property={selectedProperty} onClose={() => setSelectedProperty(null)} />
      )}
    </div>
  );
}

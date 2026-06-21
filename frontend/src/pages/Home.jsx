import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen px-6 py-12">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between">
          <span className="font-display text-2xl font-semibold text-ink">AlquiListo</span>
          {user ? (
            <button onClick={logout} className="font-sans text-sm text-ink/60 hover:text-ink">
              Cerrar sesión
            </button>
          ) : (
            <div className="flex gap-4 font-sans text-sm">
              <Link to="/login" className="text-ink/60 hover:text-ink">
                Iniciar sesión
              </Link>
              <Link to="/registro" className="font-medium text-forest hover:underline">
                Crear cuenta
              </Link>
            </div>
          )}
        </div>

        <h1 className="mt-24 font-display text-5xl font-medium leading-tight text-ink">
          Llegá al alquiler
          <br />
          <span className="italic text-forest">ya listo.</span>
        </h1>
        <p className="mt-6 max-w-md font-sans text-lg text-ink/60">
          Armá tu perfil verificado una sola vez y postulate con un clic. Sin
          vueltas, sin papeles perdidos.
        </p>

        {user && (
          <p className="mt-8 rounded-lg bg-forest/10 px-4 py-3 font-sans text-sm text-forest-dark">
            Hola, {user.email} — sesión iniciada como {user.role}.
          </p>
        )}
      </div>
    </div>
  );
}

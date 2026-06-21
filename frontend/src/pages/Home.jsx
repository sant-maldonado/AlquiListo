import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user, logout } = useAuth();
  const isOwner = user?.role === 'propietario';
  const dashboardPath = isOwner ? '/mis-propiedades' : '/buscar';
  const dashboardLabel = isOwner ? 'Mis propiedades' : 'Buscar';

  return (
    <div className="min-h-screen px-6 py-12">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between">
          <span className="font-display text-2xl font-semibold text-ink">AlquiListo</span>
          {user ? (
            <div className="flex items-center gap-4 font-sans text-sm">
              {!isOwner && (
                <>
                  <Link to="/perfil" className="text-ink/60 hover:text-ink">
                    Mi perfil
                  </Link>
                  <Link to="/mis-postulaciones" className="text-ink/60 hover:text-ink">
                    Mis postulaciones
                  </Link>
                </>
              )}
              <Link to={dashboardPath} className="font-medium text-forest hover:underline">
                {dashboardLabel}
              </Link>
              <button onClick={logout} className="text-ink/60 hover:text-ink">
                Cerrar sesión
              </button>
            </div>
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
          <Link
            to={dashboardPath}
            className="mt-8 inline-block rounded-lg bg-forest px-5 py-3 font-sans text-sm font-medium text-cream hover:bg-forest-dark"
          >
            Ir a {dashboardLabel.toLowerCase()} →
          </Link>
        )}
      </div>
    </div>
  );
}

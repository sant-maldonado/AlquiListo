import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ProfileService } from '../services/profileService';
import { getErrorMessage } from '../utils/errors';
import TramiteChecklist from '../components/TramiteChecklist';
import StepDatos from '../components/StepDatos';
import StepGarantes from '../components/StepGarantes';
import StepDocumentos from '../components/StepDocumentos';
import { PageLoader, LoadError } from '../components/LoadingStates';

export default function Perfil() {
  const { user, logout } = useAuth();
  const toast = useToast();
  const [step, setStep] = useState('perfil');
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const loadProfile = useCallback(() => {
    setLoading(true);
    setLoadError(null);

    ProfileService.getMyProfile()
      .then((p) => {
        setProfile(p);
        setStep('garantes');
      })
      .catch((err) => {
        if (err.response?.status !== 404) {
          setLoadError(getErrorMessage(err, 'No pudimos cargar tu perfil.'));
        }
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  function handleDatosSaved(savedProfile) {
    setProfile(savedProfile);
    setStep('garantes');
    toast.success('Tus datos quedaron guardados.');
  }

  if (loading) {
    return <PageLoader label="Cargando tu perfil…" />;
  }

  if (loadError) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <LoadError message={loadError} onRetry={loadProfile} />
        </div>
      </div>
    );
  }

  const stepLabels = {
    perfil: { title: 'Completá tus datos', subtitle: 'Esto se carga una sola vez y queda guardado en tu perfil.' },
    garantes: { title: 'Sumá tus garantías', subtitle: 'Necesitás al menos una para poder postularte.' },
    busqueda: { title: 'Subí tu documentación', subtitle: 'Cuanto más completo, más rápido te van a responder.' },
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <TramiteChecklist activeStep={step} />

      <div className="flex flex-col px-6 py-10">
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
          <div className="flex items-center justify-between">
            <span className="font-display text-xl font-semibold text-ink">AlquiListo</span>
            <button onClick={logout} className="font-sans text-sm text-ink/60 hover:text-ink">
              Cerrar sesión
            </button>
          </div>

          <div className="mt-10">
            <h1 className="font-display text-2xl font-medium text-ink">
              {stepLabels[step].title}
            </h1>
            <p className="mt-1 font-sans text-sm text-ink/60">{stepLabels[step].subtitle}</p>
          </div>

          <div className="mt-8 flex-1">
            {step === 'perfil' && (
              <StepDatos
                initialData={profile}
                profileService={ProfileService}
                onSaved={handleDatosSaved}
              />
            )}
            {step === 'garantes' && (
              <StepGarantes onContinue={() => setStep('busqueda')} />
            )}
            {step === 'busqueda' && (
              <StepDocumentos onFinish={() => setStep('busqueda')} />
            )}
          </div>

          {step === 'busqueda' && (
            <div className="mt-8 rounded-lg bg-forest/10 px-4 py-4 text-center">
              <p className="font-sans text-sm font-medium text-forest-dark">
                ¡Tu perfil está en marcha!
              </p>
              <p className="mt-1 font-sans text-xs text-forest-dark/70">
                Ya podés buscar propiedades con tu perfil verificado.
              </p>
              <Link
                to="/buscar"
                className="mt-3 inline-block rounded-lg bg-forest px-4 py-2 font-sans text-sm font-medium text-cream hover:bg-forest-dark"
              >
                Buscar ahora →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

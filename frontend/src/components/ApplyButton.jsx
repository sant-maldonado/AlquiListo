import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ApplicationService } from '../services/applicationService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../utils/errors';

export default function ApplyButton({ propertyId }) {
  const { user } = useAuth();
  const toast = useToast();
  const [status, setStatus] = useState('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleApply() {
    setStatus('applying');
    try {
      await ApplicationService.apply(propertyId);
      setStatus('applied');
      toast.success('¡Te postulaste! El propietario va a ver tu perfil.');
    } catch (err) {
      if (err.response?.status === 403) {
        setStatus('not_verified');
        setErrorMsg(getErrorMessage(err));
      } else {
        setStatus('error');
        toast.error(getErrorMessage(err, 'No pudimos procesar tu postulación.'));
      }
    }
  }

  if (!user) {
    return (
      <Link
        to="/login"
        className="mt-6 block w-full rounded-lg bg-forest px-4 py-3 text-center font-sans text-sm font-medium text-cream hover:bg-forest-dark"
      >
        Iniciá sesión para postularte
      </Link>
    );
  }

  if (status === 'applied') {
    return (
      <div className="mt-6 rounded-lg bg-forest/10 px-4 py-3 text-center">
        <p className="font-sans text-sm font-medium text-forest-dark">
          ✓ Ya te postulaste a esta propiedad
        </p>
      </div>
    );
  }

  if (status === 'not_verified') {
    return (
      <div className="mt-6 rounded-lg bg-terracotta/10 px-4 py-3 text-center">
        <p className="font-sans text-sm text-terracotta-dark">{errorMsg}</p>
        <Link
          to="/perfil"
          className="mt-2 inline-block font-sans text-sm font-medium text-terracotta-dark underline hover:no-underline"
        >
          Completar mi perfil
        </Link>
      </div>
    );
  }

  return (
    <button
      onClick={handleApply}
      disabled={status === 'applying'}
      className="mt-6 w-full rounded-lg bg-forest px-4 py-3 font-sans text-sm font-medium text-cream transition-colors hover:bg-forest-dark disabled:opacity-50"
    >
      {status === 'applying' ? 'Postulando…' : 'Postularme con mi perfil verificado'}
    </button>
  );
}

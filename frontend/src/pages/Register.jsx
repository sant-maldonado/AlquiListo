import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../utils/errors';
import Input from '../components/Input';
import TramiteChecklist from '../components/TramiteChecklist';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState('inquilino');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  function validate() {
    const next = {};
    if (!email.includes('@')) next.email = 'Ingresá un email válido';
    if (password.length < 8) next.password = 'Mínimo 8 caracteres';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;

    setSubmitting(true);
    try {
      await register({ email, password, role });
      navigate(role === 'inquilino' ? '/perfil' : '/');
    } catch (err) {
      setServerError(getErrorMessage(err, 'No pudimos crear tu cuenta. Probá de nuevo.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <TramiteChecklist activeStep="cuenta" />

      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <Link to="/" className="font-display text-2xl font-semibold text-ink">
            AlquiListo
          </Link>
          <h1 className="mt-8 font-display text-3xl font-medium text-ink">Creá tu cuenta</h1>
          <p className="mt-2 font-sans text-ink/60">
            Empezá a armar tu perfil verificado para alquilar más rápido.
          </p>

          <div className="mt-8 grid grid-cols-2 gap-2 rounded-lg border border-line bg-white p-1">
            {[
              { value: 'inquilino', label: 'Busco alquilar' },
              { value: 'propietario', label: 'Tengo una propiedad' },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setRole(opt.value)}
                className={`rounded-md px-3 py-2 font-sans text-sm font-medium transition-colors ${
                  role === opt.value ? 'bg-forest text-cream' : 'text-ink/60 hover:text-ink'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              placeholder="vos@email.com"
              autoComplete="email"
            />
            <Input
              label="Contraseña"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              placeholder="Mínimo 8 caracteres"
              autoComplete="new-password"
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
              {submitting ? 'Creando cuenta…' : 'Crear cuenta'}
            </button>
          </form>

          <p className="mt-6 text-center font-sans text-sm text-ink/60">
            ¿Ya tenés cuenta?{' '}
            <Link to="/login" className="font-medium text-forest hover:underline">
              Iniciá sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

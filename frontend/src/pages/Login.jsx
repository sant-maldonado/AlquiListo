import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../utils/errors';
import Input from '../components/Input';
import TramiteChecklist from '../components/TramiteChecklist';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setServerError('');
    setSubmitting(true);
    try {
      const user = await login({ email, password });
      navigate(user.role === 'inquilino' ? '/perfil' : '/');
    } catch (err) {
      setServerError(getErrorMessage(err, 'Email o contraseña incorrectos.'));
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
          <h1 className="mt-8 font-display text-3xl font-medium text-ink">Bienvenido de nuevo</h1>
          <p className="mt-2 font-sans text-ink/60">Iniciá sesión para seguir con tu trámite.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vos@email.com"
              autoComplete="email"
              required
            />
            <Input
              label="Contraseña"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Tu contraseña"
              autoComplete="current-password"
              required
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
              {submitting ? 'Ingresando…' : 'Iniciar sesión'}
            </button>
          </form>

          <p className="mt-6 text-center font-sans text-sm text-ink/60">
            ¿Todavía no tenés cuenta?{' '}
            <Link to="/registro" className="font-medium text-forest hover:underline">
              Creala gratis
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

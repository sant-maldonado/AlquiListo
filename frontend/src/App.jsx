import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Perfil from './pages/Perfil';
import MisPropiedades from './pages/MisPropiedades';
import Buscar from './pages/Buscar';
import MisPostulaciones from './pages/MisPostulaciones';
import PostulacionesRecibidas from './pages/PostulacionesRecibidas';
import Admin from './pages/Admin';

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/registro" element={<Register />} />
              <Route
                path="/perfil"
                element={
                  <ProtectedRoute>
                    <Perfil />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/mis-propiedades"
                element={
                  <ProtectedRoute>
                    <MisPropiedades />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/buscar"
                element={
                  <ProtectedRoute>
                    <Buscar />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/mis-postulaciones"
                element={
                  <ProtectedRoute>
                    <MisPostulaciones />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/postulaciones-recibidas"
                element={
                  <ProtectedRoute>
                    <PostulacionesRecibidas />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <Admin />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </ToastProvider>
    </ErrorBoundary>
  );
}

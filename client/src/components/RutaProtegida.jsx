import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const rutaPorRol = {
  ADMIN: '/admin',
  LOCAL: '/local',
  REPOSITOR: '/repositor',
};

export default function RutaProtegida({ children, rolRequerido }) {
  const { usuario } = useAuth();

  if (!usuario) return <Navigate to="/login" replace />;

  if (rolRequerido && usuario.rol !== rolRequerido) {
    const destino = rutaPorRol[usuario.rol] || '/login';
    return <Navigate to={destino} replace />;
  }

  return children;
}

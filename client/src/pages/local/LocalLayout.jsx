import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getImgUrl } from '../../config';

export default function LocalLayout({ children }) {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f13', fontFamily: 'sans-serif' }}>
      {/* Navbar */}
      <nav style={{
        background: '#1a1a24', borderBottom: '1px solid #2d2d3d',
        display: 'flex', alignItems: 'center', padding: '0 24px', height: 56,
      }}>
        {/* Logo + nombre local */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginRight: 32 }}>
          {usuario?.local_logo && (
            <img src={getImgUrl(usuario.local_logo)} alt="" style={{ height: 32, objectFit: 'contain' }} />
          )}
          <span style={{ fontWeight: 700, color: '#fff', fontSize: 15 }}>
            {usuario?.local_nombre || 'Mi local'}
          </span>
        </div>

        {/* Links de navegación */}
        <div style={{ display: 'flex', gap: 0, flex: 1 }}>
          {[
            { to: '/local', label: 'Inicio', end: true },
            { to: '/local/pedidos', label: 'Pedidos' },
            { to: '/local/reclamos', label: 'Reclamos' },
            { to: '/local/carteles', label: 'Carteles' },
          ].map(({ to, label, end }) => (
            <NavLink
              key={to} to={to} end={end}
              style={({ isActive }) => ({
                padding: '0 18px', height: 56, display: 'flex', alignItems: 'center',
                textDecoration: 'none', fontSize: 14, fontWeight: isActive ? 700 : 400,
                color: isActive ? '#a78bfa' : '#9090a0',
                borderBottom: isActive ? '2px solid #6c63ff' : '2px solid transparent',
              })}
            >
              {label}
            </NavLink>
          ))}
        </div>

        <button
          onClick={handleLogout}
          style={{
            background: 'none', border: '1px solid #2d2d3d', color: '#9090a0',
            borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontSize: 13,
          }}
        >
          Salir
        </button>
      </nav>

      <main style={{ padding: 24 }}>
        {children}
      </main>
    </div>
  );
}

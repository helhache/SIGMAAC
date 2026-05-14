import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const NAV = [
  { to: '/repositor',             label: 'Inicio',       icon: '⊞', end: true },
  { to: '/repositor/mis-locales', label: 'Mis locales',  icon: '📍' },
  { to: '/repositor/objetivos',   label: 'Objetivos',    icon: '🎯' },
  { to: '/repositor/activaciones',label: 'Activaciones', icon: '⚡' },
  { to: '/repositor/precios',     label: 'Precios',      icon: '💲' },
  { to: '/repositor/cambios',     label: 'Cambios',      icon: '↩' },
  { to: '/repositor/pedidos',     label: 'Pedidos',      icon: '📦' },
  { to: '/repositor/actividades', label: 'Actividades',  icon: '✅' },
  { to: '/repositor/carteles',    label: 'Carteles',     icon: '🖼' },
];

export default function RepositorLayout({ children }) {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0f0f13', fontFamily: 'sans-serif' }}>
      {/* Sidebar */}
      <nav style={{
        width: 210, background: '#0a0a10', borderRight: '1px solid #1e1e2e',
        display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0,
        height: '100vh', zIndex: 100, overflowY: 'auto',
      }}>
        {/* Perfil */}
        <div style={{ padding: '20px 16px 14px', borderBottom: '1px solid #1e1e2e' }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%', background: '#6c63ff33',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 8,
          }}>
            <span style={{ fontSize: 18, color: '#a78bfa' }}>R</span>
          </div>
          <div style={{ fontWeight: 700, color: '#fff', fontSize: 13, lineHeight: 1.3 }}>
            {usuario?.repositor_nombre} {usuario?.repositor_apellido}
          </div>
          <div style={{ fontSize: 10, color: '#6c63ff', fontWeight: 600, marginTop: 2, textTransform: 'uppercase', letterSpacing: 1 }}>
            Repositor #{usuario?.numero_vendedor}
          </div>
        </div>

        {/* Links */}
        <div style={{ flex: 1, padding: '8px 0' }}>
          {NAV.map(({ to, label, icon, end }) => (
            <NavLink
              key={to} to={to} end={end}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 18px', textDecoration: 'none',
                color: isActive ? '#fff' : '#8080a0', fontSize: 13,
                fontWeight: isActive ? 700 : 400,
                background: isActive ? '#6c63ff1a' : 'transparent',
                borderLeft: isActive ? '3px solid #6c63ff' : '3px solid transparent',
                transition: 'all 0.15s',
              })}
            >
              <span style={{ fontSize: 15, width: 18, textAlign: 'center' }}>{icon}</span>
              {label}
            </NavLink>
          ))}
        </div>

        {/* Logout */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid #1e1e2e' }}>
          <button onClick={handleLogout} style={{
            width: '100%', background: 'none', border: '1px solid #2d2d3d',
            color: '#606070', borderRadius: 6, padding: '8px 0', cursor: 'pointer',
            fontSize: 12, fontWeight: 600,
          }}>
            Cerrar sesión
          </button>
        </div>
      </nav>

      {/* Content */}
      <main style={{ marginLeft: 210, flex: 1, padding: 28, minHeight: '100vh' }}>
        {children}
      </main>
    </div>
  );
}

import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function RepositorLayout({ children }) {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f13', fontFamily: 'sans-serif' }}>
      <nav style={{
        background: '#1a1a24', borderBottom: '1px solid #2d2d3d',
        display: 'flex', alignItems: 'center', padding: '0 24px', height: 56,
      }}>
        {/* Nombre + rol */}
        <div style={{ marginRight: 32, minWidth: 0 }}>
          <div style={{ fontWeight: 700, color: '#fff', fontSize: 14, lineHeight: 1.2, whiteSpace: 'nowrap' }}>
            {usuario?.repositor_nombre} {usuario?.repositor_apellido}
          </div>
          <div style={{ fontSize: 11, color: '#a78bfa', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
            Repositor · {usuario?.numero_vendedor}
          </div>
        </div>

        {/* Links */}
        <div style={{ display: 'flex', gap: 0, flex: 1, overflowX: 'auto' }}>
          {[
            { to: '/repositor',              label: 'Mis locales',   end: true },
            { to: '/repositor/activaciones', label: 'Activaciones'          },
            { to: '/repositor/cambios',      label: 'Cambios'               },
            { to: '/repositor/pedidos',      label: 'Pedidos'               },
            { to: '/repositor/reclamos',     label: 'Reclamos'              },
          ].map(({ to, label, end }) => (
            <NavLink
              key={to} to={to} end={end}
              style={({ isActive }) => ({
                padding: '0 16px', height: 56, display: 'flex', alignItems: 'center',
                textDecoration: 'none', fontSize: 14, fontWeight: isActive ? 700 : 400,
                color: isActive ? '#a78bfa' : '#9090a0', whiteSpace: 'nowrap',
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
            borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontSize: 13, whiteSpace: 'nowrap',
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

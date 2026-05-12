import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function GerenteLayout({ children }) {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      {/* Sidebar */}
      <aside style={{
        width: 220, background: '#1a1a2e', color: '#fff',
        display: 'flex', flexDirection: 'column', padding: '24px 0'
      }}>
        <div style={{ padding: '0 20px 24px', borderBottom: '1px solid #333' }}>
          <div style={{ fontWeight: 700, fontSize: 18, color: '#e94560' }}>SIGMA</div>
          <div style={{ fontSize: 13, color: '#aaa', marginTop: 4 }}>Gerente</div>
          <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{usuario?.username}</div>
        </div>

        <nav style={{ flex: 1, padding: '16px 0' }}>
          {[
            { to: '/gerente', label: 'Inicio', end: true },
            { to: '/gerente/pedidos', label: 'Pedidos' },
            { to: '/gerente/cambios', label: 'Cambios' },
            { to: '/gerente/objetivos', label: 'Objetivos' },
            { to: '/gerente/repositores', label: 'Repositores' },
            { to: '/gerente/reclamos', label: 'Reclamos' },
          ].map(({ to, label, end }) => (
            <NavLink
              key={to} to={to} end={end}
              style={({ isActive }) => ({
                display: 'block', padding: '10px 20px', color: isActive ? '#e94560' : '#ccc',
                textDecoration: 'none', fontWeight: isActive ? 600 : 400,
                background: isActive ? 'rgba(233,69,96,0.1)' : 'transparent',
              })}
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <button
          onClick={handleLogout}
          style={{
            margin: '0 20px', padding: '10px', background: 'transparent',
            border: '1px solid #555', color: '#aaa', cursor: 'pointer', borderRadius: 6
          }}
        >
          Cerrar sesión
        </button>
      </aside>

      {/* Contenido */}
      <main style={{ flex: 1, background: '#f5f5f5', padding: 32, overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  );
}

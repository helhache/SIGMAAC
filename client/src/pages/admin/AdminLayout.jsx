import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const LINKS = [
  { to: '/admin',            label: 'Inicio',       end: true },
  { to: '/admin/activaciones', label: 'Activaciones' },
  { to: '/admin/pedidos',    label: 'Pedidos' },
  { to: '/admin/cambios',    label: 'Cambios' },
  { to: '/admin/objetivos',  label: 'Objetivos' },
  { to: '/admin/repositores', label: 'Repositores' },
  { to: '/admin/empresas',   label: 'Empresas' },
  { to: '/admin/usuarios',   label: 'Usuarios' },
  { to: '/admin/editor',     label: 'Editor' },
];

export default function AdminLayout({ children }) {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside style={{
        width: 220, background: '#1a1a24', borderRight: '1px solid #2d2d3d',
        display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh',
      }}>
        <div style={{ padding: '20px 20px 18px', borderBottom: '1px solid #2d2d3d' }}>
          <div style={{ fontWeight: 700, fontSize: 18, color: '#fff' }}>SIGMA AC</div>
          <span style={{
            display: 'inline-block', marginTop: 6,
            background: '#e53e3e', color: '#fff', fontSize: '0.65rem',
            fontWeight: 700, padding: '2px 8px', borderRadius: 4,
          }}>ADMIN</span>
          <div style={{ fontSize: 12, color: '#606070', marginTop: 6 }}>{usuario?.username}</div>
        </div>

        <nav style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
          {LINKS.map(({ to, label, end }) => (
            <NavLink
              key={to} to={to} end={end}
              style={({ isActive }) => ({
                display: 'block', padding: '9px 20px',
                color: isActive ? '#6c63ff' : '#a0a0b0',
                textDecoration: 'none', fontWeight: isActive ? 600 : 400,
                background: isActive ? '#6c63ff15' : 'transparent',
                borderLeft: isActive ? '3px solid #6c63ff' : '3px solid transparent',
                fontSize: '0.88rem', transition: 'all 0.15s',
              })}
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <button
          onClick={handleLogout}
          style={{
            margin: '12px 16px', padding: '9px', background: 'transparent',
            border: '1px solid #2d2d3d', color: '#606070', cursor: 'pointer',
            borderRadius: 6, fontSize: '0.85rem',
          }}
        >
          Salir
        </button>
      </aside>

      <main style={{ flex: 1, padding: '1.5rem 2rem', overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  );
}

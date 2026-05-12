import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);
    try {
      const usuario = await login(form.username, form.password);
      if (usuario.rol === 'ADMIN') navigate('/admin');
      else if (usuario.rol === 'REPOSITOR') navigate('/repositor');
      else navigate('/local');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al iniciar sesión');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0f0f13',
    }}>
      <div style={{
        background: '#1a1a24',
        border: '1px solid #2d2d3d',
        borderRadius: 16,
        padding: '2.5rem',
        width: '100%',
        maxWidth: 400,
      }}>
        {/* Logo Coca-Cola */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <img
            src="/coca_cola_logo.png"
            alt="Coca-Cola"
            style={{ height: 60, objectFit: 'contain' }}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <h1 style={{ color: '#fff', fontSize: '1.3rem', fontWeight: 700, marginTop: '1rem' }}>
            SIGMA AC
          </h1>
          <p style={{ color: '#606070', fontSize: '0.85rem', marginTop: '0.3rem' }}>
            Iniciá sesión para continuar
          </p>
        </div>

        {error && <div className="msg-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Usuario</label>
            <input
              className="form-control"
              type="text"
              value={form.username}
              onChange={(e) => setForm(p => ({ ...p, username: e.target.value }))}
              placeholder="admin.coca.repo"
              autoComplete="username"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Contraseña</label>
            <input
              className="form-control"
              type="password"
              value={form.password}
              onChange={(e) => setForm(p => ({ ...p, password: e.target.value }))}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>
          <button
            type="submit"
            disabled={cargando}
            style={{
              width: '100%',
              background: '#e53e3e',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '0.85rem',
              fontSize: '1rem',
              fontWeight: 700,
              cursor: cargando ? 'not-allowed' : 'pointer',
              opacity: cargando ? 0.7 : 1,
              marginTop: '0.5rem',
            }}
          >
            {cargando ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  );
}

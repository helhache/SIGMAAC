import { useEffect, useState } from 'react';
import API_URL from '../../config';

export default function GerenteRepositores() {
  const [repositores, setRepositores] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function cargar() {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/api/repositores`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setRepositores(data);
      } catch {
        setError('No se pudieron cargar los repositores');
      } finally {
        setCargando(false);
      }
    }
    cargar();
  }, []);

  return (
    <div className="gestion-container">
      <div className="gestion-header">
        <div>
          <h2 className="gestion-titulo">Repositores</h2>
          <p style={{ color: '#9090a0', fontSize: '0.88rem', marginTop: 2 }}>Equipo de campo y sus locales asignados</p>
        </div>
      </div>

      {error && <div className="msg-error">{error}</div>}

      {cargando ? (
        <p style={{ color: '#606070' }}>Cargando...</p>
      ) : repositores.length === 0 ? (
        <p className="msg-vacio">No hay repositores registrados.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {repositores.map(r => (
            <div key={r.id} style={{ background: '#1a1a24', border: '1px solid #2d2d3d', borderRadius: 10, padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15, color: '#fff' }}>
                    {r.nombre} {r.apellido}
                  </div>
                  <div style={{ fontSize: 12, color: '#606070' }}>@{r.username}</div>
                </div>
                <span style={{ fontSize: 11, color: '#9090a0', background: '#2d2d3d', padding: '2px 8px', borderRadius: 8 }}>
                  Nro {r.numero_vendedor}
                </span>
              </div>

              <div style={{ fontSize: 13, color: '#9090a0', marginTop: 10 }}>
                <strong style={{ color: '#a0a0b0' }}>Locales asignados:</strong>
                <div style={{ marginTop: 4, color: '#606070' }}>
                  {r.locales_asignados || <span style={{ color: '#3d3d4d' }}>Sin locales asignados</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

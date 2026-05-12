import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import API_URL from '../../config';

export default function RepositorActivaciones() {
  const { usuario } = useAuth();
  const locales = usuario?.locales || [];

  const [localSeleccionado, setLocalSeleccionado] = useState(locales[0]?.id || '');
  const [activaciones, setActivaciones] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (localSeleccionado) cargar(localSeleccionado);
  }, [localSeleccionado]);

  async function cargar(localId) {
    setCargando(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/asignaciones?local_id=${localId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setActivaciones(data);
    } catch {
      setError('No se pudieron cargar las activaciones');
    } finally {
      setCargando(false);
    }
  }

  const formatFecha = (f) => f ? new Date(f).toLocaleDateString('es-AR') : '—';
  const formatPrecio = (p) => p != null ? `$${Number(p).toLocaleString('es-AR')}` : '—';

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ margin: '0 0 4px', color: '#fff' }}>Activaciones vigentes</h2>
          <p style={{ color: '#9090a0', margin: 0, fontSize: 13 }}>Precios y promociones por local</p>
        </div>

        {locales.length > 1 && (
          <select
            value={localSeleccionado}
            onChange={e => setLocalSeleccionado(e.target.value)}
            style={{
              padding: '7px 12px', background: '#1a1a24', border: '1px solid #2d2d3d',
              borderRadius: 8, color: '#fff', fontSize: 14, cursor: 'pointer',
            }}
          >
            {locales.map(l => <option key={l.id} value={l.id}>{l.nombre}</option>)}
          </select>
        )}
      </div>

      {locales.length === 0 && (
        <p style={{ color: '#9090a0' }}>No tenés locales asignados.</p>
      )}

      {error && <p style={{ color: '#dc2626', marginBottom: 16 }}>{error}</p>}

      {cargando ? (
        <p style={{ color: '#9090a0' }}>Cargando...</p>
      ) : activaciones.length === 0 ? (
        <p style={{ color: '#9090a0' }}>No hay activaciones vigentes para este local.</p>
      ) : (
        <div style={{ background: '#1a1a24', border: '1px solid #2d2d3d', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #2d2d3d' }}>
                  {['Descripción', 'Dinámica', 'P. Sugerido', 'P. Oferta', 'Vigencia'].map(h => (
                    <th key={h} style={{
                      padding: '10px 14px', textAlign: 'left', color: '#9090a0',
                      fontSize: 11, fontWeight: 600, textTransform: 'uppercase', whiteSpace: 'nowrap',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activaciones.map(a => (
                  <tr key={a.id} style={{ borderBottom: '1px solid #1e1e28' }}>
                    <td style={{ padding: '10px 14px', color: '#fff', fontWeight: 600 }}>{a.descripcion}</td>
                    <td style={{ padding: '10px 14px' }}>
                      {a.dinamica && (
                        <span style={{
                          background: '#6c63ff20', color: '#a78bfa',
                          padding: '2px 8px', borderRadius: 4, fontWeight: 700, fontSize: 12,
                        }}>
                          {a.dinamica}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '10px 14px', color: '#fbbf24', fontWeight: 700 }}>
                      {formatPrecio(a.precio_sugerido)}
                    </td>
                    <td style={{ padding: '10px 14px', color: '#38a169', fontWeight: 700 }}>
                      {formatPrecio(a.precio_personalizado ?? a.precio_oferta)}
                    </td>
                    <td style={{ padding: '10px 14px', color: '#9090a0', whiteSpace: 'nowrap' }}>
                      {formatFecha(a.desde)} — {formatFecha(a.hasta)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

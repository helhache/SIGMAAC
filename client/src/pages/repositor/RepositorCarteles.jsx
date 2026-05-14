import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import API_URL from '../../config';
import { useEffect } from 'react';

export default function RepositorCarteles() {
  const { usuario } = useAuth();
  const locales = usuario?.locales || [];
  const [localSel, setLocalSel] = useState(locales[0]?.id || '');
  const [activaciones, setActivaciones] = useState([]);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (localSel) cargar(localSel);
  }, [localSel]);

  async function cargar(localId) {
    setCargando(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/activaciones?local_id=${localId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setActivaciones(Array.isArray(data) ? data : []);
    } catch { /* silencioso */ }
    finally { setCargando(false); }
  }

  const formatFecha = f => f ? new Date(f).toLocaleDateString('es-AR') : '—';
  const formatPrecio = p => p != null ? `$${Number(p).toLocaleString('es-AR')}` : '—';

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ margin: '0 0 4px', color: '#fff' }}>Carteles</h2>
          <p style={{ color: '#9090a0', margin: 0, fontSize: 13 }}>Activaciones y carteles vigentes por local</p>
        </div>
        {locales.length > 1 && (
          <select value={localSel} onChange={e => setLocalSel(e.target.value)} style={{
            padding: '8px 14px', background: '#1a1a24', border: '1px solid #2d2d3d',
            borderRadius: 8, color: '#fff', fontSize: 13, cursor: 'pointer',
          }}>
            {locales.map(l => <option key={l.id} value={l.id}>{l.nombre}</option>)}
          </select>
        )}
      </div>

      {locales.length === 0 && (
        <p style={{ color: '#9090a0' }}>No tenés locales asignados.</p>
      )}

      {cargando ? (
        <p style={{ color: '#9090a0' }}>Cargando...</p>
      ) : activaciones.length === 0 ? (
        <div style={{ background: '#1a1a24', border: '1px solid #2d2d3d', borderRadius: 10, padding: 32, textAlign: 'center', color: '#9090a0' }}>
          No hay activaciones vigentes para este local.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
          {activaciones.map(a => (
            <div key={a.id} style={{ background: '#1a1a24', border: '1px solid #2d2d3d', borderRadius: 10, overflow: 'hidden' }}>
              {a.imagen && (
                <div style={{ height: 140, overflow: 'hidden', background: '#0f0f18' }}>
                  <img src={`${API_URL}/uploads/${a.imagen}`} alt={a.descripcion}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}
              <div style={{ padding: '14px 16px' }}>
                <div style={{ fontWeight: 700, color: '#fff', marginBottom: 6 }}>{a.descripcion}</div>
                {a.dinamica && (
                  <span style={{ background: '#6c63ff20', color: '#a78bfa', padding: '2px 8px', borderRadius: 4, fontSize: 12, fontWeight: 700, marginBottom: 8, display: 'inline-block' }}>
                    {a.dinamica}
                  </span>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                  <div>
                    <div style={{ fontSize: 11, color: '#9090a0' }}>P. oferta</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#4ade80' }}>
                      {formatPrecio(a.precio_personalizado ?? a.precio_oferta)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11, color: '#9090a0' }}>Vigencia</div>
                    <div style={{ fontSize: 11, color: '#9090a0' }}>{formatFecha(a.desde)}</div>
                    <div style={{ fontSize: 11, color: '#9090a0' }}>{formatFecha(a.hasta)}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

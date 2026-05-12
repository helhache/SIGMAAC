import { useEffect, useState } from 'react';
import API_URL from '../../config';

const colorEstado = {
  abierto: '#dc2626',
  en_revision: '#d97706',
  resuelto: '#16a34a',
  cerrado: '#888',
};

export default function GerenteReclamos() {
  const [reclamos, setReclamos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [seleccionado, setSeleccionado] = useState(null);
  const [error, setError] = useState('');
  const [resolucion, setResolucion] = useState('');

  useEffect(() => { cargarReclamos(); }, []);

  async function cargarReclamos() {
    setCargando(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/reclamos`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setReclamos(data);
    } catch {
      setError('No se pudieron cargar los reclamos');
    } finally {
      setCargando(false);
    }
  }

  async function cambiarEstado(id, estado) {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/api/reclamos/${id}/estado`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ estado, resolucion }),
      });
      setResolucion('');
      setSeleccionado(null);
      cargarReclamos();
    } catch {
      setError('Error al actualizar el reclamo');
    }
  }

  return (
    <div className="gestion-container">
      <div className="gestion-header">
        <div>
          <h2 className="gestion-titulo">Reclamos</h2>
          <p style={{ color: '#9090a0', fontSize: '0.88rem', marginTop: 2 }}>Reclamos recibidos de locales y repositores</p>
        </div>
      </div>

      {error && <div className="msg-error">{error}</div>}

      {cargando ? (
        <p style={{ color: '#606070' }}>Cargando...</p>
      ) : reclamos.length === 0 ? (
        <p className="msg-vacio">No hay reclamos registrados.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {reclamos.map(r => (
            <div key={r.id} style={{ background: '#1a1a24', border: '1px solid #2d2d3d', borderRadius: 8 }}>
              <div
                onClick={() => setSeleccionado(seleccionado === r.id ? null : r.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 18px', cursor: 'pointer' }}
              >
                <div style={{ flex: 1 }}>
                  <span style={{ fontWeight: 600, color: '#fff' }}>{r.local_nombre}</span>
                  <span style={{ color: '#606070', fontSize: 13, marginLeft: 10 }}>
                    {r.remitente_username} ({r.remitente_rol})
                  </span>
                  {r.tipo && (
                    <span style={{ color: '#9090a0', fontSize: 13, marginLeft: 10 }}>— {r.tipo}</span>
                  )}
                </div>
                <div style={{ fontSize: 13, color: '#9090a0' }}>{r.fecha?.slice(0, 10)}</div>
                <span style={{
                  fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 12,
                  background: colorEstado[r.estado] + '22', color: colorEstado[r.estado],
                }}>
                  {r.estado}
                </span>
              </div>

              {seleccionado === r.id && (
                <div style={{ borderTop: '1px solid #2d2d3d', padding: '14px 18px' }}>
                  <p style={{ margin: '0 0 12px', fontSize: 14, color: '#e0e0e0' }}>{r.descripcion}</p>

                  {r.resolucion && (
                    <p style={{ margin: '0 0 12px', fontSize: 13, color: '#9090a0', background: '#0f0f13', padding: '8px 12px', borderRadius: 6 }}>
                      <strong>Resolución:</strong> {r.resolucion}
                    </p>
                  )}

                  {r.estado !== 'cerrado' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <textarea
                        value={resolucion}
                        onChange={e => setResolucion(e.target.value)}
                        placeholder="Resolución o comentario (opcional)"
                        rows={2}
                        className="form-control"
                        style={{ resize: 'vertical' }}
                      />
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {r.estado === 'abierto' && (
                          <button onClick={() => cambiarEstado(r.id, 'en_revision')} style={btnStyle('#d97706')}>
                            Poner en revisión
                          </button>
                        )}
                        {(r.estado === 'abierto' || r.estado === 'en_revision') && (
                          <button onClick={() => cambiarEstado(r.id, 'resuelto')} style={btnStyle('#16a34a')}>
                            Marcar resuelto
                          </button>
                        )}
                        {r.estado === 'resuelto' && (
                          <button onClick={() => cambiarEstado(r.id, 'cerrado')} style={btnStyle('#888')}>
                            Cerrar
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function btnStyle(color) {
  return {
    padding: '6px 16px', border: 'none', borderRadius: 6,
    background: color, color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 13,
  };
}

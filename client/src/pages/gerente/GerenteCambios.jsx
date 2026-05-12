import { useEffect, useState } from 'react';
import API_URL from '../../config';

const colorEstado = {
  pendiente: '#d97706',
  aprobado: '#2563eb',
  procesado: '#16a34a',
  rechazado: '#dc2626',
};

export default function GerenteCambios() {
  const [cambios, setCambios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [seleccionado, setSeleccionado] = useState(null);
  const [detalle, setDetalle] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => { cargarCambios(); }, []);

  async function cargarCambios() {
    setCargando(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/cambios`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setCambios(data);
    } catch {
      setError('No se pudieron cargar los cambios');
    } finally {
      setCargando(false);
    }
  }

  async function verDetalle(id) {
    if (seleccionado === id) { setSeleccionado(null); setDetalle(null); return; }
    setSeleccionado(id);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/cambios/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setDetalle(data);
    } catch {
      setDetalle(null);
    }
  }

  async function cambiarEstado(id, estado) {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/api/cambios/${id}/estado`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ estado }),
      });
      cargarCambios();
      if (seleccionado === id) verDetalle(id);
    } catch {
      setError('Error al cambiar estado');
    }
  }

  return (
    <div className="gestion-container">
      <div className="gestion-header">
        <div>
          <h2 className="gestion-titulo">Cambios</h2>
          <p style={{ color: '#9090a0', fontSize: '0.88rem', marginTop: 2 }}>Aprobar o rechazar cambios registrados por repositores</p>
        </div>
      </div>

      {error && <div className="msg-error">{error}</div>}

      {cargando ? (
        <p style={{ color: '#606070' }}>Cargando...</p>
      ) : cambios.length === 0 ? (
        <p className="msg-vacio">No hay cambios registrados.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {cambios.map(c => (
            <div key={c.id} style={{ background: '#1a1a24', border: '1px solid #2d2d3d', borderRadius: 8 }}>
              <div
                onClick={() => verDetalle(c.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 18px', cursor: 'pointer' }}
              >
                <div style={{ flex: 1 }}>
                  <span style={{ fontWeight: 600, color: '#fff' }}>{c.local_nombre}</span>
                  <span style={{ color: '#606070', fontSize: 13, marginLeft: 10 }}>
                    {c.repositor_nombre} {c.repositor_apellido} — Nro {c.numero_vendedor}
                  </span>
                </div>
                <div style={{ fontSize: 13, color: '#9090a0' }}>{c.fecha?.slice(0, 10)}</div>
                <span style={{
                  fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 12,
                  background: colorEstado[c.estado] + '22', color: colorEstado[c.estado],
                }}>
                  {c.estado}
                </span>
              </div>

              {seleccionado === c.id && detalle && (
                <div style={{ borderTop: '1px solid #2d2d3d', padding: '14px 18px' }}>
                  {detalle.notas && (
                    <p style={{ margin: '0 0 12px', fontSize: 13, color: '#9090a0' }}>Notas: {detalle.notas}</p>
                  )}

                  {detalle.items?.length > 0 && (
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 14, fontSize: 13 }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #2d2d3d', color: '#606070' }}>
                          <th style={{ textAlign: 'left', padding: '4px 8px' }}>Producto</th>
                          <th style={{ textAlign: 'right', padding: '4px 8px' }}>Cant.</th>
                          <th style={{ textAlign: 'left', padding: '4px 8px' }}>Motivo</th>
                          <th style={{ textAlign: 'left', padding: '4px 8px' }}>Vence</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detalle.items.map(i => (
                          <tr key={i.id} style={{ borderBottom: '1px solid #1a1a2e' }}>
                            <td style={{ padding: '4px 8px', color: '#e0e0e0' }}>{i.producto_nombre}</td>
                            <td style={{ padding: '4px 8px', textAlign: 'right', color: '#9090a0' }}>{i.cantidad}</td>
                            <td style={{ padding: '4px 8px', color: '#9090a0' }}>{i.motivo_descripcion}</td>
                            <td style={{ padding: '4px 8px', color: '#606070' }}>{i.fecha_vencimiento?.slice(0, 10) || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  <div style={{ display: 'flex', gap: 8 }}>
                    {c.estado === 'pendiente' && (
                      <>
                        <button
                          onClick={() => cambiarEstado(c.id, 'aprobado')}
                          style={{ padding: '6px 16px', border: 'none', borderRadius: 6, background: '#2563eb', color: '#fff', cursor: 'pointer', fontWeight: 600 }}
                        >
                          Aprobar
                        </button>
                        <button
                          onClick={() => cambiarEstado(c.id, 'rechazado')}
                          style={{ padding: '6px 16px', border: 'none', borderRadius: 6, background: '#dc2626', color: '#fff', cursor: 'pointer', fontWeight: 600 }}
                        >
                          Rechazar
                        </button>
                      </>
                    )}
                    {c.estado === 'aprobado' && (
                      <button
                        onClick={() => cambiarEstado(c.id, 'procesado')}
                        style={{ padding: '6px 16px', border: 'none', borderRadius: 6, background: '#16a34a', color: '#fff', cursor: 'pointer', fontWeight: 600 }}
                      >
                        Marcar procesado
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

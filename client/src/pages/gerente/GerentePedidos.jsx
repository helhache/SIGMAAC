import { useEffect, useState } from 'react';
import API_URL from '../../config';

const ESTADOS = ['borrador', 'confirmado', 'en_transito', 'entregado', 'cancelado'];

const colorEstado = {
  borrador: '#888',
  confirmado: '#2563eb',
  en_transito: '#d97706',
  entregado: '#16a34a',
  cancelado: '#dc2626',
};

export default function GerentePedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [seleccionado, setSeleccionado] = useState(null);
  const [detalle, setDetalle] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => { cargarPedidos(); }, []);

  async function cargarPedidos() {
    setCargando(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/pedidos`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setPedidos(data);
    } catch {
      setError('No se pudieron cargar los pedidos');
    } finally {
      setCargando(false);
    }
  }

  async function verDetalle(id) {
    if (seleccionado === id) { setSeleccionado(null); setDetalle(null); return; }
    setSeleccionado(id);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/pedidos/${id}`, {
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
      await fetch(`${API_URL}/api/pedidos/${id}/estado`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ estado }),
      });
      cargarPedidos();
      if (seleccionado === id) verDetalle(id);
    } catch {
      setError('Error al cambiar estado');
    }
  }

  return (
    <div className="gestion-container">
      <div className="gestion-header">
        <div>
          <h2 className="gestion-titulo">Pedidos</h2>
          <p style={{ color: '#9090a0', fontSize: '0.88rem', marginTop: 2 }}>Lista de pedidos de todos los locales</p>
        </div>
      </div>

      {error && <div className="msg-error">{error}</div>}

      {cargando ? (
        <p style={{ color: '#606070' }}>Cargando...</p>
      ) : pedidos.length === 0 ? (
        <p className="msg-vacio">No hay pedidos registrados.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {pedidos.map(p => (
            <div key={p.id} style={{ background: '#1a1a24', border: '1px solid #2d2d3d', borderRadius: 8 }}>
              <div
                onClick={() => verDetalle(p.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 18px', cursor: 'pointer' }}
              >
                <div style={{ flex: 1 }}>
                  <span style={{ fontWeight: 600, color: '#fff' }}>{p.local_nombre}</span>
                  <span style={{ color: '#606070', fontSize: 13, marginLeft: 10 }}>
                    {p.tipo === 'forzado' ? '⚡ Forzado' : 'Programado'}
                  </span>
                </div>
                <div style={{ fontSize: 13, color: '#9090a0' }}>{p.fecha_pedido?.slice(0, 10)}</div>
                <div style={{ fontSize: 13, color: '#9090a0' }}>{p.total_bultos} bultos</div>
                <span style={{
                  fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 12,
                  background: colorEstado[p.estado] + '22', color: colorEstado[p.estado],
                }}>
                  {p.estado}
                </span>
              </div>

              {seleccionado === p.id && detalle && (
                <div style={{ borderTop: '1px solid #2d2d3d', padding: '14px 18px' }}>
                  {detalle.repositor_nombre && (
                    <p style={{ margin: '0 0 8px', fontSize: 13, color: '#9090a0' }}>
                      Repositor: <strong style={{ color: '#e0e0e0' }}>{detalle.repositor_nombre} {detalle.repositor_apellido}</strong>
                    </p>
                  )}
                  {detalle.notas && (
                    <p style={{ margin: '0 0 12px', fontSize: 13, color: '#9090a0' }}>Notas: {detalle.notas}</p>
                  )}

                  {detalle.items?.length > 0 && (
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 14, fontSize: 13 }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #2d2d3d', color: '#606070' }}>
                          <th style={{ textAlign: 'left', padding: '4px 8px' }}>Producto</th>
                          <th style={{ textAlign: 'right', padding: '4px 8px' }}>Bultos</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detalle.items.map(i => (
                          <tr key={i.id} style={{ borderBottom: '1px solid #1a1a2e' }}>
                            <td style={{ padding: '4px 8px', color: '#e0e0e0' }}>{i.producto_nombre}</td>
                            <td style={{ padding: '4px 8px', textAlign: 'right', color: '#9090a0' }}>{i.cantidad_bultos}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {ESTADOS.filter(e => e !== p.estado).map(e => (
                      <button
                        key={e}
                        onClick={() => cambiarEstado(p.id, e)}
                        style={{
                          padding: '5px 12px', border: 'none', borderRadius: 6,
                          background: colorEstado[e] + '22', color: colorEstado[e],
                          cursor: 'pointer', fontWeight: 600, fontSize: 12,
                        }}
                      >
                        → {e}
                      </button>
                    ))}
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

import { useEffect, useState } from 'react';
import API_URL from '../../config';

const colorEstado = {
  borrador: '#888', confirmado: '#2563eb',
  en_transito: '#d97706', entregado: '#16a34a', cancelado: '#dc2626',
};

export default function RepositorPedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [seleccionado, setSeleccionado] = useState(null);
  const [detalle, setDetalle] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    async function cargar() {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/api/pedidos`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setPedidos(await res.json());
      } catch {
        setError('No se pudieron cargar los pedidos');
      } finally {
        setCargando(false);
      }
    }
    cargar();
  }, []);

  async function verDetalle(id) {
    if (seleccionado === id) { setSeleccionado(null); setDetalle(null); return; }
    setSeleccionado(id);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/pedidos/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDetalle(await res.json());
    } catch { setDetalle(null); }
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <h2 style={{ margin: '0 0 4px', color: '#fff' }}>Mis pedidos</h2>
      <p style={{ color: '#9090a0', marginBottom: 24, fontSize: 13 }}>
        Pedidos que cargaste vos
      </p>

      {error && <p style={{ color: '#dc2626', marginBottom: 16 }}>{error}</p>}

      {cargando ? (
        <p style={{ color: '#9090a0' }}>Cargando...</p>
      ) : pedidos.length === 0 ? (
        <p style={{ color: '#9090a0' }}>No registraste pedidos todavía.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {pedidos.map(p => (
            <div key={p.id} style={{ background: '#1a1a24', border: '1px solid #2d2d3d', borderRadius: 8 }}>
              <div
                onClick={() => verDetalle(p.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', cursor: 'pointer' }}
              >
                <div style={{ flex: 1 }}>
                  <span style={{ fontWeight: 600, color: '#fff' }}>{p.local_nombre}</span>
                  {p.tipo === 'forzado' && (
                    <span style={{ marginLeft: 8, fontSize: 12, color: '#d97706', fontWeight: 600 }}>⚡ Forzado</span>
                  )}
                </div>
                <div style={{ fontSize: 13, color: '#9090a0' }}>{p.fecha_pedido?.slice(0, 10)}</div>
                <div style={{ fontSize: 13, color: '#9090a0' }}>{p.total_bultos} bultos</div>
                <span style={{
                  fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 12,
                  background: (colorEstado[p.estado] || '#888') + '22',
                  color: colorEstado[p.estado] || '#888',
                }}>
                  {p.estado}
                </span>
              </div>

              {seleccionado === p.id && detalle && (
                <div style={{ borderTop: '1px solid #2d2d3d', padding: '12px 16px' }}>
                  {detalle.notas && <p style={{ color: '#9090a0', fontSize: 13, margin: '0 0 10px' }}>Notas: {detalle.notas}</p>}
                  {detalle.items?.length > 0 && (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead>
                        <tr style={{ color: '#606070', borderBottom: '1px solid #2d2d3d' }}>
                          <th style={{ textAlign: 'left', padding: '4px 8px' }}>Producto</th>
                          <th style={{ textAlign: 'right', padding: '4px 8px' }}>Bultos</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detalle.items.map(i => (
                          <tr key={i.id} style={{ borderBottom: '1px solid #1e1e28', color: '#ccc' }}>
                            <td style={{ padding: '4px 8px' }}>{i.producto_nombre}</td>
                            <td style={{ padding: '4px 8px', textAlign: 'right', fontWeight: 700, color: '#a78bfa' }}>{i.cantidad_bultos}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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

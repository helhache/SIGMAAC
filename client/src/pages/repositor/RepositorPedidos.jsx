import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import API_URL from '../../config';

const colorEstado = {
  borrador: '#888', confirmado: '#2563eb',
  en_transito: '#d97706', entregado: '#16a34a', cancelado: '#dc2626',
};

function formatFecha(f) {
  if (!f) return '—';
  return String(f).slice(0,10).split('-').reverse().join('/');
}

export default function RepositorPedidos() {
  const { usuario } = useAuth();
  const locales = usuario?.locales || [];

  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [seleccionado, setSeleccionado] = useState(null);
  const [detalle, setDetalle] = useState(null);
  const [error, setError] = useState('');
  const [filtroLocal, setFiltroLocal] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');

  // Reclamo
  const [reclamandoId, setReclamandoId] = useState(null);
  const [formReclamo, setFormReclamo] = useState({ descripcion: '' });
  const [enviandoReclamo, setEnviandoReclamo] = useState(false);
  const [exitoReclamo, setExitoReclamo] = useState('');

  useEffect(() => {
    async function cargar() {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/api/pedidos/mis-locales`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setPedidos(Array.isArray(data) ? data : []);
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

  async function enviarReclamo(pedidoId) {
    if (!formReclamo.descripcion.trim()) return;
    setEnviandoReclamo(true);
    try {
      const token = localStorage.getItem('token');
      const pedido = pedidos.find(p => p.id === pedidoId);
      const res = await fetch(`${API_URL}/api/reclamos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          local_id: pedido?.local_id,
          tipo: `Pedido #${pedidoId}`,
          descripcion: formReclamo.descripcion,
          fecha: new Date().toISOString().slice(0,10),
        }),
      });
      if (res.ok) {
        setReclamandoId(null);
        setFormReclamo({ descripcion: '' });
        setExitoReclamo(`Reclamo del pedido #${pedidoId} enviado`);
        setTimeout(() => setExitoReclamo(''), 4000);
      }
    } catch { /* silencioso */ }
    finally { setEnviandoReclamo(false); }
  }

  const pedidosFiltrados = pedidos.filter(p => {
    if (filtroLocal && String(p.local_id) !== filtroLocal) return false;
    if (filtroEstado && p.estado !== filtroEstado) return false;
    return true;
  });

  return (
    <div style={{ maxWidth: 980, margin: '0 auto' }}>
      <h2 style={{ margin: '0 0 4px', color: '#fff' }}>Pedidos de mis locales</h2>
      <p style={{ color: '#9090a0', marginBottom: 24, fontSize: 13 }}>
        Todos los pedidos de los locales asignados a tu ruta
      </p>

      {error && <p style={{ color: '#dc2626', marginBottom: 16 }}>{error}</p>}
      {exitoReclamo && (
        <div style={{ background: '#16a34a22', border: '1px solid #16a34a44', color: '#4ade80', borderRadius: 8, padding: '10px 16px', marginBottom: 16, fontSize: 13 }}>
          {exitoReclamo}
        </div>
      )}

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        {locales.length > 1 && (
          <select value={filtroLocal} onChange={e => setFiltroLocal(e.target.value)} style={selectStyle}>
            <option value="">Todos los locales</option>
            {locales.map(l => <option key={l.id} value={l.id}>{l.nombre}</option>)}
          </select>
        )}
        <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)} style={selectStyle}>
          <option value="">Todos los estados</option>
          {Object.keys(colorEstado).map(e => <option key={e} value={e}>{e}</option>)}
        </select>
        {(filtroLocal || filtroEstado) && (
          <button onClick={() => { setFiltroLocal(''); setFiltroEstado(''); }}
            style={{ background: 'none', border: '1px solid #2d2d3d', color: '#9090a0', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontSize: 12 }}>
            Limpiar
          </button>
        )}
        <span style={{ color: '#9090a0', fontSize: 12, alignSelf: 'center', marginLeft: 4 }}>
          {pedidosFiltrados.length} pedidos
        </span>
      </div>

      {cargando ? (
        <p style={{ color: '#9090a0' }}>Cargando...</p>
      ) : pedidosFiltrados.length === 0 ? (
        <p style={{ color: '#9090a0' }}>No hay pedidos registrados.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {pedidosFiltrados.map(p => (
            <div key={p.id} style={{ background: '#1a1a24', border: '1px solid #2d2d3d', borderRadius: 8 }}>
              {/* Fila principal */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 120 }}>
                  <div style={{ fontWeight: 700, color: '#fff', fontSize: 14 }}>{p.local_nombre}</div>
                  <div style={{ fontSize: 11, color: '#9090a0', marginTop: 1 }}>Pedido #{p.id}</div>
                </div>
                <div style={{ fontSize: 12, color: '#9090a0', textAlign: 'center' }}>
                  <div style={{ color: '#ccc' }}>{formatFecha(p.fecha_pedido)}</div>
                  <div>pedido</div>
                </div>
                {p.fecha_entrega_estimada && (
                  <div style={{ fontSize: 12, color: '#9090a0', textAlign: 'center' }}>
                    <div style={{ color: '#f6ad55', fontWeight: 600 }}>{formatFecha(p.fecha_entrega_estimada)}</div>
                    <div>entrega est.</div>
                  </div>
                )}
                <div style={{ fontSize: 12, color: '#9090a0', textAlign: 'center' }}>
                  <div style={{ color: '#ccc' }}>{p.total_bultos ?? 0}</div>
                  <div>bultos</div>
                </div>
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 10,
                  background: (colorEstado[p.estado] || '#888') + '22',
                  color: colorEstado[p.estado] || '#888',
                }}>
                  {p.estado}
                </span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => verDetalle(p.id)} style={btnStyle('#6c63ff')}>Ver detalle</button>
                  <button onClick={() => setReclamandoId(reclamandoId === p.id ? null : p.id)} style={btnStyle('#d97706')}>
                    Reclamar
                  </button>
                </div>
              </div>

              {/* Detalle */}
              {seleccionado === p.id && detalle && (
                <div style={{ borderTop: '1px solid #2d2d3d', padding: '12px 16px' }}>
                  {detalle.notas && <p style={{ color: '#9090a0', fontSize: 13, margin: '0 0 10px' }}>Notas: {detalle.notas}</p>}
                  {detalle.items?.length > 0 && (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead>
                        <tr style={{ color: '#606070', borderBottom: '1px solid #2d2d3d' }}>
                          <th style={th}>Producto</th>
                          <th style={{ ...th, textAlign: 'right' }}>Cantidad</th>
                          <th style={{ ...th, textAlign: 'right' }}>Packs</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detalle.items.map(i => {
                          const cant = i.cantidad_display != null ? `${i.cantidad_display} ${i.unidad_display}` : `${i.cantidad_bultos} bultos`;
                          const packs = i.packs ?? Math.round((i.cantidad_bultos || 0) / Math.max(i.unidades_por_bulto || 1, 1));
                          return (
                            <tr key={i.id} style={{ borderBottom: '1px solid #1e1e28', color: '#ccc' }}>
                              <td style={th}>{i.producto_nombre}</td>
                              <td style={{ ...th, textAlign: 'right', fontWeight: 700, color: '#a78bfa' }}>{cant}</td>
                              <td style={{ ...th, textAlign: 'right', color: '#9090a0' }}>{packs}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* Form reclamo */}
              {reclamandoId === p.id && (
                <div style={{ borderTop: '1px solid #2d2d3d', padding: '14px 16px', background: '#0f0f18' }}>
                  <p style={{ color: '#f6ad55', fontSize: 12, fontWeight: 600, margin: '0 0 8px' }}>
                    Reclamo para pedido #{p.id} — {p.local_nombre}
                  </p>
                  <textarea
                    value={formReclamo.descripcion}
                    onChange={e => setFormReclamo({ descripcion: e.target.value })}
                    placeholder="Describí el problema (faltante, entrega incorrecta, etc.)"
                    rows={3}
                    style={{ width: '100%', padding: '8px 10px', background: '#1a1a24', border: '1px solid #2d2d3d', borderRadius: 6, color: '#fff', fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }}
                  />
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <button onClick={() => enviarReclamo(p.id)} disabled={enviandoReclamo} style={{ padding: '7px 18px', background: '#d97706', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
                      {enviandoReclamo ? 'Enviando...' : 'Enviar reclamo'}
                    </button>
                    <button onClick={() => setReclamandoId(null)} style={{ padding: '7px 14px', background: 'none', border: '1px solid #2d2d3d', color: '#9090a0', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>
                      Cancelar
                    </button>
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

const btnStyle = (color) => ({
  padding: '4px 12px', background: color + '22', border: `1px solid ${color}44`,
  color, borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 600,
});
const selectStyle = { padding: '7px 10px', border: '1px solid #2d2d3d', borderRadius: 6, fontSize: 13, background: '#1a1a24', color: '#fff', cursor: 'pointer' };
const th = { padding: '6px 10px', textAlign: 'left', fontWeight: 500, fontSize: 12 };

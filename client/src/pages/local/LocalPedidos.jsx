import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import API_URL from '../../config';

const colorEstado = {
  borrador: '#888',
  confirmado: '#2563eb',
  en_transito: '#d97706',
  entregado: '#16a34a',
  cancelado: '#dc2626',
};

export default function LocalPedidos() {
  const { usuario } = useAuth();
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [seleccionado, setSeleccionado] = useState(null);
  const [detalle, setDetalle] = useState(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [productos, setProductos] = useState([]);
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  const [form, setForm] = useState({
    local_id: usuario?.local_id || '',
    tipo: 'programado',
    fecha_pedido: new Date().toISOString().slice(0, 10),
    notas: '',
    items: [{ producto_id: '', cantidad_bultos: 1 }],
  });

  useEffect(() => {
    cargarPedidos();
    cargarProductos();
  }, []);

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

  async function cargarProductos() {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/productos`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setProductos(data);
    } catch { /* silencioso */ }
  }

  async function verDetalle(id) {
    if (seleccionado === id) { setSeleccionado(null); setDetalle(null); return; }
    setSeleccionado(id);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/pedidos/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDetalle(await res.json());
    } catch {
      setDetalle(null);
    }
  }

  function agregarItem() {
    setForm(f => ({ ...f, items: [...f.items, { producto_id: '', cantidad_bultos: 1 }] }));
  }

  function quitarItem(idx) {
    setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));
  }

  function editarItem(idx, campo, valor) {
    setForm(f => {
      const items = [...f.items];
      items[idx] = { ...items[idx], [campo]: valor };
      return { ...f, items };
    });
  }

  async function enviarPedido(e) {
    e.preventDefault();
    setEnviando(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const payload = {
        ...form,
        local_id: parseInt(form.local_id),
        items: form.items.map(i => ({
          producto_id: parseInt(i.producto_id),
          cantidad_bultos: parseInt(i.cantidad_bultos),
        })).filter(i => i.producto_id && i.cantidad_bultos > 0),
      };

      const res = await fetch(`${API_URL}/api/pedidos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Error al enviar el pedido');
        return;
      }

      setMostrarForm(false);
      setForm({
        local_id: usuario?.local_id || '',
        tipo: 'programado',
        fecha_pedido: new Date().toISOString().slice(0, 10),
        notas: '',
        items: [{ producto_id: '', cantidad_bultos: 1 }],
      });
      cargarPedidos();
    } catch {
      setError('Error al enviar el pedido');
    } finally {
      setEnviando(false);
    }
  }

  // Si el local tiene múltiples locales, necesita elegir cuál
  const misLocales = usuario?.local_ids?.length > 1
    ? usuario.local_ids.map((id, i) => ({ id, nombre: i === 0 ? usuario.local_nombre : `Local ${id}` }))
    : null;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: '0 0 4px', color: '#fff' }}>Mis pedidos</h2>
          <p style={{ color: '#9090a0', margin: 0, fontSize: 13 }}>
            Historial de pedidos y forzados
          </p>
        </div>
        <button
          onClick={() => setMostrarForm(v => !v)}
          style={{ padding: '8px 18px', background: '#6c63ff', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}
        >
          {mostrarForm ? 'Cancelar' : '+ Nuevo pedido'}
        </button>
      </div>

      {error && <p style={{ color: '#dc2626', marginBottom: 16 }}>{error}</p>}

      {/* Formulario nuevo pedido */}
      {mostrarForm && (
        <form onSubmit={enviarPedido} style={{
          background: '#1a1a24', border: '1px solid #2d2d3d', borderRadius: 10,
          padding: 24, marginBottom: 24,
        }}>
          <h3 style={{ color: '#fff', margin: '0 0 16px' }}>Nuevo pedido</h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
            {misLocales && (
              <div>
                <label style={labelStyle}>Local</label>
                <select
                  value={form.local_id}
                  onChange={e => setForm(f => ({ ...f, local_id: e.target.value }))}
                  style={inputStyle} required
                >
                  <option value="">— Elegir local —</option>
                  {misLocales.map(l => (
                    <option key={l.id} value={l.id}>{l.nombre}</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label style={labelStyle}>Tipo</label>
              <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))} style={inputStyle}>
                <option value="programado">Programado</option>
                <option value="forzado">Forzado (urgente)</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Fecha del pedido</label>
              <input type="date" value={form.fecha_pedido} onChange={e => setForm(f => ({ ...f, fecha_pedido: e.target.value }))} style={inputStyle} required />
            </div>
          </div>

          {/* Items */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Productos</label>
            {form.items.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                <select
                  value={item.producto_id}
                  onChange={e => editarItem(idx, 'producto_id', e.target.value)}
                  style={{ ...inputStyle, flex: 1 }} required
                >
                  <option value="">— Producto —</option>
                  {productos.map(p => (
                    <option key={p.id} value={p.id}>{p.nombre}</option>
                  ))}
                </select>
                <input
                  type="number" min={1} value={item.cantidad_bultos}
                  onChange={e => editarItem(idx, 'cantidad_bultos', e.target.value)}
                  style={{ ...inputStyle, width: 90 }} placeholder="Bultos"
                />
                {form.items.length > 1 && (
                  <button type="button" onClick={() => quitarItem(idx)}
                    style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 18, padding: '0 4px' }}>
                    ×
                  </button>
                )}
              </div>
            ))}
            <button type="button" onClick={agregarItem}
              style={{ background: 'none', border: '1px dashed #2d2d3d', color: '#9090a0', borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontSize: 13, marginTop: 4 }}>
              + Agregar producto
            </button>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Notas (opcional)</label>
            <input value={form.notas} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))} style={inputStyle} placeholder="Ej: Entregar antes del viernes" />
          </div>

          <button type="submit" disabled={enviando} style={{
            padding: '9px 24px', background: '#6c63ff', color: '#fff',
            border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600,
          }}>
            {enviando ? 'Enviando...' : 'Enviar pedido'}
          </button>
        </form>
      )}

      {cargando ? (
        <p style={{ color: '#9090a0' }}>Cargando...</p>
      ) : pedidos.length === 0 ? (
        <p style={{ color: '#9090a0' }}>No tenés pedidos registrados.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {pedidos.map(p => (
            <div key={p.id} style={{ background: '#1a1a24', border: '1px solid #2d2d3d', borderRadius: 8 }}>
              <div
                onClick={() => verDetalle(p.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 16px', cursor: 'pointer' }}
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
                  background: colorEstado[p.estado] + '22', color: colorEstado[p.estado],
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
                            <td style={{ padding: '4px 8px', textAlign: 'right' }}>{i.cantidad_bultos}</td>
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

const labelStyle = { display: 'block', fontSize: 12, fontWeight: 600, color: '#9090a0', marginBottom: 4 };
const inputStyle = {
  width: '100%', padding: '8px 10px', border: '1px solid #2d2d3d',
  borderRadius: 6, fontSize: 14, background: '#0f0f13', color: '#fff', boxSizing: 'border-box',
};

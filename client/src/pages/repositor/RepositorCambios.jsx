import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import API_URL from '../../config';

export default function RepositorCambios() {
  const { usuario } = useAuth();
  const locales = usuario?.locales || [];

  const [motivos, setMotivos] = useState([]);
  const [productos, setProductos] = useState([]);
  const [cambios, setCambios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');
  const [seleccionado, setSeleccionado] = useState(null);
  const [detalle, setDetalle] = useState(null);

  const [form, setForm] = useState({
    local_id: locales[0]?.id || '',
    fecha: new Date().toISOString().slice(0, 10),
    notas: '',
    items: [{ producto_id: '', cantidad: 1, motivo_id: '', fecha_vencimiento: '', etiquetas_requeridas: 0 }],
  });

  useEffect(() => {
    cargarTodo();
  }, []);

  async function cargarTodo() {
    setCargando(true);
    const token = localStorage.getItem('token');
    try {
      const [resCambios, resMotivos, resProductos] = await Promise.all([
        fetch(`${API_URL}/api/cambios`,         { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/api/cambios/motivos`,  { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/api/productos`,        { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setCambios(await resCambios.json());
      setMotivos(await resMotivos.json());
      setProductos(await resProductos.json());
    } catch {
      setError('Error al cargar datos');
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
      setDetalle(await res.json());
    } catch { setDetalle(null); }
  }

  function agregarItem() {
    setForm(f => ({
      ...f,
      items: [...f.items, { producto_id: '', cantidad: 1, motivo_id: '', fecha_vencimiento: '', etiquetas_requeridas: 0 }],
    }));
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

  async function enviarCambio(e) {
    e.preventDefault();
    setEnviando(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const payload = {
        local_id: parseInt(form.local_id),
        fecha: form.fecha,
        notas: form.notas || undefined,
        items: form.items
          .filter(i => i.producto_id && i.motivo_id)
          .map(i => ({
            producto_id: parseInt(i.producto_id),
            cantidad: parseInt(i.cantidad),
            motivo_id: parseInt(i.motivo_id),
            fecha_vencimiento: i.fecha_vencimiento || undefined,
            etiquetas_requeridas: parseInt(i.etiquetas_requeridas) || 0,
          })),
      };

      if (payload.items.length === 0) {
        setError('Completá al menos un item con producto y motivo');
        return;
      }

      const res = await fetch(`${API_URL}/api/cambios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Error al registrar el cambio');
        return;
      }

      setMostrarForm(false);
      setForm({
        local_id: locales[0]?.id || '',
        fecha: new Date().toISOString().slice(0, 10),
        notas: '',
        items: [{ producto_id: '', cantidad: 1, motivo_id: '', fecha_vencimiento: '', etiquetas_requeridas: 0 }],
      });
      setExito('Cambio registrado correctamente');
      setTimeout(() => setExito(''), 4000);
      cargarTodo();
    } catch {
      setError('Error al registrar el cambio');
    } finally {
      setEnviando(false);
    }
  }

  const colorEstado = { pendiente: '#d97706', aprobado: '#2563eb', procesado: '#16a34a', rechazado: '#dc2626' };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: '0 0 4px', color: '#fff' }}>Cambios de mercadería</h2>
          <p style={{ color: '#9090a0', margin: 0, fontSize: 13 }}>
            Registrá devoluciones y cambios digitalmente
          </p>
        </div>
        <button
          onClick={() => setMostrarForm(v => !v)}
          style={{ padding: '8px 18px', background: '#6c63ff', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}
        >
          {mostrarForm ? 'Cancelar' : '+ Nuevo cambio'}
        </button>
      </div>

      {error && <p style={{ color: '#dc2626', marginBottom: 16 }}>{error}</p>}
      {exito && (
        <div style={{ background: '#16a34a22', border: '1px solid #16a34a44', color: '#4ade80', borderRadius: 8, padding: '10px 16px', marginBottom: 16, fontSize: 14 }}>
          {exito}
        </div>
      )}

      {/* Aviso si no hay motivos cargados */}
      {!cargando && motivos.length === 0 && (
        <div style={{ background: '#d9770622', border: '1px solid #d9770644', color: '#fbbf24', borderRadius: 8, padding: '10px 16px', marginBottom: 16, fontSize: 13 }}>
          Los motivos de cambio (01-11) aún no fueron cargados en la base de datos. Pedile al administrador que los cargue para poder registrar cambios.
        </div>
      )}

      {/* Formulario */}
      {mostrarForm && motivos.length > 0 && (
        <form onSubmit={enviarCambio} style={{
          background: '#1a1a24', border: '1px solid #2d2d3d', borderRadius: 10,
          padding: 24, marginBottom: 24,
        }}>
          <h3 style={{ color: '#fff', margin: '0 0 18px' }}>Nuevo cambio</h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
            <div>
              <label style={labelStyle}>Local *</label>
              <select
                value={form.local_id}
                onChange={e => setForm(f => ({ ...f, local_id: e.target.value }))}
                style={inputStyle} required
              >
                <option value="">— Elegir local —</option>
                {locales.map(l => <option key={l.id} value={l.id}>{l.nombre}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Fecha *</label>
              <input
                type="date" value={form.fecha}
                onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))}
                style={inputStyle} required
              />
            </div>
          </div>

          {/* Items */}
          <div style={{ marginBottom: 18 }}>
            <label style={{ ...labelStyle, marginBottom: 10 }}>Productos a cambiar *</label>

            {form.items.map((item, idx) => (
              <div key={idx} style={{
                background: '#0f0f13', border: '1px solid #2d2d3d', borderRadius: 8,
                padding: 14, marginBottom: 10,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ color: '#9090a0', fontSize: 12, fontWeight: 600 }}>Item {idx + 1}</span>
                  {form.items.length > 1 && (
                    <button type="button" onClick={() => quitarItem(idx)}
                      style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>
                      ×
                    </button>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, marginBottom: 10 }}>
                  <div>
                    <label style={labelStyle}>Producto *</label>
                    <select
                      value={item.producto_id}
                      onChange={e => editarItem(idx, 'producto_id', e.target.value)}
                      style={inputStyle} required
                    >
                      <option value="">— Seleccionar —</option>
                      {productos.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.codigo_venta ? `[${p.codigo_venta}] ` : ''}{p.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Cantidad</label>
                    <input
                      type="number" min={1} value={item.cantidad}
                      onChange={e => editarItem(idx, 'cantidad', e.target.value)}
                      style={{ ...inputStyle, width: 80 }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                  <div style={{ gridColumn: '1 / 2' }}>
                    <label style={labelStyle}>Motivo *</label>
                    <select
                      value={item.motivo_id}
                      onChange={e => editarItem(idx, 'motivo_id', e.target.value)}
                      style={inputStyle} required
                    >
                      <option value="">— Motivo —</option>
                      {motivos.map(m => (
                        <option key={m.id} value={m.id}>
                          {String(m.id).padStart(2, '0')} — {m.descripcion}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Vencimiento</label>
                    <input
                      type="date" value={item.fecha_vencimiento}
                      onChange={e => editarItem(idx, 'fecha_vencimiento', e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Etiquetas</label>
                    <input
                      type="number" min={0} value={item.etiquetas_requeridas}
                      onChange={e => editarItem(idx, 'etiquetas_requeridas', e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                </div>
              </div>
            ))}

            <button type="button" onClick={agregarItem}
              style={{
                background: 'none', border: '1px dashed #2d2d3d', color: '#9090a0',
                borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 13, width: '100%',
              }}>
              + Agregar otro producto
            </button>
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={labelStyle}>Notas (opcional)</label>
            <input
              value={form.notas}
              onChange={e => setForm(f => ({ ...f, notas: e.target.value }))}
              style={inputStyle} placeholder="Observaciones adicionales"
            />
          </div>

          <button type="submit" disabled={enviando} style={{
            padding: '9px 28px', background: '#6c63ff', color: '#fff',
            border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 14,
          }}>
            {enviando ? 'Registrando...' : 'Registrar cambio'}
          </button>
        </form>
      )}

      {/* Historial */}
      {cargando ? (
        <p style={{ color: '#9090a0' }}>Cargando...</p>
      ) : cambios.length === 0 ? (
        <p style={{ color: '#9090a0' }}>No registraste cambios todavía.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {cambios.map(c => (
            <div key={c.id} style={{ background: '#1a1a24', border: '1px solid #2d2d3d', borderRadius: 8 }}>
              <div
                onClick={() => verDetalle(c.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', cursor: 'pointer' }}
              >
                <div style={{ flex: 1 }}>
                  <span style={{ fontWeight: 600, color: '#fff' }}>{c.local_nombre}</span>
                  <span style={{ color: '#9090a0', fontSize: 12, marginLeft: 10 }}>{c.fecha?.slice(0, 10)}</span>
                </div>
                <span style={{
                  fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 12,
                  background: (colorEstado[c.estado] || '#888') + '22',
                  color: colorEstado[c.estado] || '#888',
                }}>
                  {c.estado}
                </span>
              </div>

              {seleccionado === c.id && detalle && (
                <div style={{ borderTop: '1px solid #2d2d3d', padding: '12px 16px' }}>
                  {detalle.notas && <p style={{ color: '#9090a0', fontSize: 13, margin: '0 0 10px' }}>Notas: {detalle.notas}</p>}
                  {detalle.items?.length > 0 && (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead>
                        <tr style={{ color: '#606070', borderBottom: '1px solid #2d2d3d' }}>
                          <th style={{ textAlign: 'left', padding: '4px 8px' }}>Producto</th>
                          <th style={{ textAlign: 'right', padding: '4px 8px' }}>Cant.</th>
                          <th style={{ textAlign: 'left', padding: '4px 8px' }}>Motivo</th>
                          <th style={{ textAlign: 'left', padding: '4px 8px' }}>Vence</th>
                          <th style={{ textAlign: 'right', padding: '4px 8px' }}>Etiq.</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detalle.items.map(i => (
                          <tr key={i.id} style={{ borderBottom: '1px solid #1e1e28', color: '#ccc' }}>
                            <td style={{ padding: '5px 8px' }}>{i.producto_nombre}</td>
                            <td style={{ padding: '5px 8px', textAlign: 'right', color: '#a78bfa', fontWeight: 700 }}>{i.cantidad}</td>
                            <td style={{ padding: '5px 8px', color: '#9090a0' }}>{i.motivo_descripcion}</td>
                            <td style={{ padding: '5px 8px', color: '#9090a0' }}>{i.fecha_vencimiento?.slice(0, 10) || '—'}</td>
                            <td style={{ padding: '5px 8px', textAlign: 'right', color: '#9090a0' }}>{i.etiquetas_requeridas || '—'}</td>
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
  borderRadius: 6, fontSize: 13, background: '#1a1a24', color: '#fff', boxSizing: 'border-box',
};

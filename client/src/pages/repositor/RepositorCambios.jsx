import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import API_URL from '../../config';

// ── Tabla de referencia de motivos (hardcoded) ─────────────────────────────
const MOTIVOS_REF = [
  { codigo:'01', motivo:'Sabor',       cerrado:'NO', nota_cerrado:'Envase Abierto Permitido', condicion:'Sujeto a control' },
  { codigo:'02', motivo:'Olor',        cerrado:'NO', nota_cerrado:'Envase Abierto Permitido', condicion:'Sujeto a control' },
  { codigo:'03', motivo:'Color',       cerrado:'SÍ', nota_cerrado:'',                         condicion:'—' },
  { codigo:'04', motivo:'Mat. Extraño',cerrado:'SÍ', nota_cerrado:'',                         condicion:'Protocolo estricto' },
  { codigo:'05', motivo:'Falta Gas',   cerrado:'SÍ', nota_cerrado:'',                         condicion:'—' },
  { codigo:'06', motivo:'Bajo Nivel',  cerrado:'SÍ', nota_cerrado:'',                         condicion:'—' },
  { codigo:'07', motivo:'Explotado',   cerrado:'SÍ', nota_cerrado:'',                         condicion:'—' },
  { codigo:'08', motivo:'Fuga',        cerrado:'SÍ', nota_cerrado:'',                         condicion:'—' },
  { codigo:'09', motivo:'Maltratado',  cerrado:'SÍ', nota_cerrado:'',                         condicion:'Solo Mayoristas + Calidad' },
  { codigo:'10', motivo:'Vencido',     cerrado:'SÍ', nota_cerrado:'',                         condicion:'<600cc PET, máx 15 días' },
  { codigo:'11', motivo:'Etiqueta',    cerrado:'SÍ', nota_cerrado:'',                         condicion:'Retornables, código legible' },
];

const colorEstado = {
  pendiente: '#d97706', aprobado: '#2563eb', procesado: '#16a34a',
  rechazado: '#dc2626', cancelado: '#888',
};

const ITEMS_POR_PAGINA = 10;
const MAX_REGISTROS = 30;

function formatFecha(f) {
  if (!f) return '—';
  return String(f).slice(0,10).split('-').reverse().join('/');
}

export default function RepositorCambios() {
  const { usuario } = useAuth();
  const locales = usuario?.locales || [];

  const [motivos, setMotivos] = useState([]);
  const [productos, setProductos] = useState([]);
  const [cambios, setCambios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');
  const [detalleModal, setDetalleModal] = useState(null);

  // Filtros + paginación
  const [filtroLocal, setFiltroLocal] = useState('');
  const [filtroDesde, setFiltroDesde] = useState('');
  const [filtroHasta, setFiltroHasta] = useState('');
  const [pagina, setPagina] = useState(1);

  // Form nuevo cambio
  const ITEM_VACIO = { codigo: '', producto_id: '', cantidad: 1, motivo_id: '' };
  const [form, setForm] = useState({
    local_id: locales[0]?.id || '',
    fecha: new Date().toISOString().slice(0, 10),
    notas: '',
    items: [{ ...ITEM_VACIO }],
  });

  useEffect(() => { cargarTodo(); }, []);

  async function cargarTodo() {
    setCargando(true);
    const token = localStorage.getItem('token');
    try {
      const [resCambios, resMotivos, resProductos] = await Promise.all([
        fetch(`${API_URL}/api/cambios`,        { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/api/cambios/motivos`,{ headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/api/productos`,      { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const dataCambios = await resCambios.json();
      setCambios(Array.isArray(dataCambios) ? dataCambios.slice(0, MAX_REGISTROS) : []);
      setMotivos(await resMotivos.json());
      setProductos(await resProductos.json());
    } catch {
      setError('Error al cargar datos');
    } finally {
      setCargando(false);
    }
  }

  // ── Filtros ────────────────────────────────────────────────────────────────
  const cambiosFiltrados = cambios.filter(c => {
    if (filtroLocal && String(c.local_id) !== filtroLocal) return false;
    if (filtroDesde && String(c.fecha).slice(0,10) < filtroDesde) return false;
    if (filtroHasta && String(c.fecha).slice(0,10) > filtroHasta) return false;
    return true;
  });
  const totalPaginas = Math.ceil(cambiosFiltrados.length / ITEMS_POR_PAGINA);
  const cambiosPagina = cambiosFiltrados.slice((pagina-1)*ITEMS_POR_PAGINA, pagina*ITEMS_POR_PAGINA);

  // ── Acciones ───────────────────────────────────────────────────────────────
  async function accion(id, tipo) {
    const token = localStorage.getItem('token');
    const url = tipo === 'eliminar'
      ? `${API_URL}/api/cambios/${id}`
      : `${API_URL}/api/cambios/${id}/${tipo}`;
    const method = tipo === 'eliminar' ? 'DELETE' : 'PATCH';
    try {
      const res = await fetch(url, { method, headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Error'); return; }
      setExito(data.mensaje || 'Acción realizada');
      setTimeout(() => setExito(''), 3000);
      cargarTodo();
    } catch { setError('Error al procesar'); }
  }

  async function verDetalle(cambio) {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/api/cambios/${cambio.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDetalleModal(await res.json());
    } catch { setDetalleModal(cambio); }
  }

  // ── Items del form ─────────────────────────────────────────────────────────
  function editarItem(idx, campo, valor) {
    setForm(f => {
      const items = [...f.items];
      const item = { ...items[idx], [campo]: valor };
      if (campo === 'codigo') {
        const prod = productos.find(p => (p.codigo_venta || '') === valor);
        if (prod) { item.producto_id = String(prod.id); }
      }
      if (campo === 'producto_id') {
        const prod = productos.find(p => String(p.id) === valor);
        if (prod) { item.codigo = prod.codigo_venta || ''; }
      }
      items[idx] = item;
      return { ...f, items };
    });
  }

  async function enviarCambio() {
    setEnviando(true);
    setError('');
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
        })),
    };
    if (!payload.local_id) { setError('Seleccioná un local'); setEnviando(false); return; }
    if (payload.items.length === 0) { setError('Completá al menos un ítem con producto y motivo'); setEnviando(false); return; }
    try {
      const res = await fetch(`${API_URL}/api/cambios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Error al registrar'); return; }
      setModalAbierto(false);
      resetForm();
      setExito('Cambio registrado y enviado al admin');
      setTimeout(() => setExito(''), 4000);
      cargarTodo();
    } catch { setError('Error al registrar'); }
    finally { setEnviando(false); }
  }

  function resetForm() {
    setForm({ local_id: locales[0]?.id || '', fecha: new Date().toISOString().slice(0,10), notas: '', items: [{ ...ITEM_VACIO }] });
  }

  // ── Exportar PDF ───────────────────────────────────────────────────────────
  function exportarPDF() {
    const localInfo = locales.find(l => String(l.id) === String(form.local_id));
    const lineas = form.items.filter(i => i.producto_id).map(i => {
      const prod = productos.find(p => String(p.id) === i.producto_id);
      return `${i.codigo || '—'} | ${prod?.nombre || '—'} | ${i.cantidad}`;
    }).join('\n');
    const contenido = `CAMBIO DE MERCADERÍA\nLocal: ${localInfo?.nombre || '—'} (#${form.local_id})\nFecha: ${form.fecha}\n\nCÓDIGO | PRODUCTO | CANTIDAD\n${lineas}\n\nNotas: ${form.notas || '—'}`;
    const ventana = window.open('', '_blank');
    ventana.document.write(`<pre style="font-family:monospace;padding:24px;font-size:14px">${contenido}</pre>`);
    ventana.document.close();
    ventana.print();
  }

  // ── Copiar WSP ─────────────────────────────────────────────────────────────
  function copiarWSP() {
    const lineas = form.items.filter(i => i.producto_id).map(i => {
      const prod = productos.find(p => String(p.id) === i.producto_id);
      return `${i.codigo || '—'}-${prod?.nombre || '—'}-${i.cantidad}`;
    });
    navigator.clipboard.writeText(lineas.join('\n'))
      .then(() => { setExito('Formato copiado al portapapeles'); setTimeout(() => setExito(''), 3000); })
      .catch(() => setError('No se pudo copiar'));
  }

  const localFormInfo = locales.find(l => String(l.id) === String(form.local_id));

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: '0 0 4px', color: '#fff' }}>Cambios de mercadería</h2>
          <p style={{ color: '#9090a0', margin: 0, fontSize: 13 }}>Registrá y seguí tus cambios</p>
        </div>
        <button
          onClick={() => { resetForm(); setModalAbierto(true); setError(''); }}
          style={{ padding: '9px 20px', background: '#6c63ff', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700 }}
        >
          + Nuevo cambio
        </button>
      </div>

      {error && <div style={{ background: '#dc262622', border: '1px solid #dc262644', color: '#fca5a5', borderRadius: 8, padding: '10px 16px', marginBottom: 16, fontSize: 13 }}>{error}</div>}
      {exito && <div style={{ background: '#16a34a22', border: '1px solid #16a34a44', color: '#4ade80', borderRadius: 8, padding: '10px 16px', marginBottom: 16, fontSize: 13 }}>{exito}</div>}

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        {locales.length > 1 && (
          <select value={filtroLocal} onChange={e => { setFiltroLocal(e.target.value); setPagina(1); }} style={selectStyle}>
            <option value="">Todos los locales</option>
            {locales.map(l => <option key={l.id} value={l.id}>{l.nombre}</option>)}
          </select>
        )}
        <input type="date" value={filtroDesde} onChange={e => { setFiltroDesde(e.target.value); setPagina(1); }} style={inputStyle} placeholder="Desde" />
        <input type="date" value={filtroHasta} onChange={e => { setFiltroHasta(e.target.value); setPagina(1); }} style={inputStyle} placeholder="Hasta" />
        {(filtroLocal || filtroDesde || filtroHasta) && (
          <button onClick={() => { setFiltroLocal(''); setFiltroDesde(''); setFiltroHasta(''); setPagina(1); }}
            style={{ background: 'none', border: '1px solid #2d2d3d', color: '#9090a0', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontSize: 12 }}>
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Tabla historial */}
      <div style={{ background: '#1a1a24', border: '1px solid #2d2d3d', borderRadius: 10, overflow: 'hidden', marginBottom: 12 }}>
        {cargando ? (
          <p style={{ color: '#9090a0', padding: '20px 24px', margin: 0 }}>Cargando...</p>
        ) : cambiosPagina.length === 0 ? (
          <p style={{ color: '#9090a0', padding: '20px 24px', margin: 0 }}>No hay cambios registrados.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #2d2d3d' }}>
                {['Fecha','Local','Estado','Acciones'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: '#9090a0', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cambiosPagina.map(c => (
                <tr key={c.id} style={{ borderBottom: '1px solid #1e1e28' }}>
                  <td style={{ padding: '10px 14px', color: '#ccc' }}>{formatFecha(c.fecha)}</td>
                  <td style={{ padding: '10px 14px', color: '#fff', fontWeight: 600 }}>{c.local_nombre}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 10,
                      background: (colorEstado[c.estado] || '#888') + '22',
                      color: colorEstado[c.estado] || '#888',
                    }}>
                      {c.estado}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <BtnAccion label="Ampliar"  color="#6c63ff" onClick={() => verDetalle(c)} />
                      {c.estado === 'rechazado' && (
                        <BtnAccion label="Reclamar" color="#d97706" onClick={() => accion(c.id, 'reclamar')} />
                      )}
                      {['pendiente','rechazado'].includes(c.estado) && (
                        <BtnAccion label="Cancelar" color="#dc2626" onClick={() => { if(window.confirm('¿Cancelar este cambio?')) accion(c.id, 'cancelar'); }} />
                      )}
                      {['cancelado'].includes(c.estado) && (
                        <BtnAccion label="Eliminar" color="#888" onClick={() => { if(window.confirm('¿Eliminar este cambio?')) accion(c.id, 'eliminar'); }} />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Paginación */}
      {totalPaginas > 1 && (
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 28 }}>
          {Array.from({ length: totalPaginas }, (_, i) => i+1).map(n => (
            <button key={n} onClick={() => setPagina(n)} style={{
              padding: '5px 12px', borderRadius: 6, border: '1px solid #2d2d3d',
              background: n === pagina ? '#6c63ff' : '#1a1a24',
              color: n === pagina ? '#fff' : '#9090a0', cursor: 'pointer', fontSize: 12,
            }}>{n}</button>
          ))}
        </div>
      )}

      {/* Tabla de referencia de motivos */}
      <div style={{ background: '#1a1a24', border: '1px solid #2d2d3d', borderRadius: 10, overflow: 'hidden', marginBottom: 24 }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #2d2d3d' }}>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>TABLA DE REFERENCIA RÁPIDA</span>
          <span style={{ color: '#9090a0', fontSize: 12, marginLeft: 10 }}>Motivos de cambio</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #2d2d3d' }}>
                {['CÓDIGO','MOTIVO','CERRADO OBLIGATORIO','CONDICIÓN ESPECIAL'].map(h => (
                  <th key={h} style={{ padding: '8px 14px', textAlign: 'left', color: '#9090a0', fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MOTIVOS_REF.map(m => (
                <tr key={m.codigo} style={{ borderBottom: '1px solid #1e1e28' }}>
                  <td style={{ padding: '8px 14px', color: '#a78bfa', fontWeight: 700, textAlign: 'center' }}>{m.codigo}</td>
                  <td style={{ padding: '8px 14px', color: '#fff', fontWeight: 600 }}>{m.motivo}</td>
                  <td style={{ padding: '8px 14px' }}>
                    {m.cerrado === 'NO' ? (
                      <span>
                        <span style={{ color: '#fbbf24', fontWeight: 700 }}>NO </span>
                        <span style={{ color: '#fbbf24', fontSize: 11 }}>({m.nota_cerrado})</span>
                      </span>
                    ) : (
                      <span style={{ color: '#4ade80', fontWeight: 700 }}>SÍ</span>
                    )}
                  </td>
                  <td style={{ padding: '8px 14px', color: '#9090a0', fontSize: 11 }}>{m.condicion}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Imagen etiqueta */}
      <div style={{ marginBottom: 24 }}>
        <p style={{ color: '#9090a0', fontSize: 12, marginBottom: 8, fontWeight: 600 }}>REFERENCIA DE ETIQUETA</p>
        <img
          src="/etiqueta-cambios.jpeg"
          alt="Referencia etiqueta cambios"
          style={{ maxWidth: '100%', borderRadius: 10, border: '1px solid #2d2d3d' }}
          onError={e => { e.target.style.display='none'; }}
        />
      </div>

      {/* Modal nuevo cambio */}
      {modalAbierto && (
        <div style={{
          position: 'fixed', inset: 0, background: '#000000cc', zIndex: 1000,
          display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
          padding: '30px 16px', overflowY: 'auto',
        }}>
          <div style={{
            background: '#1a1a24', border: '1px solid #2d2d3d', borderRadius: 12,
            width: '100%', maxWidth: 680, padding: '24px 28px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, color: '#fff' }}>Nuevo cambio</h3>
              <button onClick={() => setModalAbierto(false)} style={{ background: 'none', border: 'none', color: '#9090a0', cursor: 'pointer', fontSize: 22, lineHeight: 1 }}>×</button>
            </div>

            {error && <div style={{ background: '#dc262622', color: '#fca5a5', borderRadius: 8, padding: '8px 14px', marginBottom: 14, fontSize: 13 }}>{error}</div>}

            {/* Cabecera del cambio */}
            <div style={{ background: '#0f0f18', border: '1px solid #2d2d3d', borderRadius: 8, padding: '14px 16px', marginBottom: 18 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Local *</label>
                  <select value={form.local_id} onChange={e => setForm(f => ({ ...f, local_id: e.target.value }))} style={inputStyle} required>
                    <option value="">— Elegir local —</option>
                    {locales.map(l => <option key={l.id} value={l.id}>{l.nombre} (#{l.id})</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Fecha de envío</label>
                  <input type="date" value={form.fecha} onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))} style={inputStyle} />
                </div>
              </div>
              {localFormInfo && (
                <div style={{ marginTop: 10, fontSize: 12, color: '#9090a0' }}>
                  <span>Local: <strong style={{ color: '#fff' }}>{localFormInfo.nombre}</strong></span>
                  <span style={{ marginLeft: 16 }}>N° Local: <strong style={{ color: '#a78bfa' }}>#{localFormInfo.id}</strong></span>
                </div>
              )}
            </div>

            {/* Items */}
            <label style={{ ...labelStyle, marginBottom: 10 }}>Productos a cambiar *</label>
            {form.items.map((item, idx) => (
              <div key={idx} style={{ background: '#0f0f18', border: '1px solid #2d2d3d', borderRadius: 8, padding: 14, marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ color: '#9090a0', fontSize: 11, fontWeight: 600 }}>Ítem {idx+1}</span>
                  {form.items.length > 1 && (
                    <button type="button" onClick={() => setForm(f => ({ ...f, items: f.items.filter((_,i) => i!==idx) }))}
                      style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>×</button>
                  )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr 70px', gap: 10, marginBottom: 10 }}>
                  <div>
                    <label style={labelStyle}>Código</label>
                    <input
                      value={item.codigo} placeholder="cód."
                      onChange={e => editarItem(idx, 'codigo', e.target.value)}
                      style={inputStyle} list={`codigos-${idx}`}
                    />
                    <datalist id={`codigos-${idx}`}>
                      {productos.filter(p => p.codigo_venta).map(p => (
                        <option key={p.id} value={p.codigo_venta}>{p.nombre}</option>
                      ))}
                    </datalist>
                  </div>
                  <div>
                    <label style={labelStyle}>Producto *</label>
                    <select value={item.producto_id} onChange={e => editarItem(idx, 'producto_id', e.target.value)} style={inputStyle} required>
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
                    <input type="number" min={1} value={item.cantidad}
                      onChange={e => editarItem(idx, 'cantidad', e.target.value)} style={inputStyle} />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Motivo *</label>
                  <select value={item.motivo_id} onChange={e => editarItem(idx, 'motivo_id', e.target.value)} style={inputStyle} required>
                    <option value="">— Motivo —</option>
                    {motivos.map(m => (
                      <option key={m.id} value={m.id}>{String(m.id).padStart(2,'0')} — {m.descripcion}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))}

            <button type="button" onClick={() => setForm(f => ({ ...f, items: [...f.items, { ...ITEM_VACIO }] }))}
              style={{ background: 'none', border: '1px dashed #2d2d3d', color: '#9090a0', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 13, width: '100%', marginBottom: 16 }}>
              + Agregar otro producto
            </button>

            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Notas (opcional)</label>
              <input value={form.notas} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))}
                style={inputStyle} placeholder="Observaciones adicionales" />
            </div>

            {/* Botones de acción */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button onClick={enviarCambio} disabled={enviando} style={{
                flex: 1, padding: '10px', background: '#6c63ff', color: '#fff',
                border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 14,
              }}>
                {enviando ? 'Enviando...' : 'Enviar al admin'}
              </button>
              <button onClick={exportarPDF} style={{
                padding: '10px 16px', background: '#0f0f18', border: '1px solid #2d2d3d',
                color: '#9090a0', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13,
              }}>
                Exportar PDF
              </button>
              <button onClick={copiarWSP} style={{
                padding: '10px 16px', background: '#0f0f18', border: '1px solid #16a34a44',
                color: '#4ade80', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13,
              }}>
                Copiar WSP
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal detalle (ampliar) */}
      {detalleModal && (
        <div style={{ position: 'fixed', inset: 0, background: '#000000cc', zIndex: 1001, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#1a1a24', border: '1px solid #2d2d3d', borderRadius: 12, width: '100%', maxWidth: 560, padding: '24px 28px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, color: '#fff' }}>Detalle del cambio</h3>
              <button onClick={() => setDetalleModal(null)} style={{ background: 'none', border: 'none', color: '#9090a0', cursor: 'pointer', fontSize: 22 }}>×</button>
            </div>
            <div style={{ marginBottom: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div><span style={{ color: '#9090a0', fontSize: 12 }}>Local</span><br /><span style={{ color: '#fff', fontWeight: 600 }}>{detalleModal.local_nombre}</span></div>
              <div><span style={{ color: '#9090a0', fontSize: 12 }}>Fecha</span><br /><span style={{ color: '#fff' }}>{formatFecha(detalleModal.fecha)}</span></div>
              <div><span style={{ color: '#9090a0', fontSize: 12 }}>Estado</span><br />
                <span style={{ fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: (colorEstado[detalleModal.estado]||'#888')+'22', color: colorEstado[detalleModal.estado]||'#888' }}>
                  {detalleModal.estado}
                </span>
              </div>
              {detalleModal.nota_admin && (
                <div style={{ gridColumn: '1/-1' }}>
                  <span style={{ color: '#9090a0', fontSize: 12 }}>Nota del admin</span><br />
                  <span style={{ color: '#fbbf24' }}>{detalleModal.nota_admin}</span>
                </div>
              )}
            </div>
            {detalleModal.notas && <p style={{ color: '#9090a0', fontSize: 13, marginBottom: 14 }}>Notas: {detalleModal.notas}</p>}
            {detalleModal.items?.length > 0 && (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #2d2d3d' }}>
                    {['Código','Producto','Cant.','Motivo'].map(h => (
                      <th key={h} style={{ padding: '6px 10px', textAlign: 'left', color: '#9090a0', fontSize: 11, fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {detalleModal.items.map(i => (
                    <tr key={i.id} style={{ borderBottom: '1px solid #1e1e28', color: '#ccc' }}>
                      <td style={{ padding: '8px 10px', color: '#a78bfa', fontFamily: 'monospace' }}>{i.codigo_venta || '—'}</td>
                      <td style={{ padding: '8px 10px', fontWeight: 600, color: '#fff' }}>{i.producto_nombre}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 700, color: '#6c63ff' }}>{i.cantidad}</td>
                      <td style={{ padding: '8px 10px', color: '#9090a0', fontSize: 12 }}>{i.motivo_descripcion}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function BtnAccion({ label, color, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: '3px 10px', background: color + '22', border: `1px solid ${color}44`,
      color, borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 600,
    }}>
      {label}
    </button>
  );
}

const labelStyle = { display: 'block', fontSize: 11, fontWeight: 600, color: '#9090a0', marginBottom: 4 };
const inputStyle = { width: '100%', padding: '7px 10px', border: '1px solid #2d2d3d', borderRadius: 6, fontSize: 13, background: '#1a1a24', color: '#fff', boxSizing: 'border-box' };
const selectStyle = { padding: '7px 10px', border: '1px solid #2d2d3d', borderRadius: 6, fontSize: 13, background: '#1a1a24', color: '#fff', cursor: 'pointer' };

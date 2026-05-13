import { useEffect, useState, useRef } from 'react';
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
  const [tab, setTab] = useState('pedidos'); // 'pedidos' | 'catalogo'
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [seleccionado, setSeleccionado] = useState(null);
  const [detalle, setDetalle] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [productos, setProductos] = useState([]);
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [accionando, setAccionando] = useState(null); // id del pedido en proceso de acción

  const [busqueda, setBusqueda] = useState('');
  const [mostrarDropdown, setMostrarDropdown] = useState(false);
  const busquedaRef = useRef(null);

  const [catalogoBusqueda, setCatalogoBusqueda] = useState('');
  const [catalogoDetalle, setCatalogoDetalle] = useState(null);

  const [form, setForm] = useState({
    local_id: usuario?.local_id || '',
    tipo: 'programado',
    fecha_programada: '',
    notas: '',
    items: [], // { producto_id, pack: '', cortes: '', pale: '' }
  });

  const misLocales = usuario?.local_ids?.length > 1
    ? usuario.local_ids.map((id, i) => ({ id, nombre: i === 0 ? usuario.local_nombre : `Local ${id}` }))
    : null;

  useEffect(() => {
    cargarPedidos();
    cargarProductos();
  }, []);

  // Cerrar dropdown si click afuera
  useEffect(() => {
    function handleClick(e) {
      if (busquedaRef.current && !busquedaRef.current.contains(e.target)) {
        setMostrarDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function cargarPedidos() {
    setCargando(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/pedidos`, {
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

  async function cargarProductos() {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/productos`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setProductos(Array.isArray(data) ? data.filter(p => p.activo !== 0) : []);
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
    } catch { setDetalle(null); }
  }

  async function cambiarEstado(id, nuevoEstado) {
    setAccionando(id);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/pedidos/${id}/estado`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ estado: nuevoEstado }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || 'Error al actualizar el pedido');
        return;
      }
      // Si se cancela el que estaba expandido, cerrarlo
      if (seleccionado === id) { setSeleccionado(null); setDetalle(null); }
      cargarPedidos();
    } catch {
      setError('Error al actualizar el pedido');
    } finally {
      setAccionando(null);
    }
  }

  // Búsqueda de productos
  const productosFiltrados = busqueda.length >= 1
    ? productos
        .filter(p => p.nombre.toLowerCase().includes(busqueda.toLowerCase()))
        .filter(p => !form.items.some(i => i.producto_id === p.id))
        .slice(0, 8)
    : [];

  function agregarProducto(producto) {
    setForm(f => ({
      ...f,
      items: [...f.items, { producto_id: producto.id, pack: '', cortes: '', pale: '' }],
    }));
    setBusqueda('');
    setMostrarDropdown(false);
  }

  function quitarItem(idx) {
    setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));
  }

  function editarItemUnidad(idx, unidad, valor) {
    setForm(f => {
      const items = [...f.items];
      const item = { ...items[idx] };
      if (valor !== '' && parseInt(valor) > 0) {
        // Llenar la unidad seleccionada y limpiar las otras
        item.pack = unidad === 'pack' ? valor : '';
        item.cortes = unidad === 'cortes' ? valor : '';
        item.pale = unidad === 'pale' ? valor : '';
      } else {
        item[unidad] = valor;
      }
      items[idx] = item;
      return { ...f, items };
    });
  }

  // ─── Unidades de medida ───────────────────────────────────────────
  // bulto = botella = unidad (lo más chico)
  // 1 pack  = Z botellas   (unidades_por_bulto, col Z)
  // 1 corte = AA packs     (packs_por_corte, col AA)
  // 1 pale  = AC packs     (unidades_por_pale, col AC)
  //
  // cantidad_bultos (lo que se almacena) = botellas totales
  //   pack  → ingresado × Z
  //   corte → ingresado × AA × Z
  //   pale  → ingresado × AC × Z
  //
  // packs totales (para volumen y monto)
  //   pack  → ingresado
  //   corte → ingresado × AA
  //   pale  → ingresado × AC
  //
  // volumen = packs × unit_value (col X)
  // ─────────────────────────────────────────────────────────────────

  function _getProd(item) {
    return productos.find(p => p.id === item.producto_id);
  }

  function getUnidadActiva(item) {
    if (item.pack !== '' && parseInt(item.pack) > 0) return 'pack';
    if (item.cortes !== '' && parseInt(item.cortes) > 0) return 'cortes';
    if (item.pale !== '' && parseInt(item.pale) > 0) return 'pale';
    return null;
  }

  // Packs totales (necesario para volumen y monto)
  function getPacksItem(item) {
    const prod = _getProd(item);
    const packsPorCorte = prod?.packs_por_corte || 1; // col AA
    const packsPorPale  = prod?.unidades_por_pale || 1; // col AC
    if (item.pack   !== '' && parseInt(item.pack)   > 0) return parseInt(item.pack);
    if (item.cortes !== '' && parseInt(item.cortes) > 0) return parseInt(item.cortes) * packsPorCorte;
    if (item.pale   !== '' && parseInt(item.pale)   > 0) return parseInt(item.pale)   * packsPorPale;
    return 0;
  }

  // Bultos totales = botellas totales (lo que se guarda en la DB)
  function getCantidadItem(item) {
    const prod = _getProd(item);
    const unidsPorPack = prod?.unidades_por_bulto || 1; // col Z
    return getPacksItem(item) * unidsPorPack;
  }

  // Volumen = packs × unit_value (col X)
  function getVolumenItem(item) {
    const prod = _getProd(item);
    if (!prod?.unit_value) return null;
    const packs = getPacksItem(item);
    return packs > 0 ? (packs * parseFloat(prod.unit_value)).toFixed(2) : null;
  }

  // Monto = packs × precio_sugerido
  function getMontoItem(item) {
    const prod = _getProd(item);
    if (!prod?.precio_sugerido) return null;
    const packs = getPacksItem(item);
    return packs > 0 ? (packs * parseFloat(prod.precio_sugerido)).toFixed(2) : null;
  }

  function abrirModal() {
    setError('');
    setForm({
      local_id: usuario?.local_id || '',
      tipo: 'programado',
      fecha_programada: '',
      notas: '',
      items: [],
    });
    setBusqueda('');
    setMostrarModal(true);
  }

  // estadoDestino: 'borrador' (guardar para después) | 'confirmado' (enviar ahora)
  async function guardarPedido(e, estadoDestino) {
    e.preventDefault();
    setEnviando(true);
    setError('');

    const itemsValidos = form.items
      .map(i => {
        const prod = _getProd(i);
        const unidadActiva = getUnidadActiva(i);
        const packs = getPacksItem(i);
        const bultos = getCantidadItem(i);
        // cantidad_display: el número que ingresó el usuario (sin conversión)
        const cantDisplay = unidadActiva
          ? parseInt(i[unidadActiva]) || 0
          : 0;
        return {
          producto_id: i.producto_id,
          cantidad_bultos: bultos,
          packs,
          cantidad_display: cantDisplay,
          unidad_display: unidadActiva || 'pack',
          precio_unitario: prod?.precio_sugerido ? parseFloat(prod.precio_sugerido) : null,
        };
      })
      .filter(i => i.producto_id && i.cantidad_bultos > 0);

    if (itemsValidos.length === 0) {
      setError('Agregá al menos un producto con cantidad');
      setEnviando(false);
      return;
    }

    // Totales del pedido
    const totalPacks = itemsValidos.reduce((acc, i) => acc + (i.packs || 0), 0);
    const totalVolumen = itemsValidos.reduce((acc, i) => {
      const prod = productos.find(p => p.id === i.producto_id);
      return acc + (i.packs || 0) * parseFloat(prod?.unit_value || 0);
    }, 0);

    try {
      const token = localStorage.getItem('token');
      const payload = {
        local_id: parseInt(form.local_id),
        tipo: form.tipo,
        fecha_pedido: new Date().toISOString().slice(0, 10),
        fecha_entrega_estimada: form.fecha_programada || null,
        notas: form.notas || null,
        estado: estadoDestino,
        total_packs: totalPacks,
        total_volumen: parseFloat(totalVolumen.toFixed(2)),
        items: itemsValidos,
      };

      const res = await fetch(`${API_URL}/api/pedidos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Error al guardar el pedido');
        return;
      }

      setMostrarModal(false);
      cargarPedidos();
    } catch {
      setError('Error al guardar el pedido');
    } finally {
      setEnviando(false);
    }
  }

  // Catálogo filtrado
  const catalogoFiltrado = catalogoBusqueda
    ? productos.filter(p => p.nombre.toLowerCase().includes(catalogoBusqueda.toLowerCase()))
    : productos;

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>

      {/* Tabs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #2d2d3d' }}>
          {[
            { id: 'pedidos', label: 'Mis pedidos' },
            { id: 'catalogo', label: 'Catálogo' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: '10px 20px',
                fontSize: 14, fontWeight: tab === t.id ? 700 : 400,
                color: tab === t.id ? '#a78bfa' : '#9090a0',
                borderBottom: tab === t.id ? '2px solid #6c63ff' : '2px solid transparent',
                marginBottom: -1,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
        {tab === 'pedidos' && (
          <button
            onClick={abrirModal}
            style={{ padding: '8px 18px', background: '#6c63ff', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}
          >
            + Nuevo pedido
          </button>
        )}
      </div>

      {/* ─── TAB: MIS PEDIDOS ─── */}
      {tab === 'pedidos' && (
        <>
          {cargando ? (
            <p style={{ color: '#9090a0' }}>Cargando...</p>
          ) : pedidos.length === 0 ? (
            <p style={{ color: '#9090a0' }}>No tenés pedidos registrados.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {pedidos.map(p => (
                <div key={p.id} style={{
                  background: '#1a1a24',
                  border: `1px solid ${p.estado === 'borrador' ? '#4a4a2a' : '#2d2d3d'}`,
                  borderRadius: 8,
                }}>
                  <div
                    onClick={() => verDetalle(p.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', cursor: 'pointer' }}
                  >
                    <div style={{ flex: 1 }}>
                      <span style={{ fontWeight: 600, color: '#fff' }}>{p.local_nombre}</span>
                      {p.tipo === 'forzado' && (
                        <span style={{ marginLeft: 8, fontSize: 12, color: '#d97706', fontWeight: 600 }}>⚡ Forzado</span>
                      )}
                      {p.estado === 'borrador' && (
                        <span style={{ marginLeft: 8, fontSize: 11, color: '#a0803a', fontWeight: 600 }}>— EN ESPERA</span>
                      )}
                    </div>
                    <div style={{ fontSize: 13, color: '#9090a0' }}>{formatFecha(p.fecha_pedido)}</div>
                    <div style={{ fontSize: 13, color: '#9090a0' }}>{p.total_bultos} bultos</div>
                    <span style={{
                      fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 12,
                      background: (colorEstado[p.estado] || '#888') + '22', color: colorEstado[p.estado] || '#888',
                    }}>
                      {p.estado}
                    </span>
                    <span style={{ color: '#555', fontSize: 14 }}>{seleccionado === p.id ? '▲' : '▼'}</span>
                  </div>

                  {/* Acciones para borradores */}
                  {p.estado === 'borrador' && (
                    <div style={{
                      display: 'flex', gap: 8, padding: '0 16px 12px', borderTop: '1px solid #2a2a1a',
                    }}
                      onClick={e => e.stopPropagation()}
                    >
                      <button
                        onClick={() => cambiarEstado(p.id, 'confirmado')}
                        disabled={accionando === p.id}
                        style={{
                          padding: '6px 14px', fontSize: 12, fontWeight: 600,
                          background: '#6c63ff', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer',
                        }}
                      >
                        {accionando === p.id ? '...' : '↑ Enviar pedido'}
                      </button>
                      <button
                        onClick={() => cambiarEstado(p.id, 'cancelado')}
                        disabled={accionando === p.id}
                        style={{
                          padding: '6px 14px', fontSize: 12, fontWeight: 600,
                          background: 'none', color: '#dc2626', border: '1px solid #dc262644', borderRadius: 6, cursor: 'pointer',
                        }}
                      >
                        Cancelar
                      </button>
                    </div>
                  )}

                  {seleccionado === p.id && detalle && (
                    <div style={{ borderTop: '1px solid #2d2d3d', padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: 24, marginBottom: 10, fontSize: 13, color: '#9090a0' }}>
                        {detalle.fecha_entrega_estimada && (
                          <span>Entrega estimada: <strong style={{ color: '#ccc' }}>{formatFecha(detalle.fecha_entrega_estimada)}</strong></span>
                        )}
                        {detalle.notas && <span>Nota: <strong style={{ color: '#ccc' }}>{detalle.notas}</strong></span>}
                      </div>
                      {detalle.items?.length > 0 && (
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                          <thead>
                            <tr style={{ color: '#606070', borderBottom: '1px solid #2d2d3d' }}>
                              <th style={{ textAlign: 'left', padding: '4px 8px' }}>Producto</th>
                              <th style={{ textAlign: 'right', padding: '4px 8px' }}>Bultos</th>
                            </tr>
                          </thead>
                          <tbody>
                            {detalle.items.map(i => {
                              const cantLabel = i.cantidad_display != null
                                ? `${i.cantidad_display} ${i.unidad_display}`
                                : `${i.cantidad_bultos} bultos`;
                              return (
                              <tr key={i.id} style={{ borderBottom: '1px solid #1e1e28', color: '#ccc' }}>
                                <td style={{ padding: '4px 8px' }}>{i.producto_nombre}</td>
                                <td style={{ padding: '4px 8px', textAlign: 'right' }}>{cantLabel}</td>
                              </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ─── TAB: CATÁLOGO ─── */}
      {tab === 'catalogo' && (
        <div>
          <input
            value={catalogoBusqueda}
            onChange={e => setCatalogoBusqueda(e.target.value)}
            placeholder="Buscar producto..."
            style={{ ...inputStyle, maxWidth: 360, marginBottom: 16 }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {catalogoFiltrado.map(p => (
              <div key={p.id} style={{ background: '#1a1a24', border: '1px solid #2d2d3d', borderRadius: 8 }}>
                <div
                  onClick={() => setCatalogoDetalle(catalogoDetalle === p.id ? null : p.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 16px', cursor: 'pointer' }}
                >
                  <div style={{ flex: 1, fontWeight: 600, color: '#fff', fontSize: 14 }}>{p.nombre}</div>
                  {p.codigo_venta && <div style={{ fontSize: 12, color: '#9090a0' }}>{p.codigo_venta}</div>}
                  {p.precio_sugerido && (
                    <div style={{ fontSize: 13, color: '#a78bfa', fontWeight: 600 }}>${parseFloat(p.precio_sugerido).toFixed(2)}</div>
                  )}
                  <span style={{ color: '#555', fontSize: 13 }}>{catalogoDetalle === p.id ? '▲' : '▼'}</span>
                </div>
                {catalogoDetalle === p.id && (
                  <div style={{ borderTop: '1px solid #2d2d3d', padding: '12px 16px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, fontSize: 13 }}>
                    <Campo label="EAN" valor={p.ean} />
                    <Campo label="Código venta" valor={p.codigo_venta} />
                    <Campo label="Precio sugerido" valor={p.precio_sugerido ? `$${parseFloat(p.precio_sugerido).toFixed(2)}` : '—'} />
                    <Campo label="Unidades/pack (botellas)" valor={p.unidades_por_bulto} />
                    <Campo label="Packs por corte" valor={p.packs_por_corte} />
                    <Campo label="Packs por pale" valor={p.unidades_por_pale} />
                    <Campo label="Unit value" valor={p.unit_value} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── MODAL NUEVO PEDIDO ─── */}
      {mostrarModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16,
        }}>
          <div style={{
            background: '#1a1a24', border: '1px solid #2d2d3d', borderRadius: 12,
            width: '100%', maxWidth: 860, maxHeight: '90vh', overflowY: 'auto', padding: 28,
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
              <div>
                <h3 style={{ margin: 0, color: '#fff', fontSize: 18 }}>Nuevo pedido</h3>
                <span style={{ fontSize: 12, color: '#555', marginTop: 2, display: 'block' }}>#————</span>
              </div>
              <button
                onClick={() => setMostrarModal(false)}
                style={{ background: 'none', border: 'none', color: '#9090a0', fontSize: 20, cursor: 'pointer', padding: 0, lineHeight: 1 }}
              >
                ×
              </button>
            </div>

            <form onSubmit={e => e.preventDefault()}>
              {/* Tipo + Fecha programada */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                {misLocales && (
                  <div style={{ gridColumn: '1 / -1' }}>
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
                    <option value="programado">Habitual</option>
                    <option value="forzado">Forzado</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Fecha programada <span style={{ color: '#555', fontWeight: 400 }}>(fecha que debe llegar)</span></label>
                  <input
                    type="date"
                    value={form.fecha_programada}
                    onChange={e => setForm(f => ({ ...f, fecha_programada: e.target.value }))}
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Buscador de productos */}
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Productos</label>
                <div style={{ position: 'relative' }} ref={busquedaRef}>
                  <input
                    value={busqueda}
                    onChange={e => { setBusqueda(e.target.value); setMostrarDropdown(true); }}
                    onFocus={() => setMostrarDropdown(true)}
                    placeholder="🔍 Buscar y agregar producto..."
                    style={inputStyle}
                    autoComplete="off"
                  />
                  {mostrarDropdown && productosFiltrados.length > 0 && (
                    <div style={{
                      position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10,
                      background: '#0f0f13', border: '1px solid #2d2d3d', borderRadius: '0 0 8px 8px',
                      maxHeight: 220, overflowY: 'auto',
                    }}>
                      {productosFiltrados.map(p => (
                        <div
                          key={p.id}
                          onClick={() => agregarProducto(p)}
                          style={{
                            padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #1e1e28',
                            color: '#ccc', fontSize: 13,
                            transition: 'background 0.15s',
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = '#1a1a24'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <span style={{ fontWeight: 600, color: '#fff' }}>{p.nombre}</span>
                          {p.precio_sugerido && (
                            <span style={{ marginLeft: 8, color: '#a78bfa', fontSize: 12 }}>
                              ${parseFloat(p.precio_sugerido).toFixed(2)}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Tabla de productos agregados */}
              {form.items.length > 0 && (
                <div style={{ marginBottom: 20, border: '1px solid #2d2d3d', borderRadius: 8, overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: '#0f0f13', color: '#606070' }}>
                        <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 600 }}>Producto</th>
                        <th style={{ textAlign: 'center', padding: '8px 8px', fontWeight: 600, width: 72 }}>Pack</th>
                        <th style={{ textAlign: 'center', padding: '8px 8px', fontWeight: 600, width: 72 }}>Cortes</th>
                        <th style={{ textAlign: 'center', padding: '8px 8px', fontWeight: 600, width: 72 }}>Pale</th>
                        <th style={{ textAlign: 'center', padding: '8px 6px', fontWeight: 600, width: 58, color: '#4a4a6a', fontSize: 11 }}>Packs</th>
                        <th style={{ textAlign: 'center', padding: '8px 6px', fontWeight: 600, width: 60, color: '#4a4a6a', fontSize: 11 }}>Bultos</th>
                        <th style={{ textAlign: 'right', padding: '8px 12px', fontWeight: 600, width: 80 }}>Monto$</th>
                        <th style={{ width: 32 }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {form.items.map((item, idx) => {
                        const prod = productos.find(p => p.id === item.producto_id);
                        const activa = getUnidadActiva(item);
                        const packs  = getPacksItem(item);
                        const bultos = getCantidadItem(item);
                        const monto  = getMontoItem(item);
                        return (
                          <tr key={idx} style={{ borderTop: '1px solid #2d2d3d', color: '#ccc' }}>
                            <td style={{ padding: '8px 12px', fontWeight: 500 }}>
                              {prod?.nombre || '—'}
                            </td>
                            {['pack', 'cortes', 'pale'].map(unidad => (
                              <td key={unidad} style={{ padding: '6px 4px', textAlign: 'center' }}>
                                <input
                                  type="number" min={0} placeholder="—"
                                  value={item[unidad]}
                                  disabled={activa !== null && activa !== unidad}
                                  onChange={e => editarItemUnidad(idx, unidad, e.target.value)}
                                  style={{
                                    width: 60, padding: '5px 6px', textAlign: 'center',
                                    background: activa !== null && activa !== unidad ? '#0a0a10' : '#0f0f13',
                                    border: `1px solid ${activa === unidad ? '#6c63ff' : '#2d2d3d'}`,
                                    borderRadius: 6, color: activa !== null && activa !== unidad ? '#444' : '#fff',
                                    fontSize: 13, boxSizing: 'border-box',
                                    cursor: activa !== null && activa !== unidad ? 'not-allowed' : 'text',
                                  }}
                                />
                              </td>
                            ))}
                            <td style={{ padding: '8px 6px', textAlign: 'center', color: packs > 0 ? '#6c63ff' : '#333', fontSize: 12, fontWeight: 600 }}>
                              {packs > 0 ? packs : '—'}
                            </td>
                            <td style={{ padding: '8px 6px', textAlign: 'center', color: bultos > 0 ? '#9090a0' : '#333', fontSize: 12 }}>
                              {bultos > 0 ? bultos : '—'}
                            </td>
                            <td style={{ padding: '8px 12px', textAlign: 'right', color: monto ? '#a78bfa' : '#444', fontWeight: 600 }}>
                              {monto ? `$${monto}` : '—'}
                            </td>
                            <td style={{ padding: '8px 4px', textAlign: 'center' }}>
                              <button
                                type="button" onClick={() => quitarItem(idx)}
                                style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: 0 }}
                              >
                                ×
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {form.items.length === 0 && (
                <div style={{ textAlign: 'center', padding: '20px', color: '#555', fontSize: 13, border: '1px dashed #2d2d3d', borderRadius: 8, marginBottom: 20 }}>
                  Buscá y agregá productos arriba
                </div>
              )}

              {/* Nota */}
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Nota <span style={{ color: '#555', fontWeight: 400 }}>(opcional)</span></label>
                <input
                  value={form.notas}
                  onChange={e => setForm(f => ({ ...f, notas: e.target.value }))}
                  placeholder="Ej: Entregar antes del viernes"
                  style={inputStyle}
                />
              </div>

              {error && <p style={{ color: '#dc2626', fontSize: 13, margin: '0 0 12px' }}>{error}</p>}

              {/* Acciones */}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => setMostrarModal(false)}
                  style={{ padding: '9px 20px', background: 'none', border: '1px solid #2d2d3d', color: '#9090a0', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}
                >
                  Cancelar
                </button>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    type="button"
                    disabled={enviando}
                    onClick={e => guardarPedido(e, 'borrador')}
                    style={{
                      padding: '9px 20px', background: 'none', border: '1px solid #a0803a',
                      color: '#a0803a', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13,
                    }}
                  >
                    {enviando ? '...' : 'Guardar para después'}
                  </button>
                  <button
                    type="button"
                    disabled={enviando}
                    onClick={e => guardarPedido(e, 'confirmado')}
                    style={{
                      padding: '9px 24px', background: '#6c63ff', color: '#fff',
                      border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13,
                    }}
                  >
                    {enviando ? 'Enviando...' : 'Enviar pedido'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Campo({ label, valor }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: '#606070', fontWeight: 600, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 13, color: '#ccc' }}>{valor ?? '—'}</div>
    </div>
  );
}

function formatFecha(fecha) {
  if (!fecha) return '—';
  return fecha.slice(0, 10).split('-').reverse().join('/');
}

const labelStyle = { display: 'block', fontSize: 12, fontWeight: 600, color: '#9090a0', marginBottom: 4 };
const inputStyle = {
  width: '100%', padding: '8px 10px', border: '1px solid #2d2d3d',
  borderRadius: 6, fontSize: 14, background: '#0f0f13', color: '#fff', boxSizing: 'border-box',
};

import { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';

const ESTADOS = ['borrador', 'confirmado', 'en_transito', 'entregado', 'cancelado'];
const colorEstado = {
  borrador: '#888', confirmado: '#2563eb', en_transito: '#d97706',
  entregado: '#16a34a', cancelado: '#dc2626',
};

const thS = {
  padding: '0.5rem 0.8rem', textAlign: 'left', color: '#9090a0',
  fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', whiteSpace: 'nowrap',
};

function BadgeEstado({ estado }) {
  return (
    <span style={{
      fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: 10,
      background: (colorEstado[estado] || '#888') + '22', color: colorEstado[estado] || '#888',
    }}>{estado?.replace('_', ' ')}</span>
  );
}

function exportarExcel(datos, nombre) {
  const ws = XLSX.utils.json_to_sheet(datos);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Datos');
  XLSX.writeFile(wb, `${nombre}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

// ─── Tab: Pedidos activos / Historial ────────────────────────────────────────
function TabPedidos({ pedidos, locales, unitG, recargar, esHistorial }) {
  const [expandido, setExpandido] = useState(null);
  const [detalle, setDetalle] = useState({});
  const [notaEdit, setNotaEdit] = useState('');
  const [estadoEdit, setEstadoEdit] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [eliminando, setEliminando] = useState(null);
  const [error, setError] = useState('');

  // Filtros (solo historial)
  const [filtros, setFiltros] = useState({ desde: '', hasta: '', local_id: '', estado: '', repositor: '' });

  const pedidosFiltrados = (() => {
    let lista = esHistorial ? pedidos : pedidos.filter(p => ['borrador', 'confirmado', 'en_transito'].includes(p.estado));
    if (esHistorial) {
      if (filtros.desde) lista = lista.filter(p => p.fecha_pedido >= filtros.desde);
      if (filtros.hasta) lista = lista.filter(p => p.fecha_pedido <= filtros.hasta);
      if (filtros.local_id) lista = lista.filter(p => String(p.local_id) === filtros.local_id);
      if (filtros.estado) lista = lista.filter(p => p.estado === filtros.estado);
      if (filtros.repositor) lista = lista.filter(p =>
        `${p.repositor_nombre} ${p.repositor_apellido}`.toLowerCase().includes(filtros.repositor.toLowerCase())
      );
    }
    return lista;
  })();

  async function verDetalle(id) {
    if (expandido === id) { setExpandido(null); return; }
    setExpandido(id);
    setError('');
    if (detalle[id]) {
      const p = pedidos.find(x => x.id === id);
      setNotaEdit(p?.notas || '');
      setEstadoEdit(p?.estado || '');
      return;
    }
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/pedidos/${id}`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setDetalle(d => ({ ...d, [id]: data }));
    setNotaEdit(data.notas || '');
    setEstadoEdit(data.estado || '');
  }

  async function guardarCambios(id) {
    setGuardando(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/pedidos/${id}/estado`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ estado: estadoEdit, notas: notaEdit }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error); return; }
      await recargar();
      setDetalle(d => ({ ...d, [id]: { ...d[id], notas: notaEdit, estado: estadoEdit } }));
    } finally {
      setGuardando(false);
    }
  }

  async function eliminarPedido(id, localNombre) {
    if (!window.confirm(`¿Eliminar el pedido de ${localNombre}? Esta acción no se puede deshacer.`)) return;
    setEliminando(id);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/pedidos/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { const d = await res.json(); setError(d.error); return; }
      if (expandido === id) setExpandido(null);
      await recargar();
    } finally {
      setEliminando(null);
    }
  }

  function exportar() {
    const filas = pedidosFiltrados.map(p => ({
      Local: p.local_nombre,
      Repositor: p.repositor_nombre ? `${p.repositor_nombre} ${p.repositor_apellido}` : '—',
      'Fecha pedido': p.fecha_pedido?.slice(0, 10),
      'Fecha entrega est.': p.fecha_entrega_estimada?.slice(0, 10) || '—',
      Packs: p.total_packs ?? '—',
      Bultos: p.total_bultos,
      Volumen: p.total_volumen != null ? +p.total_volumen : +((p.total_bultos || 0) * unitG).toFixed(2),
      Estado: p.estado,
      Notas: p.notas || '',
    }));
    exportarExcel(filas, esHistorial ? 'historial_pedidos' : 'pedidos_activos');
  }

  return (
    <div>
      {/* Filtros historial */}
      {esHistorial && (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: '1rem', background: '#1a1a24', border: '1px solid #2d2d3d', borderRadius: 8, padding: '0.8rem 1rem' }}>
          <input className="form-control" type="date" value={filtros.desde} onChange={e => setFiltros(f => ({ ...f, desde: e.target.value }))} style={{ width: 140 }} placeholder="Desde" title="Fecha desde" />
          <input className="form-control" type="date" value={filtros.hasta} onChange={e => setFiltros(f => ({ ...f, hasta: e.target.value }))} style={{ width: 140 }} placeholder="Hasta" title="Fecha hasta" />
          <select className="form-control" value={filtros.local_id} onChange={e => setFiltros(f => ({ ...f, local_id: e.target.value }))} style={{ width: 180 }}>
            <option value="">Todos los locales</option>
            {locales.map(l => <option key={l.id} value={l.id}>{l.nombre}</option>)}
          </select>
          <select className="form-control" value={filtros.estado} onChange={e => setFiltros(f => ({ ...f, estado: e.target.value }))} style={{ width: 150 }}>
            <option value="">Todos los estados</option>
            {ESTADOS.map(e => <option key={e} value={e}>{e.replace('_', ' ')}</option>)}
          </select>
          <input className="form-control" value={filtros.repositor} onChange={e => setFiltros(f => ({ ...f, repositor: e.target.value }))} placeholder="Repositor..." style={{ width: 160 }} />
          <button onClick={() => setFiltros({ desde: '', hasta: '', local_id: '', estado: '', repositor: '' })} style={{ padding: '0.4rem 0.8rem', background: '#2d2d3d', border: 'none', borderRadius: 6, color: '#9090a0', cursor: 'pointer', fontSize: '0.82rem' }}>
            Limpiar
          </button>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
        <span style={{ color: '#9090a0', fontSize: '0.85rem' }}>{pedidosFiltrados.length} pedido{pedidosFiltrados.length !== 1 ? 's' : ''}</span>
        <button onClick={exportar} style={{ padding: '0.4rem 0.9rem', background: '#38a16920', border: '1px solid #38a16940', borderRadius: 6, color: '#68d391', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>
          Exportar Excel
        </button>
      </div>

      {pedidosFiltrados.length === 0 ? (
        <p className="msg-vacio">No hay pedidos.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {pedidosFiltrados.map(p => {
            // Volumen: usa total_volumen (guardado por producto×unit_value) si está disponible
            // Fallback para pedidos viejos: total_bultos × unitG
            const vol = p.total_volumen != null
              ? parseFloat(p.total_volumen).toFixed(2)
              : ((p.total_bultos || 0) * unitG).toFixed(2);
            const abierto = expandido === p.id;
            const det = detalle[p.id];
            return (
              <div key={p.id} style={{ background: '#1a1a24', border: `1px solid ${abierto ? '#6c63ff40' : '#2d2d3d'}`, borderRadius: 8, transition: 'border-color 0.2s' }}>
                {/* Fila principal */}
                <div onClick={() => verDetalle(p.id)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', cursor: 'pointer', flexWrap: 'wrap' }}>
                  <div style={{ flex: '1 1 160px' }}>
                    <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.9rem' }}>{p.local_nombre}</div>
                    <div style={{ fontSize: '0.78rem', color: '#606070', marginTop: 2 }}>
                      {p.repositor_nombre ? `${p.repositor_nombre} ${p.repositor_apellido}` : 'Sin repositor'}
                    </div>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#9090a0', whiteSpace: 'nowrap' }}>
                    <div>Ingreso: {p.fecha_pedido?.slice(0, 10)}</div>
                    <div style={{ marginTop: 2 }}>Entrega: {p.fecha_entrega_estimada?.slice(0, 10) || '—'}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, color: '#6c63ff', fontSize: '1rem' }}>{vol} <span style={{ fontSize: '0.7rem', fontWeight: 400, color: '#606070' }}>vol</span></div>
                    <div style={{ fontSize: '0.78rem', color: '#9090a0' }}>
                      {p.total_packs != null ? `${p.total_packs} packs` : `${p.total_bultos} bultos`}
                    </div>
                  </div>
                  <BadgeEstado estado={p.estado} />
                  <span style={{ color: '#606070', fontSize: '0.8rem', marginLeft: 'auto' }}>{abierto ? '▲' : '▼'}</span>
                </div>

                {/* Detalle expandido */}
                {abierto && (
                  <div style={{ borderTop: '1px solid #2d2d3d', padding: '14px 16px' }}>
                    {error && <div className="msg-error" style={{ marginBottom: 10 }}>{error}</div>}

                    {/* Items */}
                    {!det ? (
                      <p style={{ color: '#606070', fontSize: '0.85rem' }}>Cargando detalle...</p>
                    ) : det.items?.length > 0 ? (
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem', marginBottom: 14 }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid #2d2d3d' }}>
                            <th style={thS}>Código</th>
                            <th style={thS}>Producto</th>
                            <th style={{ ...thS, textAlign: 'right' }}>Cantidad</th>
                            <th style={{ ...thS, textAlign: 'right' }}>Packs</th>
                            <th style={{ ...thS, textAlign: 'right' }}>Bultos</th>
                            <th style={{ ...thS, textAlign: 'right' }}>Vol.</th>
                          </tr>
                        </thead>
                        <tbody>
                          {det.items.map(i => {
                            // Volumen por ítem: packs × unit_value del producto
                            const itemPacks = i.packs ?? Math.round((i.cantidad_bultos || 0) / Math.max(i.unidades_por_bulto || 1, 1));
                            const itemVol = (itemPacks * parseFloat(i.unit_value || 0)).toFixed(2);
                            // Unidad a mostrar: la original si está guardada, o "bultos" como fallback
                            const cantLabel = i.cantidad_display != null
                              ? `${i.cantidad_display} ${i.unidad_display}`
                              : `${i.cantidad_bultos} bultos`;
                            return (
                            <tr key={i.id} style={{ borderBottom: '1px solid #1a1a2e' }}>
                              <td style={{ padding: '4px 8px', color: '#606070' }}>{i.codigo_venta || '—'}</td>
                              <td style={{ padding: '4px 8px', color: '#e0e0e0' }}>{i.producto_nombre}</td>
                              <td style={{ padding: '4px 8px', textAlign: 'right', color: '#fff', fontWeight: 600 }}>{cantLabel}</td>
                              <td style={{ padding: '4px 8px', textAlign: 'right', color: '#9090a0' }}>{itemPacks}</td>
                              <td style={{ padding: '4px 8px', textAlign: 'right', color: '#606070' }}>{i.cantidad_bultos}</td>
                              <td style={{ padding: '4px 8px', textAlign: 'right', color: '#6c63ff', fontWeight: 600 }}>{itemVol}</td>
                            </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    ) : (
                      <p style={{ color: '#606070', fontSize: '0.83rem', marginBottom: 14 }}>Sin productos en este pedido.</p>
                    )}

                    {/* Acciones */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto auto', gap: 10, alignItems: 'end' }}>
                      <div>
                        <label className="form-label">Estado</label>
                        <select className="form-control" value={estadoEdit} onChange={e => setEstadoEdit(e.target.value)}>
                          {ESTADOS.map(e => <option key={e} value={e}>{e.replace('_', ' ')}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="form-label">Nota interna</label>
                        <input className="form-control" value={notaEdit} onChange={e => setNotaEdit(e.target.value)} placeholder="Comentario o novedad..." />
                      </div>
                      <button
                        onClick={() => guardarCambios(p.id)}
                        disabled={guardando}
                        style={{ padding: '0.55rem 1rem', background: '#6c63ff', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap' }}
                      >
                        {guardando ? '...' : 'Guardar'}
                      </button>
                      <button
                        onClick={() => eliminarPedido(p.id, p.local_nombre)}
                        disabled={eliminando === p.id}
                        style={{ padding: '0.55rem 1rem', background: 'none', color: '#dc2626', border: '1px solid #dc262650', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap' }}
                      >
                        {eliminando === p.id ? '...' : 'Eliminar'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Tab: Catálogo de productos ───────────────────────────────────────────────
function TabProductos({ productos, recargar }) {
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState({ ean: '', codigo_venta: '', nombre: '', descripcion: '', unidades_por_bulto: '', packs_por_corte: '', unidades_por_pale: '', precio_sugerido: '', unit_value: '', sovi_requerido: '' });
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [filtroMarca, setFiltroMarca] = useState('');
  const [filtroRetornable, setFiltroRetornable] = useState('');
  const [filtroActivo, setFiltroActivo] = useState('1');

  const marcas = [...new Set(productos.map(p => p.marca).filter(Boolean))].sort();

  const prodFiltrados = productos.filter(p => {
    if (filtroActivo === '1' && !p.activo) return false;
    if (filtroActivo === '0' && p.activo) return false;
    if (filtroMarca && p.marca !== filtroMarca) return false;
    if (filtroRetornable === 'SI' && !p.retornable) return false;
    if (filtroRetornable === 'NO' && p.retornable) return false;
    if (busqueda) {
      const q = busqueda.toLowerCase();
      return p.nombre.toLowerCase().includes(q) ||
        (p.codigo_venta || '').toLowerCase().includes(q) ||
        (p.sabor || '').toLowerCase().includes(q) ||
        String(p.ean || '').includes(q);
    }
    return true;
  });

  function abrirNuevo() {
    setEditando(null);
    setForm({ ean: '', codigo_venta: '', nombre: '', descripcion: '', unidades_por_bulto: '', packs_por_corte: '', unidades_por_pale: '', precio_sugerido: '', unit_value: '', sovi_requerido: '' });
    setError('');
    setModal(true);
  }

  function abrirEditar(p) {
    setEditando(p);
    setForm({
      ean: p.ean || '', codigo_venta: p.codigo_venta || '', nombre: p.nombre || '',
      descripcion: p.descripcion || '', unidades_por_bulto: p.unidades_por_bulto || '',
      packs_por_corte: p.packs_por_corte || '', unidades_por_pale: p.unidades_por_pale || '',
      precio_sugerido: p.precio_sugerido || '', unit_value: p.unit_value || '',
      sovi_requerido: p.sovi_requerido || '',
    });
    setError('');
    setModal(true);
  }

  async function toggleActivo(p) {
    const token = localStorage.getItem('token');
    await fetch(`/api/productos/${p.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ activo: p.activo ? 0 : 1 }),
    });
    recargar();
  }

  async function guardar() {
    setError('');
    if (!form.ean || !form.nombre) return setError('EAN y nombre son requeridos');
    setGuardando(true);
    try {
      const token = localStorage.getItem('token');
      const url = editando ? `/api/productos/${editando.id}` : '/api/productos';
      const method = editando ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...form,
          ean: Number(form.ean),
          unidades_por_bulto: form.unidades_por_bulto ? Number(form.unidades_por_bulto) : null,
          packs_por_corte: form.packs_por_corte ? Number(form.packs_por_corte) : null,
          unidades_por_pale: form.unidades_por_pale ? Number(form.unidades_por_pale) : null,
          precio_sugerido: form.precio_sugerido ? Number(form.precio_sugerido) : null,
          unit_value: form.unit_value ? Number(form.unit_value) : null,
          sovi_requerido: form.sovi_requerido ? Number(form.sovi_requerido) : null,
        }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error); return; }
      setModal(false);
      recargar();
    } finally {
      setGuardando(false);
    }
  }

  function exportar() {
    const filas = prodFiltrados.map(p => ({
      'Código Venta': p.codigo_venta || '',
      EAN: p.ean,
      Nombre: p.nombre,
      'Unid/Bulto': p.unidades_por_bulto || '',
      'Precio Sugerido': p.precio_sugerido || '',
      'Unit Value': p.unit_value || '',
      'SOVI %': p.sovi_requerido || '',
      Activo: p.activo ? 'Sí' : 'No',
    }));
    exportarExcel(filas, 'catalogo_productos');
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: '0.8rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          className="form-control"
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre, código, sabor o EAN..."
          style={{ flex: 1, minWidth: 200 }}
        />
        <select className="form-control" value={filtroMarca} onChange={e => setFiltroMarca(e.target.value)} style={{ width: 160 }}>
          <option value="">Todas las marcas</option>
          {marcas.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <select className="form-control" value={filtroRetornable} onChange={e => setFiltroRetornable(e.target.value)} style={{ width: 150 }}>
          <option value="">Retornable/NR</option>
          <option value="SI">Retornable</option>
          <option value="NO">No retornable</option>
        </select>
        <select className="form-control" value={filtroActivo} onChange={e => setFiltroActivo(e.target.value)} style={{ width: 130 }}>
          <option value="1">Solo activos</option>
          <option value="0">Solo inactivos</option>
          <option value="">Todos</option>
        </select>
        <button
          onClick={() => { setBusqueda(''); setFiltroMarca(''); setFiltroRetornable(''); setFiltroActivo('1'); }}
          style={{ padding: '0.5rem 0.8rem', background: '#2d2d3d', border: 'none', borderRadius: 6, color: '#9090a0', cursor: 'pointer', fontSize: '0.82rem', whiteSpace: 'nowrap' }}
        >
          Limpiar
        </button>
        <button onClick={exportar} style={{ padding: '0.5rem 0.9rem', background: '#38a16920', border: '1px solid #38a16940', borderRadius: 6, color: '#68d391', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
          Exportar Excel
        </button>
        <button className="btn-nuevo" onClick={abrirNuevo}>+ Nuevo producto</button>
      </div>
      <div style={{ fontSize: '0.78rem', color: '#606070', marginBottom: '0.6rem' }}>
        {prodFiltrados.length} producto{prodFiltrados.length !== 1 ? 's' : ''} encontrados
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #2d2d3d' }}>
              {['Código', 'Nombre', 'Marca', 'Sabor', 'Ret.', 'Unid/Bulto', 'Unit Value', 'Activo', ''].map(h => (
                <th key={h} style={thS}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {prodFiltrados.length === 0 ? (
              <tr><td colSpan={9} style={{ padding: '1.5rem', color: '#606070', textAlign: 'center' }}>
                {productos.length === 0 ? 'No hay productos cargados. Agregá el primero.' : 'Sin resultados.'}
              </td></tr>
            ) : prodFiltrados.map(p => (
              <tr key={p.id} style={{ borderBottom: '1px solid #12121a', opacity: p.activo ? 1 : 0.45 }}>
                <td style={{ padding: '0.5rem 0.8rem', color: '#9090a0' }}>{p.codigo_venta || '—'}</td>
                <td style={{ padding: '0.5rem 0.8rem', color: '#fff', fontWeight: 600, maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.nombre}</td>
                <td style={{ padding: '0.5rem 0.8rem', color: '#a78bfa' }}>{p.marca || '—'}</td>
                <td style={{ padding: '0.5rem 0.8rem', color: '#9090a0', fontSize: '0.78rem' }}>{p.sabor || '—'}</td>
                <td style={{ padding: '0.5rem 0.8rem', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 6px', borderRadius: 6,
                    background: p.retornable ? '#16a34a22' : '#60606022',
                    color: p.retornable ? '#4ade80' : '#606070' }}>
                    {p.retornable ? 'RET' : 'NR'}
                  </span>
                </td>
                <td style={{ padding: '0.5rem 0.8rem', color: '#9090a0', textAlign: 'right' }}>{p.unidades_por_bulto || '—'}</td>
                <td style={{ padding: '0.5rem 0.8rem', color: '#6c63ff', fontWeight: 600 }}>{p.unit_value ? Number(p.unit_value).toFixed(4) : '—'}</td>
                <td style={{ padding: '0.5rem 0.8rem' }}>
                  <button onClick={() => toggleActivo(p)} style={{
                    padding: '2px 10px', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: '0.72rem',
                    background: p.activo ? '#38a16920' : '#e53e3e20',
                    color: p.activo ? '#68d391' : '#fc8181',
                  }}>
                    {p.activo ? 'Activo' : 'Inactivo'}
                  </button>
                </td>
                <td style={{ padding: '0.5rem 0.8rem' }}>
                  <button className="btn-editar" style={{ padding: '0.25rem 0.7rem', fontSize: '0.78rem' }} onClick={() => abrirEditar(p)}>Editar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
            <h3 className="modal-titulo">{editando ? 'Editar producto' : 'Nuevo producto'}</h3>
            {error && <div className="msg-error">{error}</div>}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Nombre *</label>
                <input className="form-control" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} placeholder="Ej: Coca-Cola 2.25L PET" />
              </div>
              <div className="form-group">
                <label className="form-label">EAN *</label>
                <input className="form-control" type="number" value={form.ean} onChange={e => setForm(f => ({ ...f, ean: e.target.value }))} placeholder="7790895000082" />
              </div>
              <div className="form-group">
                <label className="form-label">Código de venta</label>
                <input className="form-control" value={form.codigo_venta} onChange={e => setForm(f => ({ ...f, codigo_venta: e.target.value }))} placeholder="Ej: 0082" />
              </div>
              <div className="form-group">
                <label className="form-label">Unidades/pack (botellas)</label>
                <input className="form-control" type="number" value={form.unidades_por_bulto} onChange={e => setForm(f => ({ ...f, unidades_por_bulto: e.target.value }))} placeholder="6" />
              </div>
              <div className="form-group">
                <label className="form-label">Packs por corte</label>
                <input className="form-control" type="number" value={form.packs_por_corte} onChange={e => setForm(f => ({ ...f, packs_por_corte: e.target.value }))} placeholder="4" />
              </div>
              <div className="form-group">
                <label className="form-label">Packs por pale</label>
                <input className="form-control" type="number" value={form.unidades_por_pale} onChange={e => setForm(f => ({ ...f, unidades_por_pale: e.target.value }))} placeholder="28" />
              </div>
              <div className="form-group">
                <label className="form-label">Precio sugerido ($)</label>
                <input className="form-control" type="number" step="0.01" value={form.precio_sugerido} onChange={e => setForm(f => ({ ...f, precio_sugerido: e.target.value }))} placeholder="1500.00" />
              </div>
              <div className="form-group">
                <label className="form-label">Unit Value</label>
                <input className="form-control" type="number" step="0.0001" value={form.unit_value} onChange={e => setForm(f => ({ ...f, unit_value: e.target.value }))} placeholder="1.7" />
              </div>
              <div className="form-group">
                <label className="form-label">SOVI requerido (%)</label>
                <input className="form-control" type="number" step="0.01" value={form.sovi_requerido} onChange={e => setForm(f => ({ ...f, sovi_requerido: e.target.value }))} placeholder="80.00" />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Descripción</label>
                <input className="form-control" value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} placeholder="Descripción opcional" />
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-guardar" onClick={guardar} disabled={guardando}>{guardando ? 'Guardando...' : 'Guardar'}</button>
              <button className="btn-cancelar" onClick={() => setModal(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function AdminPedidos() {
  const [tab, setTab] = useState('pedidos');
  const [pedidos, setPedidos] = useState([]);
  const [productos, setProductos] = useState([]);
  const [locales, setLocales] = useState([]);
  const [unitG, setUnitG] = useState(1.7);
  const [cargando, setCargando] = useState(true);

  useEffect(() => { cargarTodo(); }, []);

  async function cargarTodo() {
    const token = localStorage.getItem('token');
    const h = { Authorization: `Bearer ${token}` };
    const [pedRes, prodRes, locRes, objRes] = await Promise.allSettled([
      fetch('/api/pedidos', { headers: h }).then(r => r.json()),
      fetch('/api/productos', { headers: h }).then(r => r.json()),
      fetch('/api/locales', { headers: h }).then(r => r.json()),
      fetch('/api/objetivos', { headers: h }).then(r => r.json()),
    ]);
    if (pedRes.status === 'fulfilled' && Array.isArray(pedRes.value)) setPedidos(pedRes.value);
    if (prodRes.status === 'fulfilled' && Array.isArray(prodRes.value)) setProductos(prodRes.value);
    if (locRes.status === 'fulfilled' && Array.isArray(locRes.value)) setLocales(locRes.value);
    if (objRes.status === 'fulfilled' && Array.isArray(objRes.value) && objRes.value.length > 0) {
      const u = objRes.value[0]?.unit_general;
      if (u) setUnitG(Number(u));
    }
    setCargando(false);
  }

  const tabs = [
    { key: 'pedidos', label: 'Pedidos activos' },
    { key: 'historial', label: 'Historial' },
    { key: 'catalogo', label: 'Catálogo de productos' },
  ];

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <h2 style={{ color: '#fff', fontSize: '1.3rem', fontWeight: 700, marginBottom: '1.2rem' }}>Pedidos</h2>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid #2d2d3d', marginBottom: '1.2rem' }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: '0.6rem 1.2rem', border: 'none', background: 'transparent', cursor: 'pointer',
            color: tab === t.key ? '#6c63ff' : '#9090a0',
            fontWeight: tab === t.key ? 700 : 400, fontSize: '0.88rem',
            borderBottom: tab === t.key ? '2px solid #6c63ff' : '2px solid transparent',
            marginBottom: -1, transition: 'all 0.15s',
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {cargando ? (
        <p style={{ color: '#606070' }}>Cargando...</p>
      ) : tab === 'catalogo' ? (
        <TabProductos productos={productos} recargar={cargarTodo} />
      ) : (
        <TabPedidos
          pedidos={pedidos}
          locales={locales}
          unitG={unitG}
          recargar={cargarTodo}
          esHistorial={tab === 'historial'}
        />
      )}
    </div>
  );
}

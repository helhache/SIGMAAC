import { useEffect, useState } from 'react';
import axios from 'axios';

const ESTADOS = ['pendiente', 'aprobado', 'procesado', 'rechazado'];

const colorEstado = {
  pendiente:  { bg: '#d9770622', color: '#d97706' },
  aprobado:   { bg: '#2563eb22', color: '#60a5fa' },
  procesado:  { bg: '#16a34a22', color: '#4ade80' },
  rechazado:  { bg: '#dc262622', color: '#f87171' },
};

export default function AdminCambios() {
  const [cambios, setCambios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modal, setModal] = useState(null);   // { cambio, detalle }
  const [nota, setNota] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroRepo, setFiltroRepo] = useState('');

  useEffect(() => { cargar(); }, []);

  async function cargar() {
    setCargando(true);
    try {
      const { data } = await axios.get('/api/cambios');
      setCambios(data);
    } finally {
      setCargando(false);
    }
  }

  async function abrirModal(c) {
    try {
      const { data } = await axios.get(`/api/cambios/${c.id}`);
      setNota(data.nota_admin || '');
      setModal({ cambio: c, detalle: data });
    } catch {
      alert('Error al cargar detalle');
    }
  }

  function cerrarModal() { setModal(null); setNota(''); }

  async function guardarEstado(estado) {
    if (!modal) return;
    setGuardando(true);
    try {
      await axios.put(`/api/cambios/${modal.cambio.id}/estado`, { estado, nota_admin: nota });
      await cargar();
      // Refresh modal data
      const { data } = await axios.get(`/api/cambios/${modal.cambio.id}`);
      setModal(prev => ({ ...prev, cambio: { ...prev.cambio, estado }, detalle: data }));
    } catch {
      alert('Error al actualizar estado');
    } finally {
      setGuardando(false);
    }
  }

  const totalUnidades = (items) => items?.reduce((s, i) => s + (i.cantidad || 0), 0) ?? 0;

  const filtrados = cambios.filter(c => {
    if (filtroEstado && c.estado !== filtroEstado) return false;
    if (filtroRepo) {
      const term = filtroRepo.toLowerCase();
      const nombre = `${c.repositor_nombre} ${c.repositor_apellido}`.toLowerCase();
      if (!nombre.includes(term)) return false;
    }
    return true;
  });

  return (
    <div className="gestion-container">
      <div className="gestion-header">
        <div>
          <h2 className="gestion-titulo">Cambios</h2>
          <p style={{ color: '#9090a0', fontSize: '0.88rem', marginTop: 2 }}>
            Revisá y gestioná los cambios registrados por repositores
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <select
            value={filtroEstado}
            onChange={e => setFiltroEstado(e.target.value)}
            style={{ background: '#1a1a24', border: '1px solid #2d2d3d', color: '#e0e0e0', borderRadius: 6, padding: '0.4rem 0.7rem', fontSize: '0.85rem' }}
          >
            <option value="">Todos los estados</option>
            {ESTADOS.map(e => <option key={e} value={e}>{e.charAt(0).toUpperCase() + e.slice(1)}</option>)}
          </select>
          <input
            placeholder="Buscar repositor..."
            value={filtroRepo}
            onChange={e => setFiltroRepo(e.target.value)}
            style={{ background: '#1a1a24', border: '1px solid #2d2d3d', color: '#e0e0e0', borderRadius: 6, padding: '0.4rem 0.7rem', fontSize: '0.85rem', width: 180 }}
          />
        </div>
      </div>

      {cargando ? (
        <p style={{ color: '#606070' }}>Cargando...</p>
      ) : filtrados.length === 0 ? (
        <p className="msg-vacio">No hay cambios registrados.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #2d2d3d' }}>
                {['Local', 'Repositor', 'Fecha', 'Total unidades', 'Estado', ''].map(h => (
                  <th key={h} style={{ padding: '0.6rem 0.8rem', textAlign: 'left', color: '#9090a0', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtrados.map(c => (
                <tr key={c.id} style={{ borderBottom: '1px solid #1a1a24' }}>
                  <td style={{ padding: '0.7rem 0.8rem', color: '#6c63ff', fontWeight: 700 }}>{c.local_nombre}</td>
                  <td style={{ padding: '0.7rem 0.8rem', color: '#e0e0e0' }}>
                    {c.repositor_nombre} {c.repositor_apellido}
                    {c.numero_vendedor && <span style={{ color: '#606070', fontSize: '0.75rem', marginLeft: 4 }}>#{c.numero_vendedor}</span>}
                  </td>
                  <td style={{ padding: '0.7rem 0.8rem', color: '#9090a0', whiteSpace: 'nowrap' }}>{c.fecha?.slice(0, 10)}</td>
                  <td style={{ padding: '0.7rem 0.8rem', color: '#e0e0e0', fontWeight: 600 }}>—</td>
                  <td style={{ padding: '0.7rem 0.8rem' }}>
                    <span style={{
                      padding: '2px 10px', borderRadius: 10, fontWeight: 700, fontSize: '0.75rem',
                      background: colorEstado[c.estado]?.bg ?? '#2d2d3d',
                      color: colorEstado[c.estado]?.color ?? '#9090a0',
                    }}>
                      {c.estado}
                    </span>
                  </td>
                  <td style={{ padding: '0.7rem 0.8rem' }}>
                    <button
                      onClick={() => abrirModal(c)}
                      style={{ padding: '4px 12px', background: '#6c63ff20', border: '1px solid #6c63ff44', color: '#a78bfa', borderRadius: 6, cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
                    >
                      Ver detalle
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal detalle */}
      {modal && (
        <div style={{
          position: 'fixed', inset: 0, background: '#000000aa', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem',
        }}>
          <div style={{
            background: '#1a1a24', border: '1px solid #2d2d3d', borderRadius: 12,
            padding: '1.5rem', width: '100%', maxWidth: 640, maxHeight: '90vh', overflowY: 'auto',
          }}>
            {/* Header modal */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ color: '#fff', fontWeight: 700, fontSize: '1rem', margin: 0 }}>
                  Cambio #{modal.cambio.id} — {modal.cambio.local_nombre}
                </h3>
                <p style={{ color: '#9090a0', fontSize: '0.82rem', margin: '4px 0 0' }}>
                  {modal.cambio.repositor_nombre} {modal.cambio.repositor_apellido} · {modal.cambio.fecha?.slice(0, 10)}
                </p>
              </div>
              <button onClick={cerrarModal} style={{ background: 'none', border: 'none', color: '#9090a0', fontSize: '1.2rem', cursor: 'pointer', padding: 4 }}>✕</button>
            </div>

            {/* Estado actual */}
            <div style={{ marginBottom: '1rem' }}>
              <span style={{
                padding: '3px 12px', borderRadius: 10, fontWeight: 700, fontSize: '0.8rem',
                background: colorEstado[modal.cambio.estado]?.bg ?? '#2d2d3d',
                color: colorEstado[modal.cambio.estado]?.color ?? '#9090a0',
              }}>
                {modal.cambio.estado}
              </span>
              {modal.detalle.notas && (
                <p style={{ color: '#9090a0', fontSize: '0.82rem', marginTop: 8 }}>
                  <strong style={{ color: '#e0e0e0' }}>Nota repositor:</strong> {modal.detalle.notas}
                </p>
              )}
            </div>

            {/* Tabla de items */}
            {modal.detalle.items?.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <h4 style={{ color: '#9090a0', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: 8 }}>Productos</h4>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #2d2d3d' }}>
                      {['Código', 'Producto', 'N° Local', 'Cantidad', 'Motivo'].map(h => (
                        <th key={h} style={{ padding: '4px 8px', textAlign: 'left', color: '#606070', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {modal.detalle.items.map(item => (
                      <tr key={item.id} style={{ borderBottom: '1px solid #0f0f13' }}>
                        <td style={{ padding: '6px 8px', color: '#9090a0', fontFamily: 'monospace' }}>{item.codigo_venta || '—'}</td>
                        <td style={{ padding: '6px 8px', color: '#e0e0e0', fontWeight: 600 }}>{item.producto_nombre}</td>
                        <td style={{ padding: '6px 8px', color: '#9090a0' }}>{modal.cambio.numero_vendedor || '—'}</td>
                        <td style={{ padding: '6px 8px', color: '#fff', fontWeight: 700, textAlign: 'right' }}>{item.cantidad}</td>
                        <td style={{ padding: '6px 8px', color: '#9090a0', fontSize: '0.78rem' }}>{item.motivo_descripcion}</td>
                      </tr>
                    ))}
                    <tr style={{ borderTop: '2px solid #2d2d3d' }}>
                      <td colSpan={3} style={{ padding: '6px 8px', color: '#9090a0', fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase' }}>Total unidades</td>
                      <td style={{ padding: '6px 8px', color: '#6c63ff', fontWeight: 700, textAlign: 'right' }}>{totalUnidades(modal.detalle.items)}</td>
                      <td />
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* Nota al repositor */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ color: '#9090a0', fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                Nota al repositor
              </label>
              <textarea
                value={nota}
                onChange={e => setNota(e.target.value)}
                rows={3}
                placeholder="Dejá una nota para el repositor..."
                style={{ width: '100%', background: '#0f0f13', border: '1px solid #2d2d3d', borderRadius: 6, color: '#e0e0e0', padding: '0.5rem', fontSize: '0.85rem', resize: 'vertical', boxSizing: 'border-box' }}
              />
              {modal.detalle.nota_admin && (
                <p style={{ color: '#606070', fontSize: '0.75rem', marginTop: 4 }}>Nota enviada anteriormente: {modal.detalle.nota_admin}</p>
              )}
            </div>

            {/* Acciones */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {modal.cambio.estado === 'pendiente' && (
                <>
                  <button
                    disabled={guardando}
                    onClick={() => guardarEstado('aprobado')}
                    style={{ padding: '7px 18px', border: 'none', borderRadius: 6, background: '#2563eb', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}
                  >
                    Aprobar
                  </button>
                  <button
                    disabled={guardando}
                    onClick={() => guardarEstado('rechazado')}
                    style={{ padding: '7px 18px', border: 'none', borderRadius: 6, background: '#dc2626', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}
                  >
                    Rechazar
                  </button>
                </>
              )}
              {modal.cambio.estado === 'aprobado' && (
                <button
                  disabled={guardando}
                  onClick={() => guardarEstado('procesado')}
                  style={{ padding: '7px 18px', border: 'none', borderRadius: 6, background: '#16a34a', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}
                >
                  Marcar procesado
                </button>
              )}
              <button
                disabled={guardando}
                onClick={async () => {
                  setGuardando(true);
                  try {
                    await axios.put(`/api/cambios/${modal.cambio.id}/estado`, { estado: modal.cambio.estado, nota_admin: nota });
                    alert('Nota guardada');
                  } catch { alert('Error al guardar nota'); }
                  finally { setGuardando(false); }
                }}
                style={{ padding: '7px 18px', border: '1px solid #2d2d3d', borderRadius: 6, background: '#0f0f13', color: '#9090a0', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}
              >
                {guardando ? 'Guardando...' : 'Guardar nota'}
              </button>
              <button
                onClick={cerrarModal}
                style={{ padding: '7px 18px', border: '1px solid #2d2d3d', borderRadius: 6, background: 'transparent', color: '#9090a0', cursor: 'pointer', fontSize: '0.85rem', marginLeft: 'auto' }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

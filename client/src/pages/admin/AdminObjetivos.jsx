import { useEffect, useState } from 'react';
import axios from 'axios';

const PERIODOS = ['semanal', 'mensual', 'anual'];

const colorPeriodo = {
  semanal: { bg: '#2563eb22', color: '#60a5fa' },
  mensual: { bg: '#7c3aed22', color: '#a78bfa' },
  anual:   { bg: '#d9770622', color: '#f6ad55' },
};

const FORM_VACIO = {
  descripcion: '', periodo: 'mensual',
  fecha_inicio: '', fecha_fin: '',
  volumen_objetivo: '', unit_general: '1.7',
};

export default function AdminObjetivos() {
  const [objetivos, setObjetivos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm] = useState(FORM_VACIO);
  const [guardando, setGuardando] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [error, setError] = useState('');

  useEffect(() => { cargar(); }, []);

  async function cargar() {
    setCargando(true);
    try {
      const { data } = await axios.get('/api/objetivos');
      setObjetivos(data);
    } catch { setError('No se pudieron cargar los objetivos'); }
    finally { setCargando(false); }
  }

  async function crear(e) {
    e.preventDefault();
    setError('');
    setGuardando(true);
    try {
      await axios.post('/api/objetivos', {
        ...form,
        volumen_objetivo: parseFloat(form.volumen_objetivo),
        unit_general: parseFloat(form.unit_general),
      });
      setMostrarForm(false);
      setForm(FORM_VACIO);
      cargar();
    } catch (err) { setError(err.response?.data?.error || 'Error al crear objetivo'); }
    finally { setGuardando(false); }
  }

  function iniciarEdicion(o) {
    setEditandoId(o.id);
    setEditForm({
      descripcion: o.descripcion || '',
      volumen_objetivo: o.volumen_objetivo,
      unit_general: o.unit_general,
    });
  }

  async function guardarEdicion(id) {
    setGuardando(true);
    try {
      await axios.put(`/api/objetivos/${id}`, {
        descripcion: editForm.descripcion,
        volumen_objetivo: parseFloat(editForm.volumen_objetivo),
        unit_general: parseFloat(editForm.unit_general),
      });
      setEditandoId(null);
      cargar();
    } catch (err) { setError(err.response?.data?.error || 'Error al guardar'); }
    finally { setGuardando(false); }
  }

  async function desactivar(id) {
    if (!confirm('¿Desactivar este objetivo?')) return;
    try {
      await axios.delete(`/api/objetivos/${id}`);
      cargar();
    } catch { setError('Error al desactivar'); }
  }

  // Agrupar por periodo para mostrar el vigente de cada tipo
  const porPeriodo = PERIODOS.reduce((acc, p) => {
    acc[p] = objetivos.filter(o => o.periodo === p);
    return acc;
  }, {});

  const fmt = (n) => Number(n).toLocaleString('es-AR');

  return (
    <div className="gestion-container">
      <div className="gestion-header">
        <div>
          <h2 className="gestion-titulo">Objetivos</h2>
          <p style={{ color: '#9090a0', fontSize: '0.88rem', marginTop: 2 }}>
            Declarás los valores de volumen que se muestran en el dashboard y en todos los roles
          </p>
        </div>
        <button className="btn-nuevo" onClick={() => { setMostrarForm(v => !v); setError(''); }}>
          {mostrarForm ? 'Cancelar' : '+ Nuevo objetivo'}
        </button>
      </div>

      {error && <div className="msg-error">{error}</div>}

      {/* Formulario nuevo */}
      {mostrarForm && (
        <form onSubmit={crear} style={{
          background: '#1a1a24', border: '1px solid #6c63ff44', borderRadius: 10,
          padding: '1.4rem', marginBottom: '1.5rem',
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.9rem',
        }}>
          <h3 style={{ gridColumn: '1/-1', color: '#fff', fontWeight: 700, fontSize: '0.95rem', margin: 0 }}>
            Nuevo objetivo
          </h3>

          <div style={{ gridColumn: '1/-1' }}>
            <label className="form-label">Descripción</label>
            <input className="form-control" value={form.descripcion} placeholder="ej: Objetivo Junio 2026"
              onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} />
          </div>

          <div>
            <label className="form-label">Período</label>
            <select className="form-control" value={form.periodo} onChange={e => setForm(f => ({ ...f, periodo: e.target.value }))}>
              {PERIODOS.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
            </select>
          </div>

          <div>
            <label className="form-label">Unit General</label>
            <input className="form-control" type="number" step="0.01" min="0.1" value={form.unit_general}
              onChange={e => setForm(f => ({ ...f, unit_general: e.target.value }))} />
          </div>

          <div>
            <label className="form-label">Fecha inicio</label>
            <input className="form-control" type="date" value={form.fecha_inicio} required
              onChange={e => setForm(f => ({ ...f, fecha_inicio: e.target.value }))} />
          </div>

          <div>
            <label className="form-label">Fecha fin</label>
            <input className="form-control" type="date" value={form.fecha_fin} required
              onChange={e => setForm(f => ({ ...f, fecha_fin: e.target.value }))} />
          </div>

          <div style={{ gridColumn: '1/-1' }}>
            <label className="form-label">Volumen objetivo</label>
            <input className="form-control" type="number" step="0.01" min="0" value={form.volumen_objetivo}
              placeholder="ej: 50000" required
              onChange={e => setForm(f => ({ ...f, volumen_objetivo: e.target.value }))} />
          </div>

          <div style={{ gridColumn: '1/-1' }}>
            <button type="submit" className="btn-guardar" disabled={guardando}>
              {guardando ? 'Guardando...' : 'Crear objetivo'}
            </button>
          </div>
        </form>
      )}

      {/* Resumen por período */}
      {!cargando && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
          {PERIODOS.map(p => {
            const vigente = porPeriodo[p]?.[0];
            return (
              <div key={p} style={{
                background: '#1a1a24', border: `1px solid ${vigente ? colorPeriodo[p].color + '44' : '#2d2d3d'}`,
                borderRadius: 10, padding: '1rem',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ ...colorPeriodo[p], padding: '2px 10px', borderRadius: 8, fontSize: '0.72rem', fontWeight: 700 }}>
                    {p.toUpperCase()}
                  </span>
                  {vigente && <span style={{ color: '#606070', fontSize: '0.72rem' }}>Vigente</span>}
                </div>
                {vigente ? (
                  <>
                    <div style={{ color: '#fff', fontWeight: 700, fontSize: '1.3rem' }}>{fmt(vigente.volumen_objetivo)}</div>
                    <div style={{ color: '#9090a0', fontSize: '0.78rem', marginTop: 4 }}>vol objetivo</div>
                    <div style={{ color: '#606070', fontSize: '0.75rem', marginTop: 6 }}>
                      {vigente.fecha_inicio?.slice(0,10)} → {vigente.fecha_fin?.slice(0,10)}
                    </div>
                    <div style={{ color: '#606070', fontSize: '0.75rem', marginTop: 2 }}>
                      Unit: {vigente.unit_general} · {fmt(Math.round(vigente.volumen_objetivo / vigente.unit_general))} bultos
                    </div>
                  </>
                ) : (
                  <p style={{ color: '#606070', fontSize: '0.82rem', margin: '8px 0 0' }}>Sin objetivo declarado</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Listado completo */}
      {cargando ? (
        <p style={{ color: '#606070' }}>Cargando...</p>
      ) : objetivos.length === 0 ? (
        <p className="msg-vacio">No hay objetivos registrados.</p>
      ) : (
        <div>
          <h4 style={{ color: '#9090a0', fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.8rem' }}>
            Todos los objetivos
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {objetivos.map(o => (
              <div key={o.id} style={{ background: '#1a1a24', border: '1px solid #2d2d3d', borderRadius: 10, padding: '1rem 1.2rem' }}>
                {editandoId === o.id ? (
                  /* Modo edición inline */
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 10, alignItems: 'end' }}>
                    <div>
                      <label className="form-label">Descripción</label>
                      <input className="form-control" value={editForm.descripcion}
                        onChange={e => setEditForm(f => ({ ...f, descripcion: e.target.value }))} />
                    </div>
                    <div>
                      <label className="form-label">Volumen objetivo</label>
                      <input className="form-control" type="number" step="0.01" value={editForm.volumen_objetivo}
                        onChange={e => setEditForm(f => ({ ...f, volumen_objetivo: e.target.value }))} />
                    </div>
                    <div>
                      <label className="form-label">Unit General</label>
                      <input className="form-control" type="number" step="0.01" value={editForm.unit_general}
                        onChange={e => setEditForm(f => ({ ...f, unit_general: e.target.value }))} />
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn-guardar" style={{ padding: '0.4rem 0.9rem', fontSize: '0.82rem' }}
                        onClick={() => guardarEdicion(o.id)} disabled={guardando}>
                        {guardando ? '...' : 'Guardar'}
                      </button>
                      <button className="btn-cancelar" style={{ padding: '0.4rem 0.9rem', fontSize: '0.82rem' }}
                        onClick={() => setEditandoId(null)}>
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Vista normal */
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                    <span style={{ ...colorPeriodo[o.periodo], padding: '2px 10px', borderRadius: 8, fontSize: '0.72rem', fontWeight: 700, flexShrink: 0 }}>
                      {o.periodo}
                    </span>
                    <div style={{ flex: 1, minWidth: 120 }}>
                      <div style={{ color: '#fff', fontWeight: 600, fontSize: '0.92rem' }}>{o.descripcion || `Objetivo #${o.id}`}</div>
                      <div style={{ color: '#606070', fontSize: '0.75rem' }}>{o.fecha_inicio?.slice(0,10)} → {o.fecha_fin?.slice(0,10)}</div>
                    </div>
                    <div style={{ textAlign: 'right', minWidth: 100 }}>
                      <div style={{ color: '#6c63ff', fontWeight: 700, fontSize: '1.1rem' }}>{fmt(o.volumen_objetivo)}</div>
                      <div style={{ color: '#606070', fontSize: '0.72rem' }}>vol · unit {o.unit_general}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <button className="btn-editar" style={{ padding: '0.25rem 0.7rem', fontSize: '0.78rem' }}
                        onClick={() => iniciarEdicion(o)}>
                        Editar
                      </button>
                      <button className="btn-eliminar" style={{ padding: '0.25rem 0.7rem', fontSize: '0.78rem' }}
                        onClick={() => desactivar(o.id)}>
                        Desactivar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

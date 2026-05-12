import { useEffect, useState } from 'react';
import axios from 'axios';

const TIPOS_TAREA = [
  { value: 'foto',   label: 'Pedir foto' },
  { value: 'precio', label: 'Declarar precio' },
  { value: 'estado', label: 'Reportar estado acción' },
  { value: 'otro',   label: 'Otro' },
];

const colorTipo = {
  foto:   { bg: '#2563eb22', color: '#60a5fa' },
  precio: { bg: '#16a34a22', color: '#4ade80' },
  estado: { bg: '#d9770622', color: '#f6ad55' },
  otro:   { bg: '#2d2d3d',   color: '#9090a0' },
};

const colorTarea = {
  pendiente:   { bg: '#d9770622', color: '#f6ad55' },
  completada:  { bg: '#16a34a22', color: '#4ade80' },
};

function formatFecha(f) {
  if (!f) return '—';
  return new Date(f).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ── Panel detalle repositor ────────────────────────────────────────────────────
function PanelRepositor({ repo, localesTodos, onClose, onActualizado }) {
  const [tab, setTab] = useState('info');
  const [tareas, setTareas] = useState([]);
  const [cargandoTareas, setCargandoTareas] = useState(false);
  const [nuevaTarea, setNuevaTarea] = useState({ tipo: 'foto', descripcion: '' });
  const [creandoTarea, setCreandoTarea] = useState(false);
  const [mostrarFormTarea, setMostrarFormTarea] = useState(false);

  // Para asignar locales
  const [localesSel, setLocalesSel] = useState([]);
  const [guardandoLocales, setGuardandoLocales] = useState(false);

  // Para objetivo semanal
  const [objSemanal, setObjSemanal] = useState(repo.objetivo_semanal ?? '');
  const [guardandoObj, setGuardandoObj] = useState(false);

  useEffect(() => {
    // Inicializar locales seleccionados desde los locales asignados actuales
    if (repo.locales_asignados) {
      // Matching por nombre (no ideal pero el listado solo trae nombres en GET /)
      const nombresAsignados = repo.locales_asignados.split(', ');
      const ids = localesTodos.filter(l => nombresAsignados.includes(l.nombre)).map(l => l.id);
      setLocalesSel(ids);
    }
  }, [repo.id]);

  useEffect(() => {
    if (tab === 'tareas') cargarTareas();
  }, [tab]);

  async function cargarTareas() {
    setCargandoTareas(true);
    try {
      const { data } = await axios.get(`/api/repositores/${repo.id}/tareas`);
      setTareas(data);
    } finally { setCargandoTareas(false); }
  }

  async function crearTarea() {
    if (!nuevaTarea.descripcion.trim()) return;
    setCreandoTarea(true);
    try {
      await axios.post(`/api/repositores/${repo.id}/tareas`, nuevaTarea);
      setNuevaTarea({ tipo: 'foto', descripcion: '' });
      setMostrarFormTarea(false);
      cargarTareas();
    } catch { alert('Error al crear tarea'); }
    finally { setCreandoTarea(false); }
  }

  async function eliminarTarea(id) {
    if (!confirm('¿Eliminar esta tarea?')) return;
    try {
      await axios.delete(`/api/repositores/tareas/${id}`);
      cargarTareas();
    } catch { alert('Error al eliminar tarea'); }
  }

  async function guardarLocales() {
    setGuardandoLocales(true);
    try {
      await axios.post(`/api/repositores/${repo.id}/locales`, { local_ids: localesSel });
      onActualizado();
      alert('Locales actualizados');
    } catch { alert('Error al guardar locales'); }
    finally { setGuardandoLocales(false); }
  }

  async function guardarObjetivo() {
    setGuardandoObj(true);
    try {
      await axios.put(`/api/repositores/${repo.id}`, { objetivo_semanal: objSemanal === '' ? null : parseFloat(objSemanal) });
      onActualizado();
      alert('Objetivo actualizado');
    } catch { alert('Error al guardar objetivo'); }
    finally { setGuardandoObj(false); }
  }

  const toggleLocal = (id) => setLocalesSel(prev =>
    prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
  );

  const TABS = [
    { key: 'info',   label: 'Info & Objetivos' },
    { key: 'locales', label: 'Locales asignados' },
    { key: 'tareas', label: 'Tareas' },
  ];

  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#000000bb', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem',
    }}>
      <div style={{
        background: '#1a1a24', border: '1px solid #2d2d3d', borderRadius: 12,
        width: '100%', maxWidth: 680, maxHeight: '88vh', display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{ padding: '1.2rem 1.5rem', borderBottom: '1px solid #2d2d3d', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ color: '#fff', fontWeight: 700, fontSize: '1rem', margin: 0 }}>
              {repo.nombre} {repo.apellido}
            </h3>
            <p style={{ color: '#9090a0', fontSize: '0.78rem', margin: '3px 0 0' }}>
              @{repo.username} · Nro {repo.numero_vendedor}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#9090a0', fontSize: '1.3rem', cursor: 'pointer' }}>✕</button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #2d2d3d', paddingLeft: '1.5rem' }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              padding: '0.6rem 1.1rem', border: 'none', background: 'transparent', cursor: 'pointer',
              color: tab === t.key ? '#6c63ff' : '#9090a0', fontWeight: tab === t.key ? 700 : 400, fontSize: '0.88rem',
              borderBottom: tab === t.key ? '2px solid #6c63ff' : '2px solid transparent', marginBottom: -1,
            }}>{t.label}</button>
          ))}
        </div>

        {/* Contenido */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.2rem 1.5rem' }}>

          {/* INFO */}
          {tab === 'info' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div style={{ background: '#0f0f13', borderRadius: 8, padding: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                <div>
                  <div style={{ color: '#606070', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 600 }}>Último ingreso</div>
                  <div style={{ color: '#e0e0e0', fontSize: '0.88rem', marginTop: 4 }}>{formatFecha(repo.ultimo_login)}</div>
                </div>
                <div>
                  <div style={{ color: '#606070', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 600 }}>Locales asignados</div>
                  <div style={{ color: '#e0e0e0', fontSize: '0.88rem', marginTop: 4 }}>{repo.locales_asignados || '—'}</div>
                </div>
              </div>

              <div>
                <label style={{ color: '#9090a0', fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
                  Objetivo semanal (volumen)
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="number" step="0.01" min="0"
                    value={objSemanal}
                    onChange={e => setObjSemanal(e.target.value)}
                    placeholder="ej: 2500"
                    style={{ flex: 1, background: '#0f0f13', border: '1px solid #2d2d3d', borderRadius: 6, color: '#e0e0e0', padding: '0.5rem 0.7rem', fontSize: '0.88rem' }}
                  />
                  <button
                    onClick={guardarObjetivo}
                    disabled={guardandoObj}
                    className="btn-guardar"
                    style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                  >
                    {guardandoObj ? '...' : 'Guardar'}
                  </button>
                </div>
                {repo.objetivo_semanal && (
                  <p style={{ color: '#606070', fontSize: '0.75rem', marginTop: 6 }}>
                    Objetivo actual: {Number(repo.objetivo_semanal).toLocaleString('es-AR')} vol
                  </p>
                )}
              </div>
            </div>
          )}

          {/* LOCALES */}
          {tab === 'locales' && (
            <div>
              <p style={{ color: '#9090a0', fontSize: '0.82rem', marginBottom: '0.8rem' }}>
                Seleccioná los locales que atiende este repositor
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: '1rem' }}>
                {localesTodos.map(l => (
                  <label key={l.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
                    background: localesSel.includes(l.id) ? '#6c63ff15' : '#0f0f13',
                    border: `1px solid ${localesSel.includes(l.id) ? '#6c63ff55' : '#2d2d3d'}`,
                    borderRadius: 8, padding: '0.6rem 0.8rem',
                  }}>
                    <input
                      type="checkbox"
                      checked={localesSel.includes(l.id)}
                      onChange={() => toggleLocal(l.id)}
                      style={{ accentColor: '#6c63ff', width: 15, height: 15 }}
                    />
                    <span style={{ color: localesSel.includes(l.id) ? '#a78bfa' : '#e0e0e0', fontWeight: localesSel.includes(l.id) ? 600 : 400, fontSize: '0.88rem' }}>
                      {l.nombre}
                    </span>
                  </label>
                ))}
                {localesTodos.length === 0 && <p style={{ color: '#606070' }}>No hay locales cargados.</p>}
              </div>
              <button
                onClick={guardarLocales}
                disabled={guardandoLocales}
                className="btn-guardar"
              >
                {guardandoLocales ? 'Guardando...' : `Guardar asignación (${localesSel.length} seleccionados)`}
              </button>
            </div>
          )}

          {/* TAREAS */}
          {tab === 'tareas' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.8rem' }}>
                <button className="btn-nuevo" onClick={() => setMostrarFormTarea(v => !v)}>
                  {mostrarFormTarea ? 'Cancelar' : '+ Nueva tarea'}
                </button>
              </div>

              {mostrarFormTarea && (
                <div style={{ background: '#0f0f13', border: '1px solid #6c63ff44', borderRadius: 8, padding: '1rem', marginBottom: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Tipo</label>
                    <select className="form-control" value={nuevaTarea.tipo} onChange={e => setNuevaTarea(p => ({ ...p, tipo: e.target.value }))}>
                      {TIPOS_TAREA.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Descripción / instrucción</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      value={nuevaTarea.descripcion}
                      onChange={e => setNuevaTarea(p => ({ ...p, descripcion: e.target.value }))}
                      placeholder="ej: Subí foto del frente del local"
                      style={{ resize: 'vertical' }}
                    />
                  </div>
                  <button className="btn-guardar" onClick={crearTarea} disabled={creandoTarea}>
                    {creandoTarea ? 'Enviando...' : 'Enviar tarea'}
                  </button>
                </div>
              )}

              {cargandoTareas ? (
                <p style={{ color: '#606070' }}>Cargando tareas...</p>
              ) : tareas.length === 0 ? (
                <p style={{ color: '#606070', textAlign: 'center', padding: '1.5rem' }}>Sin tareas asignadas.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {tareas.map(t => (
                    <div key={t.id} style={{ background: '#0f0f13', border: '1px solid #2d2d3d', borderRadius: 8, padding: '0.9rem 1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                            <span style={{ ...colorTipo[t.tipo], padding: '1px 8px', borderRadius: 8, fontSize: '0.7rem', fontWeight: 700 }}>
                              {TIPOS_TAREA.find(x => x.value === t.tipo)?.label || t.tipo}
                            </span>
                            <span style={{ ...colorTarea[t.estado], padding: '1px 8px', borderRadius: 8, fontSize: '0.7rem', fontWeight: 700 }}>
                              {t.estado}
                            </span>
                            <span style={{ color: '#606070', fontSize: '0.72rem' }}>{formatFecha(t.creado_at)}</span>
                          </div>
                          <p style={{ color: '#e0e0e0', fontSize: '0.85rem', margin: 0 }}>{t.descripcion}</p>
                          {t.respuesta && (
                            <div style={{ marginTop: 8, background: '#1a1a24', borderRadius: 6, padding: '0.5rem 0.7rem', borderLeft: '2px solid #4ade80' }}>
                              <div style={{ color: '#4ade80', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: 2 }}>Respuesta del repositor</div>
                              <p style={{ color: '#e0e0e0', fontSize: '0.83rem', margin: 0 }}>{t.respuesta}</p>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => eliminarTarea(t.id)}
                          style={{ background: 'none', border: 'none', color: '#606070', cursor: 'pointer', fontSize: '0.8rem', padding: '2px 6px', flexShrink: 0 }}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function AdminRepositores() {
  const [repositores, setRepositores] = useState([]);
  const [locales, setLocales] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [seleccionado, setSeleccionado] = useState(null);
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => { cargar(); }, []);

  async function cargar() {
    setCargando(true);
    try {
      const [{ data: repos }, { data: locs }] = await Promise.all([
        axios.get('/api/repositores'),
        axios.get('/api/locales'),
      ]);
      setRepositores(repos);
      setLocales(locs);
    } finally { setCargando(false); }
  }

  const filtrados = repositores.filter(r => {
    const q = busqueda.toLowerCase();
    return (
      r.nombre.toLowerCase().includes(q) ||
      r.apellido.toLowerCase().includes(q) ||
      r.username.toLowerCase().includes(q) ||
      (r.numero_vendedor || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="gestion-container">
      <div className="gestion-header">
        <div>
          <h2 className="gestion-titulo">Repositores</h2>
          <p style={{ color: '#9090a0', fontSize: '0.88rem', marginTop: 2 }}>
            Gestioná el equipo de campo — tareas, locales y objetivos
          </p>
        </div>
        <input
          placeholder="Buscar repositor..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          style={{ background: '#1a1a24', border: '1px solid #2d2d3d', color: '#e0e0e0', borderRadius: 6, padding: '0.4rem 0.8rem', fontSize: '0.85rem', width: 200 }}
        />
      </div>

      {cargando ? (
        <p style={{ color: '#606070' }}>Cargando...</p>
      ) : filtrados.length === 0 ? (
        <p className="msg-vacio">No hay repositores.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
          {filtrados.map(r => (
            <div
              key={r.id}
              onClick={() => setSeleccionado(r)}
              style={{
                background: '#1a1a24', border: '1px solid #2d2d3d', borderRadius: 10,
                padding: '1.2rem', cursor: 'pointer', transition: 'border-color 0.15s',
              }}
              onMouseEnter={el => el.currentTarget.style.borderColor = '#6c63ff'}
              onMouseLeave={el => el.currentTarget.style.borderColor = '#2d2d3d'}
            >
              {/* Avatar + nombre */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%', background: '#6c63ff22',
                  border: '2px solid #6c63ff44', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#a78bfa', fontWeight: 700, fontSize: '1.1rem', flexShrink: 0,
                }}>
                  {r.nombre.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.95rem' }}>{r.nombre} {r.apellido}</div>
                  <div style={{ color: '#606070', fontSize: '0.75rem' }}>@{r.username} · Nro {r.numero_vendedor}</div>
                </div>
              </div>

              {/* Info rápida */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: '0.78rem' }}>
                <div style={{ background: '#0f0f13', borderRadius: 6, padding: '0.5rem 0.7rem' }}>
                  <div style={{ color: '#606070', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.65rem' }}>Último ingreso</div>
                  <div style={{ color: '#9090a0', marginTop: 2 }}>
                    {r.ultimo_login ? new Date(r.ultimo_login).toLocaleDateString('es-AR') : '—'}
                  </div>
                </div>
                <div style={{ background: '#0f0f13', borderRadius: 6, padding: '0.5rem 0.7rem' }}>
                  <div style={{ color: '#606070', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.65rem' }}>Obj. semanal</div>
                  <div style={{ color: r.objetivo_semanal ? '#6c63ff' : '#606070', fontWeight: r.objetivo_semanal ? 700 : 400, marginTop: 2 }}>
                    {r.objetivo_semanal ? Number(r.objetivo_semanal).toLocaleString('es-AR') : '—'}
                  </div>
                </div>
              </div>

              {/* Locales */}
              <div style={{ marginTop: 10, fontSize: '0.78rem' }}>
                <div style={{ color: '#606070', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.65rem', marginBottom: 4 }}>Locales</div>
                <div style={{ color: r.locales_asignados ? '#9090a0' : '#3d3d4d' }}>
                  {r.locales_asignados || 'Sin locales asignados'}
                </div>
              </div>

              <div style={{ marginTop: 12, color: '#6c63ff', fontSize: '0.78rem', fontWeight: 600 }}>
                Ver detalle →
              </div>
            </div>
          ))}
        </div>
      )}

      {seleccionado && (
        <PanelRepositor
          repo={seleccionado}
          localesTodos={locales}
          onClose={() => setSeleccionado(null)}
          onActualizado={() => { cargar(); }}
        />
      )}
    </div>
  );
}

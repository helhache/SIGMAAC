import { useEffect, useState, useRef } from 'react';
import axios from 'axios';

// ── Helpers ──────────────────────────────────────────────────────────────────
const colorTipo = { nacional: { bg: '#d9770620', color: '#f6ad55' }, regional: { bg: '#6c63ff20', color: '#a78bfa' } };

// ── Sub-componente: panel de locales de una empresa ───────────────────────────
function PanelLocales({ empresa, onClose }) {
  const [locales, setLocales] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modalLocal, setModalLocal] = useState(false);
  const [editandoLocal, setEditandoLocal] = useState(null);
  const [formLocal, setFormLocal] = useState({ nombre: '' });
  const [logoFile, setLogoFile] = useState(null);
  const [errorLocal, setErrorLocal] = useState('');
  const [tab, setTab] = useState('locales'); // 'locales' | 'reclamos'
  const [reclamos, setReclamos] = useState([]);
  const [cargandoRec, setCargandoRec] = useState(false);
  const fileRef = useRef();

  useEffect(() => { cargarLocales(); }, [empresa.id]);
  useEffect(() => { if (tab === 'reclamos') cargarReclamos(); }, [tab, empresa.id]);

  async function cargarLocales() {
    setCargando(true);
    try {
      const { data } = await axios.get(`/api/locales?empresa_id=${empresa.id}`);
      setLocales(data);
    } finally { setCargando(false); }
  }

  async function cargarReclamos() {
    setCargandoRec(true);
    try {
      const { data } = await axios.get('/api/reclamos');
      // Filtrar reclamos cuyos locales pertenecen a esta empresa
      const ids = new Set(locales.map(l => l.id));
      setReclamos(data.filter(r => ids.has(r.local_id)));
    } catch { setReclamos([]); }
    finally { setCargandoRec(false); }
  }

  const abrirNuevo = () => { setEditandoLocal(null); setFormLocal({ nombre: '' }); setLogoFile(null); setErrorLocal(''); setModalLocal(true); };
  const abrirEditar = (l) => { setEditandoLocal(l); setFormLocal({ nombre: l.nombre }); setLogoFile(null); setErrorLocal(''); setModalLocal(true); };

  async function guardarLocal() {
    setErrorLocal('');
    if (!formLocal.nombre.trim()) return setErrorLocal('El nombre es requerido');
    try {
      const fd = new FormData();
      fd.append('nombre', formLocal.nombre);
      fd.append('empresa_id', empresa.id);
      if (logoFile) fd.append('logo', logoFile);
      if (editandoLocal) {
        await axios.put(`/api/locales/${editandoLocal.id}`, fd);
      } else {
        await axios.post('/api/locales', fd);
      }
      setModalLocal(false);
      cargarLocales();
    } catch (err) { setErrorLocal(err.response?.data?.error || 'Error al guardar'); }
  }

  async function desactivarLocal(id) {
    if (!confirm('¿Desactivar este local?')) return;
    await axios.delete(`/api/locales/${id}`);
    cargarLocales();
  }

  const TABS = [{ key: 'locales', label: 'Locales' }, { key: 'reclamos', label: 'Reclamos' }];

  const colorReclamo = { pendiente: '#d97706', en_revision: '#2563eb', resuelto: '#16a34a', rechazado: '#dc2626' };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#000000bb', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem',
    }}>
      <div style={{
        background: '#1a1a24', border: '1px solid #2d2d3d', borderRadius: 12,
        width: '100%', maxWidth: 780, maxHeight: '88vh', display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{ padding: '1.2rem 1.5rem', borderBottom: '1px solid #2d2d3d', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ color: '#fff', fontWeight: 700, fontSize: '1rem', margin: 0 }}>{empresa.nombre}</h3>
            <span style={{ ...colorTipo[empresa.tipo], padding: '1px 8px', borderRadius: 4, fontSize: '0.72rem', fontWeight: 700, display: 'inline-block', marginTop: 4 }}>
              {empresa.tipo}
            </span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#9090a0', fontSize: '1.3rem', cursor: 'pointer' }}>✕</button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #2d2d3d', paddingLeft: '1.5rem' }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              padding: '0.6rem 1.1rem', border: 'none', background: 'transparent', cursor: 'pointer',
              color: tab === t.key ? '#6c63ff' : '#9090a0', fontWeight: tab === t.key ? 700 : 400, fontSize: '0.88rem',
              borderBottom: tab === t.key ? '2px solid #6c63ff' : '2px solid transparent', marginBottom: -1,
            }}>{t.label}</button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.2rem 1.5rem' }}>
          {tab === 'locales' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.8rem' }}>
                <button className="btn-nuevo" onClick={abrirNuevo}>+ Nuevo local</button>
              </div>
              {cargando ? (
                <p style={{ color: '#606070' }}>Cargando...</p>
              ) : locales.length === 0 ? (
                <p style={{ color: '#606070', textAlign: 'center', padding: '2rem' }}>No hay locales para esta empresa.</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #2d2d3d' }}>
                      {['Logo', 'Nombre', 'Estado', 'Acciones'].map(h => (
                        <th key={h} style={{ padding: '0.5rem 0.7rem', textAlign: 'left', color: '#9090a0', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {locales.map(l => (
                      <tr key={l.id} style={{ borderBottom: '1px solid #0f0f13' }}>
                        <td style={{ padding: '0.6rem 0.7rem' }}>
                          {l.logo ? (
                            <img src={l.logo} alt="" style={{ width: 32, height: 32, borderRadius: 4, objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: 32, height: 32, borderRadius: 4, background: '#2d2d3d', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#606070', fontSize: '0.7rem' }}>
                              {l.nombre?.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '0.6rem 0.7rem', color: '#fff', fontWeight: 600 }}>{l.nombre}</td>
                        <td style={{ padding: '0.6rem 0.7rem', color: l.activo ? '#4ade80' : '#f87171', fontSize: '0.82rem' }}>{l.activo ? 'Activo' : 'Inactivo'}</td>
                        <td style={{ padding: '0.6rem 0.7rem', display: 'flex', gap: 6 }}>
                          <button className="btn-editar" style={{ padding: '0.25rem 0.7rem', fontSize: '0.78rem' }} onClick={() => abrirEditar(l)}>Editar</button>
                          {l.activo && (
                            <button className="btn-eliminar" style={{ padding: '0.25rem 0.7rem', fontSize: '0.78rem' }} onClick={() => desactivarLocal(l.id)}>Desactivar</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}

          {tab === 'reclamos' && (
            cargandoRec ? (
              <p style={{ color: '#606070' }}>Cargando reclamos...</p>
            ) : reclamos.length === 0 ? (
              <p style={{ color: '#606070', textAlign: 'center', padding: '2rem' }}>No hay reclamos para los locales de esta empresa.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #2d2d3d' }}>
                    {['Local', 'Asunto', 'Fecha', 'Estado'].map(h => (
                      <th key={h} style={{ padding: '0.5rem 0.7rem', textAlign: 'left', color: '#9090a0', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reclamos.map(r => (
                    <tr key={r.id} style={{ borderBottom: '1px solid #0f0f13' }}>
                      <td style={{ padding: '0.6rem 0.7rem', color: '#6c63ff', fontWeight: 700 }}>{r.local_nombre}</td>
                      <td style={{ padding: '0.6rem 0.7rem', color: '#e0e0e0' }}>{r.asunto}</td>
                      <td style={{ padding: '0.6rem 0.7rem', color: '#9090a0', whiteSpace: 'nowrap' }}>{r.creado_at?.slice(0, 10)}</td>
                      <td style={{ padding: '0.6rem 0.7rem' }}>
                        <span style={{
                          padding: '2px 8px', borderRadius: 8, fontWeight: 700, fontSize: '0.72rem',
                          background: (colorReclamo[r.estado] || '#606070') + '22',
                          color: colorReclamo[r.estado] || '#9090a0',
                        }}>{r.estado}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}
        </div>
      </div>

      {/* Modal nuevo/editar local */}
      {modalLocal && (
        <div style={{ position: 'fixed', inset: 0, background: '#000000cc', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
          <div className="modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <h3 className="modal-titulo">{editandoLocal ? 'Editar local' : 'Nuevo local'}</h3>
            {errorLocal && <div className="msg-error">{errorLocal}</div>}
            <div className="form-group">
              <label className="form-label">Nombre</label>
              <input className="form-control" value={formLocal.nombre} onChange={e => setFormLocal(p => ({ ...p, nombre: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Logo (opcional)</label>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => setLogoFile(e.target.files[0])} />
              <button onClick={() => fileRef.current.click()} style={{ background: '#0f0f13', border: '1px solid #2d2d3d', color: '#9090a0', borderRadius: 6, padding: '0.4rem 0.8rem', cursor: 'pointer', fontSize: '0.82rem' }}>
                {logoFile ? logoFile.name : 'Seleccionar imagen'}
              </button>
            </div>
            <div className="modal-actions">
              <button className="btn-guardar" onClick={guardarLocal}>Guardar</button>
              <button className="btn-cancelar" onClick={() => setModalLocal(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function AdminEmpresas() {
  const [empresas, setEmpresas] = useState([]);
  const [empresaSel, setEmpresaSel] = useState(null);
  const [modalEmp, setModalEmp] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState({ nombre: '', tipo: 'regional' });
  const [error, setError] = useState('');

  const cargar = async () => {
    const { data } = await axios.get('/api/empresas');
    setEmpresas(data);
  };

  useEffect(() => { cargar(); }, []);

  const abrirNuevo = () => { setEditando(null); setForm({ nombre: '', tipo: 'regional' }); setError(''); setModalEmp(true); };
  const abrirEditar = (e, ev) => { ev.stopPropagation(); setEditando(e); setForm({ nombre: e.nombre, tipo: e.tipo }); setError(''); setModalEmp(true); };

  const guardar = async () => {
    setError('');
    if (!form.nombre.trim()) return setError('El nombre es requerido');
    try {
      if (editando) {
        await axios.put(`/api/empresas/${editando.id}`, form);
      } else {
        await axios.post('/api/empresas', form);
      }
      setModalEmp(false);
      cargar();
    } catch (err) { setError(err.response?.data?.error || 'Error al guardar'); }
  };

  const desactivar = async (id, ev) => {
    ev.stopPropagation();
    if (!confirm('¿Desactivar esta empresa?')) return;
    await axios.delete(`/api/empresas/${id}`);
    cargar();
  };

  return (
    <div className="gestion-container">
      <div className="gestion-header">
        <div>
          <h2 className="gestion-titulo">Empresas</h2>
          <p style={{ color: '#9090a0', fontSize: '0.88rem', marginTop: 2 }}>Hacé click en una empresa para ver sus locales y reclamos</p>
        </div>
        <button className="btn-nuevo" onClick={abrirNuevo}>+ Nueva empresa</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
        {empresas.map(e => (
          <div
            key={e.id}
            onClick={() => setEmpresaSel(e)}
            style={{
              background: '#1a1a24', border: '1px solid #2d2d3d', borderRadius: 10,
              padding: '1.2rem', cursor: 'pointer', transition: 'border-color 0.15s',
            }}
            onMouseEnter={el => el.currentTarget.style.borderColor = '#6c63ff'}
            onMouseLeave={el => el.currentTarget.style.borderColor = '#2d2d3d'}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <h3 style={{ color: '#fff', fontWeight: 700, fontSize: '1rem', margin: 0 }}>{e.nombre}</h3>
              <span style={{ ...colorTipo[e.tipo], padding: '2px 8px', borderRadius: 4, fontSize: '0.72rem', fontWeight: 700 }}>
                {e.tipo}
              </span>
            </div>
            <p style={{ color: '#9090a0', fontSize: '0.85rem', margin: '0 0 14px' }}>
              {e.total_locales || 0} local{e.total_locales !== 1 ? 'es' : ''} activo{e.total_locales !== 1 ? 's' : ''}
            </p>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn-editar" style={{ padding: '0.25rem 0.7rem', fontSize: '0.78rem' }} onClick={(ev) => abrirEditar(e, ev)}>Editar</button>
              {e.activo && (
                <button className="btn-eliminar" style={{ padding: '0.25rem 0.7rem', fontSize: '0.78rem' }} onClick={(ev) => desactivar(e.id, ev)}>Desactivar</button>
              )}
            </div>
          </div>
        ))}
        {empresas.length === 0 && (
          <p style={{ color: '#606070' }}>No hay empresas cargadas.</p>
        )}
      </div>

      {/* Panel de locales */}
      {empresaSel && (
        <PanelLocales empresa={empresaSel} onClose={() => setEmpresaSel(null)} />
      )}

      {/* Modal empresa */}
      {modalEmp && (
        <div className="modal-overlay" onClick={() => setModalEmp(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 className="modal-titulo">{editando ? 'Editar empresa' : 'Nueva empresa'}</h3>
            {error && <div className="msg-error">{error}</div>}
            <div className="form-group">
              <label className="form-label">Nombre</label>
              <input className="form-control" value={form.nombre} placeholder="Ej: Tauil, Beraca, DIA..."
                onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Tipo</label>
              <select className="form-control" value={form.tipo} onChange={e => setForm(p => ({ ...p, tipo: e.target.value }))}>
                <option value="regional">Regional</option>
                <option value="nacional">Nacional</option>
              </select>
            </div>
            <div className="modal-actions">
              <button className="btn-guardar" onClick={guardar}>Guardar</button>
              <button className="btn-cancelar" onClick={() => setModalEmp(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

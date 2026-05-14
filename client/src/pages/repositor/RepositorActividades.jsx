import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import API_URL from '../../config';

const colorEstadoReclamo = { abierto: '#dc2626', en_revision: '#d97706', resuelto: '#16a34a', cerrado: '#888' };
const colorEstadoTarea  = { pendiente: '#d97706', en_progreso: '#2563eb', completada: '#16a34a', cancelada: '#888' };

function formatFecha(f) {
  if (!f) return '—';
  return String(f).slice(0,10).split('-').reverse().join('/');
}

export default function RepositorActividades() {
  const { usuario } = useAuth();
  const locales = usuario?.locales || [];

  const [tab, setTab] = useState('tareas');
  const [tareas, setTareas] = useState([]);
  const [reclamos, setReclamos] = useState([]);
  const [cargandoT, setCargandoT] = useState(true);
  const [cargandoR, setCargandoR] = useState(true);
  const [selTarea, setSelTarea] = useState(null);
  const [selReclamo, setSelReclamo] = useState(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');

  const [form, setForm] = useState({
    local_id: locales[0]?.id || '',
    tipo: '',
    descripcion: '',
    fecha: new Date().toISOString().slice(0,10),
  });

  useEffect(() => {
    cargarTareas();
    cargarReclamos();
  }, []);

  async function cargarTareas() {
    setCargandoT(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/api/repositores/me/tareas`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setTareas(Array.isArray(data) ? data : []);
    } catch { /* silencioso */ }
    finally { setCargandoT(false); }
  }

  async function cargarReclamos() {
    setCargandoR(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/api/reclamos`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setReclamos(Array.isArray(data) ? data : []);
    } catch { /* silencioso */ }
    finally { setCargandoR(false); }
  }

  async function enviarReclamo(e) {
    e.preventDefault();
    setEnviando(true);
    setError('');
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/api/reclamos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...form, local_id: parseInt(form.local_id) }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || 'Error al enviar');
        return;
      }
      setMostrarForm(false);
      setForm({ local_id: locales[0]?.id || '', tipo: '', descripcion: '', fecha: new Date().toISOString().slice(0,10) });
      setExito('Reclamo enviado');
      setTimeout(() => setExito(''), 3000);
      cargarReclamos();
    } catch { setError('Error al enviar'); }
    finally { setEnviando(false); }
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <h2 style={{ margin: '0 0 4px', color: '#fff' }}>Actividades</h2>
      <p style={{ color: '#9090a0', marginBottom: 20, fontSize: 13 }}>
        Tareas del admin y tus reclamos
      </p>

      {error && <div style={{ background: '#dc262622', color: '#fca5a5', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 13 }}>{error}</div>}
      {exito && <div style={{ background: '#16a34a22', color: '#4ade80', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 13 }}>{exito}</div>}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderBottom: '1px solid #2d2d3d' }}>
        {[
          { id: 'tareas', label: 'Tareas del admin', badge: tareas.filter(t => t.estado === 'pendiente').length },
          { id: 'reclamos', label: 'Mis reclamos', badge: reclamos.filter(r => r.estado === 'abierto').length },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '10px 20px', background: 'none', border: 'none', cursor: 'pointer',
            color: tab === t.id ? '#fff' : '#9090a0', fontWeight: tab === t.id ? 700 : 400,
            fontSize: 13, borderBottom: tab === t.id ? '2px solid #6c63ff' : '2px solid transparent',
            position: 'relative',
          }}>
            {t.label}
            {t.badge > 0 && (
              <span style={{
                background: '#dc2626', color: '#fff', borderRadius: '50%',
                fontSize: 10, fontWeight: 700, padding: '1px 5px', marginLeft: 6,
              }}>
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── TAB TAREAS ─────────────────────────────────────────────────────── */}
      {tab === 'tareas' && (
        <div>
          {cargandoT ? (
            <p style={{ color: '#9090a0' }}>Cargando...</p>
          ) : tareas.length === 0 ? (
            <div style={{ background: '#1a1a24', border: '1px solid #2d2d3d', borderRadius: 10, padding: 32, textAlign: 'center', color: '#9090a0' }}>
              No tenés tareas asignadas por el administrador.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {tareas.map(t => (
                <div key={t.id} style={{ background: '#1a1a24', border: '1px solid #2d2d3d', borderRadius: 8 }}>
                  <div
                    onClick={() => setSelTarea(selTarea === t.id ? null : t.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', cursor: 'pointer' }}
                  >
                    <div style={{ flex: 1 }}>
                      <span style={{ fontWeight: 600, color: '#fff', fontSize: 13 }}>
                        {t.tipo ? `[${t.tipo}] ` : ''}{t.descripcion?.slice(0,80)}{t.descripcion?.length > 80 ? '...' : ''}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: '#9090a0' }}>{formatFecha(t.creado_at)}</div>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10,
                      background: (colorEstadoTarea[t.estado || 'pendiente'] || '#888') + '22',
                      color: colorEstadoTarea[t.estado || 'pendiente'] || '#888',
                    }}>
                      {t.estado || 'pendiente'}
                    </span>
                  </div>
                  {selTarea === t.id && (
                    <div style={{ borderTop: '1px solid #2d2d3d', padding: '12px 16px' }}>
                      <p style={{ color: '#ccc', fontSize: 13, margin: 0, lineHeight: 1.6 }}>{t.descripcion}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB RECLAMOS ───────────────────────────────────────────────────── */}
      {tab === 'reclamos' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <button
              onClick={() => setMostrarForm(v => !v)}
              style={{ padding: '8px 18px', background: '#e94560', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700 }}
            >
              {mostrarForm ? 'Cancelar' : '+ Nuevo reclamo'}
            </button>
          </div>

          {mostrarForm && (
            <form onSubmit={enviarReclamo} style={{ background: '#1a1a24', border: '1px solid #2d2d3d', borderRadius: 10, padding: 24, marginBottom: 20 }}>
              <h3 style={{ color: '#fff', margin: '0 0 16px', fontSize: 15 }}>Nuevo reclamo</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={labelStyle}>Local *</label>
                  <select value={form.local_id} onChange={e => setForm(f => ({ ...f, local_id: e.target.value }))} style={inputStyle} required>
                    <option value="">— Elegir local —</option>
                    {locales.map(l => <option key={l.id} value={l.id}>{l.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Tipo (opcional)</label>
                  <input value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))} style={inputStyle} placeholder="Faltante, Entrega, Precio..." />
                </div>
                <div>
                  <label style={labelStyle}>Fecha</label>
                  <input type="date" value={form.fecha} onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))} style={inputStyle} required />
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Descripción *</label>
                <textarea value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                  rows={3} required style={{ ...inputStyle, resize: 'vertical' }} placeholder="Describí el problema..." />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Adjuntar foto (opcional)</label>
                <input type="file" accept="image/*" style={{ ...inputStyle, padding: '6px 10px' }}
                  onChange={() => { /* upload logic pendiente */ }} />
                <p style={{ color: '#505060', fontSize: 11, marginTop: 4 }}>* La carga de fotos estará disponible próximamente.</p>
              </div>
              <button type="submit" disabled={enviando} style={{ padding: '9px 24px', background: '#e94560', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700 }}>
                {enviando ? 'Enviando...' : 'Enviar reclamo'}
              </button>
            </form>
          )}

          {cargandoR ? (
            <p style={{ color: '#9090a0' }}>Cargando...</p>
          ) : reclamos.length === 0 ? (
            <div style={{ background: '#1a1a24', border: '1px solid #2d2d3d', borderRadius: 10, padding: 32, textAlign: 'center', color: '#9090a0' }}>
              No enviaste reclamos todavía.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {reclamos.map(r => (
                <div key={r.id} style={{ background: '#1a1a24', border: '1px solid #2d2d3d', borderRadius: 8 }}>
                  <div
                    onClick={() => setSelReclamo(selReclamo === r.id ? null : r.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', cursor: 'pointer' }}
                  >
                    <div style={{ flex: 1 }}>
                      <span style={{ fontWeight: 600, color: '#fff', fontSize: 13 }}>{r.local_nombre}</span>
                      {r.tipo && <span style={{ color: '#9090a0', fontSize: 12, marginLeft: 10 }}>{r.tipo}</span>}
                    </div>
                    <div style={{ fontSize: 11, color: '#9090a0' }}>{formatFecha(r.fecha)}</div>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10,
                      background: (colorEstadoReclamo[r.estado] || '#888') + '22',
                      color: colorEstadoReclamo[r.estado] || '#888',
                    }}>
                      {r.estado}
                    </span>
                  </div>
                  {selReclamo === r.id && (
                    <div style={{ borderTop: '1px solid #2d2d3d', padding: '12px 16px' }}>
                      <p style={{ color: '#ccc', fontSize: 13, margin: '0 0 10px' }}>{r.descripcion}</p>
                      {r.resolucion && (
                        <div style={{ background: '#0f0f13', borderRadius: 6, padding: '10px 12px' }}>
                          <p style={{ color: '#888', fontSize: 11, margin: '0 0 4px' }}>Respuesta del admin:</p>
                          <p style={{ color: '#4ade80', fontSize: 13, margin: 0 }}>{r.resolucion}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const labelStyle = { display: 'block', fontSize: 11, fontWeight: 600, color: '#9090a0', marginBottom: 4 };
const inputStyle = { width: '100%', padding: '8px 10px', border: '1px solid #2d2d3d', borderRadius: 6, fontSize: 13, background: '#0f0f13', color: '#fff', boxSizing: 'border-box' };

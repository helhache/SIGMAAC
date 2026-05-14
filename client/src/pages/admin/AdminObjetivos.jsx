import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNotif } from '../../context/NotifContext';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, Cell,
} from 'recharts';

const PERIODOS = ['semanal', 'mensual', 'anual'];

const CP = {
  semanal: { bg: '#2563eb22', color: '#60a5fa' },
  mensual: { bg: '#7c3aed22', color: '#a78bfa' },
  anual:   { bg: '#d9770622', color: '#f6ad55' },
};

const FORM_VACIO = {
  descripcion: '', periodo: 'mensual',
  fecha_inicio: '', fecha_fin: '',
  volumen_objetivo: '', unit_general: '1.7',
  volumen_real: '',
  visible_repositores: false, visible_volumen: true, visible_porcentaje: true,
};

function fmt(n) {
  return Number(n || 0).toLocaleString('es-AR', { maximumFractionDigits: 2 });
}

function pctColor(p) {
  if (p >= 100) return '#16a34a';
  if (p >= 80)  return '#2563eb';
  if (p >= 50)  return '#d97706';
  return '#dc2626';
}

// ── Barra de progreso ──────────────────────────────────────────────────────
function ProgressBar({ pct, color, thin }) {
  const p = Math.min(100, Math.max(0, pct || 0));
  return (
    <div style={{ background: '#2d2d3d', borderRadius: 4, height: thin ? 4 : 8, overflow: 'hidden', marginTop: 4 }}>
      <div style={{
        width: `${p}%`, height: '100%', borderRadius: 4,
        background: color, transition: 'width 0.4s ease',
      }} />
    </div>
  );
}

// ── Toggle de visibilidad ─────────────────────────────────────────────────
function Toggle({ value, onChange, label }) {
  return (
    <button
      onClick={() => onChange(!value)}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        background: value ? '#6c63ff22' : '#2d2d3d',
        border: `1px solid ${value ? '#6c63ff60' : '#3d3d4d'}`,
        borderRadius: 6, padding: '4px 10px', cursor: 'pointer',
        fontSize: '0.75rem', color: value ? '#a78bfa' : '#606070',
        fontWeight: value ? 600 : 400, transition: 'all 0.15s',
      }}
    >
      <span style={{
        width: 10, height: 10, borderRadius: '50%',
        background: value ? '#a78bfa' : '#404050', display: 'inline-block', flexShrink: 0,
      }} />
      {label}
    </button>
  );
}

// ── Gráfico mensual (para objetivos anuales) ──────────────────────────
const tooltipStyle = {
  contentStyle: { background: '#1a1a24', border: '1px solid #2d2d3d', borderRadius: 8, fontSize: 12 },
  labelStyle: { color: '#9090a0' },
  cursor: { fill: '#6c63ff10' },
};

function GraficoMensual({ meses }) {
  if (!meses || meses.length === 0) return null;

  const data = meses.map(m => ({
    mes: m.descripcion
      ? m.descripcion.replace(/objetivo\s*/i, '').slice(0, 8)
      : m.fecha_inicio?.slice(0, 7),
    Objetivo: parseFloat(m.volumen_objetivo),
    Real:     parseFloat(m.volumen_actual),
    completado: m.completado,
  }));

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ fontSize: '0.72rem', color: '#606070', fontWeight: 600, textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.05em' }}>
        Desglose mensual — Objetivo vs Real
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} barCategoryGap="30%">
          <CartesianGrid strokeDasharray="3 3" stroke="#2d2d3d" vertical={false} />
          <XAxis dataKey="mes" tick={{ fill: '#9090a0', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#9090a0', fontSize: 11 }} axisLine={false} tickLine={false} width={55}
            tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
          <Tooltip
            {...tooltipStyle}
            formatter={(v, name) => [v.toLocaleString('es-AR', { maximumFractionDigits: 1 }), name]}
          />
          <Legend
            wrapperStyle={{ fontSize: 12, color: '#9090a0', paddingTop: 8 }}
          />
          <Bar dataKey="Objetivo" fill="#6c63ff55" stroke="#6c63ff" strokeWidth={1} radius={[4, 4, 0, 0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.completado ? '#6c63ff33' : '#6c63ff55'} />
            ))}
          </Bar>
          <Bar dataKey="Real" radius={[4, 4, 0, 0]}>
            {data.map((entry, i) => {
              const ok = entry.Real >= entry.Objetivo;
              return <Cell key={i} fill={ok ? '#16a34a' : entry.completado ? '#dc2626' : '#d97706'} />;
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div style={{ display: 'flex', gap: 16, marginTop: 6, fontSize: '0.7rem', color: '#606070' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: '#16a34a', display: 'inline-block' }} /> Alcanzado
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: '#dc2626', display: 'inline-block' }} /> No alcanzado
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: '#d97706', display: 'inline-block' }} /> En curso
        </span>
      </div>
    </div>
  );
}

// ── Card de progreso (vista Admin — ve todo) ──────────────────────────────
function CardProgreso({ obj, onToggle }) {
  const cp = CP[obj.periodo] || CP.mensual;
  const [expandirMeses, setExpandirMeses] = useState(false);

  return (
    <div style={{
      background: '#1a1a24', border: `1px solid ${cp.color}44`,
      borderRadius: 10, padding: '1.1rem',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <span style={{ ...cp, padding: '2px 10px', borderRadius: 8, fontSize: '0.7rem', fontWeight: 700 }}>
          {obj.periodo.toUpperCase()}
        </span>
        <span style={{ fontSize: '1.8rem', fontWeight: 800, color: pctColor(obj.porcentaje), lineHeight: 1 }}>
          {obj.porcentaje?.toFixed(1)}%
        </span>
      </div>

      {obj.descripcion && (
        <div style={{ color: '#9090a0', fontSize: '0.78rem', marginBottom: 6 }}>{obj.descripcion}</div>
      )}

      <div style={{ marginBottom: 6 }}>
        <div style={{ color: '#fff', fontWeight: 700, fontSize: '1.15rem' }}>{fmt(obj.volumen_actual)}</div>
        <div style={{ color: '#606070', fontSize: '0.72rem' }}>de {fmt(obj.volumen_objetivo)} objetivo</div>
      </div>

      <ProgressBar pct={obj.porcentaje} color={pctColor(obj.porcentaje)} />

      {/* Barra de tiempo */}
      <div style={{ fontSize: '0.68rem', color: '#505060', marginTop: 6, display: 'flex', justifyContent: 'space-between' }}>
        <span>Tiempo: {obj.porcentaje_tiempo}%</span>
        <span>Día {obj.dias_transcurridos}/{obj.dias_totales}</span>
      </div>
      <ProgressBar pct={obj.porcentaje_tiempo} color="#3d3d5d" thin />

      <div style={{ marginTop: 8, fontSize: '0.7rem', color: '#404050' }}>
        {obj.fecha_inicio} → {obj.fecha_fin}
      </div>

      {/* Volumen no obtenido (solo anual) */}
      {obj.periodo === 'anual' && obj.volumen_no_obtenido > 0 && (
        <div style={{
          marginTop: 8, padding: '6px 10px',
          background: '#dc262615', border: '1px solid #dc262640',
          borderRadius: 6, fontSize: '0.75rem', color: '#fc8181',
        }}>
          Volumen no obtenido acumulado: <strong>{fmt(obj.volumen_no_obtenido)}</strong>
        </div>
      )}

      {/* Gráfico mensual (solo anual) */}
      {obj.periodo === 'anual' && obj.meses_detalle?.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <button
            onClick={() => setExpandirMeses(v => !v)}
            style={{ background: 'none', border: 'none', color: '#6c63ff', fontSize: '0.75rem', cursor: 'pointer', padding: 0 }}
          >
            {expandirMeses ? '▲ Ocultar gráfico' : '▼ Ver gráfico mensual'}
          </button>
          {expandirMeses && <GraficoMensual meses={obj.meses_detalle} />}
        </div>
      )}

      {/* Indicadores de visibilidad */}
      <div style={{ marginTop: 8, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {obj.visible_repositores ? (
          <>
            <span style={{ fontSize: '0.65rem', padding: '1px 6px', borderRadius: 4, background: '#16a34a18', color: '#4ade80', border: '1px solid #16a34a30' }}>
              visible
            </span>
            {obj.visible_volumen && (
              <span style={{ fontSize: '0.65rem', padding: '1px 6px', borderRadius: 4, background: '#2563eb18', color: '#60a5fa', border: '1px solid #2563eb30' }}>
                núm
              </span>
            )}
            {obj.visible_porcentaje && (
              <span style={{ fontSize: '0.65rem', padding: '1px 6px', borderRadius: 4, background: '#7c3aed18', color: '#a78bfa', border: '1px solid #7c3aed30' }}>
                %
              </span>
            )}
          </>
        ) : (
          <span style={{ fontSize: '0.65rem', padding: '1px 6px', borderRadius: 4, background: '#60606018', color: '#606070', border: '1px solid #40404050' }}>
            oculto para repositores/locales
          </span>
        )}
      </div>
    </div>
  );
}

// ── Sección de Asignaciones por empresa/local ─────────────────────────────
function SeccionAsignaciones({ objetivoId, volumenObjetivo, empresasDB, localesDB }) {
  const { toast } = useNotif();
  const [asig, setAsig] = useState({ empresas: [], locales: [] });
  const [formEmp, setFormEmp] = useState({});
  const [formLoc, setFormLoc] = useState({});
  const [guardando, setGuardando] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { cargarAsig(); }, [objetivoId]);

  async function cargarAsig() {
    try {
      const { data } = await axios.get(`/api/objetivos/${objetivoId}/asignaciones`);
      setAsig(data);
      const em = {};
      data.empresas.forEach(e => { em[e.empresa_id] = String(e.volumen_objetivo); });
      setFormEmp(em);
      const lm = {};
      data.locales.forEach(l => { lm[l.local_id] = String(l.volumen_objetivo); });
      setFormLoc(lm);
    } catch { setError('Error al cargar asignaciones'); }
  }

  async function guardarEmpresa(empresa_id) {
    const val = parseFloat(formEmp[empresa_id]);
    if (!val || val <= 0) return setError('El volumen debe ser mayor a 0');
    setGuardando(`emp_${empresa_id}`);
    setError('');
    try {
      await axios.post(`/api/objetivos/${objetivoId}/empresas`, { empresa_id, volumen_objetivo: val });
      toast('Objetivo de empresa guardado', 'success');
      cargarAsig();
    } catch (err) { setError(err.response?.data?.error || 'Error al guardar'); }
    finally { setGuardando(''); }
  }

  async function quitarEmpresa(empresa_id) {
    try {
      await axios.delete(`/api/objetivos/${objetivoId}/empresas/${empresa_id}`);
      toast('Objetivo de empresa quitado', 'info');
      cargarAsig();
    } catch { toast('Error al quitar empresa', 'error'); }
  }

  async function guardarLocal(local_id) {
    const val = parseFloat(formLoc[local_id]);
    if (!val || val <= 0) return setError('El volumen debe ser mayor a 0');
    setGuardando(`loc_${local_id}`);
    setError('');
    try {
      await axios.post(`/api/objetivos/${objetivoId}/locales`, { local_id, volumen_objetivo: val });
      toast('Objetivo de local guardado', 'success');
      cargarAsig();
    } catch (err) { setError(err.response?.data?.error || 'Error al guardar'); }
    finally { setGuardando(''); }
  }

  async function quitarLocal(local_id) {
    try {
      await axios.delete(`/api/objetivos/${objetivoId}/locales/${local_id}`);
      toast('Objetivo de local quitado', 'info');
      cargarAsig();
    } catch { toast('Error al quitar local', 'error'); }
  }

  // Totales de asignación de empresas vs objetivo principal
  const sumaEmpresas = asig.empresas.reduce((s, e) => s + parseFloat(e.volumen_objetivo), 0);
  const restoObjetivo = (volumenObjetivo || 0) - sumaEmpresas;
  const sumaEmpresasOk = volumenObjetivo > 0 && Math.abs(restoObjetivo) < 0.01;
  const sumaEmpresasExcede = sumaEmpresas > (volumenObjetivo || 0);

  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ fontSize: '0.72rem', color: '#606070', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Asignación de volumen por empresa / local
        </div>
        {/* Barra global: total asignado a empresas vs objetivo */}
        {volumenObjetivo > 0 && (
          <div style={{
            fontSize: '0.75rem', padding: '4px 10px', borderRadius: 6,
            display: 'inline-flex', gap: 6, alignItems: 'center',
            background: sumaEmpresasExcede ? '#dc262618' : sumaEmpresasOk ? '#16a34a18' : '#d9770618',
            color: sumaEmpresasExcede ? '#fc8181' : sumaEmpresasOk ? '#4ade80' : '#f6ad55',
            border: `1px solid ${sumaEmpresasExcede ? '#dc262640' : sumaEmpresasOk ? '#16a34a30' : '#d9770630'}`,
          }}>
            {sumaEmpresasOk ? '✓ Total cubierto' : sumaEmpresasExcede ? '✗ Excede el objetivo' : '⚠ Sin cubrir todo el objetivo'}
            &nbsp;—&nbsp;
            {fmt(sumaEmpresas)} / {fmt(volumenObjetivo)} asignados
            {!sumaEmpresasOk && !sumaEmpresasExcede && (
              <span style={{ color: '#9090a0' }}>· Disponible: {fmt(restoObjetivo)}</span>
            )}
          </div>
        )}
      </div>
      {error && <div className="msg-error" style={{ marginBottom: 8, fontSize: '0.82rem' }}>{error}</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {empresasDB.map(emp => {
          const empAsig = asig.empresas.find(e => e.empresa_id === emp.id);
          const objEmp = empAsig ? parseFloat(empAsig.volumen_objetivo) : 0;
          const localesDeEmp = localesDB.filter(l => l.empresa_id === emp.id && l.activo);
          const localesAsig = asig.locales.filter(l => l.empresa_id === emp.id);
          const sumaLocales = localesAsig.reduce((s, l) => s + parseFloat(l.volumen_objetivo), 0);
          const resto = objEmp - sumaLocales;
          const sumaOk = objEmp > 0 && Math.abs(resto) < 0.01;
          const sumaExcede = sumaLocales > objEmp;

          return (
            <div key={emp.id} style={{
              background: '#12121c', border: '1px solid #2d2d3d',
              borderRadius: 8, padding: '10px 12px',
            }}>
              {/* Fila empresa */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700, color: '#fff', fontSize: '0.85rem', flex: 1, minWidth: 100 }}>
                  {emp.nombre}
                </span>
                <input
                  type="number" min="0" step="0.01"
                  placeholder="Vol. empresa..."
                  value={formEmp[emp.id] ?? ''}
                  onChange={e => setFormEmp(f => ({ ...f, [emp.id]: e.target.value }))}
                  className="form-control"
                  style={{ width: 150, fontSize: '0.82rem' }}
                />
                <button
                  onClick={() => guardarEmpresa(emp.id)}
                  disabled={!!guardando}
                  style={{
                    padding: '0.35rem 0.9rem', background: '#6c63ff',
                    border: 'none', borderRadius: 6, color: '#fff',
                    cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
                    opacity: guardando === `emp_${emp.id}` ? 0.6 : 1,
                  }}
                >
                  {guardando === `emp_${emp.id}` ? '...' : empAsig ? 'Actualizar' : 'Asignar'}
                </button>
                {empAsig && (
                  <button
                    onClick={() => quitarEmpresa(emp.id)}
                    style={{
                      padding: '0.35rem 0.7rem', background: 'none',
                      border: '1px solid #dc262650', borderRadius: 6,
                      color: '#fc8181', cursor: 'pointer', fontSize: '0.78rem',
                    }}
                  >
                    Quitar
                  </button>
                )}
              </div>

              {/* Locales de esta empresa (solo si la empresa tiene objetivo) */}
              {empAsig && localesDeEmp.length > 0 && (
                <div style={{ marginTop: 8, paddingLeft: 10, borderLeft: '2px solid #2d2d3d' }}>
                  {localesDeEmp.map(loc => {
                    const locAsig = asig.locales.find(l => l.local_id === loc.id);
                    return (
                      <div key={loc.id} style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        marginBottom: 5, flexWrap: 'wrap',
                      }}>
                        <span style={{ color: '#9090a0', fontSize: '0.8rem', flex: 1, minWidth: 80 }}>
                          {loc.nombre}
                        </span>
                        <input
                          type="number" min="0" step="0.01"
                          placeholder="Vol. local..."
                          value={formLoc[loc.id] ?? ''}
                          onChange={e => setFormLoc(f => ({ ...f, [loc.id]: e.target.value }))}
                          className="form-control"
                          style={{ width: 130, fontSize: '0.8rem' }}
                        />
                        <button
                          onClick={() => guardarLocal(loc.id)}
                          disabled={!!guardando}
                          style={{
                            padding: '0.3rem 0.7rem',
                            background: '#6c63ff33', border: '1px solid #6c63ff50',
                            borderRadius: 6, color: '#a78bfa', cursor: 'pointer',
                            fontSize: '0.78rem',
                            opacity: guardando === `loc_${loc.id}` ? 0.6 : 1,
                          }}
                        >
                          {guardando === `loc_${loc.id}` ? '...' : locAsig ? 'Actualizar' : 'Asignar'}
                        </button>
                        {locAsig && (
                          <button
                            onClick={() => quitarLocal(loc.id)}
                            style={{
                              padding: '0.3rem 0.6rem', background: 'none',
                              border: '1px solid #dc262640', borderRadius: 6,
                              color: '#fc8181', cursor: 'pointer', fontSize: '0.75rem',
                            }}
                          >×</button>
                        )}
                      </div>
                    );
                  })}

                  {/* Barra de suma */}
                  <div style={{
                    marginTop: 6, fontSize: '0.75rem', padding: '4px 8px',
                    borderRadius: 6, display: 'inline-flex', gap: 6, alignItems: 'center',
                    background: sumaExcede ? '#dc262618' : sumaOk ? '#16a34a18' : '#d9770618',
                    color: sumaExcede ? '#fc8181' : sumaOk ? '#4ade80' : '#f6ad55',
                    border: `1px solid ${sumaExcede ? '#dc262640' : sumaOk ? '#16a34a30' : '#d9770630'}`,
                  }}>
                    {sumaOk ? '✓ Completo' : sumaExcede ? '✗ Excede' : '⚠ Incompleto'}
                    &nbsp;—&nbsp;
                    {fmt(sumaLocales)} / {fmt(objEmp)} asignados a locales
                    {!sumaOk && !sumaExcede && (
                      <span style={{ color: '#9090a0' }}>· Resta: {fmt(resto)}</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────────────────────────────────────
export default function AdminObjetivos() {
  const { toast, confirmar } = useNotif();
  const [tab, setTab] = useState('progreso');

  // Datos
  const [progreso, setProgreso] = useState([]);
  const [objetivos, setObjetivos] = useState([]);
  const [empresasDB, setEmpresasDB] = useState([]);
  const [localesDB, setLocalesDB] = useState([]);
  const [cargando, setCargando] = useState(true);

  // Form nuevo objetivo
  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm] = useState(FORM_VACIO);
  const [guardando, setGuardando] = useState(false);

  // Edición inline
  const [editandoId, setEditandoId] = useState(null);
  const [editForm, setEditForm] = useState({});

  // Expandir asignaciones
  const [asigAbierto, setAsigAbierto] = useState(null);

  const [error, setError] = useState('');

  useEffect(() => { cargar(); }, []);

  async function cargar() {
    setCargando(true);
    try {
      const [p, o, e, l] = await Promise.all([
        axios.get('/api/objetivos/progreso').then(r => r.data).catch(() => []),
        axios.get('/api/objetivos').then(r => r.data).catch(() => []),
        axios.get('/api/empresas').then(r => r.data).catch(() => []),
        axios.get('/api/locales').then(r => r.data).catch(() => []),
      ]);
      setProgreso(Array.isArray(p) ? p : []);
      setObjetivos(Array.isArray(o) ? o : []);
      setEmpresasDB(Array.isArray(e) ? e : []);
      setLocalesDB(Array.isArray(l) ? l : []);
    } catch { setError('Error al cargar datos'); }
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
      toast('Objetivo creado', 'success');
      cargar();
    } catch (err) { setError(err.response?.data?.error || 'Error al crear'); }
    finally { setGuardando(false); }
  }

  async function guardarEdicion(id) {
    setGuardando(true);
    try {
      await axios.put(`/api/objetivos/${id}`, {
        descripcion: editForm.descripcion,
        volumen_objetivo: parseFloat(editForm.volumen_objetivo),
        unit_general: parseFloat(editForm.unit_general),
        volumen_real: editForm.volumen_real === '' ? null : parseFloat(editForm.volumen_real),
      });
      setEditandoId(null);
      toast('Objetivo actualizado', 'success');
      cargar();
    } catch (err) { setError(err.response?.data?.error || 'Error al guardar'); }
    finally { setGuardando(false); }
  }

  async function toggleVisibilidad(obj, campo) {
    try {
      await axios.put(`/api/objetivos/${obj.id}`, { [campo]: !obj[campo] });
      cargar();
    } catch { toast('Error al actualizar visibilidad', 'error'); }
  }

  async function desactivar(id) {
    if (!await confirmar('¿Desactivar este objetivo?', 'danger')) return;
    try {
      await axios.delete(`/api/objetivos/${id}`);
      toast('Objetivo desactivado', 'info');
      cargar();
    } catch { toast('Error al desactivar', 'error'); }
  }

  // Progreso vigente por período (más reciente de cada tipo)
  const progresoVigente = PERIODOS.reduce((acc, p) => {
    acc[p] = progreso.filter(o => o.periodo === p)[0] || null;
    return acc;
  }, {});

  const tabs = [
    { key: 'progreso', label: 'Progreso' },
    { key: 'gestion',  label: 'Gestión' },
  ];

  return (
    <div className="gestion-container">
      <div className="gestion-header">
        <div>
          <h2 className="gestion-titulo">Objetivos</h2>
          <p style={{ color: '#9090a0', fontSize: '0.88rem', marginTop: 2 }}>
            Seguimiento de volumen — anual, mensual y semanal
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={cargar}
            style={{ padding: '0.4rem 0.9rem', background: 'transparent', border: '1px solid #2d2d3d', borderRadius: 6, color: '#606070', cursor: 'pointer', fontSize: '0.82rem' }}
            title="Recargar datos"
          >
            ↻ Recargar
          </button>
          {tab === 'gestion' && (
            <button className="btn-nuevo" onClick={() => { setMostrarForm(v => !v); setError(''); }}>
              {mostrarForm ? 'Cancelar' : '+ Nuevo objetivo'}
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid #2d2d3d', marginBottom: '1.5rem' }}>
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

      {error && <div className="msg-error" style={{ marginBottom: '1rem' }}>{error}</div>}
      {cargando && <p style={{ color: '#606070' }}>Cargando...</p>}

      {/* ── Tab: PROGRESO ───────────────────────────────────────────────── */}
      {!cargando && tab === 'progreso' && (
        <div>
          {/* Cards de período vigente */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
            {PERIODOS.map(p => {
              const obj = progresoVigente[p];
              if (!obj) return (
                <div key={p} style={{
                  background: '#1a1a24', border: '1px solid #2d2d3d',
                  borderRadius: 10, padding: '1.1rem',
                }}>
                  <span style={{ ...CP[p], padding: '2px 10px', borderRadius: 8, fontSize: '0.7rem', fontWeight: 700 }}>
                    {p.toUpperCase()}
                  </span>
                  <p style={{ color: '#606070', fontSize: '0.82rem', margin: '10px 0 0' }}>
                    Sin objetivo declarado
                  </p>
                </div>
              );
              return <CardProgreso key={p} obj={obj} />;
            })}
          </div>

          {/* Gráfico del objetivo anual vigente */}
          {progresoVigente.anual?.meses_detalle?.length > 0 && (
            <div style={{ background: '#1a1a24', border: '1px solid #2d2d3d', borderRadius: 10, padding: '1.2rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, flexWrap: 'wrap', gap: 8 }}>
                <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.92rem' }}>
                  Evolución mensual — {progresoVigente.anual.descripcion || `Anual ${progresoVigente.anual.fecha_inicio?.slice(0,4)}`}
                </span>
                {progresoVigente.anual.volumen_no_obtenido > 0 && (
                  <span style={{ fontSize: '0.75rem', color: '#fc8181', background: '#dc262615', border: '1px solid #dc262640', borderRadius: 6, padding: '2px 10px' }}>
                    Vol. no obtenido acumulado: {fmt(progresoVigente.anual.volumen_no_obtenido)}
                  </span>
                )}
              </div>
              <GraficoMensual meses={progresoVigente.anual.meses_detalle} />
            </div>
          )}

          {/* Todos los objetivos con progreso */}
          {progreso.length > 0 && (
            <>
              <h4 style={{ color: '#9090a0', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.8rem', letterSpacing: '0.05em' }}>
                Todos los objetivos activos
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {progreso.map(obj => (
                  <div key={obj.id} style={{
                    background: '#1a1a24', border: '1px solid #2d2d3d',
                    borderRadius: 8, padding: '0.8rem 1rem',
                    display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
                  }}>
                    <span style={{ ...CP[obj.periodo], padding: '2px 8px', borderRadius: 6, fontSize: '0.68rem', fontWeight: 700, flexShrink: 0 }}>
                      {obj.periodo}
                    </span>
                    <div style={{ flex: 1, minWidth: 120 }}>
                      <div style={{ color: '#fff', fontWeight: 600, fontSize: '0.88rem' }}>
                        {obj.descripcion || `Objetivo #${obj.id}`}
                      </div>
                      <div style={{ color: '#606070', fontSize: '0.72rem' }}>
                        {obj.fecha_inicio} → {obj.fecha_fin}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', minWidth: 120 }}>
                      <div style={{ color: pctColor(obj.porcentaje), fontWeight: 700, fontSize: '1.05rem' }}>
                        {fmt(obj.volumen_actual)}
                        <span style={{ color: '#606070', fontWeight: 400, fontSize: '0.72rem' }}> / {fmt(obj.volumen_objetivo)}</span>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: pctColor(obj.porcentaje), fontWeight: 600 }}>
                        {obj.porcentaje?.toFixed(1)}%
                      </div>
                    </div>
                    {obj.periodo === 'anual' && obj.volumen_no_obtenido > 0 && (
                      <div style={{ fontSize: '0.72rem', color: '#fc8181', background: '#dc262615', padding: '2px 8px', borderRadius: 4 }}>
                        No obtenido: {fmt(obj.volumen_no_obtenido)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
          {progreso.length === 0 && (
            <p className="msg-vacio">No hay objetivos con progreso disponible.</p>
          )}
        </div>
      )}

      {/* ── Tab: GESTIÓN ────────────────────────────────────────────────── */}
      {!cargando && tab === 'gestion' && (
        <div>
          {/* Formulario nuevo objetivo */}
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
                <input className="form-control" value={form.descripcion}
                  placeholder="ej: Objetivo Junio 2026"
                  onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} />
              </div>

              <div>
                <label className="form-label">Período</label>
                <select className="form-control" value={form.periodo}
                  onChange={e => setForm(f => ({ ...f, periodo: e.target.value }))}>
                  {PERIODOS.map(p => (
                    <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                  ))}
                </select>
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
                <input className="form-control" type="number" step="0.01" min="0"
                  value={form.volumen_objetivo} placeholder="ej: 50000" required
                  onChange={e => setForm(f => ({ ...f, volumen_objetivo: e.target.value }))} />
              </div>

              {/* Volumen real (carga manual para meses históricos) */}
              <div style={{ gridColumn: '1/-1', background: '#0f0f18', border: '1px solid #d9770630', borderRadius: 8, padding: '0.9rem 1rem' }}>
                <label className="form-label" style={{ color: '#f6ad55', marginBottom: 4 }}>
                  Volumen real alcanzado
                  <span style={{ marginLeft: 6, fontSize: '0.65rem', fontWeight: 400, color: '#606070', textTransform: 'none', letterSpacing: 0 }}>
                    (opcional — para cargar datos históricos de meses pasados)
                  </span>
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <input
                    className="form-control" type="number" step="0.01" min="0"
                    value={form.volumen_real}
                    placeholder="Dejar vacío para calcular automáticamente desde pedidos"
                    onChange={e => setForm(f => ({ ...f, volumen_real: e.target.value }))}
                    style={{ flex: 1, minWidth: 200 }}
                  />
                  {form.volumen_real && form.volumen_objetivo && parseFloat(form.volumen_objetivo) > 0 && (
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f6ad55', whiteSpace: 'nowrap' }}>
                      = {(parseFloat(form.volumen_real) / parseFloat(form.volumen_objetivo) * 100).toFixed(1)}%
                    </span>
                  )}
                </div>
                <p style={{ margin: '6px 0 0', fontSize: '0.72rem', color: '#505060', lineHeight: 1.5 }}>
                  Si cargás este valor, tiene prioridad sobre los pedidos del sistema. Usalo para meses ya cerrados donde conocés el resultado real.
                </p>
              </div>

              {/* Unit General — solo para cálculo aproximado de bultos */}
              <div style={{ gridColumn: '1/-1', background: '#12121c', border: '1px solid #2d2d3d', borderRadius: 8, padding: '0.9rem 1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <label className="form-label" style={{ marginBottom: 4 }}>
                      Unit General
                      <span style={{ marginLeft: 6, fontSize: '0.65rem', fontWeight: 400, color: '#606070', textTransform: 'none', letterSpacing: 0 }}>
                        (factor de referencia del mercado)
                      </span>
                    </label>
                    <input className="form-control" type="number" step="0.01" min="0.1"
                      value={form.unit_general}
                      onChange={e => setForm(f => ({ ...f, unit_general: e.target.value }))}
                      style={{ width: 120 }}
                    />
                  </div>

                  {/* Cálculo en tiempo real */}
                  {form.volumen_objetivo && form.unit_general && parseFloat(form.unit_general) > 0 && (
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.7rem', color: '#606070', marginBottom: 2 }}>Bultos / packs aprox.</div>
                      <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#f6ad55' }}>
                        {Math.round(parseFloat(form.volumen_objetivo) / parseFloat(form.unit_general)).toLocaleString('es-AR')}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: '#505060' }}>
                        {form.volumen_objetivo} ÷ {form.unit_general}
                      </div>
                    </div>
                  )}
                </div>

                <p style={{ margin: '8px 0 0', fontSize: '0.72rem', color: '#505060', lineHeight: 1.5 }}>
                  Este dato se usa <strong style={{ color: '#9090a0' }}>solo para estimar</strong> la cantidad de bultos/cajas físicas que implica el objetivo.
                  El volumen real que se acumula contra el objetivo se calcula a partir del <strong style={{ color: '#9090a0' }}>unit value de cada producto</strong> en los pedidos.
                </p>
              </div>

              {/* Visibilidad */}
              <div style={{ gridColumn: '1/-1' }}>
                <label className="form-label" style={{ marginBottom: 8 }}>Visibilidad para repositores / locales</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <Toggle
                    value={form.visible_repositores}
                    onChange={v => setForm(f => ({ ...f, visible_repositores: v }))}
                    label="Publicar a repositores y locales"
                  />
                  <Toggle
                    value={form.visible_volumen}
                    onChange={v => setForm(f => ({ ...f, visible_volumen: v }))}
                    label="Mostrar número"
                  />
                  <Toggle
                    value={form.visible_porcentaje}
                    onChange={v => setForm(f => ({ ...f, visible_porcentaje: v }))}
                    label="Mostrar %"
                  />
                </div>
              </div>

              <div style={{ gridColumn: '1/-1' }}>
                <button type="submit" className="btn-guardar" disabled={guardando}>
                  {guardando ? 'Guardando...' : 'Crear objetivo'}
                </button>
              </div>
            </form>
          )}

          {/* Lista de objetivos */}
          {objetivos.length === 0 ? (
            <p className="msg-vacio">No hay objetivos registrados.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {objetivos.map(o => {
                const progresoObj = progreso.find(p => p.id === o.id);
                const cp = CP[o.periodo] || CP.mensual;
                const isAsigAbierto = asigAbierto === o.id;

                return (
                  <div key={o.id} style={{
                    background: '#1a1a24', border: '1px solid #2d2d3d', borderRadius: 10,
                  }}>
                    {editandoId === o.id ? (
                      /* Modo edición */
                      <div style={{ padding: '1rem 1.2rem', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: 10, alignItems: 'end' }}>
                        <div>
                          <label className="form-label">Descripción</label>
                          <input className="form-control" value={editForm.descripcion}
                            onChange={e => setEditForm(f => ({ ...f, descripcion: e.target.value }))} />
                        </div>
                        <div>
                          <label className="form-label">Volumen objetivo</label>
                          <input className="form-control" type="number" step="0.01"
                            value={editForm.volumen_objetivo}
                            onChange={e => setEditForm(f => ({ ...f, volumen_objetivo: e.target.value }))} />
                        </div>
                        <div>
                          <label className="form-label">Unit General</label>
                          <input className="form-control" type="number" step="0.01"
                            value={editForm.unit_general}
                            onChange={e => setEditForm(f => ({ ...f, unit_general: e.target.value }))} />
                        </div>
                        <div>
                          <label className="form-label" style={{ color: '#f6ad55' }}>Vol. real <span style={{ color: '#606070', fontWeight: 400 }}>(vacío = auto)</span></label>
                          <input className="form-control" type="number" step="0.01" min="0"
                            value={editForm.volumen_real ?? ''}
                            placeholder="automático"
                            onChange={e => setEditForm(f => ({ ...f, volumen_real: e.target.value }))} />
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
                      <div style={{ padding: '0.9rem 1.1rem' }}>
                        {/* Fila principal */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                          <span style={{ ...cp, padding: '2px 10px', borderRadius: 8, fontSize: '0.7rem', fontWeight: 700, flexShrink: 0 }}>
                            {o.periodo}
                          </span>
                          <div style={{ flex: 1, minWidth: 120 }}>
                            <div style={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem' }}>
                              {o.descripcion || `Objetivo #${o.id}`}
                            </div>
                            <div style={{ color: '#606070', fontSize: '0.72rem' }}>
                              {String(o.fecha_inicio).slice(0, 10)} → {String(o.fecha_fin).slice(0, 10)}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right', minWidth: 90 }}>
                            <div style={{ color: '#6c63ff', fontWeight: 700, fontSize: '1.05rem' }}>
                              {fmt(o.volumen_objetivo)}
                            </div>
                            <div style={{ color: '#606070', fontSize: '0.7rem' }}>
                              unit {o.unit_general}
                            </div>
                          </div>
                          {/* Progreso resumido */}
                          {progresoObj && (
                            <div style={{ textAlign: 'right', minWidth: 70 }}>
                              <span style={{ color: pctColor(progresoObj.porcentaje), fontWeight: 700, fontSize: '0.95rem' }}>
                                {progresoObj.porcentaje?.toFixed(1)}%
                              </span>
                            </div>
                          )}
                          <div style={{ display: 'flex', gap: 6, flexShrink: 0, flexWrap: 'wrap' }}>
                            <button className="btn-editar" style={{ padding: '0.25rem 0.7rem', fontSize: '0.78rem' }}
                              onClick={() => {
                                setEditandoId(o.id);
                                setEditForm({ descripcion: o.descripcion || '', volumen_objetivo: o.volumen_objetivo, unit_general: o.unit_general, volumen_real: o.volumen_real ?? '' });
                              }}>
                              Editar
                            </button>
                            <button className="btn-eliminar" style={{ padding: '0.25rem 0.7rem', fontSize: '0.78rem' }}
                              onClick={() => desactivar(o.id)}>
                              Desactivar
                            </button>
                          </div>
                        </div>

                        {/* Toggles de visibilidad */}
                        <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.72rem', color: '#505060', flexShrink: 0 }}>Visibilidad:</span>
                          <Toggle
                            value={!!o.visible_repositores}
                            onChange={() => toggleVisibilidad(o, 'visible_repositores')}
                            label="Publicar"
                          />
                          <Toggle
                            value={!!o.visible_volumen}
                            onChange={() => toggleVisibilidad(o, 'visible_volumen')}
                            label="Mostrar número"
                          />
                          <Toggle
                            value={!!o.visible_porcentaje}
                            onChange={() => toggleVisibilidad(o, 'visible_porcentaje')}
                            label="Mostrar %"
                          />

                          {/* Botón asignaciones */}
                          <button
                            onClick={() => setAsigAbierto(isAsigAbierto ? null : o.id)}
                            style={{
                              marginLeft: 'auto', padding: '0.3rem 0.9rem',
                              background: isAsigAbierto ? '#6c63ff33' : 'transparent',
                              border: `1px solid ${isAsigAbierto ? '#6c63ff80' : '#3d3d4d'}`,
                              borderRadius: 6, color: isAsigAbierto ? '#a78bfa' : '#606070',
                              cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600,
                            }}
                          >
                            {isAsigAbierto ? '▲ Asignaciones' : '▼ Asignaciones'}
                          </button>
                        </div>

                        {/* Panel de asignaciones */}
                        {isAsigAbierto && (
                          <SeccionAsignaciones
                            objetivoId={o.id}
                            volumenObjetivo={parseFloat(o.volumen_objetivo)}
                            empresasDB={empresasDB}
                            localesDB={localesDB}
                          />
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

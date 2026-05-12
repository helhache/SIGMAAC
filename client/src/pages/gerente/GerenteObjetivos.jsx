import { useEffect, useState } from 'react';
import API_URL from '../../config';

const colorPeriodo = {
  semanal: '#2563eb',
  mensual: '#7c3aed',
  anual: '#d97706',
};

export default function GerenteObjetivos() {
  const [objetivos, setObjetivos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm] = useState({
    periodo: 'mensual',
    fecha_inicio: '',
    fecha_fin: '',
    volumen_objetivo: '',
    unit_general: '1.7',
    descripcion: '',
  });
  const [guardando, setGuardando] = useState(false);

  useEffect(() => { cargarObjetivos(); }, []);

  async function cargarObjetivos() {
    setCargando(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/objetivos`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setObjetivos(data);
    } catch {
      setError('No se pudieron cargar los objetivos');
    } finally {
      setCargando(false);
    }
  }

  async function crearObjetivo(e) {
    e.preventDefault();
    setGuardando(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/objetivos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...form,
          volumen_objetivo: parseFloat(form.volumen_objetivo),
          unit_general: parseFloat(form.unit_general),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Error al crear objetivo');
        return;
      }
      setMostrarForm(false);
      setForm({ periodo: 'mensual', fecha_inicio: '', fecha_fin: '', volumen_objetivo: '', unit_general: '1.7', descripcion: '' });
      cargarObjetivos();
    } catch {
      setError('Error al crear objetivo');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="gestion-container">
      <div className="gestion-header">
        <div>
          <h2 className="gestion-titulo">Objetivos</h2>
          <p style={{ color: '#9090a0', fontSize: '0.88rem', marginTop: 2 }}>Metas de volumen del equipo</p>
        </div>
        <button className="btn-nuevo" onClick={() => setMostrarForm(v => !v)}>
          {mostrarForm ? 'Cancelar' : '+ Nuevo objetivo'}
        </button>
      </div>

      {error && <div className="msg-error">{error}</div>}

      {mostrarForm && (
        <form onSubmit={crearObjetivo} style={{
          background: '#1a1a24', border: '1px solid #2d2d3d', borderRadius: 10,
          padding: 24, marginBottom: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14,
        }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Descripción</label>
            <input
              className="form-control"
              value={form.descripcion}
              onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
              placeholder="ej: Objetivo Mayo 2026"
            />
          </div>
          <div>
            <label className="form-label">Período</label>
            <select className="form-control" value={form.periodo} onChange={e => setForm(f => ({ ...f, periodo: e.target.value }))}>
              <option value="semanal">Semanal</option>
              <option value="mensual">Mensual</option>
              <option value="anual">Anual</option>
            </select>
          </div>
          <div>
            <label className="form-label">Unit General</label>
            <input
              className="form-control"
              type="number" step="0.01" value={form.unit_general}
              onChange={e => setForm(f => ({ ...f, unit_general: e.target.value }))}
            />
          </div>
          <div>
            <label className="form-label">Fecha inicio</label>
            <input className="form-control" type="date" value={form.fecha_inicio} onChange={e => setForm(f => ({ ...f, fecha_inicio: e.target.value }))} required />
          </div>
          <div>
            <label className="form-label">Fecha fin</label>
            <input className="form-control" type="date" value={form.fecha_fin} onChange={e => setForm(f => ({ ...f, fecha_fin: e.target.value }))} required />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Volumen objetivo</label>
            <input
              className="form-control"
              type="number" step="0.01" value={form.volumen_objetivo}
              onChange={e => setForm(f => ({ ...f, volumen_objetivo: e.target.value }))}
              placeholder="ej: 5000" required
            />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <button type="submit" disabled={guardando} className="btn-guardar">
              {guardando ? 'Guardando...' : 'Crear objetivo'}
            </button>
          </div>
        </form>
      )}

      {cargando ? (
        <p style={{ color: '#606070' }}>Cargando...</p>
      ) : objetivos.length === 0 ? (
        <p className="msg-vacio">No hay objetivos registrados.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {objetivos.map(o => (
            <div key={o.id} style={{ background: '#1a1a24', border: '1px solid #2d2d3d', borderRadius: 10, padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div style={{ fontWeight: 600, fontSize: 15, color: '#fff' }}>{o.descripcion || `Objetivo #${o.id}`}</div>
                <span style={{
                  fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 10,
                  background: (colorPeriodo[o.periodo] || '#888') + '22', color: colorPeriodo[o.periodo] || '#888',
                }}>
                  {o.periodo}
                </span>
              </div>
              <div style={{ fontSize: 13, color: '#9090a0', marginBottom: 6 }}>
                {o.fecha_inicio?.slice(0, 10)} → {o.fecha_fin?.slice(0, 10)}
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#6c63ff' }}>
                {Number(o.volumen_objetivo).toLocaleString()}
                <span style={{ fontSize: 12, fontWeight: 400, color: '#606070', marginLeft: 4 }}>vol</span>
              </div>
              <div style={{ fontSize: 12, color: '#606070', marginTop: 4 }}>
                Unit general: {o.unit_general} — Bultos: {Math.round(o.volumen_objetivo / o.unit_general).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

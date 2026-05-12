import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import API_URL from '../../config';

const colorEstado = {
  abierto: '#dc2626', en_revision: '#d97706', resuelto: '#16a34a', cerrado: '#888',
};

export default function RepositorReclamos() {
  const { usuario } = useAuth();
  const locales = usuario?.locales || [];

  const [reclamos, setReclamos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [seleccionado, setSeleccionado] = useState(null);

  const [form, setForm] = useState({
    local_id: locales[0]?.id || '',
    tipo: '',
    descripcion: '',
    fecha: new Date().toISOString().slice(0, 10),
  });

  useEffect(() => { cargar(); }, []);

  async function cargar() {
    setCargando(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/reclamos`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReclamos(await res.json());
    } catch {
      setError('No se pudieron cargar los reclamos');
    } finally {
      setCargando(false);
    }
  }

  async function enviar(e) {
    e.preventDefault();
    setEnviando(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/reclamos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...form, local_id: parseInt(form.local_id) }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Error al enviar');
        return;
      }
      setMostrarForm(false);
      setForm({ local_id: locales[0]?.id || '', tipo: '', descripcion: '', fecha: new Date().toISOString().slice(0, 10) });
      cargar();
    } catch {
      setError('Error al enviar el reclamo');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: '0 0 4px', color: '#fff' }}>Reclamos</h2>
          <p style={{ color: '#9090a0', margin: 0, fontSize: 13 }}>Enviá un reclamo o consulta al gerente</p>
        </div>
        <button
          onClick={() => setMostrarForm(v => !v)}
          style={{ padding: '8px 18px', background: '#e94560', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}
        >
          {mostrarForm ? 'Cancelar' : '+ Nuevo reclamo'}
        </button>
      </div>

      {error && <p style={{ color: '#dc2626', marginBottom: 16 }}>{error}</p>}

      {mostrarForm && (
        <form onSubmit={enviar} style={{
          background: '#1a1a24', border: '1px solid #2d2d3d', borderRadius: 10, padding: 24, marginBottom: 24,
        }}>
          <h3 style={{ color: '#fff', margin: '0 0 16px' }}>Nuevo reclamo</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div>
              <label style={labelStyle}>Local *</label>
              <select
                value={form.local_id}
                onChange={e => setForm(f => ({ ...f, local_id: e.target.value }))}
                style={inputStyle} required
              >
                <option value="">— Elegir local —</option>
                {locales.map(l => <option key={l.id} value={l.id}>{l.nombre}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Tipo (opcional)</label>
              <input
                value={form.tipo}
                onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}
                style={inputStyle} placeholder="Ej: Faltante, Entrega, Precio..."
              />
            </div>
            <div>
              <label style={labelStyle}>Fecha</label>
              <input type="date" value={form.fecha} onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))} style={inputStyle} required />
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Descripción *</label>
            <textarea
              value={form.descripcion}
              onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
              rows={3} required
              style={{ ...inputStyle, resize: 'vertical' }}
              placeholder="Describí el problema..."
            />
          </div>
          <button type="submit" disabled={enviando} style={{
            padding: '9px 24px', background: '#e94560', color: '#fff',
            border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600,
          }}>
            {enviando ? 'Enviando...' : 'Enviar reclamo'}
          </button>
        </form>
      )}

      {cargando ? (
        <p style={{ color: '#9090a0' }}>Cargando...</p>
      ) : reclamos.length === 0 ? (
        <p style={{ color: '#9090a0' }}>No enviaste reclamos todavía.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {reclamos.map(r => (
            <div key={r.id} style={{ background: '#1a1a24', border: '1px solid #2d2d3d', borderRadius: 8 }}>
              <div
                onClick={() => setSeleccionado(seleccionado === r.id ? null : r.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', cursor: 'pointer' }}
              >
                <div style={{ flex: 1 }}>
                  <span style={{ fontWeight: 600, color: '#fff' }}>{r.local_nombre}</span>
                  {r.tipo && <span style={{ color: '#9090a0', fontSize: 13, marginLeft: 10 }}>{r.tipo}</span>}
                </div>
                <div style={{ fontSize: 13, color: '#9090a0' }}>{r.fecha?.slice(0, 10)}</div>
                <span style={{
                  fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 12,
                  background: (colorEstado[r.estado] || '#888') + '22',
                  color: colorEstado[r.estado] || '#888',
                }}>
                  {r.estado}
                </span>
              </div>
              {seleccionado === r.id && (
                <div style={{ borderTop: '1px solid #2d2d3d', padding: '12px 16px' }}>
                  <p style={{ color: '#ccc', fontSize: 14, margin: '0 0 10px' }}>{r.descripcion}</p>
                  {r.resolucion && (
                    <div style={{ background: '#0f0f13', borderRadius: 6, padding: '10px 12px' }}>
                      <p style={{ color: '#888', fontSize: 12, margin: '0 0 4px' }}>Respuesta del gerente:</p>
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
  );
}

const labelStyle = { display: 'block', fontSize: 12, fontWeight: 600, color: '#9090a0', marginBottom: 4 };
const inputStyle = {
  width: '100%', padding: '8px 10px', border: '1px solid #2d2d3d',
  borderRadius: 6, fontSize: 13, background: '#0f0f13', color: '#fff', boxSizing: 'border-box',
};

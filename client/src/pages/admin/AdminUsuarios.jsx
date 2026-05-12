import { useEffect, useState } from 'react';
import axios from 'axios';

const ROLES = [
  { value: 'ADMIN',     label: 'ADMIN — Control total' },
  { value: 'LOCAL',     label: 'LOCAL — Encargado de comercio' },
  { value: 'REPOSITOR', label: 'REPOSITOR — Repositor de campo' },
];

const colorRol = {
  ADMIN:     { bg: '#e53e3e20', color: '#fc8181' },
  LOCAL:     { bg: '#6c63ff20', color: '#a78bfa' },
  REPOSITOR: { bg: '#38a16920', color: '#68d391' },
};

export default function AdminUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [locales, setLocales] = useState([]);
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState({ username: '', password: '', rol: 'LOCAL', nombre_display: '', local_ids: [] });
  const [error, setError] = useState('');

  const cargar = async () => {
    const [u, l] = await Promise.all([axios.get('/api/usuarios'), axios.get('/api/locales')]);
    setUsuarios(u.data);
    setLocales(l.data);
  };

  useEffect(() => { cargar(); }, []);

  const abrirNuevo = () => {
    setEditando(null);
    setForm({ username: '', password: '', rol: 'LOCAL', nombre_display: '', local_ids: [] });
    setError('');
    setModal(true);
  };

  const abrirEditar = (u) => {
    setEditando(u);
    // Parsear locales_asignados en ids (solo disponible si rol LOCAL)
    setForm({
      username: u.username,
      password: '',
      rol: u.rol,
      nombre_display: u.nombre_display || '',
      local_ids: [],  // No podemos saber los ids desde el texto, se recargan vacíos al editar
    });
    setError('');
    setModal(true);
  };

  const toggleLocal = (id) => {
    setForm(f => ({
      ...f,
      local_ids: f.local_ids.includes(id)
        ? f.local_ids.filter(x => x !== id)
        : [...f.local_ids, id],
    }));
  };

  const guardar = async () => {
    setError('');
    if (!form.username.trim()) return setError('El usuario es requerido');
    if (!editando && !form.password) return setError('La contraseña es requerida para usuarios nuevos');

    const body = {
      username: form.username,
      rol: form.rol,
      nombre_display: form.nombre_display || undefined,
    };
    if (form.password) body.password = form.password;
    if (form.rol === 'LOCAL') body.local_ids = form.local_ids;

    try {
      if (editando) {
        await axios.put(`/api/usuarios/${editando.id}`, body);
      } else {
        await axios.post('/api/usuarios', body);
      }
      setModal(false);
      cargar();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar');
    }
  };

  const desactivar = async (id) => {
    if (!confirm('¿Desactivar este usuario?')) return;
    await axios.delete(`/api/usuarios/${id}`);
    cargar();
  };

  return (
    <div className="gestion-container">
      <div className="gestion-header">
        <h2 className="gestion-titulo">Usuarios</h2>
        <button className="btn-nuevo" onClick={abrirNuevo}>+ Nuevo usuario</button>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #2d2d3d' }}>
            {['Usuario', 'Nombre', 'Rol', 'Locales', 'Estado', 'Acciones'].map(h => (
              <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', color: '#9090a0', fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {usuarios.map(u => (
            <tr key={u.id} style={{ borderBottom: '1px solid #1a1a24' }}>
              <td style={{ padding: '0.75rem 1rem', color: '#fff', fontWeight: 600 }}>{u.username}</td>
              <td style={{ padding: '0.75rem 1rem', color: '#9090a0', fontSize: '0.88rem' }}>{u.nombre_display || '—'}</td>
              <td style={{ padding: '0.75rem 1rem' }}>
                <span style={{ ...colorRol[u.rol], padding: '2px 8px', borderRadius: 4, fontSize: '0.75rem', fontWeight: 700 }}>
                  {u.rol}
                </span>
              </td>
              <td style={{ padding: '0.75rem 1rem', color: '#9090a0', fontSize: '0.83rem', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {u.locales_asignados || '—'}
              </td>
              <td style={{ padding: '0.75rem 1rem' }}>
                <span style={{ color: u.activo ? '#38a169' : '#e53e3e', fontSize: '0.85rem' }}>
                  {u.activo ? 'Activo' : 'Inactivo'}
                </span>
              </td>
              <td style={{ padding: '0.75rem 1rem', display: 'flex', gap: '0.5rem' }}>
                <button className="btn-editar" style={{ padding: '0.3rem 0.8rem' }} onClick={() => abrirEditar(u)}>Editar</button>
                {u.activo ? (
                  <button className="btn-eliminar" style={{ padding: '0.3rem 0.8rem' }} onClick={() => desactivar(u.id)}>Desactivar</button>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 className="modal-titulo">{editando ? 'Editar usuario' : 'Nuevo usuario'}</h3>
            {error && <div className="msg-error">{error}</div>}

            <div className="form-group">
              <label className="form-label">Nombre de usuario *</label>
              <input className="form-control" value={form.username}
                onChange={e => setForm(p => ({ ...p, username: e.target.value }))} />
            </div>

            <div className="form-group">
              <label className="form-label">Nombre para mostrar</label>
              <input className="form-control" value={form.nombre_display}
                placeholder="Ej: Juan Pérez"
                onChange={e => setForm(p => ({ ...p, nombre_display: e.target.value }))} />
            </div>

            <div className="form-group">
              <label className="form-label">Contraseña {editando && '(dejar vacío para no cambiar)'}</label>
              <input className="form-control" type="password" value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
            </div>

            <div className="form-group">
              <label className="form-label">Rol</label>
              <select className="form-control" value={form.rol}
                onChange={e => setForm(p => ({ ...p, rol: e.target.value, local_ids: [] }))}>
                {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>

            {form.rol === 'LOCAL' && (
              <div className="form-group">
                <label className="form-label">Locales asignados ({form.local_ids.length} seleccionados)</label>
                <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid #2d2d3d', borderRadius: 6, padding: '0.4rem' }}>
                  {locales.map(l => {
                    const sel = form.local_ids.includes(l.id);
                    return (
                      <div key={l.id}
                        onClick={() => toggleLocal(l.id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 8,
                          padding: '6px 8px', cursor: 'pointer', borderRadius: 4,
                          background: sel ? '#6c63ff15' : 'transparent',
                          color: sel ? '#a78bfa' : '#9090a0', fontSize: '0.88rem',
                        }}>
                        <div style={{
                          width: 14, height: 14, border: `2px solid ${sel ? '#6c63ff' : '#4d4d5d'}`,
                          borderRadius: 3, background: sel ? '#6c63ff' : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>
                          {sel && <span style={{ color: '#fff', fontSize: '0.65rem', fontWeight: 900 }}>✓</span>}
                        </div>
                        {l.nombre}
                      </div>
                    );
                  })}
                  {locales.length === 0 && <p style={{ color: '#606070', fontSize: '0.82rem', margin: '0.5rem' }}>No hay locales cargados.</p>}
                </div>
                {editando && (
                  <p style={{ color: '#9090a0', fontSize: '0.75rem', marginTop: '0.3rem' }}>
                    Al guardar, los locales se reemplazarán por los seleccionados arriba.
                  </p>
                )}
              </div>
            )}

            <div className="modal-actions">
              <button className="btn-guardar" onClick={guardar}>Guardar</button>
              <button className="btn-cancelar" onClick={() => setModal(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

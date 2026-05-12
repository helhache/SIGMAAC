import { useEffect, useState } from 'react';
import axios from 'axios';
import { getImgUrl } from '../../config';

export default function AdminLocales() {
  const [locales, setLocales] = useState([]);
  const [modal, setModal] = useState(false);         // modal editar/crear local
  const [modalAcceso, setModalAcceso] = useState(false); // modal crear acceso
  const [editando, setEditando] = useState(null);
  const [localAcceso, setLocalAcceso] = useState(null);
  const [empresas, setEmpresas] = useState([]);
  const [form, setForm] = useState({ nombre: '', logo: null, empresa_id: '' });
  const [formAcceso, setFormAcceso] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [errorAcceso, setErrorAcceso] = useState('');
  const [msgAcceso, setMsgAcceso] = useState('');

  const cargar = async () => {
    const [loc, emp] = await Promise.all([axios.get('/api/locales'), axios.get('/api/empresas')]);
    setLocales(loc.data);
    setEmpresas(emp.data);
  };

  useEffect(() => { cargar(); }, []);

  const abrirNuevo = () => { setEditando(null); setForm({ nombre: '', logo: null, empresa_id: empresas[0]?.id || '' }); setError(''); setModal(true); };
  const abrirEditar = (l) => { setEditando(l); setForm({ nombre: l.nombre, logo: null, empresa_id: l.empresa_id || '' }); setError(''); setModal(true); };

  const abrirAcceso = (l) => {
    setLocalAcceso(l);
    // Sugerir username basado en nombre del local (sin espacios, minúsculas)
    const sugerido = l.nombre.toLowerCase().replace(/\s+/g, '.').replace(/[^a-z0-9.]/g, '');
    setFormAcceso({ username: sugerido, password: '' });
    setErrorAcceso('');
    setMsgAcceso('');
    setModalAcceso(true);
  };

  const guardar = async () => {
    setError('');
    if (!form.nombre.trim()) return setError('El nombre es requerido');
    const fd = new FormData();
    fd.append('nombre', form.nombre);
    if (form.empresa_id) fd.append('empresa_id', form.empresa_id);
    if (form.logo) fd.append('logo', form.logo);
    try {
      if (editando) {
        await axios.put(`/api/locales/${editando.id}`, fd);
      } else {
        await axios.post('/api/locales', fd);
      }
      setModal(false);
      cargar();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar');
    }
  };

  const guardarAcceso = async () => {
    setErrorAcceso('');
    if (!formAcceso.username.trim()) return setErrorAcceso('El usuario es requerido');
    if (!formAcceso.password) return setErrorAcceso('La contraseña es requerida');
    try {
      await axios.post('/api/usuarios', {
        username: formAcceso.username,
        password: formAcceso.password,
        rol: 'LOCAL',
        local_ids: [localAcceso.id],
      });
      setMsgAcceso(`Acceso creado: ${formAcceso.username}`);
      setFormAcceso({ username: '', password: '' });
    } catch (err) {
      setErrorAcceso(err.response?.data?.error || 'Error al crear acceso');
    }
  };

  const eliminar = async (id) => {
    if (!confirm('¿Desactivar este local?')) return;
    await axios.delete(`/api/locales/${id}`);
    cargar();
  };

  return (
    <div className="gestion-container">
      <div className="gestion-header">
        <h2 className="gestion-titulo">Locales</h2>
        <button className="btn-nuevo" onClick={abrirNuevo}>+ Nuevo local</button>
      </div>

      {locales.length === 0 ? (
        <p className="msg-vacio">No hay locales cargados.</p>
      ) : (
        <div className="items-grid">
          {locales.map(l => (
            <div key={l.id} className="item-card">
              {l.logo ? (
                <img src={getImgUrl(l.logo)} alt={l.nombre} className="item-card-img" />
              ) : (
                <div className="item-card-img-placeholder">🏪</div>
              )}
              <div className="item-card-body">
                <div className="item-card-nombre">{l.nombre}</div>
              </div>
              <div className="item-card-actions" style={{ flexWrap: 'wrap', gap: '0.4rem' }}>
                <button className="btn-editar" onClick={() => abrirEditar(l)}>Editar</button>
                <button
                  onClick={() => abrirAcceso(l)}
                  style={{ flex: 1, padding: '0.4rem', border: 'none', borderRadius: 6, background: '#38a16920', color: '#68d391', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  + Acceso
                </button>
                <button className="btn-eliminar" onClick={() => eliminar(l.id)}>Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal editar/crear local */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 className="modal-titulo">{editando ? 'Editar local' : 'Nuevo local'}</h3>
            {error && <div className="msg-error">{error}</div>}
            <div className="form-group">
              <label className="form-label">Empresa</label>
              <select className="form-control" value={form.empresa_id} onChange={e => setForm(p => ({ ...p, empresa_id: e.target.value }))}>
                <option value="">— Sin empresa (se asigna automáticamente) —</option>
                {empresas.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Nombre del local</label>
              <input className="form-control" value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Logo</label>
              <label className="upload-area" style={{ cursor: 'pointer', display: 'block' }}>
                {form.logo ? (
                  <span style={{ color: '#6c63ff', fontSize: '0.9rem' }}>{form.logo.name}</span>
                ) : (
                  <span style={{ color: '#606070', fontSize: '0.88rem' }}>Clic para subir logo (PNG/JPG)</span>
                )}
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => setForm(p => ({ ...p, logo: e.target.files[0] }))} />
              </label>
            </div>
            <div className="modal-actions">
              <button className="btn-guardar" onClick={guardar}>Guardar</button>
              <button className="btn-cancelar" onClick={() => setModal(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal crear acceso para local */}
      {modalAcceso && (
        <div className="modal-overlay" onClick={() => setModalAcceso(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 className="modal-titulo">Crear acceso — {localAcceso?.nombre}</h3>
            <p style={{ color: '#9090a0', fontSize: '0.85rem', marginBottom: '1rem' }}>
              Estos datos le das al local para que inicie sesión.
            </p>
            {errorAcceso && <div className="msg-error">{errorAcceso}</div>}
            {msgAcceso && (
              <div style={{ background: '#38a16920', border: '1px solid #38a16940', color: '#68d391', padding: '0.75rem 1rem', borderRadius: 8, marginBottom: '1rem', fontSize: '0.9rem' }}>
                {msgAcceso}
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Nombre de usuario</label>
              <input className="form-control" value={formAcceso.username} onChange={e => setFormAcceso(p => ({ ...p, username: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Contraseña</label>
              <input className="form-control" type="password" value={formAcceso.password} onChange={e => setFormAcceso(p => ({ ...p, password: e.target.value }))} />
            </div>
            <div className="modal-actions">
              <button className="btn-guardar" onClick={guardarAcceso}>Crear acceso</button>
              <button className="btn-cancelar" onClick={() => setModalAcceso(false)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import CartelHorizontal from '../../components/CartelHorizontal.jsx';
import CartelVertical from '../../components/CartelVertical.jsx';
import { getImgUrl } from '../../config';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';

// ── Pestaña Descargas ─────────────────────────────────────────────────────────
function TabDescargas() {
  const [log, setLog] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    axios.get('/api/asignaciones/log')
      .then(r => setLog(r.data))
      .catch(() => {})
      .finally(() => setCargando(false));
  }, []);

  const formatFecha = (f) => new Date(f).toLocaleString('es-AR');

  return (
    <div>
      <div style={{ marginBottom: '1rem', color: '#9090a0', fontSize: '0.88rem' }}>
        {log.length} descarga{log.length !== 1 ? 's' : ''} registrada{log.length !== 1 ? 's' : ''}
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #2d2d3d' }}>
              {['Fecha', 'Local', 'Activación', 'Tipo', 'Formato'].map(h => (
                <th key={h} style={{ padding: '0.6rem 0.8rem', textAlign: 'left', color: '#9090a0', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr><td colSpan={5} style={{ padding: '1.5rem', color: '#606070', textAlign: 'center' }}>Cargando...</td></tr>
            ) : log.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: '1.5rem', color: '#606070', textAlign: 'center' }}>No hay descargas registradas aún.</td></tr>
            ) : log.map(r => (
              <tr key={r.id} style={{ borderBottom: '1px solid #1a1a24' }}>
                <td style={{ padding: '0.6rem 0.8rem', color: '#9090a0', whiteSpace: 'nowrap' }}>{formatFecha(r.descargado_at)}</td>
                <td style={{ padding: '0.6rem 0.8rem', color: '#6c63ff', fontWeight: 700 }}>{r.local_nombre || '—'}</td>
                <td style={{ padding: '0.6rem 0.8rem', color: '#fff', maxWidth: 280, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.activacion || '—'}</td>
                <td style={{ padding: '0.6rem 0.8rem' }}>
                  <span style={{ background: r.tipo_cartel ? '#6c63ff20' : '#2d2d3d', color: r.tipo_cartel ? '#a78bfa' : '#606070', padding: '2px 8px', borderRadius: 4, fontWeight: 700, fontSize: '0.75rem' }}>
                    {r.tipo_cartel || '—'}
                  </span>
                </td>
                <td style={{ padding: '0.6rem 0.8rem', color: '#9090a0' }}>{r.formato || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function AdminEditor() {
  const { usuario } = useAuth();
  const [tab, setTab] = useState('editor');

  const [locales, setLocales] = useState([]);
  const [activaciones, setActivaciones] = useState([]);
  const [localSel, setLocalSel] = useState(null);
  const [actSel, setActSel] = useState(null);
  const [orientacion, setOrientacion] = useState('horizontal');
  const [esColor, setEsColor] = useState(true);
  const [precio, setPrecio] = useState('');
  const [imagenCustom, setImagenCustom] = useState('');
  const [busAct, setBusAct] = useState('');
  const [exportando, setExportando] = useState(false);

  useEffect(() => {
    Promise.all([axios.get('/api/locales'), axios.get('/api/activaciones')])
      .then(([l, a]) => { setLocales(l.data); setActivaciones(a.data); })
      .catch(() => {});
  }, []);

  const selActivacion = (act) => {
    setActSel(act);
    setPrecio(act.precio_oferta || '');
    setImagenCustom('');
  };

  const handleImagen = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = (ev) => setImagenCustom(ev.target.result);
    reader.readAsDataURL(f);
  };

  const datosCartel = actSel ? {
    descripcion: actSel.descripcion,
    dinamica: actSel.dinamica,
    precio,
    imagen: imagenCustom || getImgUrl(actSel.imagen),
    logoLocal: localSel ? getImgUrl(localSel.logo) : '',
    nombreLocal: localSel?.nombre || '',
    esColor,
  } : null;

  const capturar = async () => {
    const nodo = document.getElementById('preview-cartel');
    if (!nodo) throw new Error('No se encontró el cartel');
    return { dataUrl: await toPng(nodo, { quality: 1, pixelRatio: 2 }), nodo };
  };

  const exportarPDF = async () => {
    if (!actSel) return alert('Seleccioná una activación primero');
    setExportando(true);
    try {
      const { dataUrl, nodo } = await capturar();
      const esH = orientacion === 'horizontal';
      const pdf = new jsPDF({ orientation: esH ? 'landscape' : 'portrait', unit: 'mm', format: 'a4' });
      const pW = esH ? 297 : 210, pH = esH ? 210 : 297;
      const prop = Math.min(pW / nodo.offsetWidth, pH / nodo.offsetHeight);
      const iW = nodo.offsetWidth * prop, iH = nodo.offsetHeight * prop;
      pdf.addImage(dataUrl, 'PNG', (pW - iW) / 2, (pH - iH) / 2, iW, iH);
      pdf.save(`cartel_${actSel.descripcion || 'cartel'}_${Date.now()}.pdf`.replace(/\s+/g, '_').toLowerCase());
    } catch { alert('Error al generar PDF'); }
    finally { setExportando(false); }
  };

  const exportarPNG = async () => {
    if (!actSel) return alert('Seleccioná una activación primero');
    setExportando(true);
    try {
      const { dataUrl } = await capturar();
      const a = document.createElement('a');
      a.download = `cartel_${actSel.descripcion || 'cartel'}_${Date.now()}.png`.replace(/\s+/g, '_').toLowerCase();
      a.href = dataUrl; a.click();
    } catch { alert('Error al generar PNG'); }
    finally { setExportando(false); }
  };

  const actFiltradas = activaciones.filter(a =>
    a.descripcion.toLowerCase().includes(busAct.toLowerCase()) ||
    (a.dinamica || '').toLowerCase().includes(busAct.toLowerCase())
  );

  const formatPrecio = (p) => p != null ? `$${Number(p).toLocaleString('es-AR')}` : '—';

  // ── Tabs ──
  const tabs = [
    { key: 'editor', label: 'Editor de carteles' },
    { key: 'descargas', label: 'Historial de descargas' },
  ];

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: 4, marginBottom: '1.2rem', borderBottom: '1px solid #2d2d3d', paddingBottom: 0 }}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '0.6rem 1.2rem', border: 'none', background: 'transparent', cursor: 'pointer',
              color: tab === t.key ? '#6c63ff' : '#9090a0',
              fontWeight: tab === t.key ? 700 : 400, fontSize: '0.9rem',
              borderBottom: tab === t.key ? '2px solid #6c63ff' : '2px solid transparent',
              marginBottom: -1, transition: 'all 0.15s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'descargas' ? (
        <TabDescargas />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '1.5rem' }}>
          {/* Panel izquierdo */}
          <div style={{ background: '#1a1a24', border: '1px solid #2d2d3d', borderRadius: 12, padding: '1.2rem', maxHeight: 'calc(100vh - 140px)', overflowY: 'auto' }}>
            <h3 style={{ color: '#fff', fontWeight: 700, fontSize: '0.95rem', marginBottom: '1rem' }}>Configurar cartel</h3>

            <div className="form-group">
              <label className="form-label">Local</label>
              <select className="form-control" value={localSel?.id || ''} onChange={e => setLocalSel(locales.find(l => l.id === parseInt(e.target.value)) || null)}>
                <option value="">-- Sin local (solo Coca-Cola) --</option>
                {locales.map(l => <option key={l.id} value={l.id}>{l.nombre}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Orientación</label>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                {['horizontal', 'vertical'].map(o => (
                  <button key={o} onClick={() => setOrientacion(o)} style={{
                    flex: 1, padding: '0.4rem', border: `2px solid ${orientacion === o ? '#6c63ff' : '#2d2d3d'}`,
                    borderRadius: 6, background: orientacion === o ? '#6c63ff20' : '#0f0f13',
                    color: orientacion === o ? '#6c63ff' : '#9090a0', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer',
                  }}>
                    {o === 'horizontal' ? 'Horizontal' : 'Vertical'}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Impresión</label>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                {[true, false].map(c => (
                  <button key={String(c)} onClick={() => setEsColor(c)} style={{
                    flex: 1, padding: '0.4rem', border: `2px solid ${esColor === c ? '#6c63ff' : '#2d2d3d'}`,
                    borderRadius: 6, background: esColor === c ? '#6c63ff20' : '#0f0f13',
                    color: esColor === c ? '#6c63ff' : '#9090a0', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer',
                  }}>
                    {c ? 'Color' : 'B&N'}
                  </button>
                ))}
              </div>
            </div>

            {actSel && (
              <div className="form-group">
                <label className="form-label">Precio ($)</label>
                <input className="form-control" type="number" min="0" value={precio} onChange={e => setPrecio(e.target.value)} />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Foto del producto</label>
              <label style={{ cursor: 'pointer', background: '#0f0f13', border: '1px solid #2d2d3d', borderRadius: 6, padding: '0.4rem 0.8rem', color: '#9090a0', fontSize: '0.82rem', display: 'inline-block' }}>
                {imagenCustom ? 'Cambiar foto' : 'Subir foto'}
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImagen} />
              </label>
              {imagenCustom && (
                <button onClick={() => setImagenCustom('')} style={{ marginLeft: '0.5rem', background: 'none', border: 'none', color: '#fc8181', fontSize: '0.8rem', cursor: 'pointer' }}>
                  ✕ Quitar
                </button>
              )}
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #2d2d3d', margin: '0.8rem 0' }} />

            <div className="form-group">
              <label className="form-label">Activaciones ({actFiltradas.length})</label>
              <input className="form-control" placeholder="Buscar..." value={busAct} onChange={e => setBusAct(e.target.value)} style={{ marginBottom: '0.5rem' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {actFiltradas.map(a => (
                <div
                  key={a.id}
                  onClick={() => selActivacion(a)}
                  style={{
                    background: actSel?.id === a.id ? '#6c63ff15' : '#0f0f13',
                    border: `1px solid ${actSel?.id === a.id ? '#6c63ff' : '#2d2d3d'}`,
                    borderRadius: 8, padding: '0.6rem 0.8rem', cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6 }}>
                    <span style={{ color: '#fff', fontSize: '0.82rem', fontWeight: 600, lineHeight: 1.3 }}>{a.descripcion}</span>
                    <span style={{ background: '#6c63ff20', color: '#a78bfa', padding: '1px 5px', borderRadius: 3, fontWeight: 700, fontSize: '0.7rem', whiteSpace: 'nowrap', flexShrink: 0 }}>{a.dinamica}</span>
                  </div>
                  <div style={{ color: '#38a169', fontWeight: 700, fontSize: '0.85rem', marginTop: 2 }}>{formatPrecio(a.precio_oferta)}</div>
                </div>
              ))}
              {actFiltradas.length === 0 && <p style={{ color: '#606070', fontSize: '0.85rem' }}>No hay activaciones.</p>}
            </div>

            <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #2d2d3d' }}>
              <button className="btn-exportar btn-pdf" onClick={exportarPDF} disabled={exportando || !actSel} style={{ flex: 1 }}>
                {exportando ? 'Generando...' : 'PDF'}
              </button>
              <button className="btn-exportar btn-png" onClick={exportarPNG} disabled={exportando || !actSel} style={{ flex: 1 }}>
                {exportando ? 'Generando...' : 'PNG'}
              </button>
            </div>
          </div>

          {/* Panel derecho: preview */}
          <div style={{ background: '#1a1a24', border: '1px solid #2d2d3d', borderRadius: 12, padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '1rem' }}>
              <h3 style={{ color: '#fff', fontWeight: 700, fontSize: '0.95rem' }}>Vista previa</h3>
              <span style={{ fontSize: '0.8rem', color: '#606070' }}>{orientacion === 'horizontal' ? 'A4 Horizontal' : 'A4 Vertical'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, width: '100%', background: '#2a2a38', borderRadius: 10, padding: '1.5rem', minHeight: 500 }}>
              {!actSel ? (
                <p style={{ color: '#606070' }}>Seleccioná una activación para ver el cartel</p>
              ) : orientacion === 'horizontal' ? (
                <CartelHorizontal datos={datosCartel} />
              ) : (
                <CartelVertical datos={datosCartel} />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

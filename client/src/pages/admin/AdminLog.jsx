import { useEffect, useState } from 'react';
import axios from 'axios';

export default function AdminLog() {
  const [log, setLog] = useState([]);

  useEffect(() => {
    axios.get('/api/asignaciones/log').then(r => setLog(r.data)).catch(() => {});
  }, []);

  const formatFecha = (f) => new Date(f).toLocaleString('es-AR');

  return (
    <div className="gestion-container">
      <div className="gestion-header">
        <h2 className="gestion-titulo">Registro de Descargas ({log.length})</h2>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #2d2d3d' }}>
              {['Fecha', 'Local', 'Activación', 'Formato', 'Color'].map(h => (
                <th key={h} style={{ padding: '0.6rem 0.8rem', textAlign: 'left', color: '#9090a0', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {log.map(r => (
              <tr key={r.id} style={{ borderBottom: '1px solid #1a1a24' }}>
                <td style={{ padding: '0.6rem 0.8rem', color: '#9090a0', whiteSpace: 'nowrap' }}>{formatFecha(r.descargado_at)}</td>
                <td style={{ padding: '0.6rem 0.8rem', color: '#6c63ff', fontWeight: 700 }}>{r.local_nombre || '—'}</td>
                <td style={{ padding: '0.6rem 0.8rem', color: '#fff', maxWidth: 300, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.activacion || '—'}</td>
                <td style={{ padding: '0.6rem 0.8rem' }}>
                  <span style={{ background: r.tipo_cartel ? '#6c63ff20' : '#2d2d3d', color: r.tipo_cartel ? '#a78bfa' : '#606070', padding: '2px 8px', borderRadius: 4, fontWeight: 700, fontSize: '0.78rem' }}>
                    {r.tipo_cartel || '—'}
                  </span>
                </td>
                <td style={{ padding: '0.6rem 0.8rem', color: '#9090a0' }}>
                  {r.formato || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {log.length === 0 && <p className="msg-vacio">No hay descargas registradas aún.</p>}
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import API_URL from '../../config';

function fmt(n) {
  if (n == null) return '—';
  return Number(n).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function RepositorPrecios() {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`${API_URL}/api/productos`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setProductos(d); })
      .catch(() => {})
      .finally(() => setCargando(false));
  }, []);

  const filtrados = productos.filter(p =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    (p.codigo_venta || '').toLowerCase().includes(busqueda.toLowerCase()) ||
    (p.ean || '').toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ margin: '0 0 4px', color: '#fff' }}>Lista de precios</h2>
          <p style={{ color: '#9090a0', margin: 0, fontSize: 13 }}>Productos y precios de referencia</p>
        </div>
        <input
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre o código..."
          style={{
            padding: '8px 14px', background: '#1a1a24', border: '1px solid #2d2d3d',
            borderRadius: 8, color: '#fff', fontSize: 13, width: 240,
          }}
        />
      </div>

      <div style={{ background: '#1a1a24', border: '1px solid #2d2d3d', borderRadius: 10, overflow: 'hidden' }}>
        {cargando ? (
          <p style={{ color: '#9090a0', padding: '20px 24px', margin: 0 }}>Cargando...</p>
        ) : filtrados.length === 0 ? (
          <p style={{ color: '#9090a0', padding: '20px 24px', margin: 0 }}>Sin resultados.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #2d2d3d' }}>
                  {['Cód. Venta','EAN','Producto','Precio sugerido','Unit Value','Ud/Bulto','Packs/Corte'].map(h => (
                    <th key={h} style={{
                      padding: '10px 14px', textAlign: 'left', color: '#9090a0',
                      fontSize: 11, fontWeight: 600, textTransform: 'uppercase', whiteSpace: 'nowrap',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtrados.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid #1e1e28' }}>
                    <td style={{ padding: '10px 14px', color: '#a78bfa', fontWeight: 700, fontFamily: 'monospace' }}>
                      {p.codigo_venta || '—'}
                    </td>
                    <td style={{ padding: '10px 14px', color: '#9090a0', fontSize: 12, fontFamily: 'monospace' }}>
                      {p.ean || '—'}
                    </td>
                    <td style={{ padding: '10px 14px', color: '#fff', fontWeight: 600 }}>{p.nombre}</td>
                    <td style={{ padding: '10px 14px', color: '#4ade80', fontWeight: 700 }}>
                      {p.precio_sugerido != null ? `$${fmt(p.precio_sugerido)}` : '—'}
                    </td>
                    <td style={{ padding: '10px 14px', color: '#60a5fa', fontWeight: 600 }}>
                      {p.unit_value != null ? fmt(p.unit_value) : '—'}
                    </td>
                    <td style={{ padding: '10px 14px', color: '#9090a0' }}>{p.unidades_por_bulto ?? '—'}</td>
                    <td style={{ padding: '10px 14px', color: '#9090a0' }}>{p.packs_por_corte ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p style={{ color: '#505060', fontSize: 11, marginTop: 10 }}>
        * Los precios son de referencia. Para precios personalizados por local, ver Activaciones.
      </p>
    </div>
  );
}

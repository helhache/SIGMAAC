import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import API_URL from '../../config';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const colorEstado = {
  borrador: '#888',
  confirmado: '#2563eb',
  en_transito: '#d97706',
  entregado: '#16a34a',
  cancelado: '#dc2626',
};

export default function LocalInicio() {
  const { usuario } = useAuth();
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargar() {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/api/pedidos`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setPedidos(Array.isArray(data) ? data : []);
      } catch { /* silencioso */ }
      finally { setCargando(false); }
    }
    cargar();
  }, []);

  const hoy = new Date();
  const anioActual = hoy.getFullYear();
  const mesActual = hoy.getMonth(); // 0-indexed

  // Filtrar pedidos del mes actual
  const pedidosMes = pedidos.filter(p => {
    const f = new Date(p.fecha_pedido);
    return f.getFullYear() === anioActual && f.getMonth() === mesActual;
  });

  const cantidadPedidosMes = pedidosMes.length;
  const bultosMes = pedidosMes.reduce((acc, p) => acc + (p.total_bultos || 0), 0);

  // Volumen esperado: pedidos en estado confirmado o en_transito
  const volumenEsperado = pedidos
    .filter(p => p.estado === 'confirmado' || p.estado === 'en_transito')
    .reduce((acc, p) => acc + (p.total_bultos || 0), 0);

  // Datos para el gráfico anual (ene–dic)
  const datosMensuales = MESES.map((mes, idx) => {
    const total = pedidos
      .filter(p => {
        const f = new Date(p.fecha_pedido);
        return f.getFullYear() === anioActual && f.getMonth() === idx;
      })
      .reduce((acc, p) => acc + (p.total_bultos || 0), 0);
    return { mes, bultos: total };
  });

  // Últimos 8 pedidos
  const ultimosPedidos = [...pedidos]
    .sort((a, b) => new Date(b.fecha_pedido) - new Date(a.fecha_pedido))
    .slice(0, 8);

  if (cargando) return <p style={{ color: '#9090a0', padding: 24 }}>Cargando...</p>;

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: '0 0 4px', color: '#fff' }}>
          Buen día, {usuario?.local_nombre || 'Local'}
        </h2>
        <p style={{ color: '#9090a0', margin: 0, fontSize: 13 }}>
          Resumen del mes — {MESES[mesActual]} {anioActual}
        </p>
      </div>

      {/* Tarjetas de stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
        <StatCard label="Pedidos del mes" valor={cantidadPedidosMes} icon="📦" />
        <StatCard label="Bultos del mes" valor={bultosMes} icon="📊" />
        <StatCard label="Bultos esperados" valor={volumenEsperado} icon="🚚" sublabel="confirmados + en tránsito" />
      </div>

      {/* Gráfico */}
      <div style={{
        background: '#1a1a24', border: '1px solid #2d2d3d', borderRadius: 10, padding: '20px 24px', marginBottom: 24,
      }}>
        <p style={{ margin: '0 0 16px', color: '#9090a0', fontSize: 13, fontWeight: 600 }}>
          Bultos generados por mes — {anioActual}
        </p>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={datosMensuales} margin={{ top: 4, right: 16, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d2d3d" />
            <XAxis dataKey="mes" tick={{ fill: '#9090a0', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#9090a0', fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: '#0f0f13', border: '1px solid #2d2d3d', borderRadius: 6 }}
              labelStyle={{ color: '#fff', fontSize: 13 }}
              itemStyle={{ color: '#a78bfa' }}
            />
            <Line
              type="monotone" dataKey="bultos" stroke="#6c63ff" strokeWidth={2}
              dot={{ fill: '#6c63ff', r: 3 }} activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Tabla últimos pedidos */}
      <div style={{ background: '#1a1a24', border: '1px solid #2d2d3d', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #2d2d3d' }}>
          <span style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>Últimos pedidos</span>
        </div>
        {ultimosPedidos.length === 0 ? (
          <p style={{ color: '#9090a0', padding: '16px 20px', margin: 0, fontSize: 13 }}>
            No hay pedidos registrados.
          </p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ color: '#606070', borderBottom: '1px solid #2d2d3d' }}>
                <th style={th}>Fecha pedido</th>
                <th style={th}>Fecha entrega</th>
                <th style={th}>Productos</th>
                <th style={th}>Bultos (botellas)</th>
                <th style={th}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {ultimosPedidos.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid #1e1e28', color: '#ccc' }}>
                  <td style={td}>{formatFecha(p.fecha_pedido)}</td>
                  <td style={td}>{p.fecha_entrega_estimada ? formatFecha(p.fecha_entrega_estimada) : <span style={{ color: '#555' }}>—</span>}</td>
                  <td style={td}>{p.total_items ?? '—'}</td>
                  <td style={td}>{p.total_bultos ?? 0}</td>
                  <td style={td}>
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 10,
                      background: (colorEstado[p.estado] || '#888') + '22',
                      color: colorEstado[p.estado] || '#888',
                    }}>
                      {p.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, valor, icon, sublabel }) {
  return (
    <div style={{
      background: '#1a1a24', border: '1px solid #2d2d3d', borderRadius: 10, padding: '18px 20px',
    }}>
      <div style={{ fontSize: 22, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: '#fff', lineHeight: 1 }}>{valor}</div>
      <div style={{ fontSize: 12, color: '#9090a0', marginTop: 6 }}>{label}</div>
      {sublabel && <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>{sublabel}</div>}
    </div>
  );
}

function formatFecha(fecha) {
  if (!fecha) return '—';
  return fecha.slice(0, 10).split('-').reverse().join('/');
}

const th = { textAlign: 'left', padding: '8px 16px', fontWeight: 600, fontSize: 12 };
const td = { padding: '10px 16px' };

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const colorEstado = {
  borrador: '#888', confirmado: '#2563eb', en_transito: '#d97706',
  entregado: '#16a34a', cancelado: '#dc2626',
};
const colorCambio = {
  pendiente: '#d97706', aprobado: '#2563eb', procesado: '#16a34a', rechazado: '#dc2626',
};

const thStyle = {
  padding: '0.5rem 0.8rem', textAlign: 'left', color: '#9090a0',
  fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase',
  whiteSpace: 'nowrap', position: 'sticky', top: 0, background: '#1a1a24', zIndex: 1,
};

function BarraProgreso({ porcentaje, color }) {
  const pct = Math.min(porcentaje, 100);
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 11, color: '#9090a0' }}>Progreso</span>
        <span style={{ fontSize: 11, fontWeight: 700, color }}>{pct.toFixed(1)}%</span>
      </div>
      <div style={{ background: '#2d2d3d', borderRadius: 4, height: 6, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.6s ease' }} />
      </div>
    </div>
  );
}

const tooltipStyle = {
  contentStyle: { background: '#1a1a24', border: '1px solid #2d2d3d', borderRadius: 8, color: '#e0e0e0', fontSize: 12 },
  labelStyle: { color: '#9090a0' },
  cursor: { fill: '#6c63ff10' },
};

export default function AdminInicio() {
  const { usuario } = useAuth();
  const [cargando, setCargando] = useState(true);

  // Objetivos
  const [objAnual, setObjAnual] = useState(null);
  const [objMensual, setObjMensual] = useState(null);

  // Métricas simples
  const [localesActivos, setLocalesActivos] = useState(0);
  const [accionesActivas, setAccionesActivas] = useState(0);
  const [cambiosPendientesCount, setCambiosPendientesCount] = useState(0);
  const [pedidosEntregadosMes, setPedidosEntregadosMes] = useState(0);

  // Datos para tablas
  const [ultimosPedidos, setUltimosPedidos] = useState([]);
  const [cambiosPendientes, setCambiosPendientes] = useState([]);

  // Datos para gráficos
  const [datosLinea, setDatosLinea] = useState([]);
  const [datosBarra, setDatosBarra] = useState([]);

  useEffect(() => {
    async function cargar() {
      const token = localStorage.getItem('token');
      const h = { Authorization: `Bearer ${token}` };
      const hoy = new Date();
      const mesActual = hoy.getMonth();
      const anioActual = hoy.getFullYear();

      const [locRes, actRes, pedRes, camRes, objRes] = await Promise.allSettled([
        fetch('/api/locales', { headers: h }).then(r => r.json()),
        fetch('/api/activaciones', { headers: h }).then(r => r.json()),
        fetch('/api/pedidos', { headers: h }).then(r => r.json()),
        fetch('/api/cambios', { headers: h }).then(r => r.json()),
        fetch('/api/objetivos', { headers: h }).then(r => r.json()),
      ]);

      const locales     = locRes.status === 'fulfilled' && Array.isArray(locRes.value) ? locRes.value : [];
      const activaciones = actRes.status === 'fulfilled' && Array.isArray(actRes.value) ? actRes.value : [];
      const pedidos     = pedRes.status === 'fulfilled' && Array.isArray(pedRes.value) ? pedRes.value : [];
      const cambios     = camRes.status === 'fulfilled' && Array.isArray(camRes.value) ? camRes.value : [];
      const objetivos   = objRes.status === 'fulfilled' && Array.isArray(objRes.value) ? objRes.value : [];

      // ── Objetivos ──────────────────────────────────────────────────────────
      const anual   = objetivos.find(o => o.periodo === 'anual');
      const mensual = objetivos.find(o => {
        if (o.periodo !== 'mensual') return false;
        const desde = new Date(o.fecha_inicio);
        const hasta = new Date(o.fecha_fin);
        return hoy >= desde && hoy <= hasta;
      });
      setObjAnual(anual || null);
      setObjMensual(mensual || null);

      // ── unit_general para cálculo de volumen ──────────────────────────────
      const unitG = mensual?.unit_general || anual?.unit_general || 1.7;

      // ── Métricas ──────────────────────────────────────────────────────────
      setLocalesActivos(locales.filter(l => l.activo).length);

      const hoyStr = hoy.toISOString().slice(0, 10);
      setAccionesActivas(activaciones.filter(a => a.activo && a.hasta >= hoyStr).length);

      const cambiosPend = cambios.filter(c => c.estado === 'pendiente');
      setCambiosPendientesCount(cambiosPend.length);
      setCambiosPendientes(cambiosPend.slice(0, 8));

      const entregadosMes = pedidos.filter(p => {
        if (p.estado !== 'entregado') return false;
        const f = new Date(p.fecha_pedido);
        return f.getMonth() === mesActual && f.getFullYear() === anioActual;
      });
      setPedidosEntregadosMes(entregadosMes.length);

      setUltimosPedidos(pedidos.slice(0, 8));

      // ── Gráfico lineal: volumen mensual (últimos 6 meses) ─────────────────
      const volPorMes = {};
      for (let i = 5; i >= 0; i--) {
        const d = new Date(anioActual, mesActual - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        volPorMes[key] = { mes: MESES[d.getMonth()], volumen: 0 };
      }
      pedidos.forEach(p => {
        const f = new Date(p.fecha_pedido);
        const key = `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}`;
        if (volPorMes[key]) {
          volPorMes[key].volumen += (p.total_bultos || 0) * unitG;
        }
      });
      setDatosLinea(Object.values(volPorMes).map(d => ({ ...d, volumen: +d.volumen.toFixed(2) })));

      // ── Gráfico barras: top 6 locales por volumen ─────────────────────────
      const volPorLocal = {};
      pedidos.forEach(p => {
        if (!p.local_nombre) return;
        volPorLocal[p.local_nombre] = (volPorLocal[p.local_nombre] || 0) + (p.total_bultos || 0) * unitG;
      });
      const topLocales = Object.entries(volPorLocal)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([local, volumen]) => ({ local: local.length > 16 ? local.slice(0, 14) + '…' : local, volumen: +volumen.toFixed(2) }));
      setDatosBarra(topLocales);

      setCargando(false);
    }

    cargar();
  }, []);

  // ── Volúmenes actuales ─────────────────────────────────────────────────────
  const unitG = objMensual?.unit_general || objAnual?.unit_general || 1.7;
  const hoy = new Date();
  const mesActual = hoy.getMonth();
  const anioActual = hoy.getFullYear();

  const volAnualActual = ultimosPedidos.reduce((acc, p) => {
    const f = new Date(p.fecha_pedido);
    return f.getFullYear() === anioActual ? acc + (p.total_bultos || 0) * unitG : acc;
  }, 0);

  const volMensualActual = ultimosPedidos.reduce((acc, p) => {
    const f = new Date(p.fecha_pedido);
    return f.getMonth() === mesActual && f.getFullYear() === anioActual
      ? acc + (p.total_bultos || 0) * unitG : acc;
  }, 0);

  const inicioSemana = new Date(hoy);
  inicioSemana.setDate(hoy.getDate() - hoy.getDay());
  const volSemanalActual = ultimosPedidos.reduce((acc, p) => {
    const f = new Date(p.fecha_pedido);
    return f >= inicioSemana ? acc + (p.total_bultos || 0) * unitG : acc;
  }, 0);

  const pctAnual = objAnual ? (volAnualActual / objAnual.volumen_objetivo) * 100 : null;
  const pctMensual = objMensual ? (volMensualActual / objMensual.volumen_objetivo) * 100 : null;

  // ── Render ─────────────────────────────────────────────────────────────────
  const cardVol = (label, valor, obj, pct, color, link) => (
    <Link to={link} style={{ textDecoration: 'none' }}>
      <div style={{ background: '#1a1a24', border: `1px solid ${color}30`, borderRadius: 12, padding: '1.2rem', transition: 'border-color 0.2s' }}
        onMouseEnter={e => e.currentTarget.style.borderColor = color}
        onMouseLeave={e => e.currentTarget.style.borderColor = `${color}30`}>
        <div style={{ fontSize: '0.75rem', color: '#9090a0', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>{label}</div>
        <div style={{ fontSize: '1.6rem', fontWeight: 900, color, lineHeight: 1 }}>
          {cargando ? '—' : valor.toLocaleString('es-AR', { maximumFractionDigits: 1 })}
          <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#606070', marginLeft: 4 }}>vol</span>
        </div>
        {obj && <div style={{ fontSize: '0.75rem', color: '#606070', marginTop: 4 }}>Objetivo: {Number(obj.volumen_objetivo).toLocaleString('es-AR')}</div>}
        {pct !== null && <BarraProgreso porcentaje={pct} color={color} />}
      </div>
    </Link>
  );

  const cardSimple = (label, valor, color, link) => (
    <Link to={link} style={{ textDecoration: 'none' }}>
      <div style={{ background: '#1a1a24', border: `1px solid ${color}30`, borderRadius: 12, padding: '1.2rem', textAlign: 'center', transition: 'border-color 0.2s' }}
        onMouseEnter={e => e.currentTarget.style.borderColor = color}
        onMouseLeave={e => e.currentTarget.style.borderColor = `${color}30`}>
        <div style={{ fontSize: '2.2rem', fontWeight: 900, color }}>{cargando ? '—' : valor}</div>
        <div style={{ fontSize: '0.78rem', color: '#9090a0', marginTop: 4 }}>{label}</div>
      </div>
    </Link>
  );

  return (
    <div style={{ maxWidth: 1300, margin: '0 auto' }}>
      <h2 style={{ color: '#fff', fontSize: '1.4rem', fontWeight: 700, marginBottom: 2 }}>
        Bienvenido, {usuario?.nombre_display || usuario?.username}
      </h2>
      <p style={{ color: '#606070', fontSize: '0.85rem', marginBottom: '1.8rem' }}>Panel de administración SIGMA AC</p>

      {/* ── Fila 1: cards de volumen ─────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
        {cardVol('Volumen anual', volAnualActual, objAnual, pctAnual, '#6c63ff', '/admin/objetivos')}
        {cardVol('Volumen mensual', volMensualActual, objMensual, pctMensual, '#38a169', '/admin/objetivos')}
        {cardVol('Volumen semanal', volSemanalActual, null, null, '#2563eb', '/admin/pedidos')}
      </div>

      {/* ── Fila 2: cards simples ────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.8rem' }}>
        {cardSimple('Pedidos entregados (mes)', pedidosEntregadosMes, '#16a34a', '/admin/pedidos')}
        {cardSimple('Locales activos', localesActivos, '#9090a0', '/admin/empresas')}
        {cardSimple('Acciones activas', accionesActivas, '#a78bfa', '/admin/activaciones')}
        {cardSimple('Cambios pendientes', cambiosPendientesCount, '#d97706', '/admin/cambios')}
      </div>

      {/* ── Gráficos ─────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.8rem' }}>
        {/* Línea: volumen mensual */}
        <div style={{ background: '#1a1a24', border: '1px solid #2d2d3d', borderRadius: 12, padding: '1.2rem' }}>
          <h3 style={{ color: '#fff', fontWeight: 700, fontSize: '0.9rem', marginBottom: '1rem' }}>Volumen por mes (últimos 6 meses)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={datosLinea}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d2d3d" />
              <XAxis dataKey="mes" tick={{ fill: '#9090a0', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#9090a0', fontSize: 11 }} axisLine={false} tickLine={false} width={50} />
              <Tooltip {...tooltipStyle} formatter={v => [v.toLocaleString('es-AR'), 'Volumen']} />
              <Line type="monotone" dataKey="volumen" stroke="#6c63ff" strokeWidth={2.5} dot={{ fill: '#6c63ff', r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Barras: top locales */}
        <div style={{ background: '#1a1a24', border: '1px solid #2d2d3d', borderRadius: 12, padding: '1.2rem' }}>
          <h3 style={{ color: '#fff', fontWeight: 700, fontSize: '0.9rem', marginBottom: '1rem' }}>Locales con mayor volumen</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={datosBarra} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#2d2d3d" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#9090a0', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="local" tick={{ fill: '#9090a0', fontSize: 11 }} axisLine={false} tickLine={false} width={90} />
              <Tooltip {...tooltipStyle} formatter={v => [v.toLocaleString('es-AR'), 'Volumen']} />
              <Bar dataKey="volumen" fill="#38a169" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Tablas ───────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

        {/* Últimos pedidos */}
        <div style={{ background: '#1a1a24', border: '1px solid #2d2d3d', borderRadius: 12, padding: '1.2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
            <h3 style={{ color: '#fff', fontWeight: 700, fontSize: '0.9rem' }}>Últimos pedidos</h3>
            <Link to="/admin/pedidos" style={{ color: '#6c63ff', fontSize: '0.8rem', textDecoration: 'none' }}>Ver todos →</Link>
          </div>
          <div style={{ overflowY: 'auto', maxHeight: 280 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #2d2d3d' }}>
                  <th style={thStyle}>Local</th>
                  <th style={thStyle}>Ingreso</th>
                  <th style={thStyle}>Entrega</th>
                  <th style={thStyle}>Vol.</th>
                  <th style={thStyle}>Bultos</th>
                  <th style={thStyle}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {cargando ? (
                  <tr><td colSpan={6} style={{ padding: '1rem', color: '#606070', textAlign: 'center' }}>Cargando...</td></tr>
                ) : ultimosPedidos.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: '1rem', color: '#606070', textAlign: 'center' }}>Sin pedidos.</td></tr>
                ) : ultimosPedidos.map(p => {
                  const vol = ((p.total_bultos || 0) * unitG).toFixed(1);
                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid #12121a' }}>
                      <td style={{ padding: '0.45rem 0.8rem', color: '#fff', fontWeight: 600, maxWidth: 120, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.local_nombre}</td>
                      <td style={{ padding: '0.45rem 0.8rem', color: '#9090a0', whiteSpace: 'nowrap' }}>{p.fecha_pedido?.slice(0, 10)}</td>
                      <td style={{ padding: '0.45rem 0.8rem', color: '#9090a0', whiteSpace: 'nowrap' }}>{p.fecha_entrega_estimada?.slice(0, 10) || '—'}</td>
                      <td style={{ padding: '0.45rem 0.8rem', color: '#6c63ff', fontWeight: 700 }}>{vol}</td>
                      <td style={{ padding: '0.45rem 0.8rem', color: '#9090a0' }}>{p.total_bultos}</td>
                      <td style={{ padding: '0.45rem 0.8rem' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 6px', borderRadius: 8, background: (colorEstado[p.estado] || '#888') + '22', color: colorEstado[p.estado] || '#888' }}>
                          {p.estado}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Cambios pendientes */}
        <div style={{ background: '#1a1a24', border: '1px solid #2d2d3d', borderRadius: 12, padding: '1.2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
            <h3 style={{ color: '#fff', fontWeight: 700, fontSize: '0.9rem' }}>Cambios pendientes</h3>
            <Link to="/admin/cambios" style={{ color: '#6c63ff', fontSize: '0.8rem', textDecoration: 'none' }}>Ver todos →</Link>
          </div>
          <div style={{ overflowY: 'auto', maxHeight: 280 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #2d2d3d' }}>
                  <th style={thStyle}>Local</th>
                  <th style={thStyle}>Repositor</th>
                  <th style={thStyle}>Fecha</th>
                  <th style={thStyle}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {cargando ? (
                  <tr><td colSpan={4} style={{ padding: '1rem', color: '#606070', textAlign: 'center' }}>Cargando...</td></tr>
                ) : cambiosPendientes.length === 0 ? (
                  <tr><td colSpan={4} style={{ padding: '1rem', color: '#606070', textAlign: 'center' }}>Sin cambios pendientes.</td></tr>
                ) : cambiosPendientes.map(c => (
                  <tr key={c.id} style={{ borderBottom: '1px solid #12121a' }}>
                    <td style={{ padding: '0.45rem 0.8rem', color: '#fff', fontWeight: 600, maxWidth: 120, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.local_nombre}</td>
                    <td style={{ padding: '0.45rem 0.8rem', color: '#9090a0', whiteSpace: 'nowrap' }}>{c.repositor_nombre} {c.repositor_apellido}</td>
                    <td style={{ padding: '0.45rem 0.8rem', color: '#9090a0', whiteSpace: 'nowrap' }}>{c.fecha?.slice(0, 10)}</td>
                    <td style={{ padding: '0.45rem 0.8rem' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 6px', borderRadius: 8, background: (colorCambio[c.estado] || '#888') + '22', color: colorCambio[c.estado] || '#888' }}>
                        {c.estado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}

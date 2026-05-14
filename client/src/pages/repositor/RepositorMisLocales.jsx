import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import API_URL from '../../config';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

function fmt(n) {
  return Number(n || 0).toLocaleString('es-AR', { maximumFractionDigits: 1 });
}

export default function RepositorMisLocales() {
  const { usuario } = useAuth();
  const locales = usuario?.locales || [];
  const [localSel, setLocalSel] = useState(locales[0]?.id || null);
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargar() {
      setCargando(true);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/api/pedidos/mis-locales`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setPedidos(Array.isArray(data) ? data : []);
      } catch { /* silencioso */ }
      finally { setCargando(false); }
    }
    cargar();
  }, []);

  const anio = new Date().getFullYear();

  function datosMensuales(localId) {
    return MESES.map((mes, idx) => {
      const vol = pedidos
        .filter(p => {
          const f = new Date(p.fecha_pedido);
          return p.local_id === localId && f.getFullYear() === anio && f.getMonth() === idx
            && ['confirmado','en_transito','entregado'].includes(p.estado);
        })
        .reduce((a, p) => a + (p.total_volumen > 0 ? p.total_volumen : (p.total_bultos || 0)), 0);
      return { mes, vol: parseFloat(vol.toFixed(2)) };
    });
  }

  const localActual = locales.find(l => l.id === localSel);
  const datos = localSel ? datosMensuales(localSel) : [];
  const totalAnual = datos.reduce((a, d) => a + d.vol, 0);

  return (
    <div style={{ maxWidth: 980, margin: '0 auto' }}>
      <h2 style={{ margin: '0 0 4px', color: '#fff' }}>Mis locales</h2>
      <p style={{ color: '#9090a0', marginBottom: 24, fontSize: 13 }}>
        Locales asignados a tu ruta · gráfico de volumen mensual
      </p>

      {locales.length === 0 ? (
        <div style={{ background: '#1a1a24', border: '1px solid #2d2d3d', borderRadius: 10, padding: 32, textAlign: 'center', color: '#9090a0' }}>
          No tenés locales asignados.
        </div>
      ) : (
        <>
          {/* Cards de locales */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10, marginBottom: 24 }}>
            {locales.map(l => {
              const volMes = pedidos
                .filter(p => {
                  const f = new Date(p.fecha_pedido);
                  const hoy = new Date();
                  return p.local_id === l.id && f.getMonth() === hoy.getMonth() && f.getFullYear() === hoy.getFullYear()
                    && ['confirmado','en_transito','entregado'].includes(p.estado);
                })
                .reduce((a, p) => a + (p.total_volumen > 0 ? p.total_volumen : (p.total_bultos || 0)), 0);

              return (
                <div
                  key={l.id}
                  onClick={() => setLocalSel(l.id)}
                  style={{
                    background: localSel === l.id ? '#6c63ff22' : '#1a1a24',
                    border: `1px solid ${localSel === l.id ? '#6c63ff' : '#2d2d3d'}`,
                    borderRadius: 10, padding: '14px 16px', cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  <div style={{ fontWeight: 700, color: '#fff', fontSize: 13 }}>{l.nombre}</div>
                  <div style={{ fontSize: 11, color: '#6c63ff', marginTop: 3 }}>Local #{l.id}</div>
                  {!cargando && (
                    <div style={{ fontSize: 12, color: '#9090a0', marginTop: 6 }}>
                      Vol. mes: <span style={{ color: '#fff', fontWeight: 600 }}>{fmt(volMes)}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Gráfico del local seleccionado */}
          {localActual && (
            <div style={{ background: '#1a1a24', border: '1px solid #2d2d3d', borderRadius: 10, padding: '22px 24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <div style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>{localActual.nombre}</div>
                  <div style={{ color: '#9090a0', fontSize: 12 }}>Volumen por mes — {anio}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#6c63ff' }}>{fmt(totalAnual)}</div>
                  <div style={{ fontSize: 11, color: '#9090a0' }}>total anual</div>
                </div>
              </div>

              {cargando ? (
                <p style={{ color: '#9090a0', textAlign: 'center', padding: 40 }}>Cargando...</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={datos} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2d2d3d" />
                    <XAxis dataKey="mes" tick={{ fill: '#9090a0', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#9090a0', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: '#0f0f13', border: '1px solid #2d2d3d', borderRadius: 6 }}
                      labelStyle={{ color: '#fff', fontSize: 12 }}
                      itemStyle={{ color: '#a78bfa' }}
                      formatter={v => [fmt(v), 'Volumen']}
                    />
                    <Bar dataKey="vol" fill="#6c63ff" radius={[3,3,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import API_URL from '../../config';

function fmt(n) {
  return Number(n || 0).toLocaleString('es-AR', { maximumFractionDigits: 2 });
}

function pctColor(p) {
  if (p >= 100) return '#16a34a';
  if (p >= 80)  return '#2563eb';
  if (p >= 50)  return '#d97706';
  return '#dc2626';
}

function MiniBar({ pct, color }) {
  const p = Math.min(100, Math.max(0, pct || 0));
  return (
    <div style={{ background: '#2d2d3d', borderRadius: 4, height: 5, overflow: 'hidden', marginTop: 6 }}>
      <div style={{ width: `${p}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.4s' }} />
    </div>
  );
}

export default function RepositorInicio() {
  const { usuario } = useAuth();
  const [resumen, setResumen] = useState(null);
  const [objetivos, setObjetivos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargar() {
      const token = localStorage.getItem('token');
      const h = { Authorization: `Bearer ${token}` };
      try {
        const [resRes, objRes] = await Promise.allSettled([
          fetch(`${API_URL}/api/repositores/me/resumen`, { headers: h }).then(r => r.json()),
          fetch(`${API_URL}/api/objetivos/progreso`, { headers: h }).then(r => r.json()),
        ]);
        if (resRes.status === 'fulfilled' && resRes.value?.repositor) setResumen(resRes.value);
        if (objRes.status === 'fulfilled' && Array.isArray(objRes.value)) setObjetivos(objRes.value);
      } catch { /* silencioso */ }
      finally { setCargando(false); }
    }
    cargar();
  }, []);

  if (cargando) return <p style={{ color: '#9090a0', padding: 24 }}>Cargando...</p>;

  const locales = resumen?.locales || [];
  const totalVolMes = locales.reduce((a, l) => a + (l.vol_mes || 0), 0);
  const totalObjLocal = locales.reduce((a, l) => a + (l.volumen_objetivo_local || 0), 0);
  const pctTotal = totalObjLocal > 0 ? (totalVolMes / totalObjLocal) * 100 : 0;

  const objAnual = objetivos.find(o => o.periodo === 'anual');

  const hoy = new Date();
  const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

  return (
    <div style={{ maxWidth: 980, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ margin: '0 0 4px', color: '#fff', fontSize: '1.4rem' }}>
          Buen día, {resumen?.repositor?.nombre || usuario?.repositor_nombre}
        </h2>
        <p style={{ color: '#9090a0', margin: 0, fontSize: 13 }}>
          {MESES[hoy.getMonth()]} {hoy.getFullYear()} — Resumen de tu zona
        </p>
      </div>

      {/* Totales */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 28 }}>
        <StatCard label="Volumen total del mes" valor={fmt(totalVolMes)} sub="suma de todos tus locales" accent="#6c63ff" />
        <StatCard label="Objetivo mensual locales" valor={fmt(totalObjLocal)} sub="suma de objetivos asignados" accent="#a78bfa" />
        <div style={{ background: '#1a1a24', border: `1px solid ${pctColor(pctTotal)}44`, borderRadius: 10, padding: '18px 20px' }}>
          <div style={{ fontSize: 11, color: '#9090a0', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
            % Cumplimiento total
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: pctColor(pctTotal), lineHeight: 1 }}>
            {pctTotal.toFixed(1)}%
          </div>
          <MiniBar pct={pctTotal} color={pctColor(pctTotal)} />
        </div>
      </div>

      {/* Objetivo anual del grupo */}
      {objAnual && (
        <div style={{ background: '#1a1a24', border: '1px solid #d9770633', borderRadius: 10, padding: '18px 22px', marginBottom: 28 }}>
          <div style={{ fontSize: 11, color: '#f6ad55', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
            Objetivo anual del grupo
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 24, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#fff' }}>{fmt(objAnual.volumen_actual)}</div>
              <div style={{ fontSize: 12, color: '#9090a0' }}>de {fmt(objAnual.volumen_objetivo)} objetivo</div>
            </div>
            {objAnual.visible_porcentaje && (
              <div style={{ fontSize: 36, fontWeight: 900, color: pctColor(objAnual.porcentaje) }}>
                {objAnual.porcentaje?.toFixed(1)}%
              </div>
            )}
            {objAnual.descripcion && (
              <div style={{ color: '#9090a0', fontSize: 13 }}>{objAnual.descripcion}</div>
            )}
          </div>
          <MiniBar pct={objAnual.porcentaje} color={pctColor(objAnual.porcentaje)} />
        </div>
      )}

      {/* Cards por local */}
      {locales.length > 0 && (
        <>
          <p style={{ margin: '0 0 12px', color: '#9090a0', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Volumen por local — este mes
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12, marginBottom: 28 }}>
            {locales.map(l => {
              const pct = l.volumen_objetivo_local > 0 ? (l.vol_mes / l.volumen_objetivo_local) * 100 : 0;
              const col = pctColor(pct);
              return (
                <div key={l.id} style={{ background: '#1a1a24', border: `1px solid ${col}33`, borderRadius: 10, padding: '16px 18px' }}>
                  <div style={{ fontWeight: 700, color: '#fff', fontSize: 14, marginBottom: 10 }}>{l.nombre}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 4 }}>
                    <div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{fmt(l.vol_mes)}</div>
                      {l.volumen_objetivo_local > 0 && (
                        <div style={{ fontSize: 11, color: '#606070' }}>/ {fmt(l.volumen_objetivo_local)} obj.</div>
                      )}
                    </div>
                    {l.volumen_objetivo_local > 0 && (
                      <div style={{ fontSize: 20, fontWeight: 800, color: col }}>{pct.toFixed(0)}%</div>
                    )}
                  </div>
                  {l.volumen_objetivo_local > 0 && <MiniBar pct={pct} color={col} />}
                  <div style={{ marginTop: 8, fontSize: 11, color: '#505060' }}>
                    {l.pedidos_mes} {l.pedidos_mes === 1 ? 'pedido' : 'pedidos'} este mes
                    {l.vol_anio > 0 && <span> · {fmt(l.vol_anio)} anual</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Sin locales */}
      {locales.length === 0 && (
        <div style={{ background: '#1a1a24', border: '1px solid #2d2d3d', borderRadius: 10, padding: 32, textAlign: 'center', color: '#9090a0' }}>
          No tenés locales asignados. Pedile al administrador que te asigne locales.
        </div>
      )}
    </div>
  );
}

function StatCard({ label, valor, sub, accent }) {
  return (
    <div style={{ background: '#1a1a24', border: `1px solid ${accent}33`, borderRadius: 10, padding: '18px 20px' }}>
      <div style={{ fontSize: 11, color: '#9090a0', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{valor}</div>
      {sub && <div style={{ fontSize: 11, color: '#505060', marginTop: 5 }}>{sub}</div>}
    </div>
  );
}

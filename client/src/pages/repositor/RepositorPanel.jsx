import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import API_URL from '../../config';

function pctColor(p) {
  if (p >= 100) return '#16a34a';
  if (p >= 80)  return '#2563eb';
  if (p >= 50)  return '#d97706';
  return '#dc2626';
}

function fmt(n) {
  return Number(n || 0).toLocaleString('es-AR', { maximumFractionDigits: 2 });
}

const CP = {
  semanal: { bg: '#2563eb22', color: '#60a5fa' },
  mensual: { bg: '#7c3aed22', color: '#a78bfa' },
  anual:   { bg: '#d9770622', color: '#f6ad55' },
};

function ProgressBar({ pct, color }) {
  const p = Math.min(100, Math.max(0, pct || 0));
  return (
    <div style={{ background: '#2d2d3d', borderRadius: 4, height: 6, overflow: 'hidden', marginTop: 5 }}>
      <div style={{ width: `${p}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.4s ease' }} />
    </div>
  );
}

function CardObjetivo({ obj }) {
  const cp = CP[obj.periodo] || CP.mensual;
  const color = pctColor(obj.porcentaje);

  return (
    <div style={{
      background: '#1a1a24', border: `1px solid ${cp.color}33`,
      borderRadius: 10, padding: '1rem',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <span style={{ ...cp, padding: '2px 8px', borderRadius: 6, fontSize: '0.68rem', fontWeight: 700 }}>
          {obj.periodo.toUpperCase()}
        </span>
        {obj.visible_porcentaje ? (
          <span style={{ fontSize: '1.5rem', fontWeight: 800, color, lineHeight: 1 }}>
            {obj.porcentaje?.toFixed(1)}%
          </span>
        ) : null}
      </div>

      {obj.descripcion && (
        <div style={{ color: '#9090a0', fontSize: '0.78rem', marginBottom: 6 }}>{obj.descripcion}</div>
      )}

      {obj.visible_volumen && (
        <div style={{ marginBottom: 6 }}>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: '1.05rem' }}>
            {fmt(obj.volumen_actual)}
          </div>
          <div style={{ color: '#606070', fontSize: '0.7rem' }}>
            de {fmt(obj.volumen_objetivo)} objetivo
          </div>
        </div>
      )}

      {(obj.visible_porcentaje || obj.visible_volumen) && (
        <ProgressBar pct={obj.porcentaje} color={color} />
      )}

      <div style={{ marginTop: 6, fontSize: '0.68rem', color: '#505060' }}>
        {obj.fecha_inicio} → {obj.fecha_fin}
      </div>
    </div>
  );
}

export default function RepositorPanel() {
  const { usuario } = useAuth();
  const locales = usuario?.locales || [];
  const [objetivos, setObjetivos] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`${API_URL}/api/objetivos/progreso`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setObjetivos(data); })
      .catch(() => {});
  }, []);

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>

      {/* Progreso del equipo */}
      {objetivos.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <h3 style={{
            margin: '0 0 12px', color: '#9090a0', fontSize: '0.72rem',
            fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em',
          }}>
            Progreso del equipo
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
            {objetivos.map(obj => <CardObjetivo key={obj.id} obj={obj} />)}
          </div>
        </div>
      )}

      {/* Mis locales */}
      <h2 style={{ margin: '0 0 4px', color: '#fff' }}>Mis locales</h2>
      <p style={{ color: '#9090a0', marginBottom: 16, fontSize: 13 }}>
        Locales asignados a tu ruta
      </p>

      {locales.length === 0 ? (
        <div style={{
          background: '#1a1a24', border: '1px solid #2d2d3d', borderRadius: 10,
          padding: 32, textAlign: 'center', color: '#9090a0',
        }}>
          No tenés locales asignados aún. Pedile al administrador que te asigne locales.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
          {locales.map(l => (
            <div key={l.id} style={{
              background: '#1a1a24', border: '1px solid #2d2d3d',
              borderRadius: 10, padding: 20,
            }}>
              <div style={{ fontWeight: 700, color: '#fff', fontSize: 15, marginBottom: 4 }}>{l.nombre}</div>
              <div style={{ fontSize: 12, color: '#6c63ff' }}>Local #{l.id}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from 'react';
import API_URL from '../../config';

function pctColor(p) {
  if (p >= 100) return '#16a34a';
  if (p >= 80)  return '#2563eb';
  if (p >= 50)  return '#d97706';
  return '#dc2626';
}

const CP = {
  semanal: { bg: '#2563eb22', color: '#60a5fa' },
  mensual: { bg: '#7c3aed22', color: '#a78bfa' },
  anual:   { bg: '#d9770622', color: '#f6ad55' },
};

function fmt(n) {
  return Number(n || 0).toLocaleString('es-AR', { maximumFractionDigits: 2 });
}

function ProgressBar({ pct, color }) {
  const p = Math.min(100, Math.max(0, pct || 0));
  return (
    <div style={{ background: '#2d2d3d', borderRadius: 4, height: 6, overflow: 'hidden', marginTop: 6 }}>
      <div style={{ width: `${p}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.4s' }} />
    </div>
  );
}

function CardObjetivo({ obj }) {
  const cp = CP[obj.periodo] || CP.mensual;
  const color = pctColor(obj.porcentaje);
  return (
    <div style={{ background: '#1a1a24', border: `1px solid ${cp.color}33`, borderRadius: 10, padding: '1.1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <span style={{ ...cp, padding: '3px 10px', borderRadius: 6, fontSize: '0.68rem', fontWeight: 700 }}>
          {obj.periodo.toUpperCase()}
        </span>
        {obj.visible_porcentaje && (
          <span style={{ fontSize: '1.6rem', fontWeight: 900, color, lineHeight: 1 }}>
            {obj.porcentaje?.toFixed(1)}%
          </span>
        )}
      </div>
      {obj.descripcion && (
        <div style={{ color: '#9090a0', fontSize: '0.8rem', marginBottom: 8 }}>{obj.descripcion}</div>
      )}
      {obj.visible_volumen && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: '1.1rem' }}>{fmt(obj.volumen_actual)}</div>
          <div style={{ color: '#606070', fontSize: '0.72rem' }}>de {fmt(obj.volumen_objetivo)} objetivo</div>
        </div>
      )}
      {(obj.visible_porcentaje || obj.visible_volumen) && (
        <ProgressBar pct={obj.porcentaje} color={color} />
      )}
      <div style={{ marginTop: 8, fontSize: '0.68rem', color: '#505060' }}>
        {String(obj.fecha_inicio).slice(0,10)} → {String(obj.fecha_fin).slice(0,10)}
      </div>
    </div>
  );
}

export default function RepositorObjetivos() {
  const [objetivos, setObjetivos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`${API_URL}/api/objetivos/progreso`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setObjetivos(d); })
      .catch(() => {})
      .finally(() => setCargando(false));
  }, []);

  if (cargando) return <p style={{ color: '#9090a0' }}>Cargando...</p>;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <h2 style={{ margin: '0 0 4px', color: '#fff' }}>Objetivos del equipo</h2>
      <p style={{ color: '#9090a0', marginBottom: 24, fontSize: 13 }}>
        Progreso de los objetivos publicados por el administrador
      </p>

      {objetivos.length === 0 ? (
        <div style={{ background: '#1a1a24', border: '1px solid #2d2d3d', borderRadius: 10, padding: 32, textAlign: 'center', color: '#9090a0' }}>
          No hay objetivos publicados actualmente.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
          {objetivos.map(obj => <CardObjetivo key={obj.id} obj={obj} />)}
        </div>
      )}
    </div>
  );
}

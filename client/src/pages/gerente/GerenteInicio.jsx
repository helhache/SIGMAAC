import { useAuth } from '../../context/AuthContext';

export default function GerenteInicio() {
  const { usuario } = useAuth();

  return (
    <div>
      <h1 style={{ margin: '0 0 8px', color: '#1a1a2e' }}>Bienvenido, {usuario?.username}</h1>
      <p style={{ color: '#666', marginBottom: 32 }}>Panel de Gerencia — Catamarca</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
        {[
          { titulo: 'Pedidos', desc: 'Ver y gestionar pedidos de locales', ruta: '/gerente/pedidos' },
          { titulo: 'Cambios', desc: 'Aprobar cambios de repositores', ruta: '/gerente/cambios' },
          { titulo: 'Objetivos', desc: 'Gestionar metas de volumen', ruta: '/gerente/objetivos' },
          { titulo: 'Repositores', desc: 'Ver equipo de campo', ruta: '/gerente/repositores' },
          { titulo: 'Reclamos', desc: 'Reclamos de locales y repositores', ruta: '/gerente/reclamos' },
        ].map(card => (
          <a
            key={card.ruta}
            href={card.ruta}
            style={{
              background: '#fff', borderRadius: 10, padding: 20,
              textDecoration: 'none', color: 'inherit',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              display: 'block', transition: 'transform 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = ''}
          >
            <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 6, color: '#1a1a2e' }}>{card.titulo}</div>
            <div style={{ fontSize: 13, color: '#888' }}>{card.desc}</div>
          </a>
        ))}
      </div>
    </div>
  );
}

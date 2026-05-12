import { useAuth } from '../../context/AuthContext';

export default function RepositorPanel() {
  const { usuario } = useAuth();
  const locales = usuario?.locales || [];

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <h2 style={{ margin: '0 0 4px', color: '#fff' }}>Mis locales</h2>
      <p style={{ color: '#9090a0', marginBottom: 24, fontSize: 13 }}>
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
              background: '#1a1a24', border: '1px solid #2d2d3d', borderRadius: 10,
              padding: 20,
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

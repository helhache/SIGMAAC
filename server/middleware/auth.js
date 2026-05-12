const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'carteles_secret_2026';

function verificarToken(req, res, next) {
  const header = req.headers['authorization'];
  if (!header) return res.status(401).json({ error: 'Token requerido' });

  const token = header.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token inválido' });

  try {
    req.usuario = jwt.verify(token, SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Token expirado o inválido' });
  }
}

function soloAdmin(req, res, next) {
  if (req.usuario?.rol !== 'ADMIN') {
    return res.status(403).json({ error: 'Acceso denegado: se requiere rol ADMIN' });
  }
  next();
}

// Middleware flexible: acepta array de roles permitidos
// Uso: soloRoles(['ADMIN', 'GERENTE'])
function soloRoles(roles) {
  return (req, res, next) => {
    if (!roles.includes(req.usuario?.rol)) {
      return res.status(403).json({ error: `Acceso denegado. Roles permitidos: ${roles.join(', ')}` });
    }
    next();
  };
}

module.exports = { verificarToken, soloAdmin, soloRoles };

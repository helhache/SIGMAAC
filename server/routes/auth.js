const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');

const SECRET = process.env.JWT_SECRET || 'carteles_secret_2026';

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: 'Usuario y contraseña requeridos' });

  try {
    const [rows] = await db.query(
      `SELECT * FROM usuarios WHERE username = ? AND activo = 1`,
      [username]
    );

    if (rows.length === 0)
      return res.status(401).json({ error: 'Credenciales incorrectas' });

    const usuario = rows[0];
    const valido = await bcrypt.compare(password, usuario.password_hash);
    if (!valido)
      return res.status(401).json({ error: 'Credenciales incorrectas' });

    const payload = {
      id: usuario.id,
      username: usuario.username,
      rol: usuario.rol,
      nombre_display: usuario.nombre_display,
    };

    // Para usuarios LOCAL: buscar sus locales en usuarios_locales
    if (usuario.rol === 'LOCAL') {
      const [localesRows] = await db.query(
        `SELECT l.id, l.nombre FROM usuarios_locales ul
         JOIN locales l ON l.id = ul.local_id
         WHERE ul.usuario_id = ? AND l.activo = 1
         ORDER BY l.nombre`,
        [usuario.id]
      );
      payload.local_ids = localesRows.map(l => l.id);
      if (localesRows.length > 0) {
        payload.local_id     = localesRows[0].id;
        payload.local_nombre = localesRows[0].nombre;
      }
    }

    // Para usuarios REPOSITOR: incluir repositor_id y locales asignados
    if (usuario.rol === 'REPOSITOR') {
      const [[repo]] = await db.query(
        'SELECT id, nombre, apellido, numero_vendedor FROM repositores WHERE usuario_id = ? AND activo = 1',
        [usuario.id]
      );
      if (repo) {
        payload.repositor_id      = repo.id;
        payload.repositor_nombre  = repo.nombre;
        payload.repositor_apellido = repo.apellido;
        payload.numero_vendedor   = repo.numero_vendedor;

        const [localesRepo] = await db.query(
          `SELECT l.id, l.nombre FROM repositores_locales rl
           JOIN locales l ON l.id = rl.local_id
           WHERE rl.repositor_id = ? AND l.activo = 1
           ORDER BY l.nombre`,
          [repo.id]
        );
        payload.locales = localesRepo; // [{id, nombre}]
      }
    }

    // Registrar último login
    db.query('UPDATE usuarios SET ultimo_login = NOW() WHERE id = ?', [usuario.id]).catch(() => {});

    const token = jwt.sign(payload, SECRET, { expiresIn: '12h' });
    res.json({ token, usuario: payload });
  } catch (err) {
    res.status(500).json({ error: 'Error interno', detalle: err.message });
  }
});



// RUTA TEMPORAL DE EMERGENCIA - resetear password admin
router.get('/reset-admin', async (req, res) => {
    try {
          const hash = await bcrypt.hash('sigma2026', 10);
          await db.query('UPDATE usuarios SET password_hash = ?, activo = 1 WHERE username = ?', [hash, 'admin.coca.repo']);
          await db.query('UPDATE usuarios SET password_hash = ?, activo = 1 WHERE username = ?', [hash, 'repositor.demo']);
          res.json({ ok: true, msg: 'Passwords reseteados a sigma2026' });
    } catch (err) {
          res.status(500).json({ error: err.message });
    }
});

module.exports = router;

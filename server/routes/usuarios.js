const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../db');
const { verificarToken, soloAdmin } = require('../middleware/auth');

router.use(verificarToken, soloAdmin);

// GET /api/usuarios
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT u.id, u.username, u.rol, u.nombre_display, u.activo, u.creado_at,
              GROUP_CONCAT(DISTINCT l.nombre ORDER BY l.nombre SEPARATOR ', ') AS locales_asignados
       FROM usuarios u
       LEFT JOIN usuarios_locales ul ON ul.usuario_id = u.id
       LEFT JOIN locales l ON l.id = ul.local_id
       GROUP BY u.id
       ORDER BY FIELD(u.rol,'ADMIN','LOCAL','REPOSITOR'), u.username`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener usuarios', detalle: err.message });
  }
});

// POST /api/usuarios
// Body: { username, password, rol, nombre_display?, local_ids?: [id,...] }
router.post('/', async (req, res) => {
  const { username, password, rol, nombre_display, local_ids } = req.body;
  if (!username || !password || !rol)
    return res.status(400).json({ error: 'username, password y rol son requeridos' });

  try {
    const hash = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      'INSERT INTO usuarios (username, password_hash, rol, nombre_display) VALUES (?, ?, ?, ?)',
      [username, hash, rol, nombre_display || null]
    );
    const userId = result.insertId;

    // Para LOCAL: vincular los locales en usuarios_locales
    if (rol === 'LOCAL' && Array.isArray(local_ids) && local_ids.length > 0) {
      for (const lid of local_ids) {
        await db.query(
          'INSERT IGNORE INTO usuarios_locales (usuario_id, local_id) VALUES (?, ?)',
          [userId, lid]
        );
      }
    }

    res.status(201).json({ id: userId, username, rol });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY')
      return res.status(409).json({ error: 'El nombre de usuario ya existe' });
    res.status(500).json({ error: 'Error al crear usuario', detalle: err.message });
  }
});

// PUT /api/usuarios/:id
// Body: { username?, password?, rol?, nombre_display?, activo?, local_ids?: [id,...] }
router.put('/:id', async (req, res) => {
  const { username, password, rol, nombre_display, activo, local_ids } = req.body;
  try {
    const campos = [];
    const valores = [];

    if (username !== undefined)       { campos.push('username = ?');       valores.push(username); }
    if (password)                     { campos.push('password_hash = ?');  valores.push(await bcrypt.hash(password, 10)); }
    if (rol !== undefined)            { campos.push('rol = ?');            valores.push(rol); }
    if (nombre_display !== undefined) { campos.push('nombre_display = ?'); valores.push(nombre_display || null); }
    if (activo !== undefined)         { campos.push('activo = ?');         valores.push(activo ? 1 : 0); }

    if (campos.length > 0) {
      valores.push(req.params.id);
      await db.query(`UPDATE usuarios SET ${campos.join(', ')} WHERE id = ?`, valores);
    }

    // Actualizar locales del usuario LOCAL
    const rolFinal = rol ?? (await db.query('SELECT rol FROM usuarios WHERE id = ?', [req.params.id]))[0][0]?.rol;
    if (rolFinal === 'LOCAL' && Array.isArray(local_ids)) {
      await db.query('DELETE FROM usuarios_locales WHERE usuario_id = ?', [req.params.id]);
      for (const lid of local_ids) {
        await db.query(
          'INSERT IGNORE INTO usuarios_locales (usuario_id, local_id) VALUES (?, ?)',
          [req.params.id, lid]
        );
      }
    }

    res.json({ mensaje: 'Usuario actualizado' });
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar usuario', detalle: err.message });
  }
});

// DELETE /api/usuarios/:id (desactivar)
router.delete('/:id', async (req, res) => {
  try {
    await db.query('UPDATE usuarios SET activo = 0 WHERE id = ?', [req.params.id]);
    res.json({ mensaje: 'Usuario desactivado' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar usuario', detalle: err.message });
  }
});

module.exports = router;

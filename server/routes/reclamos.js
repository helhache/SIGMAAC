const express = require('express');
const router = express.Router();
const db = require('../db');
const { verificarToken, soloRoles } = require('../middleware/auth');

// GET /api/reclamos — ADMIN y GERENTE ven todos; LOCAL y REPOSITOR ven los suyos
router.get('/', verificarToken, async (req, res) => {
  const { rol, id: usuarioId } = req.usuario;
  try {
    let query = `
      SELECT r.*, l.nombre AS local_nombre, u.username AS remitente_username
      FROM reclamos r
      JOIN locales l ON l.id = r.local_id
      JOIN usuarios u ON u.id = r.remitente_id
    `;
    const params = [];

    if (rol === 'LOCAL' || rol === 'REPOSITOR') {
      query += ' WHERE r.remitente_id = ?';
      params.push(usuarioId);
    }

    query += ' ORDER BY r.creado_at DESC';
    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener reclamos', detalle: err.message });
  }
});

// GET /api/reclamos/:id
router.get('/:id', verificarToken, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT r.*, l.nombre AS local_nombre, u.username AS remitente_username
       FROM reclamos r
       JOIN locales l ON l.id = r.local_id
       JOIN usuarios u ON u.id = r.remitente_id
       WHERE r.id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Reclamo no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener reclamo', detalle: err.message });
  }
});

// POST /api/reclamos — LOCAL y REPOSITOR crean reclamos
router.post('/', verificarToken, soloRoles(['LOCAL', 'REPOSITOR', 'ADMIN']), async (req, res) => {
  const { local_id, tipo, descripcion, fecha } = req.body;
  if (!local_id || !descripcion || !fecha)
    return res.status(400).json({ error: 'local_id, descripcion y fecha son requeridos' });

  try {
    const [result] = await db.query(
      `INSERT INTO reclamos (remitente_id, remitente_rol, local_id, tipo, descripcion, fecha)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [req.usuario.id, req.usuario.rol, local_id, tipo || null, descripcion, fecha]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: 'Error al crear reclamo', detalle: err.message });
  }
});

// PUT /api/reclamos/:id/estado — ADMIN gestiona el reclamo
router.put('/:id/estado', verificarToken, soloRoles(['ADMIN']), async (req, res) => {
  const { estado, resolucion } = req.body;
  const estadosValidos = ['abierto', 'en_revision', 'resuelto', 'cerrado'];
  if (!estadosValidos.includes(estado))
    return res.status(400).json({ error: `Estado inválido. Valores: ${estadosValidos.join(', ')}` });
  try {
    await db.query(
      'UPDATE reclamos SET estado = ?, resolucion = ? WHERE id = ?',
      [estado, resolucion || null, req.params.id]
    );
    res.json({ mensaje: 'Estado de reclamo actualizado' });
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar reclamo', detalle: err.message });
  }
});

module.exports = router;

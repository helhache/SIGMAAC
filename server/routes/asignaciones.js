const express = require('express');
const router = express.Router();
const db = require('../db');
const { verificarToken, soloAdmin } = require('../middleware/auth');

// GET /api/asignaciones?local_id=X — admin ve todas o filtra por local
router.get('/', verificarToken, soloAdmin, async (req, res) => {
  try {
    const { local_id } = req.query;
    let query = `
      SELECT asi.*, l.nombre AS local_nombre, a.descripcion, a.dinamica,
             a.precio_oferta, a.desde, a.hasta, a.imagen, a.tipo, a.dcto
      FROM asignaciones asi
      INNER JOIN locales l ON l.id = asi.local_id
      INNER JOIN activaciones a ON a.id = asi.activacion_id
      WHERE 1=1
    `;
    const valores = [];

    if (local_id) { query += ' AND asi.local_id = ?'; valores.push(local_id); }
    query += ' ORDER BY l.nombre, a.hasta DESC';

    const [rows] = await db.query(query, valores);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener asignaciones', detalle: err.message });
  }
});

// POST /api/asignaciones — asignar activación a local
router.post('/', verificarToken, soloAdmin, async (req, res) => {
  const { local_id, activacion_id, precio_personalizado } = req.body;
  if (!local_id || !activacion_id)
    return res.status(400).json({ error: 'local_id y activacion_id son requeridos' });

  try {
    await db.query(
      `INSERT INTO asignaciones (local_id, activacion_id, precio_personalizado)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE activa = 1, precio_personalizado = VALUES(precio_personalizado)`,
      [local_id, activacion_id, precio_personalizado || null]
    );
    res.status(201).json({ mensaje: 'Activación asignada al local' });
  } catch (err) {
    res.status(500).json({ error: 'Error al asignar activación', detalle: err.message });
  }
});

// POST /api/asignaciones/bulk — asignación masiva (varios locales × varias activaciones)
router.post('/bulk', verificarToken, soloAdmin, async (req, res) => {
  const { local_ids, activacion_ids, precio_personalizado } = req.body;
  if (!local_ids?.length || !activacion_ids?.length)
    return res.status(400).json({ error: 'Debés seleccionar al menos un local y una activación' });

  let insertadas = 0;
  for (const lid of local_ids) {
    for (const aid of activacion_ids) {
      try {
        await db.query(
          `INSERT INTO asignaciones (local_id, activacion_id, precio_personalizado)
           VALUES (?, ?, ?)
           ON DUPLICATE KEY UPDATE activa = 1, precio_personalizado = VALUES(precio_personalizado)`,
          [lid, aid, precio_personalizado || null]
        );
        insertadas++;
      } catch {}
    }
  }
  res.status(201).json({ mensaje: `${insertadas} asignaciones procesadas` });
});

// PUT /api/asignaciones/:id — actualizar precio personalizado o activar/desactivar
router.put('/:id', verificarToken, async (req, res) => {
  const { precio_personalizado, activa } = req.body;
  const esAdmin = req.usuario.rol === 'ADMIN';

  try {
    // Local solo puede cambiar precio_personalizado de sus propias asignaciones
    if (!esAdmin) {
      const [rows] = await db.query(
        'SELECT * FROM asignaciones WHERE id = ? AND local_id = ?',
        [req.params.id, req.usuario.local_id]
      );
      if (rows.length === 0)
        return res.status(403).json({ error: 'No tenés permiso para modificar esta asignación' });
    }

    const campos = [];
    const valores = [];

    if (precio_personalizado !== undefined) {
      campos.push('precio_personalizado = ?');
      valores.push(precio_personalizado || null);
    }
    if (activa !== undefined && esAdmin) {
      campos.push('activa = ?');
      valores.push(activa ? 1 : 0);
    }

    if (campos.length === 0) return res.status(400).json({ error: 'Nada para actualizar' });

    valores.push(req.params.id);
    await db.query(`UPDATE asignaciones SET ${campos.join(', ')} WHERE id = ?`, valores);
    res.json({ mensaje: 'Asignación actualizada' });
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar asignación', detalle: err.message });
  }
});

// DELETE /api/asignaciones/:id — quitar asignación (solo ADMIN)
router.delete('/:id', verificarToken, soloAdmin, async (req, res) => {
  try {
    await db.query('UPDATE asignaciones SET activa = 0 WHERE id = ?', [req.params.id]);
    res.json({ mensaje: 'Asignación desactivada' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar asignación', detalle: err.message });
  }
});

// GET /api/asignaciones/log — tabla de descargas para admin
router.get('/log', verificarToken, soloAdmin, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT ld.*, l.nombre AS local_nombre, a.descripcion AS activacion
       FROM log_descargas ld
       LEFT JOIN locales l ON l.id = ld.local_id
       LEFT JOIN activaciones a ON a.id = ld.activacion_id
       ORDER BY ld.descargado_at DESC
       LIMIT 200`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener log', detalle: err.message });
  }
});

// POST /api/asignaciones/log — registrar descarga
router.post('/log', verificarToken, async (req, res) => {
  const { activacion_id, tipo_cartel, formato } = req.body;
  try {
    await db.query(
      'INSERT INTO log_descargas (usuario_id, local_id, activacion_id, tipo_cartel, formato) VALUES (?, ?, ?, ?, ?)',
      [req.usuario.id, req.usuario.local_id || null, activacion_id || null, tipo_cartel || null, formato || null]
    );
    res.status(201).json({ mensaje: 'Descarga registrada' });
  } catch (err) {
    res.status(500).json({ error: 'Error al registrar descarga', detalle: err.message });
  }
});

module.exports = router;

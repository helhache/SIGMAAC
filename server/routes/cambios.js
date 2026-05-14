const express = require('express');
const router = express.Router();
const db = require('../db');
const { verificarToken, soloRoles } = require('../middleware/auth');

// GET /api/cambios/motivos — lista de motivos (01 al 11)
router.get('/motivos', verificarToken, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM motivos_cambio ORDER BY id');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener motivos', detalle: err.message });
  }
});

// GET /api/cambios — filtrado por rol
router.get('/', verificarToken, async (req, res) => {
  const { rol, id: usuarioId } = req.usuario;
  try {
    let query = `
      SELECT c.*, l.nombre AS local_nombre,
             r.nombre AS repositor_nombre, r.apellido AS repositor_apellido,
             r.numero_vendedor
      FROM cambios c
      JOIN locales l ON l.id = c.local_id
      JOIN repositores r ON r.id = c.repositor_id
    `;
    const params = [];

    if (rol === 'REPOSITOR') {
      const [[repo]] = await db.query('SELECT id FROM repositores WHERE usuario_id = ?', [usuarioId]);
      if (!repo) return res.json([]);
      query += ' WHERE c.repositor_id = ?';
      params.push(repo.id);
    } else if (rol === 'LOCAL') {
      const [locales] = await db.query(
        'SELECT local_id FROM usuarios_locales WHERE usuario_id = ?', [usuarioId]
      );
      if (locales.length === 0) return res.json([]);
      const ids = locales.map(l => l.local_id);
      query += ` WHERE c.local_id IN (${ids.map(() => '?').join(',')})`;
      params.push(...ids);
    }

    query += ' ORDER BY c.fecha DESC, c.creado_at DESC';
    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener cambios', detalle: err.message });
  }
});

// GET /api/cambios/:id — con sus items
router.get('/:id', verificarToken, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT c.*, l.nombre AS local_nombre, r.nombre AS repositor_nombre, r.numero_vendedor
       FROM cambios c
       JOIN locales l ON l.id = c.local_id
       JOIN repositores r ON r.id = c.repositor_id
       WHERE c.id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Cambio no encontrado' });

    const [items] = await db.query(
      `SELECT ci.*, pr.nombre AS producto_nombre, pr.codigo_venta,
              mc.descripcion AS motivo_descripcion
       FROM cambio_items ci
       JOIN productos pr ON pr.id = ci.producto_id
       JOIN motivos_cambio mc ON mc.id = ci.motivo_id
       WHERE ci.cambio_id = ?`,
      [req.params.id]
    );
    res.json({ ...rows[0], items });
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener cambio', detalle: err.message });
  }
});

// POST /api/cambios — REPOSITOR registra un cambio
// Body: { local_id, fecha, notas, items: [{producto_id, cantidad, motivo_id, fecha_vencimiento, etiquetas_requeridas}] }
router.post('/', verificarToken, soloRoles(['ADMIN', 'REPOSITOR']), async (req, res) => {
  const { local_id, fecha, notas, items } = req.body;
  if (!local_id || !fecha)
    return res.status(400).json({ error: 'local_id y fecha son requeridos' });
  if (!Array.isArray(items) || items.length === 0)
    return res.status(400).json({ error: 'El cambio debe tener al menos un item' });

  try {
    const [[repo]] = await db.query('SELECT id, numero_vendedor FROM repositores WHERE usuario_id = ?', [req.usuario.id]);
    if (!repo && req.usuario.rol !== 'ADMIN')
      return res.status(400).json({ error: 'Usuario no tiene perfil de repositor' });

    const repositor_id = repo?.id || null;
    const numero_vendedor = repo?.numero_vendedor || 'ADMIN';

    const [result] = await db.query(
      `INSERT INTO cambios (repositor_id, local_id, numero_vendedor, fecha, notas)
       VALUES (?, ?, ?, ?, ?)`,
      [repositor_id, local_id, numero_vendedor, fecha, notas || null]
    );
    const cambioId = result.insertId;

    for (const item of items) {
      await db.query(
        `INSERT INTO cambio_items (cambio_id, producto_id, cantidad, motivo_id, fecha_vencimiento, etiquetas_requeridas)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [cambioId, item.producto_id, item.cantidad, item.motivo_id,
         item.fecha_vencimiento || null, item.etiquetas_requeridas || 0]
      );
    }

    res.status(201).json({ id: cambioId });
  } catch (err) {
    res.status(500).json({ error: 'Error al registrar cambio', detalle: err.message });
  }
});

// PUT /api/cambios/:id/estado — ADMIN aprueba/rechaza + nota al repositor
router.put('/:id/estado', verificarToken, soloRoles(['ADMIN']), async (req, res) => {
  const { estado, nota_admin } = req.body;
  const estadosValidos = ['pendiente', 'aprobado', 'procesado', 'rechazado'];
  if (!estadosValidos.includes(estado))
    return res.status(400).json({ error: `Estado inválido. Valores: ${estadosValidos.join(', ')}` });
  try {
    const campos = ['estado = ?'];
    const valores = [estado];
    if (nota_admin !== undefined) { campos.push('nota_admin = ?'); valores.push(nota_admin); }
    valores.push(req.params.id);
    await db.query(`UPDATE cambios SET ${campos.join(', ')} WHERE id = ?`, valores);
    res.json({ mensaje: 'Estado de cambio actualizado' });
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar estado', detalle: err.message });
  }
});

// PATCH /api/cambios/:id/reclamar — repositor re-envía al admin
router.patch('/:id/reclamar', verificarToken, soloRoles(['REPOSITOR']), async (req, res) => {
  try {
    const [[cambio]] = await db.query('SELECT * FROM cambios WHERE id = ?', [req.params.id]);
    if (!cambio) return res.status(404).json({ error: 'Cambio no encontrado' });
    const [[repo]] = await db.query('SELECT id FROM repositores WHERE usuario_id = ?', [req.usuario.id]);
    if (!repo || cambio.repositor_id !== repo.id)
      return res.status(403).json({ error: 'No autorizado' });
    await db.query('UPDATE cambios SET estado = ? WHERE id = ?', ['pendiente', req.params.id]);
    res.json({ mensaje: 'Cambio reclamado y re-enviado al admin' });
  } catch (err) {
    res.status(500).json({ error: 'Error al reclamar', detalle: err.message });
  }
});

// PATCH /api/cambios/:id/cancelar
router.patch('/:id/cancelar', verificarToken, soloRoles(['REPOSITOR']), async (req, res) => {
  try {
    const [[cambio]] = await db.query('SELECT * FROM cambios WHERE id = ?', [req.params.id]);
    if (!cambio) return res.status(404).json({ error: 'Cambio no encontrado' });
    const [[repo]] = await db.query('SELECT id FROM repositores WHERE usuario_id = ?', [req.usuario.id]);
    if (!repo || cambio.repositor_id !== repo.id)
      return res.status(403).json({ error: 'No autorizado' });
    await db.query('UPDATE cambios SET estado = ? WHERE id = ?', ['cancelado', req.params.id]);
    res.json({ mensaje: 'Cambio cancelado' });
  } catch (err) {
    res.status(500).json({ error: 'Error al cancelar', detalle: err.message });
  }
});

// DELETE /api/cambios/:id
router.delete('/:id', verificarToken, soloRoles(['REPOSITOR', 'ADMIN']), async (req, res) => {
  try {
    const [[cambio]] = await db.query('SELECT * FROM cambios WHERE id = ?', [req.params.id]);
    if (!cambio) return res.status(404).json({ error: 'Cambio no encontrado' });
    if (req.usuario.rol === 'REPOSITOR') {
      const [[repo]] = await db.query('SELECT id FROM repositores WHERE usuario_id = ?', [req.usuario.id]);
      if (!repo || cambio.repositor_id !== repo.id)
        return res.status(403).json({ error: 'No autorizado' });
    }
    await db.query('DELETE FROM cambios WHERE id = ?', [req.params.id]);
    res.json({ mensaje: 'Cambio eliminado' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar', detalle: err.message });
  }
});

module.exports = router;

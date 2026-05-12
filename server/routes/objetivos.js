const express = require('express');
const router = express.Router();
const db = require('../db');
const { verificarToken, soloRoles } = require('../middleware/auth');

// GET /api/objetivos — todos los roles pueden ver
router.get('/', verificarToken, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT * FROM objetivos WHERE activo = 1 ORDER BY fecha_inicio DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener objetivos', detalle: err.message });
  }
});

// GET /api/objetivos/:id — con sus SKUs
router.get('/:id', verificarToken, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM objetivos WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Objetivo no encontrado' });

    const [skus] = await db.query(
      `SELECT os.*, p.nombre AS producto_nombre, p.codigo_venta, p.ean
       FROM objetivo_skus os
       JOIN productos p ON p.id = os.producto_id
       WHERE os.objetivo_id = ?`,
      [req.params.id]
    );
    res.json({ ...rows[0], skus });
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener objetivo', detalle: err.message });
  }
});

// POST /api/objetivos — solo ADMIN
router.post('/', verificarToken, soloRoles(['ADMIN']), async (req, res) => {
  const { periodo, fecha_inicio, fecha_fin, volumen_objetivo, unit_general, descripcion, skus } = req.body;
  if (!periodo || !fecha_inicio || !fecha_fin || !volumen_objetivo)
    return res.status(400).json({ error: 'periodo, fecha_inicio, fecha_fin y volumen_objetivo son requeridos' });

  try {
    const [result] = await db.query(
      `INSERT INTO objetivos (periodo, fecha_inicio, fecha_fin, volumen_objetivo, unit_general, descripcion)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [periodo, fecha_inicio, fecha_fin, volumen_objetivo, unit_general || 1.7, descripcion || null]
    );
    const objetivoId = result.insertId;

    if (Array.isArray(skus) && skus.length > 0) {
      for (const sku of skus) {
        await db.query(
          `INSERT INTO objetivo_skus (objetivo_id, producto_id, volumen_objetivo, sovi_objetivo)
           VALUES (?, ?, ?, ?)`,
          [objetivoId, sku.producto_id, sku.volumen_objetivo, sku.sovi_objetivo || null]
        );
      }
    }

    res.status(201).json({ id: objetivoId });
  } catch (err) {
    res.status(500).json({ error: 'Error al crear objetivo', detalle: err.message });
  }
});

// PUT /api/objetivos/:id — solo ADMIN
router.put('/:id', verificarToken, soloRoles(['ADMIN']), async (req, res) => {
  const { volumen_objetivo, unit_general, descripcion, activo } = req.body;
  try {
    const campos = [];
    const valores = [];
    if (volumen_objetivo !== undefined) { campos.push('volumen_objetivo = ?'); valores.push(volumen_objetivo); }
    if (unit_general !== undefined) { campos.push('unit_general = ?'); valores.push(unit_general); }
    if (descripcion !== undefined) { campos.push('descripcion = ?'); valores.push(descripcion); }
    if (activo !== undefined) { campos.push('activo = ?'); valores.push(activo ? 1 : 0); }
    if (campos.length === 0) return res.status(400).json({ error: 'Nada para actualizar' });
    valores.push(req.params.id);
    await db.query(`UPDATE objetivos SET ${campos.join(', ')} WHERE id = ?`, valores);
    res.json({ mensaje: 'Objetivo actualizado' });
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar objetivo', detalle: err.message });
  }
});

// DELETE /api/objetivos/:id — soft delete, solo ADMIN
router.delete('/:id', verificarToken, soloRoles(['ADMIN']), async (req, res) => {
  try {
    await db.query('UPDATE objetivos SET activo = 0 WHERE id = ?', [req.params.id]);
    res.json({ mensaje: 'Objetivo desactivado' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar objetivo', detalle: err.message });
  }
});

module.exports = router;

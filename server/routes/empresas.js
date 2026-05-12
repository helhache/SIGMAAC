const express = require('express');
const router = express.Router();
const db = require('../db');
const { verificarToken, soloAdmin } = require('../middleware/auth');

// GET /api/empresas — ADMIN y GERENTE pueden ver
router.get('/', verificarToken, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT e.*, COUNT(l.id) AS total_locales
       FROM empresas e
       LEFT JOIN locales l ON l.empresa_id = e.id AND l.activo = 1
       WHERE e.activo = 1
       GROUP BY e.id
       ORDER BY e.nombre`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener empresas', detalle: err.message });
  }
});

// GET /api/empresas/:id
router.get('/:id', verificarToken, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM empresas WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Empresa no encontrada' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener empresa', detalle: err.message });
  }
});

// POST /api/empresas — solo ADMIN
router.post('/', verificarToken, soloAdmin, async (req, res) => {
  const { nombre, tipo } = req.body;
  if (!nombre) return res.status(400).json({ error: 'nombre es requerido' });
  try {
    const [result] = await db.query(
      'INSERT INTO empresas (nombre, tipo) VALUES (?, ?)',
      [nombre, tipo || 'regional']
    );
    res.status(201).json({ id: result.insertId, nombre, tipo: tipo || 'regional' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY')
      return res.status(409).json({ error: 'Ya existe una empresa con ese nombre' });
    res.status(500).json({ error: 'Error al crear empresa', detalle: err.message });
  }
});

// PUT /api/empresas/:id — solo ADMIN
router.put('/:id', verificarToken, soloAdmin, async (req, res) => {
  const { nombre, tipo, activo } = req.body;
  try {
    const campos = [];
    const valores = [];
    if (nombre !== undefined) { campos.push('nombre = ?'); valores.push(nombre); }
    if (tipo !== undefined) { campos.push('tipo = ?'); valores.push(tipo); }
    if (activo !== undefined) { campos.push('activo = ?'); valores.push(activo ? 1 : 0); }
    if (campos.length === 0) return res.status(400).json({ error: 'Nada para actualizar' });
    valores.push(req.params.id);
    await db.query(`UPDATE empresas SET ${campos.join(', ')} WHERE id = ?`, valores);
    res.json({ mensaje: 'Empresa actualizada' });
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar empresa', detalle: err.message });
  }
});

// DELETE /api/empresas/:id — soft delete, solo ADMIN
router.delete('/:id', verificarToken, soloAdmin, async (req, res) => {
  try {
    await db.query('UPDATE empresas SET activo = 0 WHERE id = ?', [req.params.id]);
    res.json({ mensaje: 'Empresa desactivada' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar empresa', detalle: err.message });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const db = require('../db');
const { verificarToken, soloAdmin } = require('../middleware/auth');

// GET /api/productos — cualquier usuario autenticado
router.get('/', verificarToken, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM productos ORDER BY nombre');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener productos', detalle: err.message });
  }
});

// GET /api/productos/:id
router.get('/:id', verificarToken, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM productos WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener producto', detalle: err.message });
  }
});

// POST /api/productos — solo ADMIN
router.post('/', verificarToken, soloAdmin, async (req, res) => {
  const { ean, codigo_venta, nombre, descripcion, unidades_por_bulto, packs_por_corte, unidades_por_pale, precio_sugerido, unit_value, sovi_requerido } = req.body;
  if (!ean || !nombre) return res.status(400).json({ error: 'EAN y nombre son requeridos' });
  try {
    const [result] = await db.query(
      `INSERT INTO productos (ean, codigo_venta, nombre, descripcion, unidades_por_bulto, packs_por_corte, unidades_por_pale, precio_sugerido, unit_value, sovi_requerido)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [ean, codigo_venta || null, nombre, descripcion || null,
       unidades_por_bulto || null, packs_por_corte || null, unidades_por_pale || null,
       precio_sugerido || null, unit_value || null, sovi_requerido || null]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Ya existe un producto con ese EAN' });
    res.status(500).json({ error: 'Error al crear producto', detalle: err.message });
  }
});

// PUT /api/productos/:id — solo ADMIN (actualizar campos o toggle activo)
router.put('/:id', verificarToken, soloAdmin, async (req, res) => {
  const { ean, codigo_venta, nombre, descripcion, unidades_por_bulto, packs_por_corte, unidades_por_pale, precio_sugerido, unit_value, sovi_requerido, activo } = req.body;
  try {
    const campos = [];
    const valores = [];
    if (ean !== undefined)               { campos.push('ean = ?');               valores.push(ean); }
    if (codigo_venta !== undefined)      { campos.push('codigo_venta = ?');      valores.push(codigo_venta); }
    if (nombre !== undefined)            { campos.push('nombre = ?');            valores.push(nombre); }
    if (descripcion !== undefined)       { campos.push('descripcion = ?');       valores.push(descripcion); }
    if (unidades_por_bulto !== undefined){ campos.push('unidades_por_bulto = ?');valores.push(unidades_por_bulto); }
    if (packs_por_corte !== undefined)   { campos.push('packs_por_corte = ?');   valores.push(packs_por_corte); }
    if (unidades_por_pale !== undefined) { campos.push('unidades_por_pale = ?'); valores.push(unidades_por_pale); }
    if (precio_sugerido !== undefined)   { campos.push('precio_sugerido = ?');   valores.push(precio_sugerido); }
    if (unit_value !== undefined)        { campos.push('unit_value = ?');        valores.push(unit_value); }
    if (sovi_requerido !== undefined)    { campos.push('sovi_requerido = ?');    valores.push(sovi_requerido); }
    if (activo !== undefined)            { campos.push('activo = ?');            valores.push(activo ? 1 : 0); }
    if (campos.length === 0) return res.status(400).json({ error: 'Nada para actualizar' });
    valores.push(req.params.id);
    await db.query(`UPDATE productos SET ${campos.join(', ')} WHERE id = ?`, valores);
    res.json({ mensaje: 'Producto actualizado' });
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar producto', detalle: err.message });
  }
});

module.exports = router;

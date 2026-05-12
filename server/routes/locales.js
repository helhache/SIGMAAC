const express = require('express');
const router = express.Router();
const multer = require('multer');
const db = require('../db');
const { verificarToken, soloAdmin } = require('../middleware/auth');
const { storageLogo } = require('../cloudinary');

const upload = multer({ storage: storageLogo, limits: { fileSize: 5 * 1024 * 1024 } });

// GET /api/locales — público (el login necesita saber los locales para el formulario de usuario)
// ?empresa_id=X filtra por empresa
router.get('/', async (req, res) => {
  try {
    const { empresa_id } = req.query;
    let query = 'SELECT * FROM locales WHERE activo = 1';
    const params = [];
    if (empresa_id) { query += ' AND empresa_id = ?'; params.push(empresa_id); }
    query += ' ORDER BY nombre';
    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener locales', detalle: err.message });
  }
});

// GET /api/locales/:id
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM locales WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Local no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener local', detalle: err.message });
  }
});

// POST /api/locales — solo ADMIN
router.post('/', verificarToken, soloAdmin, upload.single('logo'), async (req, res) => {
  try {
    const { nombre, empresa_id } = req.body;
    const logo = req.file ? req.file.path : null;

    // Si no viene empresa_id, usar la empresa 1 (o crearla si no existe)
    let empId = empresa_id || 1;
    const [[emp]] = await db.query('SELECT id FROM empresas WHERE id = ?', [empId]);
    if (!emp) {
      const [r] = await db.query(
        "INSERT INTO empresas (nombre, tipo) VALUES ('Principal', 'regional')"
      );
      empId = r.insertId;
    }

    const [result] = await db.query(
      'INSERT INTO locales (nombre, logo, empresa_id) VALUES (?, ?, ?)',
      [nombre, logo, empId]
    );
    const [rows] = await db.query('SELECT * FROM locales WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(400).json({ error: 'Error al crear local', detalle: err.message });
  }
});

// PUT /api/locales/:id — solo ADMIN
router.put('/:id', verificarToken, soloAdmin, upload.single('logo'), async (req, res) => {
  try {
    const { nombre } = req.body;
    const campos = ['nombre = ?'];
    const valores = [nombre];

    if (req.file) {
      campos.push('logo = ?');
      valores.push(req.file.path);
    }

    valores.push(req.params.id);
    await db.query(`UPDATE locales SET ${campos.join(', ')} WHERE id = ?`, valores);
    const [rows] = await db.query('SELECT * FROM locales WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(400).json({ error: 'Error al actualizar local', detalle: err.message });
  }
});

// DELETE /api/locales/:id — solo ADMIN (soft delete)
router.delete('/:id', verificarToken, soloAdmin, async (req, res) => {
  try {
    await db.query('UPDATE locales SET activo = 0 WHERE id = ?', [req.params.id]);
    res.json({ mensaje: 'Local desactivado' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar local', detalle: err.message });
  }
});

module.exports = router;

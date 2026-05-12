const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');
const db = require('../db');
const { verificarToken, soloAdmin } = require('../middleware/auth');
const { storageActivacion } = require('../cloudinary');

const uploadImg = multer({ storage: storageActivacion, limits: { fileSize: 10 * 1024 * 1024 } });

// Multer para Excel — sigue usando disco local (archivo temporal que se borra después)
const storageExcel = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `excel_${Date.now()}${path.extname(file.originalname)}`);
  },
});
const uploadExcel = multer({ storage: storageExcel });

// Convierte número serial de Excel a fecha JS
function excelFechaADate(serial) {
  const epoch = new Date(Date.UTC(1899, 11, 30));
  return new Date(epoch.getTime() + serial * 86400000);
}

function formatDate(d) {
  return d.toISOString().split('T')[0];
}

// GET /api/activaciones — admin ve todas; local ve las suyas; gerente/repositor pueden filtrar por ?local_id=
router.get('/', verificarToken, async (req, res) => {
  try {
    let rows;
    const { rol } = req.usuario;

    if (rol === 'ADMIN' || rol === 'GERENTE') {
      if (req.query.local_id) {
        // Filtrar por local específico
        [rows] = await db.query(
          `SELECT a.*, asi.precio_personalizado, asi.activa AS asignada_activa, asi.local_id
           FROM activaciones a
           INNER JOIN asignaciones asi ON asi.activacion_id = a.id
           WHERE asi.local_id = ? AND asi.activa = 1 AND a.activo = 1
           ORDER BY a.hasta DESC`,
          [req.query.local_id]
        );
      } else {
        [rows] = await db.query(
          'SELECT * FROM activaciones WHERE activo = 1 ORDER BY hasta DESC, descripcion'
        );
      }
    } else if (rol === 'REPOSITOR') {
      const localId = req.query.local_id;
      if (!localId) { rows = []; }
      else {
        [rows] = await db.query(
          `SELECT a.*, asi.precio_personalizado, asi.activa AS asignada_activa, asi.local_id
           FROM activaciones a
           INNER JOIN asignaciones asi ON asi.activacion_id = a.id
           WHERE asi.local_id = ? AND asi.activa = 1 AND a.activo = 1
           ORDER BY a.hasta DESC`,
          [localId]
        );
      }
    } else {
      // LOCAL: busca por sus locales asignados
      const localIds = req.usuario.local_ids?.length
        ? req.usuario.local_ids
        : req.usuario.local_id ? [req.usuario.local_id] : [];

      if (localIds.length === 0) { rows = []; }
      else {
        [rows] = await db.query(
          `SELECT a.*, asi.precio_personalizado, asi.activa AS asignada_activa, asi.local_id
           FROM activaciones a
           INNER JOIN asignaciones asi ON asi.activacion_id = a.id
           WHERE asi.local_id IN (${localIds.map(() => '?').join(',')}) AND asi.activa = 1 AND a.activo = 1
           ORDER BY a.hasta DESC`,
          localIds
        );
      }
    }
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener activaciones', detalle: err.message });
  }
});

// GET /api/activaciones/:id
router.get('/:id', verificarToken, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM activaciones WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Activación no encontrada' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener activación', detalle: err.message });
  }
});

// POST /api/activaciones — solo ADMIN (crear una)
router.post('/', verificarToken, soloAdmin, uploadImg.single('imagen'), async (req, res) => {
  try {
    const { tipo, desde, hasta, ean, descripcion, dinamica, dcto, precio_sugerido, precio_oferta } = req.body;
    const imagen = req.file ? req.file.path : null;

    const [result] = await db.query(
      `INSERT INTO activaciones (tipo, desde, hasta, ean, descripcion, dinamica, dcto, precio_sugerido, precio_oferta, imagen)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [tipo, desde, hasta, ean || null, descripcion, dinamica, dcto || null, precio_sugerido || null, precio_oferta || null, imagen]
    );
    const [rows] = await db.query('SELECT * FROM activaciones WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(400).json({ error: 'Error al crear activación', detalle: err.message });
  }
});

// PUT /api/activaciones/:id — solo ADMIN
router.put('/:id', verificarToken, soloAdmin, uploadImg.single('imagen'), async (req, res) => {
  try {
    const { tipo, desde, hasta, ean, descripcion, dinamica, dcto, precio_sugerido, precio_oferta, activo } = req.body;
    const campos = [];
    const valores = [];

    if (tipo !== undefined) { campos.push('tipo = ?'); valores.push(tipo); }
    if (desde !== undefined) { campos.push('desde = ?'); valores.push(desde); }
    if (hasta !== undefined) { campos.push('hasta = ?'); valores.push(hasta); }
    if (ean !== undefined) { campos.push('ean = ?'); valores.push(ean || null); }
    if (descripcion !== undefined) { campos.push('descripcion = ?'); valores.push(descripcion); }
    if (dinamica !== undefined) { campos.push('dinamica = ?'); valores.push(dinamica); }
    if (dcto !== undefined) { campos.push('dcto = ?'); valores.push(dcto || null); }
    if (precio_sugerido !== undefined) { campos.push('precio_sugerido = ?'); valores.push(precio_sugerido || null); }
    if (precio_oferta !== undefined) { campos.push('precio_oferta = ?'); valores.push(precio_oferta || null); }
    if (activo !== undefined) { campos.push('activo = ?'); valores.push(activo ? 1 : 0); }
    if (req.file) { campos.push('imagen = ?'); valores.push(req.file.path); }

    if (campos.length === 0) return res.status(400).json({ error: 'Nada para actualizar' });

    valores.push(req.params.id);
    await db.query(`UPDATE activaciones SET ${campos.join(', ')} WHERE id = ?`, valores);
    const [rows] = await db.query('SELECT * FROM activaciones WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar activación', detalle: err.message });
  }
});

// DELETE /api/activaciones/:id — solo ADMIN
router.delete('/:id', verificarToken, soloAdmin, async (req, res) => {
  try {
    await db.query('UPDATE activaciones SET activo = 0 WHERE id = ?', [req.params.id]);
    res.json({ mensaje: 'Activación desactivada' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar activación', detalle: err.message });
  }
});

// POST /api/activaciones/importar-excel — solo ADMIN
router.post('/importar-excel', verificarToken, soloAdmin, uploadExcel.single('excel'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No se recibió ningún archivo' });

  try {
    const wb = XLSX.readFile(req.file.path);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const filas = XLSX.utils.sheet_to_json(ws, { header: 1 });

    // Buscar la fila de encabezados (la que tiene "EAN" o "Descripcion")
    let headerIdx = filas.findIndex(r =>
      r.some(c => typeof c === 'string' && c.toLowerCase().includes('descripci'))
    );
    if (headerIdx === -1) headerIdx = 1;

    const datos = filas.slice(headerIdx + 1).filter(r => r.length >= 5 && r[4]);

    let insertadas = 0;
    let omitidas = 0;

    for (const fila of datos) {
      const [tipo, desde, hasta, ean, descripcion, dinamica, dcto, precioSugerido, precioOferta] = fila;

      if (!descripcion) continue;

      const desdeDate = typeof desde === 'number' ? formatDate(excelFechaADate(desde)) : desde;
      const hastaDate = typeof hasta === 'number' ? formatDate(excelFechaADate(hasta)) : hasta;

      try {
        await db.query(
          `INSERT INTO activaciones (tipo, desde, hasta, ean, descripcion, dinamica, dcto, precio_sugerido, precio_oferta)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            tipo || 'Mensual',
            desdeDate,
            hastaDate,
            ean || null,
            String(descripcion).trim(),
            dinamica || null,
            dcto != null ? parseFloat(dcto) : null,
            precioSugerido != null ? parseFloat(precioSugerido) : null,
            precioOferta != null ? parseFloat(precioOferta) : null,
          ]
        );
        insertadas++;
      } catch {
        omitidas++;
      }
    }

    // Limpiar archivo temporal
    fs.unlink(req.file.path, () => {});

    res.json({ mensaje: `Importación completada`, insertadas, omitidas });
  } catch (err) {
    res.status(500).json({ error: 'Error al procesar el Excel', detalle: err.message });
  }
});

module.exports = router;

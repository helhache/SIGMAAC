const express = require('express');
const router = express.Router();
const db = require('../db');
const { verificarToken, soloRoles } = require('../middleware/auth');

const adminOGerente = soloRoles(['ADMIN']);

// GET /api/repositores — solo ADMIN
router.get('/', verificarToken, adminOGerente, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT r.*, u.username, u.activo AS usuario_activo, u.ultimo_login,
              GROUP_CONCAT(l.nombre ORDER BY l.nombre SEPARATOR ', ') AS locales_asignados
       FROM repositores r
       JOIN usuarios u ON u.id = r.usuario_id
       LEFT JOIN repositores_locales rl ON rl.repositor_id = r.id
       LEFT JOIN locales l ON l.id = rl.local_id
       WHERE r.activo = 1
       GROUP BY r.id
       ORDER BY r.apellido, r.nombre`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener repositores', detalle: err.message });
  }
});

// GET /api/repositores/me/resumen — dashboard del repositor
router.get('/me/resumen', verificarToken, soloRoles(['REPOSITOR']), async (req, res) => {
  try {
    const [[repo]] = await db.query('SELECT * FROM repositores WHERE usuario_id = ?', [req.usuario.id]);
    if (!repo) return res.status(404).json({ error: 'Repositor no encontrado' });

    const [locales] = await db.query(
      `SELECT l.id, l.nombre FROM repositores_locales rl
       JOIN locales l ON l.id = rl.local_id WHERE rl.repositor_id = ?`, [repo.id]
    );

    const hoy = new Date();
    const anio = hoy.getFullYear();
    const mes = hoy.getMonth() + 1;
    const inicioMes = `${anio}-${String(mes).padStart(2,'0')}-01`;
    const diasMes = new Date(anio, mes, 0).getDate();
    const finMes = `${anio}-${String(mes).padStart(2,'0')}-${diasMes}`;
    const inicioAnio = `${anio}-01-01`;
    const finAnio = `${anio}-12-31`;

    const localesData = await Promise.all(locales.map(async l => {
      const [[{ vol_mes }]] = await db.query(
        `SELECT COALESCE(SUM(CASE WHEN total_volumen > 0 THEN total_volumen ELSE total_bultos END), 0) AS vol_mes
         FROM pedidos WHERE local_id = ? AND fecha_pedido BETWEEN ? AND ? AND estado IN ('confirmado','en_transito','entregado')`,
        [l.id, inicioMes, finMes]
      );
      const [[{ vol_anio }]] = await db.query(
        `SELECT COALESCE(SUM(CASE WHEN total_volumen > 0 THEN total_volumen ELSE total_bultos END), 0) AS vol_anio
         FROM pedidos WHERE local_id = ? AND fecha_pedido BETWEEN ? AND ? AND estado IN ('confirmado','en_transito','entregado')`,
        [l.id, inicioAnio, finAnio]
      );
      const [[{ pedidos_mes }]] = await db.query(
        `SELECT COUNT(*) AS pedidos_mes FROM pedidos WHERE local_id = ? AND fecha_pedido BETWEEN ? AND ?`,
        [l.id, inicioMes, finMes]
      );
      const [[obj_local]] = await db.query(
        `SELECT ol.volumen_objetivo FROM objetivo_locales ol
         JOIN objetivos o ON o.id = ol.objetivo_id
         WHERE ol.local_id = ? AND o.fecha_inicio <= ? AND o.fecha_fin >= ? AND o.activo = 1
         ORDER BY o.periodo ASC LIMIT 1`,
        [l.id, finMes, inicioMes]
      );
      return { ...l, vol_mes: parseFloat(vol_mes), vol_anio: parseFloat(vol_anio), pedidos_mes: parseInt(pedidos_mes), volumen_objetivo_local: obj_local ? parseFloat(obj_local.volumen_objetivo) : 0 };
    }));

    res.json({ repositor: repo, locales: localesData });
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener resumen', detalle: err.message });
  }
});

// GET /api/repositores/me/tareas
router.get('/me/tareas', verificarToken, soloRoles(['REPOSITOR']), async (req, res) => {
  try {
    const [[repo]] = await db.query('SELECT id FROM repositores WHERE usuario_id = ?', [req.usuario.id]);
    if (!repo) return res.json([]);
    const [rows] = await db.query('SELECT * FROM tareas WHERE repositor_id = ? ORDER BY creado_at DESC', [repo.id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener tareas', detalle: err.message });
  }
});

// GET /api/repositores/:id
router.get('/:id', verificarToken, adminOGerente, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT r.*, u.username
       FROM repositores r
       JOIN usuarios u ON u.id = r.usuario_id
       WHERE r.id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Repositor no encontrado' });

    const [locales] = await db.query(
      `SELECT l.id, l.nombre FROM repositores_locales rl
       JOIN locales l ON l.id = rl.local_id
       WHERE rl.repositor_id = ?`,
      [req.params.id]
    );
    res.json({ ...rows[0], locales });
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener repositor', detalle: err.message });
  }
});

// POST /api/repositores — solo ADMIN
// Crea el perfil de repositor vinculado a un usuario_id existente
router.post('/', verificarToken, soloRoles(['ADMIN']), async (req, res) => {
  const { usuario_id, nombre, apellido, numero_vendedor } = req.body;
  if (!usuario_id || !nombre || !apellido || !numero_vendedor)
    return res.status(400).json({ error: 'usuario_id, nombre, apellido y numero_vendedor son requeridos' });
  try {
    const [result] = await db.query(
      'INSERT INTO repositores (usuario_id, nombre, apellido, numero_vendedor) VALUES (?, ?, ?, ?)',
      [usuario_id, nombre, apellido, numero_vendedor]
    );
    res.status(201).json({ id: result.insertId, usuario_id, nombre, apellido, numero_vendedor });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY')
      return res.status(409).json({ error: 'Ya existe un repositor con ese número de vendedor o usuario' });
    res.status(500).json({ error: 'Error al crear repositor', detalle: err.message });
  }
});

// PUT /api/repositores/:id — solo ADMIN
router.put('/:id', verificarToken, soloRoles(['ADMIN']), async (req, res) => {
  const { nombre, apellido, numero_vendedor, activo, objetivo_semanal } = req.body;
  try {
    const campos = [];
    const valores = [];
    if (nombre !== undefined) { campos.push('nombre = ?'); valores.push(nombre); }
    if (apellido !== undefined) { campos.push('apellido = ?'); valores.push(apellido); }
    if (numero_vendedor !== undefined) { campos.push('numero_vendedor = ?'); valores.push(numero_vendedor); }
    if (activo !== undefined) { campos.push('activo = ?'); valores.push(activo ? 1 : 0); }
    if (objetivo_semanal !== undefined) { campos.push('objetivo_semanal = ?'); valores.push(objetivo_semanal); }
    if (campos.length === 0) return res.status(400).json({ error: 'Nada para actualizar' });
    valores.push(req.params.id);
    await db.query(`UPDATE repositores SET ${campos.join(', ')} WHERE id = ?`, valores);
    res.json({ mensaje: 'Repositor actualizado' });
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar repositor', detalle: err.message });
  }
});

// GET /api/repositores/:id/tareas
router.get('/:id/tareas', verificarToken, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM tareas WHERE repositor_id = ? ORDER BY creado_at DESC',
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener tareas', detalle: err.message });
  }
});

// POST /api/repositores/:id/tareas — solo ADMIN crea tareas
router.post('/:id/tareas', verificarToken, soloRoles(['ADMIN']), async (req, res) => {
  const { tipo, descripcion } = req.body;
  if (!descripcion) return res.status(400).json({ error: 'descripcion es requerida' });
  try {
    const [result] = await db.query(
      'INSERT INTO tareas (repositor_id, tipo, descripcion) VALUES (?, ?, ?)',
      [req.params.id, tipo || 'otro', descripcion]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: 'Error al crear tarea', detalle: err.message });
  }
});

// DELETE /api/repositores/tareas/:tareaId — solo ADMIN elimina tarea
router.delete('/tareas/:tareaId', verificarToken, soloRoles(['ADMIN']), async (req, res) => {
  try {
    await db.query('DELETE FROM tareas WHERE id = ?', [req.params.tareaId]);
    res.json({ mensaje: 'Tarea eliminada' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar tarea', detalle: err.message });
  }
});

// POST /api/repositores/:id/locales — asignar locales a un repositor
router.post('/:id/locales', verificarToken, soloRoles(['ADMIN']), async (req, res) => {
  const { local_ids } = req.body; // array de IDs
  if (!Array.isArray(local_ids)) return res.status(400).json({ error: 'local_ids debe ser un array' });
  try {
    await db.query('DELETE FROM repositores_locales WHERE repositor_id = ?', [req.params.id]);
    for (const local_id of local_ids) {
      await db.query(
        'INSERT INTO repositores_locales (repositor_id, local_id) VALUES (?, ?)',
        [req.params.id, local_id]
      );
    }
    res.json({ mensaje: 'Locales asignados al repositor' });
  } catch (err) {
    res.status(500).json({ error: 'Error al asignar locales', detalle: err.message });
  }
});

module.exports = router;

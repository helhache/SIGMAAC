const express = require('express');
const router = express.Router();
const db = require('../db');
const { verificarToken, soloRoles } = require('../middleware/auth');

// Formatea Date o string a 'YYYY-MM-DD'
function fd(d) {
  if (!d) return null;
  if (d instanceof Date) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
  return String(d).slice(0, 10);
}

// Devuelve date a medianoche local
function medianoche(d) {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}

// Calcula el volumen real dentro del rango de un objetivo.
// Si el admin cargó volumen_real manualmente, lo usa directo (datos históricos).
// Sino, suma total_volumen de pedidos (con fallback a total_bultos × unit_general).
async function calcularProgreso(obj) {
  const hoy = medianoche(new Date());
  const inicio = medianoche(obj.fecha_inicio);
  const fin = medianoche(obj.fecha_fin);
  const unitG = parseFloat(obj.unit_general) || 1.7;

  // ── Volumen manual cargado por el admin ──────────────────────────────────
  if (obj.volumen_real != null && parseFloat(obj.volumen_real) > 0) {
    const volActual = parseFloat(obj.volumen_real);
    const dias_totales = Math.max(1, Math.round((fin - inicio) / 86400000) + 1);
    const dias_transcurridos = hoy > fin ? dias_totales : hoy < inicio ? 0 : Math.round((hoy - inicio) / 86400000) + 1;
    return {
      volumen_actual: volActual,
      porcentaje: obj.volumen_objetivo > 0 ? Math.round((volActual / parseFloat(obj.volumen_objetivo)) * 10000) / 100 : 0,
      dias_totales,
      dias_transcurridos,
      porcentaje_tiempo: Math.round((dias_transcurridos / dias_totales) * 100),
      es_manual: true,
    };
  }

  // ── Cálculo automático desde pedidos ────────────────────────────────────
  const [[{ volumen_actual }]] = await db.query(
    `SELECT COALESCE(SUM(
       CASE WHEN p.total_volumen IS NOT NULL AND p.total_volumen > 0
            THEN p.total_volumen
            ELSE (p.total_bultos * ?)
       END
     ), 0) AS volumen_actual
     FROM pedidos p
     WHERE p.fecha_pedido BETWEEN ? AND ?
       AND p.estado IN ('confirmado', 'en_transito', 'entregado')`,
    [unitG, fd(obj.fecha_inicio), fd(obj.fecha_fin)]
  );

  const dias_totales = Math.max(1, Math.round((fin - inicio) / 86400000) + 1);
  let dias_transcurridos;
  if (hoy > fin)        dias_transcurridos = dias_totales;
  else if (hoy < inicio) dias_transcurridos = 0;
  else                   dias_transcurridos = Math.round((hoy - inicio) / 86400000) + 1;

  const volActual = parseFloat(volumen_actual) || 0;
  const porcentaje = obj.volumen_objetivo > 0
    ? Math.round((volActual / parseFloat(obj.volumen_objetivo)) * 10000) / 100
    : 0;

  return {
    volumen_actual: volActual,
    porcentaje,
    dias_totales,
    dias_transcurridos,
    porcentaje_tiempo: Math.round((dias_transcurridos / dias_totales) * 100),
    es_manual: false,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/objetivos/progreso
// Devuelve objetivos activos con volumen real calculado de pedidos.
// Repositores y Locales solo ven los que tienen visible_repositores = 1.
// El anual incluye volumen_no_obtenido y detalle de meses.
// ─────────────────────────────────────────────────────────────────────────────
router.get('/progreso', verificarToken, async (req, res) => {
  try {
    const { rol } = req.usuario;

    let query = 'SELECT * FROM objetivos WHERE activo = 1';
    if (rol === 'REPOSITOR' || rol === 'LOCAL') {
      query += ' AND visible_repositores = 1';
    }
    query += ' ORDER BY fecha_inicio DESC';

    const [objetivos] = await db.query(query);

    const resultado = await Promise.all(objetivos.map(async (obj) => {
      const progreso = await calcularProgreso(obj);
      return {
        id: obj.id,
        periodo: obj.periodo,
        descripcion: obj.descripcion,
        fecha_inicio: fd(obj.fecha_inicio),
        fecha_fin: fd(obj.fecha_fin),
        volumen_objetivo: parseFloat(obj.volumen_objetivo),
        unit_general: parseFloat(obj.unit_general),
        visible_repositores: obj.visible_repositores,
        visible_volumen: obj.visible_volumen,
        visible_porcentaje: obj.visible_porcentaje,
        ...progreso,
      };
    }));

    // Para los objetivos anuales: agregar volumen_no_obtenido y detalle mensual
    for (const obj of resultado) {
      if (obj.periodo !== 'anual') continue;

      const [mensuales] = await db.query(
        `SELECT * FROM objetivos
         WHERE activo = 1 AND periodo = 'mensual'
           AND fecha_inicio >= ? AND fecha_fin <= ?
         ORDER BY fecha_inicio ASC`,
        [obj.fecha_inicio, obj.fecha_fin]
      );

      const hoy = medianoche(new Date());
      let volumen_no_obtenido = 0;

      const meses_detalle = await Promise.all(mensuales.map(async (mes) => {
        const finMes = medianoche(mes.fecha_fin);
        const prog = await calcularProgreso(mes);
        const completado = finMes < hoy;

        if (completado && prog.volumen_actual < parseFloat(mes.volumen_objetivo)) {
          volumen_no_obtenido += parseFloat(mes.volumen_objetivo) - prog.volumen_actual;
        }

        return {
          id: mes.id,
          descripcion: mes.descripcion,
          fecha_inicio: fd(mes.fecha_inicio),
          fecha_fin: fd(mes.fecha_fin),
          volumen_objetivo: parseFloat(mes.volumen_objetivo),
          volumen_actual: prog.volumen_actual,
          porcentaje: prog.porcentaje,
          completado,
        };
      }));

      obj.volumen_no_obtenido = Math.round(volumen_no_obtenido * 100) / 100;
      obj.meses_detalle = meses_detalle;
    }

    res.json(resultado);
  } catch (err) {
    res.status(500).json({ error: 'Error al calcular progreso', detalle: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/objetivos
// ─────────────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/objetivos/:id  (con SKUs)
// ─────────────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/objetivos
// ─────────────────────────────────────────────────────────────────────────────
router.post('/', verificarToken, soloRoles(['ADMIN']), async (req, res) => {
  const {
    periodo, fecha_inicio, fecha_fin, volumen_objetivo, unit_general, descripcion,
    visible_repositores, visible_volumen, visible_porcentaje, volumen_real, skus,
  } = req.body;

  if (!periodo || !fecha_inicio || !fecha_fin || !volumen_objetivo)
    return res.status(400).json({ error: 'periodo, fecha_inicio, fecha_fin y volumen_objetivo son requeridos' });

  try {
    const [result] = await db.query(
      `INSERT INTO objetivos
         (periodo, fecha_inicio, fecha_fin, volumen_objetivo, unit_general, descripcion,
          visible_repositores, visible_volumen, visible_porcentaje, volumen_real)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        periodo, fecha_inicio, fecha_fin,
        volumen_objetivo, unit_general || 1.7, descripcion || null,
        visible_repositores ? 1 : 0,
        visible_volumen !== false ? 1 : 0,
        visible_porcentaje !== false ? 1 : 0,
        volumen_real ? parseFloat(volumen_real) : null,
      ]
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

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/objetivos/:id
// ─────────────────────────────────────────────────────────────────────────────
router.put('/:id', verificarToken, soloRoles(['ADMIN']), async (req, res) => {
  const {
    volumen_objetivo, unit_general, descripcion, activo,
    visible_repositores, visible_volumen, visible_porcentaje, volumen_real,
  } = req.body;

  try {
    const campos = [];
    const valores = [];

    if (volumen_objetivo    !== undefined) { campos.push('volumen_objetivo = ?');    valores.push(volumen_objetivo); }
    if (unit_general        !== undefined) { campos.push('unit_general = ?');        valores.push(unit_general); }
    if (descripcion         !== undefined) { campos.push('descripcion = ?');         valores.push(descripcion); }
    if (activo              !== undefined) { campos.push('activo = ?');              valores.push(activo ? 1 : 0); }
    if (visible_repositores !== undefined) { campos.push('visible_repositores = ?'); valores.push(visible_repositores ? 1 : 0); }
    if (visible_volumen     !== undefined) { campos.push('visible_volumen = ?');     valores.push(visible_volumen ? 1 : 0); }
    if (visible_porcentaje  !== undefined) { campos.push('visible_porcentaje = ?');  valores.push(visible_porcentaje ? 1 : 0); }
    if (volumen_real        !== undefined) { campos.push('volumen_real = ?');        valores.push(volumen_real === '' || volumen_real === null ? null : parseFloat(volumen_real)); }

    if (campos.length === 0) return res.status(400).json({ error: 'Nada para actualizar' });
    valores.push(req.params.id);
    await db.query(`UPDATE objetivos SET ${campos.join(', ')} WHERE id = ?`, valores);
    res.json({ mensaje: 'Objetivo actualizado' });
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar objetivo', detalle: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/objetivos/:id  (soft delete)
// ─────────────────────────────────────────────────────────────────────────────
router.delete('/:id', verificarToken, soloRoles(['ADMIN']), async (req, res) => {
  try {
    await db.query('UPDATE objetivos SET activo = 0 WHERE id = ?', [req.params.id]);
    res.json({ mensaje: 'Objetivo desactivado' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar objetivo', detalle: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/objetivos/:id/asignaciones
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:id/asignaciones', verificarToken, soloRoles(['ADMIN']), async (req, res) => {
  try {
    const [empresas] = await db.query(
      `SELECT oe.*, e.nombre AS empresa_nombre
       FROM objetivo_empresas oe
       JOIN empresas e ON e.id = oe.empresa_id
       WHERE oe.objetivo_id = ?
       ORDER BY e.nombre`,
      [req.params.id]
    );
    const [locales] = await db.query(
      `SELECT ol.*, l.nombre AS local_nombre, l.empresa_id, e.nombre AS empresa_nombre
       FROM objetivo_locales ol
       JOIN locales l ON l.id = ol.local_id
       JOIN empresas e ON e.id = l.empresa_id
       WHERE ol.objetivo_id = ?
       ORDER BY e.nombre, l.nombre`,
      [req.params.id]
    );
    res.json({ empresas, locales });
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener asignaciones', detalle: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/objetivos/:id/empresas  (upsert)
// La suma de todas las empresas NO puede superar el volumen_objetivo del objetivo.
// ─────────────────────────────────────────────────────────────────────────────
router.post('/:id/empresas', verificarToken, soloRoles(['ADMIN']), async (req, res) => {
  const { empresa_id, volumen_objetivo } = req.body;
  if (!empresa_id || volumen_objetivo == null)
    return res.status(400).json({ error: 'empresa_id y volumen_objetivo son requeridos' });

  try {
    // Volumen total del objetivo principal
    const [[obj]] = await db.query(
      'SELECT volumen_objetivo FROM objetivos WHERE id = ?',
      [req.params.id]
    );
    if (!obj) return res.status(404).json({ error: 'Objetivo no encontrado' });

    // Suma de las OTRAS empresas ya asignadas (excluye la que estamos guardando)
    const [[{ suma_otras }]] = await db.query(
      `SELECT COALESCE(SUM(volumen_objetivo), 0) AS suma_otras
       FROM objetivo_empresas
       WHERE objetivo_id = ? AND empresa_id != ?`,
      [req.params.id, empresa_id]
    );

    const nueva_suma = parseFloat(suma_otras) + parseFloat(volumen_objetivo);
    const vol_max = parseFloat(obj.volumen_objetivo);

    if (nueva_suma > vol_max) {
      const disponible = (vol_max - parseFloat(suma_otras)).toFixed(2);
      return res.status(400).json({
        error: `El volumen supera el objetivo. Disponible para esta empresa: ${disponible}`,
      });
    }

    await db.query(
      `INSERT INTO objetivo_empresas (objetivo_id, empresa_id, volumen_objetivo)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE volumen_objetivo = VALUES(volumen_objetivo)`,
      [req.params.id, empresa_id, volumen_objetivo]
    );
    res.json({ mensaje: 'Objetivo de empresa guardado' });
  } catch (err) {
    res.status(500).json({ error: 'Error al guardar objetivo de empresa', detalle: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/objetivos/:id/empresas/:empresa_id
// ─────────────────────────────────────────────────────────────────────────────
router.delete('/:id/empresas/:empresa_id', verificarToken, soloRoles(['ADMIN']), async (req, res) => {
  try {
    await db.query(
      'DELETE FROM objetivo_empresas WHERE objetivo_id = ? AND empresa_id = ?',
      [req.params.id, req.params.empresa_id]
    );
    res.json({ mensaje: 'Objetivo de empresa eliminado' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar', detalle: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/objetivos/:id/locales  (upsert, con validación de suma)
// La suma de todos los locales de una empresa NO puede superar el objetivo
// de esa empresa. Tampoco puede la suma quedar por debajo (se avisa en front).
// ─────────────────────────────────────────────────────────────────────────────
router.post('/:id/locales', verificarToken, soloRoles(['ADMIN']), async (req, res) => {
  const { local_id, volumen_objetivo } = req.body;
  if (!local_id || volumen_objetivo == null)
    return res.status(400).json({ error: 'local_id y volumen_objetivo son requeridos' });

  try {
    const [[local]] = await db.query('SELECT empresa_id FROM locales WHERE id = ?', [local_id]);
    if (!local) return res.status(404).json({ error: 'Local no encontrado' });

    const [[empObj]] = await db.query(
      'SELECT volumen_objetivo FROM objetivo_empresas WHERE objetivo_id = ? AND empresa_id = ?',
      [req.params.id, local.empresa_id]
    );
    if (!empObj)
      return res.status(400).json({ error: 'Primero asigná un objetivo a la empresa de este local' });

    // Suma de los OTROS locales de la misma empresa (excluye el que estamos guardando)
    const [[{ suma_otros }]] = await db.query(
      `SELECT COALESCE(SUM(ol.volumen_objetivo), 0) AS suma_otros
       FROM objetivo_locales ol
       JOIN locales l ON l.id = ol.local_id
       WHERE ol.objetivo_id = ? AND l.empresa_id = ? AND ol.local_id != ?`,
      [req.params.id, local.empresa_id, local_id]
    );

    const nueva_suma = parseFloat(suma_otros) + parseFloat(volumen_objetivo);
    const obj_emp = parseFloat(empObj.volumen_objetivo);

    if (nueva_suma > obj_emp) {
      const disponible = (obj_emp - parseFloat(suma_otros)).toFixed(2);
      return res.status(400).json({
        error: `El volumen supera el objetivo de la empresa. Disponible para este local: ${disponible}`,
      });
    }

    await db.query(
      `INSERT INTO objetivo_locales (objetivo_id, local_id, volumen_objetivo)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE volumen_objetivo = VALUES(volumen_objetivo)`,
      [req.params.id, local_id, volumen_objetivo]
    );
    res.json({ mensaje: 'Objetivo de local guardado' });
  } catch (err) {
    res.status(500).json({ error: 'Error al guardar objetivo de local', detalle: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/objetivos/:id/locales/:local_id
// ─────────────────────────────────────────────────────────────────────────────
router.delete('/:id/locales/:local_id', verificarToken, soloRoles(['ADMIN']), async (req, res) => {
  try {
    await db.query(
      'DELETE FROM objetivo_locales WHERE objetivo_id = ? AND local_id = ?',
      [req.params.id, req.params.local_id]
    );
    res.json({ mensaje: 'Objetivo de local eliminado' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar objetivo de local', detalle: err.message });
  }
});

module.exports = router;

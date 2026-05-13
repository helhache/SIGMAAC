const express = require('express');
const router = express.Router();
const db = require('../db');
const { verificarToken, soloRoles } = require('../middleware/auth');

// GET /api/pedidos — ADMIN y GERENTE ven todos; REPOSITOR ve los suyos; LOCAL ve los de su local
router.get('/', verificarToken, async (req, res) => {
  const { rol, id: usuarioId } = req.usuario;
  try {
    let query = `
      SELECT p.*, l.nombre AS local_nombre,
             r.nombre AS repositor_nombre, r.apellido AS repositor_apellido,
             COALESCE(pi_count.total_items, 0) AS total_items
      FROM pedidos p
      JOIN locales l ON l.id = p.local_id
      LEFT JOIN repositores r ON r.id = p.repositor_id
      LEFT JOIN (SELECT pedido_id, COUNT(*) AS total_items FROM pedido_items GROUP BY pedido_id) pi_count ON pi_count.pedido_id = p.id
    `;
    const params = [];

    if (rol === 'REPOSITOR') {
      const [[repo]] = await db.query('SELECT id FROM repositores WHERE usuario_id = ?', [usuarioId]);
      if (!repo) return res.json([]);
      query += ' WHERE p.repositor_id = ?';
      params.push(repo.id);
    } else if (rol === 'LOCAL') {
      const [locales] = await db.query(
        'SELECT local_id FROM usuarios_locales WHERE usuario_id = ?', [usuarioId]
      );
      if (locales.length === 0) return res.json([]);
      const ids = locales.map(l => l.local_id);
      query += ` WHERE p.local_id IN (${ids.map(() => '?').join(',')})`;
      params.push(...ids);
    }

    query += ' ORDER BY p.fecha_pedido DESC';
    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener pedidos', detalle: err.message });
  }
});

// GET /api/pedidos/:id — con sus items
router.get('/:id', verificarToken, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT p.*, l.nombre AS local_nombre
       FROM pedidos p JOIN locales l ON l.id = p.local_id
       WHERE p.id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Pedido no encontrado' });

    const [items] = await db.query(
      `SELECT pi.*, pr.nombre AS producto_nombre, pr.codigo_venta,
              pr.unit_value, pr.unidades_por_bulto, pr.packs_por_corte, pr.unidades_por_pale
       FROM pedido_items pi
       JOIN productos pr ON pr.id = pi.producto_id
       WHERE pi.pedido_id = ?`,
      [req.params.id]
    );
    res.json({ ...rows[0], items });
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener pedido', detalle: err.message });
  }
});

// POST /api/pedidos — REPOSITOR, ADMIN y LOCAL crean pedidos
router.post('/', verificarToken, soloRoles(['ADMIN', 'REPOSITOR', 'LOCAL']), async (req, res) => {
  const { local_id, tipo, fecha_pedido, fecha_entrega_estimada, notas, items, estado } = req.body;
  if (!local_id || !fecha_pedido)
    return res.status(400).json({ error: 'local_id y fecha_pedido son requeridos' });
  if (!Array.isArray(items) || items.length === 0)
    return res.status(400).json({ error: 'El pedido debe tener al menos un item' });

  try {
    let repositor_id = null;
    if (req.usuario.rol === 'REPOSITOR') {
      const [[repo]] = await db.query('SELECT id FROM repositores WHERE usuario_id = ?', [req.usuario.id]);
      if (repo) repositor_id = repo.id;
    }
    if (req.usuario.rol === 'LOCAL') {
      const [userLocales] = await db.query(
        'SELECT local_id FROM usuarios_locales WHERE usuario_id = ?', [req.usuario.id]
      );
      const allowedIds = userLocales.map(l => l.local_id);
      if (!allowedIds.includes(parseInt(local_id))) {
        return res.status(403).json({ error: 'No tenés permiso para crear pedidos en este local' });
      }
    }

    // LOCAL puede crear en borrador o confirmado; REPOSITOR/ADMIN cualquier estado
    const estadosPermitidos = ['borrador', 'confirmado'];
    const estadoInicial = estadosPermitidos.includes(estado) ? estado : 'borrador';

    const { total_packs, total_volumen } = req.body;

    const [result] = await db.query(
      `INSERT INTO pedidos (local_id, repositor_id, tipo, fecha_pedido, fecha_entrega_estimada, notas, estado, total_packs, total_volumen)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [local_id, repositor_id, tipo || 'programado', fecha_pedido, fecha_entrega_estimada || null, notas || null, estadoInicial,
       total_packs || null, total_volumen || null]
    );
    const pedidoId = result.insertId;

    let totalBultos = 0;
    for (const item of items) {
      await db.query(
        `INSERT INTO pedido_items
           (pedido_id, producto_id, cantidad_bultos, precio_unitario, cantidad_display, unidad_display, packs)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [pedidoId, item.producto_id, item.cantidad_bultos, item.precio_unitario || null,
         item.cantidad_display || null, item.unidad_display || null, item.packs || null]
      );
      totalBultos += item.cantidad_bultos;
    }

    await db.query('UPDATE pedidos SET total_bultos = ? WHERE id = ?', [totalBultos, pedidoId]);
    res.status(201).json({ id: pedidoId, total_bultos: totalBultos });
  } catch (err) {
    res.status(500).json({ error: 'Error al crear pedido', detalle: err.message });
  }
});

// PUT /api/pedidos/:id/estado — cambiar estado (y opcionalmente notas)
// ADMIN: puede cambiar a cualquier estado
// LOCAL: solo puede cambiar SUS PROPIOS pedidos en borrador → confirmado o cancelado
router.put('/:id/estado', verificarToken, soloRoles(['ADMIN', 'LOCAL']), async (req, res) => {
  const { estado, notas } = req.body;
  const estadosValidos = ['borrador', 'confirmado', 'en_transito', 'entregado', 'cancelado'];
  if (!estadosValidos.includes(estado))
    return res.status(400).json({ error: `Estado inválido. Valores: ${estadosValidos.join(', ')}` });

  try {
    const [[pedido]] = await db.query(
      'SELECT p.estado, p.local_id FROM pedidos p WHERE p.id = ?', [req.params.id]
    );
    if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado' });

    // Restricciones para LOCAL
    if (req.usuario.rol === 'LOCAL') {
      // Verificar que el pedido pertenece a un local del usuario
      const [userLocales] = await db.query(
        'SELECT local_id FROM usuarios_locales WHERE usuario_id = ?', [req.usuario.id]
      );
      const allowedIds = userLocales.map(l => l.local_id);
      if (!allowedIds.includes(pedido.local_id))
        return res.status(403).json({ error: 'No tenés permiso para modificar este pedido' });
      // LOCAL solo puede actuar sobre borradores
      if (pedido.estado !== 'borrador')
        return res.status(400).json({ error: 'Solo podés modificar pedidos en estado borrador' });
      // LOCAL solo puede pasar a confirmado o cancelado
      if (!['confirmado', 'cancelado'].includes(estado))
        return res.status(400).json({ error: 'Solo podés enviar o cancelar un pedido borrador' });
    }

    const campos = ['estado = ?'];
    const valores = [estado];
    if (notas !== undefined) { campos.push('notas = ?'); valores.push(notas); }
    valores.push(req.params.id);
    await db.query(`UPDATE pedidos SET ${campos.join(', ')} WHERE id = ?`, valores);
    res.json({ mensaje: 'Pedido actualizado' });
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar pedido', detalle: err.message });
  }
});

// DELETE /api/pedidos/:id
// ADMIN: puede eliminar cualquier pedido
// REPOSITOR: solo los suyos y solo en borrador
router.delete('/:id', verificarToken, soloRoles(['ADMIN', 'REPOSITOR']), async (req, res) => {
  try {
    const [[pedido]] = await db.query('SELECT estado, repositor_id FROM pedidos WHERE id = ?', [req.params.id]);
    if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado' });

    if (req.usuario.rol === 'REPOSITOR') {
      const [[repo]] = await db.query('SELECT id FROM repositores WHERE usuario_id = ?', [req.usuario.id]);
      if (!repo || pedido.repositor_id !== repo.id)
        return res.status(403).json({ error: 'No tenés permiso para eliminar este pedido' });
      if (pedido.estado !== 'borrador')
        return res.status(400).json({ error: 'Solo podés eliminar pedidos en estado borrador' });
    }

    await db.query('DELETE FROM pedido_items WHERE pedido_id = ?', [req.params.id]);
    await db.query('DELETE FROM pedidos WHERE id = ?', [req.params.id]);
    res.json({ mensaje: 'Pedido eliminado' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar pedido', detalle: err.message });
  }
});

module.exports = router;

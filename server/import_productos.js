/**
 * import_productos.js
 * Importa el portafolio de SKUs activos desde COPIA SKU.xlsx a la tabla productos.
 *
 * Uso: node import_productos.js
 * Ejecutar desde la carpeta server/
 */

const path  = require('path');
const XLSX  = require('xlsx');
const db    = require('./db');
require('dotenv').config();

const ARCHIVO = path.join(__dirname, '../datos  a aplicar/COPIA SKU.xlsx');

// ── Índices de columnas (fila 4 = encabezados, datos desde fila 5) ────────────
const COL = {
  cod_basis:      0,   // A  - Cód. BASIS (código de compra / código para cambios)
  nombre:         5,   // F  - Descripción
  marca:          8,   // I  - Marca
  sabor:          9,   // J  - Sabor
  retornable:    13,   // N  - Tipo (RETORNABLE / NO RETORNABLE)
  tamano_ml:     14,   // O  - Tamaño (ml)
  tipo_envase:   15,   // P  - Envase (INDIVIDUAL / FAMILIAR)
  material:      16,   // Q  - Tipo de Envase (PET, VR, CAN, etc.)
  activo:        18,   // S  - Activo? (SI / NO)
  ean:           20,   // U  - Código EAN Primario
  unit_value:    23,   // X  - Unit Case por pack
  litros_pack:   24,   // Y  - Litros por pack
  unids_pack:    25,   // Z  - Unids/Pack  → unidades_por_bulto
  packs_capa:    26,   // AA - Packs/Capa  → packs_por_capa
  capas_pale:    27,   // AB - Capas/Pallet → capas_por_pale
  packs_pale:    28,   // AC - Packs/Pallet → unidades_por_pale
};

function parseSafe(val, tipo) {
  if (val === '' || val === null || val === undefined) return null;
  const n = tipo === 'float' ? parseFloat(val) : parseInt(val);
  return isNaN(n) ? null : n;
}

function leer() {
  const wb   = XLSX.readFile(ARCHIVO);
  const ws   = wb.Sheets['SKUs'];
  const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  // Encabezados en fila 4 (idx 3), datos desde fila 5 (idx 4)
  return data.slice(4);
}

function mapear(row) {
  const esActivo = String(row[COL.activo]).trim().toUpperCase() === 'SI';
  if (!esActivo) return null;

  const ean = row[COL.ean];
  const eanNum = ean ? BigInt(String(ean).split('.')[0]).toString() : null;

  return {
    codigo_venta:     String(row[COL.cod_basis]).trim(),
    nombre:           String(row[COL.nombre]).trim(),
    marca:            String(row[COL.marca]).trim()  || null,
    sabor:            String(row[COL.sabor]).trim()  || null,
    retornable:       String(row[COL.retornable]).trim() === 'RETORNABLE' ? 1 : 0,
    tamano_ml:        row[COL.tamano_ml]   ? parseInt(row[COL.tamano_ml])   : null,
    tipo_envase:      row[COL.tipo_envase] ? String(row[COL.tipo_envase]).trim() : null,
    material_envase:  row[COL.material]    ? String(row[COL.material]).trim()    : null,
    activo:           1,
    ean:              eanNum,
    unit_value:       parseSafe(row[COL.unit_value],  'float'),
    litros_por_pack:  parseSafe(row[COL.litros_pack], 'float'),
    unidades_por_bulto: parseSafe(row[COL.unids_pack], 'int'),
    packs_por_capa:   parseSafe(row[COL.packs_capa],  'int'),
    capas_por_pale:   parseSafe(row[COL.capas_pale],  'int'),
    unidades_por_pale: parseSafe(row[COL.packs_pale], 'int'),
  };
}

async function main() {
  console.log('📦 Importando productos desde:', ARCHIVO);

  const filas = leer();
  console.log(`   Filas leídas: ${filas.length}`);

  const productos = filas.map(mapear).filter(Boolean);
  console.log(`   Productos activos a importar: ${productos.length}`);

  let insertados  = 0;
  let actualizados = 0;
  let errores     = 0;

  for (const p of productos) {
    try {
      // UPSERT por codigo_venta (identificador único real del portafolio)
      const [existe] = await db.query(
        'SELECT id FROM productos WHERE codigo_venta = ?', [p.codigo_venta]
      );

      if (existe.length > 0) {
        // Actualizar sin pisar precio_sugerido, sovi_requerido ni imagen (datos manuales)
        await db.query(`
          UPDATE productos SET
            nombre           = ?,
            marca            = ?,
            sabor            = ?,
            retornable       = ?,
            tamano_ml        = ?,
            tipo_envase      = ?,
            material_envase  = ?,
            ean              = ?,
            unit_value       = ?,
            litros_por_pack  = ?,
            unidades_por_bulto = ?,
            packs_por_capa   = ?,
            capas_por_pale   = ?,
            unidades_por_pale = ?,
            activo           = 1
          WHERE codigo_venta = ?
        `, [
          p.nombre, p.marca, p.sabor, p.retornable, p.tamano_ml,
          p.tipo_envase, p.material_envase, p.ean,
          p.unit_value, p.litros_por_pack,
          p.unidades_por_bulto, p.packs_por_capa, p.capas_por_pale,
          p.unidades_por_pale, p.codigo_venta,
        ]);
        actualizados++;
      } else {
        await db.query(`
          INSERT INTO productos
            (codigo_venta, nombre, marca, sabor, retornable, tamano_ml,
             tipo_envase, material_envase, ean, unit_value, litros_por_pack,
             unidades_por_bulto, packs_por_capa, capas_por_pale, unidades_por_pale, activo)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
        `, [
          p.codigo_venta, p.nombre, p.marca, p.sabor, p.retornable, p.tamano_ml,
          p.tipo_envase, p.material_envase, p.ean,
          p.unit_value, p.litros_por_pack,
          p.unidades_por_bulto, p.packs_por_capa, p.capas_por_pale, p.unidades_por_pale,
        ]);
        insertados++;
      }
    } catch (err) {
      console.error(`   ✗ Error en ${p.codigo_venta} - ${p.nombre}:`, err.message);
      errores++;
    }
  }

  console.log('\n✅ Importación completada:');
  console.log(`   Insertados:   ${insertados}`);
  console.log(`   Actualizados: ${actualizados}`);
  console.log(`   Errores:      ${errores}`);

  process.exit(0);
}

main().catch(err => {
  console.error('Error fatal:', err);
  process.exit(1);
});

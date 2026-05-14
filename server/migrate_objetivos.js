require('dotenv').config();
const db = require('./db');

async function migrate() {
  console.log('Ejecutando migración de objetivos...\n');

  // Columna visible_repositores
  try {
    await db.query(`ALTER TABLE objetivos ADD COLUMN visible_repositores TINYINT DEFAULT 0`);
    console.log('  + visible_repositores agregado');
  } catch (e) {
    if (e.code === 'ER_DUP_FIELDNAME') console.log('  · visible_repositores ya existe');
    else throw e;
  }

  // Columna visible_volumen
  try {
    await db.query(`ALTER TABLE objetivos ADD COLUMN visible_volumen TINYINT DEFAULT 1`);
    console.log('  + visible_volumen agregado');
  } catch (e) {
    if (e.code === 'ER_DUP_FIELDNAME') console.log('  · visible_volumen ya existe');
    else throw e;
  }

  // Columna visible_porcentaje
  try {
    await db.query(`ALTER TABLE objetivos ADD COLUMN visible_porcentaje TINYINT DEFAULT 1`);
    console.log('  + visible_porcentaje agregado');
  } catch (e) {
    if (e.code === 'ER_DUP_FIELDNAME') console.log('  · visible_porcentaje ya existe');
    else throw e;
  }

  // Tabla objetivo_empresas
  await db.query(`
    CREATE TABLE IF NOT EXISTS objetivo_empresas (
      id            INT AUTO_INCREMENT PRIMARY KEY,
      objetivo_id   INT NOT NULL,
      empresa_id    INT NOT NULL,
      volumen_objetivo DECIMAL(10,2) NOT NULL,
      UNIQUE KEY uq_obj_emp (objetivo_id, empresa_id),
      FOREIGN KEY (objetivo_id) REFERENCES objetivos(id) ON DELETE CASCADE,
      FOREIGN KEY (empresa_id)  REFERENCES empresas(id)  ON DELETE RESTRICT
    )
  `);
  console.log('  + tabla objetivo_empresas creada (o ya existía)');

  // Tabla objetivo_locales
  await db.query(`
    CREATE TABLE IF NOT EXISTS objetivo_locales (
      id            INT AUTO_INCREMENT PRIMARY KEY,
      objetivo_id   INT NOT NULL,
      local_id      INT NOT NULL,
      volumen_objetivo DECIMAL(10,2) NOT NULL,
      UNIQUE KEY uq_obj_loc (objetivo_id, local_id),
      FOREIGN KEY (objetivo_id) REFERENCES objetivos(id)  ON DELETE CASCADE,
      FOREIGN KEY (local_id)    REFERENCES locales(id)    ON DELETE RESTRICT
    )
  `);
  console.log('  + tabla objetivo_locales creada (o ya existía)');

  console.log('\nMigración completada con éxito.');
  process.exit(0);
}

migrate().catch(e => {
  console.error('Error en migración:', e.message);
  process.exit(1);
});

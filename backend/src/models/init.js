require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const pool = require('../config/database');
const bcrypt = require('bcryptjs');

async function initDatabase() {
  const client = await pool.connect();
  try {
    console.log('Conectando a PostgreSQL...');

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        apellidos VARCHAR(150),
        email VARCHAR(255) UNIQUE NOT NULL,
        telefono VARCHAR(20),
        password_hash TEXT NOT NULL,
        rol VARCHAR(50) NOT NULL CHECK (rol IN (
          'administrador', 'director_comercial', 'comercial',
          'fotografo', 'disenador', 'desarrollador'
        )),
        activo BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS leads (
        id SERIAL PRIMARY KEY,
        nombre_grupo VARCHAR(255),
        tipo_grupo VARCHAR(100),
        curso VARCHAR(100),
        pack VARCHAR(100),
        pack_personalizado TEXT,
        precio_estimado NUMERIC(10,2),
        nombre_contacto VARCHAR(100),
        apellidos_contacto VARCHAR(150),
        email_contacto VARCHAR(255),
        telefono_contacto VARCHAR(20),
        comunidad_autonoma VARCHAR(100),
        provincia VARCHAR(100),
        ciudad VARCHAR(100),
        barrio VARCHAR(100),
        notas TEXT,
        instrucciones_maquetacion TEXT,
        estado VARCHAR(50) DEFAULT 'contactado' CHECK (estado IN (
          'contactado', 'no_contesta', 'en_proceso', 'proceso_venta',
          'en_produccion', 'en_envio', 'completado', 'perdido'
        )),
        comercial_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS grupos (
        id SERIAL PRIMARY KEY,
        lead_id INTEGER REFERENCES leads(id) ON DELETE SET NULL,
        nombre_grupo VARCHAR(255),
        tipo_grupo VARCHAR(100),
        curso VARCHAR(100),
        pack VARCHAR(100),
        pack_personalizado TEXT,
        precio_final NUMERIC(10,2),
        unidades_estimadas INTEGER,
        unidades_confirmadas INTEGER,
        nombre_contacto VARCHAR(100),
        apellidos_contacto VARCHAR(150),
        email_contacto VARCHAR(255),
        telefono_contacto VARCHAR(20),
        comunidad_autonoma VARCHAR(100),
        provincia VARCHAR(100),
        ciudad VARCHAR(100),
        barrio VARCHAR(100),
        notas TEXT,
        instrucciones_maquetacion TEXT,
        estado_venta VARCHAR(50) DEFAULT 'contactado' CHECK (estado_venta IN (
          'contactado', 'no_contesta', 'en_proceso', 'proceso_venta',
          'en_produccion', 'en_envio', 'completado', 'perdido'
        )),
        estado_fotografo VARCHAR(50) DEFAULT 'sin_empezar' CHECK (estado_fotografo IN (
          'sin_empezar', 'shooting_hecho', 'material_editado', 'material_importado'
        )),
        estado_disenador VARCHAR(50) DEFAULT 'sin_empezar' CHECK (estado_disenador IN (
          'sin_empezar', 'en_proceso', 'completado'
        )),
        estado_aprobacion VARCHAR(50) DEFAULT 'pendiente' CHECK (estado_aprobacion IN (
          'pendiente', 'aprobado'
        )),
        comercial_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        pago_verificado BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS incidencias (
        id SERIAL PRIMARY KEY,
        titulo VARCHAR(255) NOT NULL,
        descripcion TEXT,
        reportado_por INTEGER REFERENCES users(id) ON DELETE SET NULL,
        estado VARCHAR(50) DEFAULT 'sin_empezar' CHECK (estado IN (
          'sin_empezar', 'en_proceso', 'solucionada'
        )),
        respuesta_usuario TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS gastos_fijos (
        id SERIAL PRIMARY KEY,
        concepto VARCHAR(255) NOT NULL,
        importe NUMERIC(10,2) NOT NULL,
        fecha DATE NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS gastos_variables (
        id SERIAL PRIMARY KEY,
        grupo_id INTEGER REFERENCES grupos(id) ON DELETE SET NULL,
        concepto VARCHAR(255) NOT NULL,
        importe NUMERIC(10,2) NOT NULL,
        fecha DATE NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS solicitudes_rol (
        id SERIAL PRIMARY KEY,
        usuario_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        rol_solicitado VARCHAR(50) NOT NULL,
        solicitado_por INTEGER REFERENCES users(id) ON DELETE SET NULL,
        aprobaciones INTEGER[] DEFAULT ARRAY[]::INTEGER[],
        estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aprobado', 'rechazado')),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    console.log('Tablas creadas correctamente.');

    const existing = await client.query(
      `SELECT id FROM users WHERE email = $1`,
      ['admin@flashback.es']
    );

    if (existing.rows.length === 0) {
      const passwordHash = await bcrypt.hash('Fl@shb4ck2024!', 12);
      await client.query(
        `INSERT INTO users (nombre, apellidos, email, telefono, password_hash, rol, activo)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        ['Admin', 'Flashback', 'admin@flashback.es', '', passwordHash, 'administrador', true]
      );
      console.log('Usuario administrador creado.');
    } else {
      console.log('Usuario administrador ya existe.');
    }

    console.log('\n✓ Base de datos inicializada correctamente.\n');
    console.log('==============================================');
    console.log('  CREDENCIALES ADMINISTRADOR');
    console.log('==============================================');
    console.log('  Email:    admin@flashback.es');
    console.log('  Password: Fl@shb4ck2024!');
    console.log('==============================================\n');

  } catch (err) {
    console.error('Error al inicializar la base de datos:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

initDatabase().catch(process.exit.bind(process, 1));

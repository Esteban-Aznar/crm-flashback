const pool = require('../config/database');
const bcrypt = require('bcryptjs');

const ROLES_VALIDOS = ['administrador', 'director_comercial', 'comercial', 'fotografo', 'disenador', 'desarrollador'];

// ─── Usuarios ───────────────────────────────────────────────────────────────

const getUsuarios = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, nombre, apellidos, email, telefono, rol, activo, created_at
       FROM users ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('getUsuarios error:', err);
    res.status(500).json({ message: 'Error al obtener usuarios.' });
  }
};

const getUsuarioById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT id, nombre, apellidos, email, telefono, rol, activo, created_at FROM users WHERE id = $1`,
      [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Usuario no encontrado.' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener el usuario.' });
  }
};

const createUsuario = async (req, res) => {
  const { nombre, apellidos, email, telefono, password, rol } = req.body;
  const creador = req.user;

  if (!nombre || !email || !password || !rol) {
    return res.status(400).json({ message: 'Nombre, email, contraseña y rol son requeridos.' });
  }
  if (!ROLES_VALIDOS.includes(rol)) {
    return res.status(400).json({ message: 'Rol no válido.' });
  }
  // Director comercial solo puede crear comerciales
  if (creador.rol === 'director_comercial' && rol !== 'comercial') {
    return res.status(403).json({ message: 'Solo puedes crear usuarios con rol "comercial".' });
  }

  try {
    const existe = await pool.query(`SELECT id FROM users WHERE email = $1`, [email.toLowerCase().trim()]);
    if (existe.rows.length > 0) return res.status(409).json({ message: 'Ya existe un usuario con ese email.' });

    const hash = await bcrypt.hash(password, 12);
    const result = await pool.query(
      `INSERT INTO users (nombre, apellidos, email, telefono, password_hash, rol, activo)
       VALUES ($1,$2,$3,$4,$5,$6,true) RETURNING id, nombre, apellidos, email, telefono, rol, activo, created_at`,
      [nombre, apellidos || null, email.toLowerCase().trim(), telefono || null, hash, rol]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('createUsuario error:', err);
    res.status(500).json({ message: 'Error al crear el usuario.' });
  }
};

const updateUsuario = async (req, res) => {
  const { id } = req.params;
  const { nombre, apellidos, email, telefono, password } = req.body;

  if (!nombre || !email) return res.status(400).json({ message: 'Nombre y email son requeridos.' });

  try {
    let query, params;
    if (password && password.trim() !== '') {
      const hash = await bcrypt.hash(password, 12);
      query = `UPDATE users SET nombre=$1, apellidos=$2, email=$3, telefono=$4, password_hash=$5 WHERE id=$6
               RETURNING id, nombre, apellidos, email, telefono, rol, activo, created_at`;
      params = [nombre, apellidos || null, email.toLowerCase().trim(), telefono || null, hash, id];
    } else {
      query = `UPDATE users SET nombre=$1, apellidos=$2, email=$3, telefono=$4 WHERE id=$5
               RETURNING id, nombre, apellidos, email, telefono, rol, activo, created_at`;
      params = [nombre, apellidos || null, email.toLowerCase().trim(), telefono || null, id];
    }

    const result = await pool.query(query, params);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Usuario no encontrado.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('updateUsuario error:', err);
    res.status(500).json({ message: 'Error al actualizar el usuario.' });
  }
};

const cambiarRol = async (req, res) => {
  const { id } = req.params;
  const { rol } = req.body;
  const solicitante = req.user;

  if (!ROLES_VALIDOS.includes(rol)) return res.status(400).json({ message: 'Rol no válido.' });

  try {
    const userResult = await pool.query(`SELECT * FROM users WHERE id = $1`, [id]);
    if (userResult.rows.length === 0) return res.status(404).json({ message: 'Usuario no encontrado.' });
    const usuario = userResult.rows[0];

    if (usuario.rol === rol) return res.status(400).json({ message: 'El usuario ya tiene ese rol.' });

    // Rol "comercial" → cambio directo
    if (rol === 'comercial') {
      await pool.query(`UPDATE users SET rol=$1 WHERE id=$2`, [rol, id]);
      // Cancelar solicitudes pendientes para este usuario
      await pool.query(`UPDATE solicitudes_rol SET estado='rechazado' WHERE usuario_id=$1 AND estado='pendiente'`, [id]);
      return res.json({ message: 'Rol actualizado a comercial.', directo: true });
    }

    // Cualquier otro rol → crear solicitud
    const pendiente = await pool.query(
      `SELECT id FROM solicitudes_rol WHERE usuario_id=$1 AND estado='pendiente'`, [id]
    );
    if (pendiente.rows.length > 0) {
      return res.status(409).json({ message: 'Ya existe una solicitud de cambio de rol pendiente para este usuario.' });
    }

    const solResult = await pool.query(
      `INSERT INTO solicitudes_rol (usuario_id, rol_solicitado, solicitado_por)
       VALUES ($1,$2,$3) RETURNING *`,
      [id, rol, solicitante.id]
    );
    res.status(201).json({ message: 'Solicitud de cambio de rol creada. Requiere aprobación de todos los administradores.', solicitud: solResult.rows[0], directo: false });
  } catch (err) {
    console.error('cambiarRol error:', err);
    res.status(500).json({ message: 'Error al procesar el cambio de rol.' });
  }
};

const toggleActivar = async (req, res) => {
  const { id } = req.params;
  const { activo } = req.body;
  try {
    const result = await pool.query(
      `UPDATE users SET activo=$1 WHERE id=$2 RETURNING id, nombre, apellidos, email, rol, activo`,
      [activo !== false, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Usuario no encontrado.' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Error al cambiar el estado del usuario.' });
  }
};

const deleteUsuario = async (req, res) => {
  const { id } = req.params;
  if (parseInt(id) === req.user.id) {
    return res.status(400).json({ message: 'No puedes eliminar tu propia cuenta.' });
  }
  try {
    const result = await pool.query(`DELETE FROM users WHERE id=$1 RETURNING id`, [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Usuario no encontrado.' });
    res.json({ message: 'Usuario eliminado correctamente.' });
  } catch (err) {
    res.status(500).json({ message: 'Error al eliminar el usuario.' });
  }
};

// ─── Solicitudes de Rol ──────────────────────────────────────────────────────

const getSolicitudesRol = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.*,
        u.nombre AS usuario_nombre, u.apellidos AS usuario_apellidos,
        u.email AS usuario_email, u.rol AS rol_actual,
        sp.nombre AS solicitante_nombre, sp.apellidos AS solicitante_apellidos
       FROM solicitudes_rol s
       JOIN users u ON s.usuario_id = u.id
       LEFT JOIN users sp ON s.solicitado_por = sp.id
       WHERE s.estado = 'pendiente'
       ORDER BY s.created_at DESC`
    );

    // Total de admins activos para saber cuántas aprobaciones se necesitan
    const adminsResult = await pool.query(
      `SELECT COUNT(*) AS count FROM users WHERE rol='administrador' AND activo=true`
    );
    const totalAdmins = parseInt(adminsResult.rows[0].count);

    res.json({ solicitudes: result.rows, total_admins: totalAdmins });
  } catch (err) {
    console.error('getSolicitudesRol error:', err);
    res.status(500).json({ message: 'Error al obtener solicitudes.' });
  }
};

const aprobarSolicitudRol = async (req, res) => {
  const { id } = req.params;
  const adminId = req.user.id;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const solResult = await client.query(
      `SELECT * FROM solicitudes_rol WHERE id=$1 AND estado='pendiente' FOR UPDATE`, [id]
    );
    if (solResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Solicitud no encontrada o ya procesada.' });
    }
    const sol = solResult.rows[0];

    if (sol.aprobaciones.includes(adminId)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Ya has aprobado esta solicitud.' });
    }

    const updResult = await client.query(
      `UPDATE solicitudes_rol SET aprobaciones=array_append(aprobaciones,$1::integer) WHERE id=$2 RETURNING *`,
      [adminId, id]
    );
    const sol2 = updResult.rows[0];

    const adminsResult = await client.query(
      `SELECT COUNT(*) AS count FROM users WHERE rol='administrador' AND activo=true`
    );
    const totalAdmins = parseInt(adminsResult.rows[0].count);

    if (cardinality(sol2.aprobaciones) >= totalAdmins) {
      await client.query(`UPDATE users SET rol=$1 WHERE id=$2`, [sol2.rol_solicitado, sol2.usuario_id]);
      await client.query(`UPDATE solicitudes_rol SET estado='aprobado' WHERE id=$1`, [id]);
      await client.query('COMMIT');
      return res.json({ message: 'Solicitud aprobada. Rol aplicado automáticamente.', rol_aplicado: true });
    }

    await client.query('COMMIT');
    res.json({ message: `Aprobación registrada (${sol2.aprobaciones.length}/${totalAdmins}).`, rol_aplicado: false });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('aprobarSolicitud error:', err);
    res.status(500).json({ message: 'Error al aprobar la solicitud.' });
  } finally {
    client.release();
  }
};

// Helper: cardinality of PostgreSQL integer array returned as JS array
function cardinality(arr) {
  return Array.isArray(arr) ? arr.length : 0;
}

const rechazarSolicitudRol = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `UPDATE solicitudes_rol SET estado='rechazado' WHERE id=$1 AND estado='pendiente' RETURNING *`, [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Solicitud no encontrada o ya procesada.' });
    res.json({ message: 'Solicitud rechazada.' });
  } catch (err) {
    res.status(500).json({ message: 'Error al rechazar la solicitud.' });
  }
};

module.exports = {
  getUsuarios, getUsuarioById, createUsuario, updateUsuario,
  cambiarRol, toggleActivar, deleteUsuario,
  getSolicitudesRol, aprobarSolicitudRol, rechazarSolicitudRol,
};

const pool = require('../config/database');

const getLeads = async (req, res) => {
  const { estado, comunidad_autonoma, provincia, ciudad, zona, q } = req.query;

  const conditions = ['1=1'];
  const params = [];
  let n = 1;

  if (estado) { conditions.push(`l.estado = $${n++}`); params.push(estado); }
  if (comunidad_autonoma) { conditions.push(`l.comunidad_autonoma ILIKE $${n++}`); params.push(`%${comunidad_autonoma}%`); }
  if (provincia) { conditions.push(`l.provincia ILIKE $${n++}`); params.push(`%${provincia}%`); }
  if (ciudad) { conditions.push(`l.ciudad ILIKE $${n++}`); params.push(`%${ciudad}%`); }
  if (zona) { conditions.push(`l.barrio ILIKE $${n++}`); params.push(`%${zona}%`); }
  if (q) { conditions.push(`l.nombre_grupo ILIKE $${n++}`); params.push(`%${q}%`); }

  try {
    const [leadsResult, metricsResult, convertidosResult] = await Promise.all([
      pool.query(
        `SELECT l.*,
          TRIM(COALESCE(u.nombre,'') || ' ' || COALESCE(u.apellidos,'')) AS comercial_nombre
         FROM leads l
         LEFT JOIN users u ON l.comercial_id = u.id
         WHERE ${conditions.join(' AND ')}
         ORDER BY l.created_at DESC`,
        params
      ),
      pool.query(
        `SELECT
          COUNT(*) AS total,
          COUNT(*) FILTER (WHERE estado NOT IN ('completado','perdido')) AS activos
         FROM leads`
      ),
      pool.query(`SELECT COUNT(*) AS count FROM grupos`),
    ]);

    res.json({
      leads: leadsResult.rows,
      metrics: {
        total: parseInt(metricsResult.rows[0].total),
        activos: parseInt(metricsResult.rows[0].activos),
        convertidos: parseInt(convertidosResult.rows[0].count),
      },
    });
  } catch (err) {
    console.error('getLeads error:', err);
    res.status(500).json({ message: 'Error al obtener leads.' });
  }
};

const getComercialesForLeads = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, nombre, apellidos, rol FROM users WHERE activo = true ORDER BY nombre`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener comerciales.' });
  }
};

const createLead = async (req, res) => {
  const {
    nombre_grupo, tipo_grupo, curso, pack, pack_personalizado, precio_estimado,
    nombre_contacto, apellidos_contacto, email_contacto, telefono_contacto,
    comunidad_autonoma, provincia, ciudad, barrio, notas,
    instrucciones_maquetacion, estado, comercial_id,
  } = req.body;

  if (!nombre_grupo) return res.status(400).json({ message: 'El nombre del grupo es requerido.' });

  try {
    const result = await pool.query(
      `INSERT INTO leads (
        nombre_grupo, tipo_grupo, curso, pack, pack_personalizado, precio_estimado,
        nombre_contacto, apellidos_contacto, email_contacto, telefono_contacto,
        comunidad_autonoma, provincia, ciudad, barrio, notas,
        instrucciones_maquetacion, estado, comercial_id
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
       RETURNING *`,
      [
        nombre_grupo, tipo_grupo || null, curso || null, pack || null,
        pack_personalizado || null, precio_estimado || null,
        nombre_contacto || null, apellidos_contacto || null,
        email_contacto || null, telefono_contacto || null,
        comunidad_autonoma || null, provincia || null, ciudad || null,
        barrio || null, notas || null, instrucciones_maquetacion || null,
        estado || 'contactado', comercial_id || null,
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('createLead error:', err);
    res.status(500).json({ message: 'Error al crear el lead.' });
  }
};

const updateLead = async (req, res) => {
  const { id } = req.params;
  const {
    nombre_grupo, tipo_grupo, curso, pack, pack_personalizado, precio_estimado,
    nombre_contacto, apellidos_contacto, email_contacto, telefono_contacto,
    comunidad_autonoma, provincia, ciudad, barrio, notas,
    instrucciones_maquetacion, estado, comercial_id,
  } = req.body;

  try {
    const result = await pool.query(
      `UPDATE leads SET
        nombre_grupo=$1, tipo_grupo=$2, curso=$3, pack=$4, pack_personalizado=$5,
        precio_estimado=$6, nombre_contacto=$7, apellidos_contacto=$8,
        email_contacto=$9, telefono_contacto=$10, comunidad_autonoma=$11,
        provincia=$12, ciudad=$13, barrio=$14, notas=$15,
        instrucciones_maquetacion=$16, estado=$17, comercial_id=$18,
        updated_at=NOW()
       WHERE id=$19 RETURNING *`,
      [
        nombre_grupo, tipo_grupo || null, curso || null, pack || null,
        pack_personalizado || null, precio_estimado || null,
        nombre_contacto || null, apellidos_contacto || null,
        email_contacto || null, telefono_contacto || null,
        comunidad_autonoma || null, provincia || null, ciudad || null,
        barrio || null, notas || null, instrucciones_maquetacion || null,
        estado || 'contactado', comercial_id || null, id,
      ]
    );

    if (result.rows.length === 0) return res.status(404).json({ message: 'Lead no encontrado.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('updateLead error:', err);
    res.status(500).json({ message: 'Error al actualizar el lead.' });
  }
};

const updateEstado = async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;

  const valid = ['contactado','no_contesta','en_proceso','proceso_venta','en_produccion','en_envio','completado','perdido'];
  if (!valid.includes(estado)) return res.status(400).json({ message: 'Estado no válido.' });

  try {
    const result = await pool.query(
      `UPDATE leads SET estado=$1, updated_at=NOW() WHERE id=$2 RETURNING *`,
      [estado, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Lead no encontrado.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('updateEstado error:', err);
    res.status(500).json({ message: 'Error al actualizar el estado.' });
  }
};

const deleteLead = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(`DELETE FROM leads WHERE id=$1 RETURNING id`, [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Lead no encontrado.' });
    res.json({ message: 'Lead eliminado correctamente.' });
  } catch (err) {
    console.error('deleteLead error:', err);
    res.status(500).json({ message: 'Error al eliminar el lead.' });
  }
};

const convertirLead = async (req, res) => {
  const { id } = req.params;
  const {
    precio_final, pack, pack_personalizado,
    nombre_contacto, apellidos_contacto, email_contacto, telefono_contacto,
    unidades_estimadas, notas,
  } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const leadResult = await client.query(`SELECT * FROM leads WHERE id=$1`, [id]);
    if (leadResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Lead no encontrado.' });
    }
    const lead = leadResult.rows[0];

    await client.query(
      `INSERT INTO grupos (
        lead_id, nombre_grupo, tipo_grupo, curso, pack, pack_personalizado,
        precio_final, unidades_estimadas,
        nombre_contacto, apellidos_contacto, email_contacto, telefono_contacto,
        comunidad_autonoma, provincia, ciudad, barrio,
        notas, instrucciones_maquetacion,
        estado_venta, estado_aprobacion, comercial_id
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)`,
      [
        lead.id,
        lead.nombre_grupo,
        lead.tipo_grupo,
        lead.curso,
        pack || lead.pack,
        pack_personalizado || lead.pack_personalizado,
        precio_final || lead.precio_estimado,
        unidades_estimadas || null,
        nombre_contacto || lead.nombre_contacto,
        apellidos_contacto || lead.apellidos_contacto,
        email_contacto || lead.email_contacto,
        telefono_contacto || lead.telefono_contacto,
        lead.comunidad_autonoma,
        lead.provincia,
        lead.ciudad,
        lead.barrio,
        notas || lead.notas,
        lead.instrucciones_maquetacion,
        lead.estado,
        'pendiente',
        lead.comercial_id,
      ]
    );

    await client.query(`DELETE FROM leads WHERE id=$1`, [id]);
    await client.query('COMMIT');

    res.json({ message: 'Lead convertido a grupo correctamente.' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('convertirLead error:', err);
    res.status(500).json({ message: 'Error al convertir el lead.' });
  } finally {
    client.release();
  }
};

module.exports = { getLeads, getComercialesForLeads, createLead, updateLead, updateEstado, deleteLead, convertirLead };

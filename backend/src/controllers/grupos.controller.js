const pool = require('../config/database');

const getGrupos = async (req, res) => {
  const { estado_venta, estado_aprobacion, comunidad_autonoma, provincia, ciudad, q } = req.query;

  const conditions = ['1=1'];
  const params = [];
  let n = 1;

  if (estado_venta)       { conditions.push(`g.estado_venta = $${n++}`);                 params.push(estado_venta); }
  if (estado_aprobacion)  { conditions.push(`g.estado_aprobacion = $${n++}`);             params.push(estado_aprobacion); }
  if (comunidad_autonoma) { conditions.push(`g.comunidad_autonoma ILIKE $${n++}`);        params.push(`%${comunidad_autonoma}%`); }
  if (provincia)          { conditions.push(`g.provincia ILIKE $${n++}`);                 params.push(`%${provincia}%`); }
  if (ciudad)             { conditions.push(`g.ciudad ILIKE $${n++}`);                    params.push(`%${ciudad}%`); }
  if (q)                  { conditions.push(`g.nombre_grupo ILIKE $${n++}`);              params.push(`%${q}%`); }

  try {
    const [gruposResult, metricsResult] = await Promise.all([
      pool.query(
        `SELECT g.*,
          TRIM(COALESCE(u.nombre,'') || ' ' || COALESCE(u.apellidos,'')) AS comercial_nombre,
          u.email AS comercial_email
         FROM grupos g
         LEFT JOIN users u ON g.comercial_id = u.id
         WHERE ${conditions.join(' AND ')}
         ORDER BY g.created_at DESC`,
        params
      ),
      pool.query(
        `SELECT
          COUNT(*) FILTER (WHERE estado_venta NOT IN ('completado','perdido')) AS activos,
          COALESCE(SUM(unidades_confirmadas), 0) AS total_confirmadas,
          COALESCE(SUM(unidades_estimadas), 0)   AS total_estimadas
         FROM grupos`
      ),
    ]);

    const m = metricsResult.rows[0];
    res.json({
      grupos: gruposResult.rows,
      metrics: {
        activos: parseInt(m.activos),
        total_confirmadas: parseInt(m.total_confirmadas),
        total_estimadas: parseInt(m.total_estimadas),
      },
    });
  } catch (err) {
    console.error('getGrupos error:', err);
    res.status(500).json({ message: 'Error al obtener grupos.' });
  }
};

const getGrupoById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT g.*,
        TRIM(COALESCE(u.nombre,'') || ' ' || COALESCE(u.apellidos,'')) AS comercial_nombre,
        u.email AS comercial_email
       FROM grupos g
       LEFT JOIN users u ON g.comercial_id = u.id
       WHERE g.id = $1`,
      [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Grupo no encontrado.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('getGrupoById error:', err);
    res.status(500).json({ message: 'Error al obtener el grupo.' });
  }
};

const updateGrupo = async (req, res) => {
  const { id } = req.params;
  const {
    nombre_grupo, tipo_grupo, curso, pack, pack_personalizado,
    precio_final, unidades_estimadas, unidades_confirmadas,
    nombre_contacto, apellidos_contacto, email_contacto, telefono_contacto,
    comunidad_autonoma, provincia, ciudad, barrio,
    notas, instrucciones_maquetacion, comercial_id,
  } = req.body;

  try {
    const result = await pool.query(
      `UPDATE grupos SET
        nombre_grupo=$1, tipo_grupo=$2, curso=$3, pack=$4, pack_personalizado=$5,
        precio_final=$6, unidades_estimadas=$7, unidades_confirmadas=$8,
        nombre_contacto=$9, apellidos_contacto=$10, email_contacto=$11, telefono_contacto=$12,
        comunidad_autonoma=$13, provincia=$14, ciudad=$15, barrio=$16,
        notas=$17, instrucciones_maquetacion=$18, comercial_id=$19,
        updated_at=NOW()
       WHERE id=$20 RETURNING *`,
      [
        nombre_grupo, tipo_grupo || null, curso || null, pack || null,
        pack_personalizado || null, precio_final || null,
        unidades_estimadas || null, unidades_confirmadas || null,
        nombre_contacto || null, apellidos_contacto || null,
        email_contacto || null, telefono_contacto || null,
        comunidad_autonoma || null, provincia || null, ciudad || null, barrio || null,
        notas || null, instrucciones_maquetacion || null,
        comercial_id || null, id,
      ]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Grupo no encontrado.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('updateGrupo error:', err);
    res.status(500).json({ message: 'Error al actualizar el grupo.' });
  }
};

const aprobarGrupo = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `UPDATE grupos SET estado_aprobacion='aprobado', updated_at=NOW() WHERE id=$1 RETURNING *`,
      [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Grupo no encontrado.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('aprobarGrupo error:', err);
    res.status(500).json({ message: 'Error al aprobar el grupo.' });
  }
};

const updateEstadoVenta = async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;
  const valid = ['contactado','no_contesta','en_proceso','proceso_venta','en_produccion','en_envio','completado','perdido'];
  if (!valid.includes(estado)) return res.status(400).json({ message: 'Estado de venta no válido.' });
  try {
    const result = await pool.query(
      `UPDATE grupos SET estado_venta=$1, updated_at=NOW() WHERE id=$2 RETURNING *`,
      [estado, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Grupo no encontrado.' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Error al actualizar estado de venta.' });
  }
};

const updateEstadoFotografo = async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;
  const valid = ['sin_empezar','shooting_hecho','material_editado','material_importado'];
  if (!valid.includes(estado)) return res.status(400).json({ message: 'Estado de fotógrafo no válido.' });
  try {
    const result = await pool.query(
      `UPDATE grupos SET estado_fotografo=$1, updated_at=NOW() WHERE id=$2 RETURNING *`,
      [estado, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Grupo no encontrado.' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Error al actualizar estado del fotógrafo.' });
  }
};

const updateEstadoDisenador = async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;
  const valid = ['sin_empezar','en_proceso','completado'];
  if (!valid.includes(estado)) return res.status(400).json({ message: 'Estado de diseñador no válido.' });
  try {
    const result = await pool.query(
      `UPDATE grupos SET estado_disenador=$1, updated_at=NOW() WHERE id=$2 RETURNING *`,
      [estado, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Grupo no encontrado.' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Error al actualizar estado del diseñador.' });
  }
};

const verificarPago = async (req, res) => {
  const { id } = req.params;
  const { verificado } = req.body;
  try {
    const result = await pool.query(
      `UPDATE grupos SET pago_verificado=$1, updated_at=NOW() WHERE id=$2 RETURNING *`,
      [verificado !== false, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Grupo no encontrado.' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Error al verificar pago.' });
  }
};

module.exports = {
  getGrupos, getGrupoById, updateGrupo, aprobarGrupo,
  updateEstadoVenta, updateEstadoFotografo, updateEstadoDisenador, verificarPago,
};

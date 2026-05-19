const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const {
  getGrupos, getGrupoById, updateGrupo, aprobarGrupo,
  updateEstadoVenta, updateEstadoFotografo, updateEstadoDisenador, verificarPago,
} = require('../controllers/grupos.controller');

router.use(authenticate);

router.get('/', getGrupos);
router.get('/:id', getGrupoById);
router.put('/:id', updateGrupo);

router.put('/:id/aprobar',
  authorize('administrador'),
  aprobarGrupo
);
router.put('/:id/verificar-pago',
  authorize('administrador'),
  verificarPago
);
router.put('/:id/estado-venta',
  authorize('administrador', 'director_comercial', 'comercial'),
  updateEstadoVenta
);
router.put('/:id/estado-fotografo',
  authorize('administrador', 'fotografo'),
  updateEstadoFotografo
);
router.put('/:id/estado-disenador',
  authorize('administrador', 'disenador'),
  updateEstadoDisenador
);

module.exports = router;

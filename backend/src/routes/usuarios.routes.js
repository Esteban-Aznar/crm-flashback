const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const {
  getUsuarios, getUsuarioById, createUsuario, updateUsuario,
  cambiarRol, toggleActivar, deleteUsuario,
  getSolicitudesRol, aprobarSolicitudRol, rechazarSolicitudRol,
} = require('../controllers/usuarios.controller');

router.use(authenticate);

// Solicitudes (before /:id routes)
router.get('/solicitudes-rol', authorize('administrador'), getSolicitudesRol);
router.put('/solicitudes-rol/:id/aprobar', authorize('administrador'), aprobarSolicitudRol);
router.put('/solicitudes-rol/:id/rechazar', authorize('administrador'), rechazarSolicitudRol);

// Usuarios
router.get('/', authorize('administrador'), getUsuarios);
router.get('/:id', authorize('administrador', 'director_comercial'), getUsuarioById);
router.post('/', authorize('administrador', 'director_comercial'), createUsuario);
router.put('/:id', authorize('administrador'), updateUsuario);
router.put('/:id/rol', authorize('administrador'), cambiarRol);
router.put('/:id/activar', authorize('administrador'), toggleActivar);
router.delete('/:id', authorize('administrador'), deleteUsuario);

module.exports = router;

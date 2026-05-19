import api from './auth';

export const usuariosApi = {
  getUsuarios:       ()          => api.get('/usuarios'),
  getUsuarioById:    (id)        => api.get(`/usuarios/${id}`),
  createUsuario:     (data)      => api.post('/usuarios', data),
  updateUsuario:     (id, data)  => api.put(`/usuarios/${id}`, data),
  cambiarRol:        (id, rol)   => api.put(`/usuarios/${id}/rol`, { rol }),
  toggleActivar:     (id, activo)=> api.put(`/usuarios/${id}/activar`, { activo }),
  deleteUsuario:     (id)        => api.delete(`/usuarios/${id}`),
  getSolicitudesRol: ()          => api.get('/usuarios/solicitudes-rol'),
  aprobarSolicitud:  (id)        => api.put(`/usuarios/solicitudes-rol/${id}/aprobar`),
  rechazarSolicitud: (id)        => api.put(`/usuarios/solicitudes-rol/${id}/rechazar`),
};

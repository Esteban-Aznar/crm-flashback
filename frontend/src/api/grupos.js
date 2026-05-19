import api from './auth';

export const gruposApi = {
  getGrupos:            (params) => api.get('/grupos', { params }),
  getGrupoById:         (id)     => api.get(`/grupos/${id}`),
  updateGrupo:          (id, data) => api.put(`/grupos/${id}`, data),
  aprobarGrupo:         (id)     => api.put(`/grupos/${id}/aprobar`),
  updateEstadoVenta:    (id, estado) => api.put(`/grupos/${id}/estado-venta`, { estado }),
  updateEstadoFotografo:(id, estado) => api.put(`/grupos/${id}/estado-fotografo`, { estado }),
  updateEstadoDisenador:(id, estado) => api.put(`/grupos/${id}/estado-disenador`, { estado }),
  verificarPago:        (id, verificado) => api.put(`/grupos/${id}/verificar-pago`, { verificado }),
};

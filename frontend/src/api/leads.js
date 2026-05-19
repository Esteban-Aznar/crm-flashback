import api from './auth';

export const leadsApi = {
  getLeads: (params) => api.get('/leads', { params }),
  getComercialesForLeads: () => api.get('/leads/comerciales'),
  createLead: (data) => api.post('/leads', data),
  updateLead: (id, data) => api.put(`/leads/${id}`, data),
  updateEstado: (id, estado) => api.put(`/leads/${id}/estado`, { estado }),
  deleteLead: (id) => api.delete(`/leads/${id}`),
  convertirLead: (id, data) => api.post(`/leads/${id}/convertir`, data),
};

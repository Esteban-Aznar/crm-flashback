import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout.jsx';
import LeadModal from '../components/LeadModal.jsx';
import ConvertirModal from '../components/ConvertirModal.jsx';
import { leadsApi } from '../api/leads.js';
import { ESTADOS_LEAD, ESTADO_CONFIG, PROVINCIAS } from '../data/provincias.js';

const COMUNIDADES = [...new Set(PROVINCIAS.map((p) => p.comunidad))].sort();

export default function LeadsPage() {
  const [leads, setLeads] = useState([]);
  const [metrics, setMetrics] = useState({ total: 0, activos: 0, convertidos: 0 });
  const [comerciales, setComercialesState] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({ q: '', estado: '', comunidad_autonoma: '', provincia: '', ciudad: '' });

  const [showModal, setShowModal] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [convertingLead, setConvertingLead] = useState(null);

  const [perdidoConfirm, setPerdidoConfirm] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.q) params.q = filters.q;
      if (filters.estado) params.estado = filters.estado;
      if (filters.comunidad_autonoma) params.comunidad_autonoma = filters.comunidad_autonoma;
      if (filters.provincia) params.provincia = filters.provincia;
      if (filters.ciudad) params.ciudad = filters.ciudad;

      const { data } = await leadsApi.getLeads(params);
      setLeads(data.leads);
      setMetrics(data.metrics);
    } catch {
      showToast('Error al cargar los leads.', 'error');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  useEffect(() => {
    leadsApi.getComercialesForLeads().then(({ data }) => setComercialesState(data)).catch(() => {});
  }, []);

  const setFilter = (key, val) => setFilters((f) => ({ ...f, [key]: val }));
  const clearFilters = () => setFilters({ q: '', estado: '', comunidad_autonoma: '', provincia: '', ciudad: '' });

  const handleSaveLead = async (formData) => {
    if (editingLead) {
      await leadsApi.updateLead(editingLead.id, formData);
      showToast('Lead actualizado correctamente.');
    } else {
      await leadsApi.createLead(formData);
      showToast('Lead creado correctamente.');
    }
    setShowModal(false);
    setEditingLead(null);
    fetchLeads();
  };

  const handleEstadoChange = (lead, nuevoEstado) => {
    if (nuevoEstado === 'perdido') {
      setPerdidoConfirm({ lead, nuevoEstado });
    } else {
      confirmEstadoChange(lead.id, nuevoEstado);
    }
  };

  const confirmEstadoChange = async (id, estado) => {
    try {
      await leadsApi.updateEstado(id, estado);
      showToast('Estado actualizado.');
      fetchLeads();
    } catch {
      showToast('Error al actualizar el estado.', 'error');
    }
    setPerdidoConfirm(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;
    try {
      await leadsApi.deleteLead(deleteConfirm.id);
      showToast('Lead eliminado.');
      fetchLeads();
    } catch {
      showToast('Error al eliminar el lead.', 'error');
    }
    setDeleteConfirm(null);
  };

  const handleConvertir = async (formData) => {
    await leadsApi.convertirLead(convertingLead.id, formData);
    showToast('Lead convertido a grupo correctamente.');
    setConvertingLead(null);
    fetchLeads();
  };

  const exportCSV = () => {
    const headers = ['ID','Grupo','Tipo','Curso','Pack','Precio','Contacto','Teléfono','Email','Provincia','Ciudad','Estado','Comercial','Creado'];
    const rows = leads.map((l) => [
      l.id, l.nombre_grupo, l.tipo_grupo, l.curso, l.pack, l.precio_estimado,
      `${l.nombre_contacto || ''} ${l.apellidos_contacto || ''}`.trim(),
      l.telefono_contacto, l.email_contacto, l.provincia, l.ciudad,
      l.estado, l.comercial_nombre,
      new Date(l.created_at).toLocaleDateString('es-ES'),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${v ?? ''}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `leads_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  };

  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <Layout>
      <div style={s.page}>
        {/* Header */}
        <div style={s.header}>
          <div>
            <h1 style={s.pageTitle}>Leads</h1>
            <p style={s.pageSubtitle}>{metrics.total} leads registrados</p>
          </div>
          <div style={s.headerActions}>
            <button style={s.exportBtn} onClick={exportCSV} title="Exportar CSV">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Exportar
            </button>
            <button style={s.newBtn} onClick={() => { setEditingLead(null); setShowModal(true); }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Nuevo Lead
            </button>
          </div>
        </div>

        {/* Metrics */}
        <div style={s.metricsRow}>
          <MetricCard label="Total Leads" value={metrics.total} color="#4a9eff" icon="📋" />
          <MetricCard label="Leads Activos" value={metrics.activos} color="#c9a84c" icon="🔥" />
          <MetricCard label="Convertidos a Grupo" value={metrics.convertidos} color="#4cae74" icon="✅" />
        </div>

        {/* Filters */}
        <div style={s.filtersBar}>
          <div style={s.searchWrap}>
            <svg style={s.searchIcon} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              style={s.searchInput}
              placeholder="Buscar por nombre de grupo..."
              value={filters.q}
              onChange={(e) => setFilter('q', e.target.value)}
            />
          </div>

          <select style={s.filterSelect} value={filters.estado} onChange={(e) => setFilter('estado', e.target.value)}>
            <option value="">Todos los estados</option>
            {ESTADOS_LEAD.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
          </select>

          <select style={s.filterSelect} value={filters.comunidad_autonoma} onChange={(e) => setFilter('comunidad_autonoma', e.target.value)}>
            <option value="">Todas las CC.AA.</option>
            {COMUNIDADES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>

          <input
            style={{ ...s.filterSelect, minWidth: '130px' }}
            placeholder="Provincia..."
            value={filters.provincia}
            onChange={(e) => setFilter('provincia', e.target.value)}
          />

          <input
            style={{ ...s.filterSelect, minWidth: '120px' }}
            placeholder="Ciudad..."
            value={filters.ciudad}
            onChange={(e) => setFilter('ciudad', e.target.value)}
          />

          {hasFilters && (
            <button style={s.clearBtn} onClick={clearFilters}>
              Limpiar filtros
            </button>
          )}
        </div>

        {/* Table */}
        <div style={s.tableWrap}>
          {loading ? (
            <div style={s.emptyState}>
              <div style={s.spinner} />
            </div>
          ) : leads.length === 0 ? (
            <div style={s.emptyState}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#2a2a2a" strokeWidth="1.5">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              <p style={{ color: '#444', marginTop: '12px', fontSize: '14px' }}>
                {hasFilters ? 'No hay leads con los filtros aplicados.' : 'No hay leads todavía. Crea el primero.'}
              </p>
            </div>
          ) : (
            <table style={s.table}>
              <thead>
                <tr>
                  <Th>Grupo</Th>
                  <Th>Comercial</Th>
                  <Th>Organizador</Th>
                  <Th>Presupuesto</Th>
                  <Th>Estado</Th>
                  <Th align="right">Acciones</Th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <LeadRow
                    key={lead.id}
                    lead={lead}
                    onEdit={() => { setEditingLead(lead); setShowModal(true); }}
                    onConvertir={() => setConvertingLead(lead)}
                    onDelete={() => setDeleteConfirm(lead)}
                    onEstadoChange={(est) => handleEstadoChange(lead, est)}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modals */}
      {showModal && (
        <LeadModal
          lead={editingLead}
          comerciales={comerciales}
          onClose={() => { setShowModal(false); setEditingLead(null); }}
          onSave={handleSaveLead}
        />
      )}

      {convertingLead && (
        <ConvertirModal
          lead={convertingLead}
          onClose={() => setConvertingLead(null)}
          onConfirm={handleConvertir}
        />
      )}

      {/* Confirmación "perdido" */}
      {perdidoConfirm && (
        <div style={s.miniOverlay}>
          <div style={s.miniModal}>
            <div style={{ fontSize: '28px', marginBottom: '12px' }}>⚠️</div>
            <h3 style={{ color: '#f0f0f0', fontFamily: 'Montserrat,sans-serif', marginBottom: '8px', fontSize: '16px' }}>
              Marcar como Perdido
            </h3>
            <p style={{ color: '#888', fontSize: '13px', lineHeight: 1.5, marginBottom: '20px' }}>
              ¿Estás seguro de que quieres marcar <strong style={{ color: '#ddd' }}>{perdidoConfirm.lead.nombre_grupo}</strong> como perdido?
              Esta acción indica que la oportunidad no se cerrará.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button style={s.cancelBtn} onClick={() => setPerdidoConfirm(null)}>Cancelar</button>
              <button style={s.dangerBtn} onClick={() => confirmEstadoChange(perdidoConfirm.lead.id, 'perdido')}>
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmación eliminar */}
      {deleteConfirm && (
        <div style={s.miniOverlay}>
          <div style={s.miniModal}>
            <div style={{ fontSize: '28px', marginBottom: '12px' }}>🗑️</div>
            <h3 style={{ color: '#f0f0f0', fontFamily: 'Montserrat,sans-serif', marginBottom: '8px', fontSize: '16px' }}>
              Eliminar Lead
            </h3>
            <p style={{ color: '#888', fontSize: '13px', lineHeight: 1.5, marginBottom: '20px' }}>
              ¿Eliminar <strong style={{ color: '#ddd' }}>{deleteConfirm.nombre_grupo}</strong>? Esta acción no se puede deshacer.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button style={s.cancelBtn} onClick={() => setDeleteConfirm(null)}>Cancelar</button>
              <button style={s.dangerBtn} onClick={handleDeleteConfirm}>Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ ...s.toast, background: toast.type === 'error' ? '#3a1010' : '#0d2a1a', borderColor: toast.type === 'error' ? '#e05252' : '#4cae74' }}>
          <span style={{ color: toast.type === 'error' ? '#e05252' : '#4cae74' }}>{toast.msg}</span>
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </Layout>
  );
}

function MetricCard({ label, value, color, icon }) {
  return (
    <div style={s.metricCard}>
      <span style={{ fontSize: '20px' }}>{icon}</span>
      <span style={{ ...s.metricValue, color }}>{value}</span>
      <span style={s.metricLabel}>{label}</span>
    </div>
  );
}

function Th({ children, align }) {
  return (
    <th style={{ ...s.th, textAlign: align || 'left' }}>{children}</th>
  );
}

function LeadRow({ lead, onEdit, onConvertir, onDelete, onEstadoChange }) {
  const est = ESTADO_CONFIG[lead.estado] || {};
  return (
    <tr style={s.tr}>
      <td style={s.td}>
        <div style={s.groupName}>{lead.nombre_grupo || '—'}</div>
        <div style={s.groupMeta}>
          {lead.tipo_grupo && <span style={s.badge}>{lead.tipo_grupo}</span>}
          {lead.curso && <span style={s.badge}>{lead.curso}</span>}
          {lead.pack && <span style={{ ...s.badge, color: '#c9a84c', borderColor: 'rgba(201,168,76,0.3)' }}>{lead.pack}</span>}
        </div>
      </td>
      <td style={s.td}>
        <span style={{ fontSize: '13px', color: lead.comercial_nombre?.trim() ? '#ccc' : '#444' }}>
          {lead.comercial_nombre?.trim() || 'Sin asignar'}
        </span>
      </td>
      <td style={s.td}>
        {lead.nombre_contacto ? (
          <div>
            <div style={{ fontSize: '13px', color: '#ddd', fontWeight: 500 }}>
              {lead.nombre_contacto} {lead.apellidos_contacto}
            </div>
            {lead.telefono_contacto && <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>{lead.telefono_contacto}</div>}
            {lead.email_contacto && <div style={{ fontSize: '12px', color: '#666' }}>{lead.email_contacto}</div>}
            {(lead.ciudad || lead.provincia) && (
              <div style={{ fontSize: '11px', color: '#555', marginTop: '2px' }}>
                {[lead.barrio, lead.ciudad, lead.provincia].filter(Boolean).join(', ')}
              </div>
            )}
          </div>
        ) : <span style={{ color: '#444', fontSize: '13px' }}>—</span>}
      </td>
      <td style={s.td}>
        {lead.precio_estimado ? (
          <span style={{ fontSize: '14px', color: '#c9a84c', fontWeight: 600, fontFamily: 'Montserrat,sans-serif' }}>
            {parseFloat(lead.precio_estimado).toFixed(2)} €
          </span>
        ) : <span style={{ color: '#444', fontSize: '13px' }}>—</span>}
      </td>
      <td style={s.td}>
        <select
          style={{ ...s.estadoSelect, color: est.color, borderColor: est.color + '44', background: est.bg }}
          value={lead.estado}
          onChange={(e) => onEstadoChange(e.target.value)}
        >
          {Object.entries(ESTADO_CONFIG).map(([val, cfg]) => (
            <option key={val} value={val}>{cfg.label}</option>
          ))}
        </select>
      </td>
      <td style={{ ...s.td, textAlign: 'right' }}>
        <div style={s.actions}>
          <ActionBtn title="Editar" onClick={onEdit} color="#888">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </ActionBtn>
          <ActionBtn title="Convertir a grupo" onClick={onConvertir} color="#4cae74">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 11 12 14 22 4"/>
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
            </svg>
          </ActionBtn>
          <ActionBtn title="Eliminar" onClick={onDelete} color="#e05252">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/>
              <path d="M9 6V4h6v2"/>
            </svg>
          </ActionBtn>
        </div>
      </td>
    </tr>
  );
}

function ActionBtn({ title, onClick, color, children }) {
  return (
    <button
      title={title}
      onClick={onClick}
      style={{ ...s.actionBtn, color }}
      onMouseEnter={(e) => { e.currentTarget.style.background = color + '18'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
    >
      {children}
    </button>
  );
}

const s = {
  page: { padding: '28px 32px', flex: 1 },
  header: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' },
  pageTitle: { fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '22px', color: '#f0f0f0' },
  pageSubtitle: { fontSize: '12px', color: '#555', marginTop: '3px' },
  headerActions: { display: 'flex', gap: '10px', alignItems: 'center' },
  exportBtn: {
    display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 16px',
    background: 'none', border: '1px solid #2a2a2a', borderRadius: '8px',
    color: '#888', fontSize: '13px', cursor: 'pointer', fontFamily: 'Inter, sans-serif',
  },
  newBtn: {
    display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 18px',
    background: 'linear-gradient(135deg, #c9a84c, #a08030)', border: 'none', borderRadius: '8px',
    color: '#0a0a0a', fontFamily: 'Montserrat, sans-serif', fontWeight: 700,
    fontSize: '13px', cursor: 'pointer', letterSpacing: '0.3px',
  },
  metricsRow: { display: 'flex', gap: '14px', marginBottom: '20px' },
  metricCard: {
    flex: 1, background: '#111', border: '1px solid #1e1e1e', borderRadius: '10px',
    padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '6px',
  },
  metricValue: { fontSize: '26px', fontWeight: 700, fontFamily: 'Montserrat, sans-serif' },
  metricLabel: { fontSize: '11px', color: '#555' },
  filtersBar: {
    display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap',
    marginBottom: '16px',
  },
  searchWrap: {
    position: 'relative', display: 'flex', alignItems: 'center', flex: '1', minWidth: '200px',
  },
  searchIcon: { position: 'absolute', left: '12px', color: '#555', pointerEvents: 'none' },
  searchInput: {
    width: '100%', padding: '9px 12px 9px 34px', background: '#111', border: '1px solid #222',
    borderRadius: '8px', color: '#f0f0f0', fontSize: '13px', outline: 'none', fontFamily: 'Inter, sans-serif',
  },
  filterSelect: {
    padding: '9px 12px', background: '#111', border: '1px solid #222',
    borderRadius: '8px', color: '#ccc', fontSize: '13px', outline: 'none',
    fontFamily: 'Inter, sans-serif', cursor: 'pointer',
  },
  clearBtn: {
    padding: '9px 14px', background: 'none', border: '1px solid #2a2a2a',
    borderRadius: '8px', color: '#555', fontSize: '12px', cursor: 'pointer',
    fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap',
  },
  tableWrap: {
    background: '#111', border: '1px solid #1e1e1e', borderRadius: '10px', overflow: 'hidden',
  },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: {
    padding: '10px 14px', fontSize: '11px', fontWeight: 600, color: '#444',
    letterSpacing: '0.8px', textTransform: 'uppercase', borderBottom: '1px solid #1a1a1a',
    background: '#0e0e0e', whiteSpace: 'nowrap',
  },
  tr: { borderBottom: '1px solid #161616' },
  td: { padding: '12px 14px', verticalAlign: 'middle' },
  groupName: { fontSize: '13px', fontWeight: 600, color: '#e0e0e0', marginBottom: '4px' },
  groupMeta: { display: 'flex', gap: '5px', flexWrap: 'wrap' },
  badge: {
    display: 'inline-block', padding: '2px 7px', borderRadius: '4px', fontSize: '10px',
    fontWeight: 500, border: '1px solid #2a2a2a', color: '#666', background: '#0d0d0d',
  },
  estadoSelect: {
    padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
    border: '1px solid', cursor: 'pointer', outline: 'none', fontFamily: 'Inter, sans-serif',
  },
  actions: { display: 'flex', gap: '4px', justifyContent: 'flex-end' },
  actionBtn: {
    background: 'none', border: 'none', cursor: 'pointer', padding: '6px',
    borderRadius: '6px', display: 'flex', alignItems: 'center', transition: 'background 0.15s',
  },
  emptyState: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', padding: '60px 20px',
  },
  spinner: {
    width: '28px', height: '28px', border: '2px solid #1e1e1e',
    borderTop: '2px solid #c9a84c', borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
  },
  miniOverlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100,
  },
  miniModal: {
    background: '#111', border: '1px solid #222', borderRadius: '12px',
    padding: '28px', maxWidth: '380px', width: '100%',
  },
  cancelBtn: {
    padding: '9px 18px', background: 'none', border: '1px solid #2a2a2a',
    borderRadius: '7px', color: '#888', fontSize: '13px', cursor: 'pointer',
    fontFamily: 'Inter, sans-serif',
  },
  dangerBtn: {
    padding: '9px 18px', background: '#e05252', border: 'none',
    borderRadius: '7px', color: '#fff', fontSize: '13px', cursor: 'pointer',
    fontFamily: 'Montserrat, sans-serif', fontWeight: 700,
  },
  toast: {
    position: 'fixed', bottom: '24px', right: '24px', padding: '12px 20px',
    borderRadius: '8px', border: '1px solid', fontSize: '13px', zIndex: 2000,
    display: 'flex', alignItems: 'center', gap: '8px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
  },
};

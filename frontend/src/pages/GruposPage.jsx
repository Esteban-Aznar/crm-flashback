import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout.jsx';
import GrupoDetailModal from '../components/GrupoDetailModal.jsx';
import GrupoEditModal from '../components/GrupoEditModal.jsx';
import { gruposApi } from '../api/grupos.js';
import { leadsApi } from '../api/leads.js';
import {
  ESTADOS_LEAD, ESTADO_CONFIG,
  ESTADO_APROBACION_CONFIG, ESTADO_FOTOGRAFO_CONFIG, ESTADO_DISENADOR_CONFIG,
  PROVINCIAS,
} from '../data/provincias.js';

const COMUNIDADES = [...new Set(PROVINCIAS.map((p) => p.comunidad))].sort();

export default function GruposPage() {
  const [grupos, setGrupos] = useState([]);
  const [metrics, setMetrics] = useState({ activos: 0, total_confirmadas: 0, total_estimadas: 0 });
  const [comerciales, setComercialesState] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({ q: '', estado_venta: '', estado_aprobacion: '', comunidad_autonoma: '', provincia: '', ciudad: '' });

  const [detailGrupo, setDetailGrupo] = useState(null);
  const [editGrupo, setEditGrupo] = useState(null);
  const [perdidoConfirm, setPerdidoConfirm] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'ok') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };

  const fetchGrupos = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.q)                 params.q = filters.q;
      if (filters.estado_venta)      params.estado_venta = filters.estado_venta;
      if (filters.estado_aprobacion) params.estado_aprobacion = filters.estado_aprobacion;
      if (filters.comunidad_autonoma)params.comunidad_autonoma = filters.comunidad_autonoma;
      if (filters.provincia)         params.provincia = filters.provincia;
      if (filters.ciudad)            params.ciudad = filters.ciudad;

      const { data } = await gruposApi.getGrupos(params);
      setGrupos(data.grupos);
      setMetrics(data.metrics);
    } catch {
      showToast('Error al cargar los grupos.', 'err');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchGrupos(); }, [fetchGrupos]);
  useEffect(() => {
    leadsApi.getComercialesForLeads().then(({ data }) => setComercialesState(data)).catch(() => {});
  }, []);

  const setFilter = (key, val) => setFilters((f) => ({ ...f, [key]: val }));
  const clearFilters = () => setFilters({ q: '', estado_venta: '', estado_aprobacion: '', comunidad_autonoma: '', provincia: '', ciudad: '' });
  const hasFilters = Object.values(filters).some(Boolean);

  const handleEstadoChange = (grupo, estado) => {
    if (estado === 'perdido') { setPerdidoConfirm({ grupo, estado }); return; }
    confirmEstado(grupo.id, estado);
  };

  const confirmEstado = async (id, estado) => {
    try {
      await gruposApi.updateEstadoVenta(id, estado);
      showToast('Estado actualizado.');
      fetchGrupos();
    } catch { showToast('Error al actualizar estado.', 'err'); }
    setPerdidoConfirm(null);
  };

  const handleSaveEdit = async (formData) => {
    await gruposApi.updateGrupo(editGrupo.id, formData);
    showToast('Grupo actualizado.');
    setEditGrupo(null);
    if (detailGrupo?.id === editGrupo.id) setDetailGrupo(null);
    fetchGrupos();
  };

  const handleDetailUpdate = (updated) => {
    setGrupos((prev) => prev.map((g) => g.id === updated.id ? { ...g, ...updated } : g));
  };

  const globalPct = metrics.total_estimadas
    ? Math.min(100, Math.round((metrics.total_confirmadas / metrics.total_estimadas) * 100))
    : 0;

  const exportCSV = () => {
    const headers = ['ID','Grupo','Tipo','Pack','Precio','Unid.Est.','Unid.Conf.','Contacto','Teléfono','Email','Provincia','Ciudad','Estado Venta','Estado Aprobación','Estado Fotógrafo','Estado Diseñador','Pago Verificado','Comercial','Creado'];
    const rows = grupos.map((g) => [
      g.id, g.nombre_grupo, g.tipo_grupo, g.pack, g.precio_final,
      g.unidades_estimadas, g.unidades_confirmadas,
      `${g.nombre_contacto || ''} ${g.apellidos_contacto || ''}`.trim(),
      g.telefono_contacto, g.email_contacto, g.provincia, g.ciudad,
      g.estado_venta, g.estado_aprobacion, g.estado_fotografo, g.estado_disenador,
      g.pago_verificado ? 'Sí' : 'No', g.comercial_nombre,
      new Date(g.created_at).toLocaleDateString('es-ES'),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${v ?? ''}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `grupos_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  };

  return (
    <Layout>
      <div style={s.page}>
        {/* Header */}
        <div style={s.header}>
          <div>
            <h1 style={s.pageTitle}>Grupos</h1>
            <p style={s.pageSubtitle}>{metrics.activos} grupos activos</p>
          </div>
          <button style={s.exportBtn} onClick={exportCSV}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Exportar
          </button>
        </div>

        {/* Metrics */}
        <div style={s.metricsRow}>
          <div style={s.metricCard}>
            <span style={{ fontSize: '20px' }}>📦</span>
            <span style={{ ...s.metricValue, color: '#4a9eff' }}>{metrics.activos}</span>
            <span style={s.metricLabel}>Grupos activos</span>
          </div>
          <div style={{ ...s.metricCard, flex: 2 }}>
            <div style={s.unidadesHeader}>
              <span style={{ fontSize: '20px' }}>👥</span>
              <span style={s.metricLabel}>Unidades vendidas</span>
              <span style={s.unidadesPct}>{globalPct}%</span>
            </div>
            <div style={s.unidadesNums}>
              <span style={{ color: '#c9a84c', fontWeight: 700, fontFamily: 'Montserrat,sans-serif', fontSize: '22px' }}>
                {metrics.total_confirmadas}
              </span>
              <span style={{ color: '#444', fontSize: '16px', margin: '0 6px' }}>/</span>
              <span style={{ color: '#555', fontSize: '16px' }}>{metrics.total_estimadas}</span>
              <span style={{ color: '#444', fontSize: '12px', marginLeft: '6px' }}>confirmadas / estimadas</span>
            </div>
            <div style={s.globalBar}>
              <div style={{ ...s.globalFill, width: `${globalPct}%` }} />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div style={s.filtersBar}>
          <div style={s.searchWrap}>
            <svg style={s.searchIcon} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input style={s.searchInput} placeholder="Buscar por nombre de grupo..." value={filters.q} onChange={(e) => setFilter('q', e.target.value)} />
          </div>
          <select style={s.filterSelect} value={filters.estado_venta} onChange={(e) => setFilter('estado_venta', e.target.value)}>
            <option value="">Todos los estados</option>
            {ESTADOS_LEAD.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
          </select>
          <select style={s.filterSelect} value={filters.estado_aprobacion} onChange={(e) => setFilter('estado_aprobacion', e.target.value)}>
            <option value="">Aprobación: todas</option>
            <option value="pendiente">Pendiente</option>
            <option value="aprobado">Aprobado</option>
          </select>
          <select style={s.filterSelect} value={filters.comunidad_autonoma} onChange={(e) => setFilter('comunidad_autonoma', e.target.value)}>
            <option value="">Todas las CC.AA.</option>
            {COMUNIDADES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <input style={{ ...s.filterSelect, minWidth: '120px' }} placeholder="Provincia..." value={filters.provincia} onChange={(e) => setFilter('provincia', e.target.value)} />
          <input style={{ ...s.filterSelect, minWidth: '110px' }} placeholder="Ciudad..." value={filters.ciudad} onChange={(e) => setFilter('ciudad', e.target.value)} />
          {hasFilters && <button style={s.clearBtn} onClick={clearFilters}>Limpiar</button>}
        </div>

        {/* Table */}
        <div style={s.tableWrap}>
          {loading ? (
            <div style={s.emptyState}><div style={s.spinner} /></div>
          ) : grupos.length === 0 ? (
            <div style={s.emptyState}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#2a2a2a" strokeWidth="1.5">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
              <p style={{ color: '#444', marginTop: '12px', fontSize: '14px' }}>
                {hasFilters ? 'No hay grupos con los filtros aplicados.' : 'No hay grupos todavía. Convierte un lead para crear el primero.'}
              </p>
            </div>
          ) : (
            <table style={s.table}>
              <thead>
                <tr>
                  <Th>Grupo</Th>
                  <Th>Comercial</Th>
                  <Th>Organizador</Th>
                  <Th>Unidades</Th>
                  <Th>Precio</Th>
                  <Th>Producción</Th>
                  <Th align="right">Acciones</Th>
                </tr>
              </thead>
              <tbody>
                {grupos.map((grupo) => (
                  <GrupoRow
                    key={grupo.id}
                    grupo={grupo}
                    onVerDetalle={() => setDetailGrupo(grupo)}
                    onEditar={() => setEditGrupo(grupo)}
                    onEstadoChange={(est) => handleEstadoChange(grupo, est)}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modales */}
      {detailGrupo && (
        <GrupoDetailModal
          grupo={detailGrupo}
          onClose={() => setDetailGrupo(null)}
          onUpdate={handleDetailUpdate}
          onEdit={() => { setEditGrupo(detailGrupo); setDetailGrupo(null); }}
        />
      )}

      {editGrupo && (
        <GrupoEditModal
          grupo={editGrupo}
          comerciales={comerciales}
          onClose={() => setEditGrupo(null)}
          onSave={handleSaveEdit}
        />
      )}

      {/* Confirmación perdido */}
      {perdidoConfirm && (
        <div style={s.miniOverlay}>
          <div style={s.miniModal}>
            <div style={{ fontSize: '28px', marginBottom: '12px' }}>⚠️</div>
            <h3 style={{ color: '#f0f0f0', fontFamily: 'Montserrat,sans-serif', marginBottom: '8px', fontSize: '16px' }}>
              Marcar como Perdido
            </h3>
            <p style={{ color: '#888', fontSize: '13px', lineHeight: 1.5, marginBottom: '20px' }}>
              ¿Marcar <strong style={{ color: '#ddd' }}>{perdidoConfirm.grupo.nombre_grupo}</strong> como perdido?
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button style={s.cancelBtn} onClick={() => setPerdidoConfirm(null)}>Cancelar</button>
              <button style={s.dangerBtn} onClick={() => confirmEstado(perdidoConfirm.grupo.id, 'perdido')}>Confirmar</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div style={{ ...s.toast, background: toast.type === 'err' ? '#3a1010' : '#0d2a1a', borderColor: toast.type === 'err' ? '#e05252' : '#4cae74' }}>
          <span style={{ color: toast.type === 'err' ? '#e05252' : '#4cae74' }}>{toast.msg}</span>
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </Layout>
  );
}

function Th({ children, align }) {
  return <th style={{ ...s.th, textAlign: align || 'left' }}>{children}</th>;
}

function GrupoRow({ grupo, onVerDetalle, onEditar, onEstadoChange }) {
  const est      = ESTADO_CONFIG[grupo.estado_venta] || {};
  const aprobEst = ESTADO_APROBACION_CONFIG[grupo.estado_aprobacion] || {};
  const fotoEst  = ESTADO_FOTOGRAFO_CONFIG[grupo.estado_fotografo] || {};
  const diseEst  = ESTADO_DISENADOR_CONFIG[grupo.estado_disenador] || {};

  const unidConf = grupo.unidades_confirmadas ?? 0;
  const unidEst  = grupo.unidades_estimadas ?? 0;
  const pct = unidEst > 0 ? Math.min(100, Math.round((unidConf / unidEst) * 100)) : 0;

  return (
    <tr style={s.tr}>
      {/* Grupo */}
      <td style={s.td}>
        <div style={s.groupName}>{grupo.nombre_grupo || '—'}</div>
        <div style={s.groupMeta}>
          {grupo.tipo_grupo && <span style={s.metaBadge}>{grupo.tipo_grupo}</span>}
          {grupo.curso && <span style={s.metaBadge}>{grupo.curso}</span>}
        </div>
        <div style={{ display: 'flex', gap: '5px', marginTop: '4px', flexWrap: 'wrap' }}>
          <span style={{ ...s.statusBadge, color: est.color, background: est.bg }}>{est.label}</span>
          <span style={{ ...s.statusBadge, color: aprobEst.color, background: aprobEst.bg }}>{aprobEst.label}</span>
          {grupo.pago_verificado && (
            <span style={{ ...s.statusBadge, color: '#4cae74', background: 'rgba(76,174,116,0.1)' }}>💳 Pagado</span>
          )}
        </div>
      </td>

      {/* Comercial */}
      <td style={s.td}>
        <div style={{ fontSize: '13px', color: grupo.comercial_nombre?.trim() ? '#ccc' : '#444', fontWeight: 500 }}>
          {grupo.comercial_nombre?.trim() || 'Sin asignar'}
        </div>
        {grupo.comercial_email && (
          <div style={{ fontSize: '11px', color: '#555', marginTop: '2px' }}>{grupo.comercial_email}</div>
        )}
      </td>

      {/* Organizador */}
      <td style={s.td}>
        {grupo.nombre_contacto ? (
          <div>
            <div style={{ fontSize: '13px', color: '#ddd', fontWeight: 500 }}>
              {grupo.nombre_contacto} {grupo.apellidos_contacto}
            </div>
            {grupo.telefono_contacto && <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>{grupo.telefono_contacto}</div>}
            {grupo.email_contacto && <div style={{ fontSize: '11px', color: '#666' }}>{grupo.email_contacto}</div>}
            <div style={{ fontSize: '10px', color: '#444', marginTop: '2px' }}>
              {[grupo.barrio, grupo.ciudad, grupo.provincia].filter(Boolean).join(', ')}
            </div>
          </div>
        ) : <span style={{ color: '#444', fontSize: '13px' }}>—</span>}
      </td>

      {/* Unidades */}
      <td style={s.td}>
        <div style={s.unidCell}>
          <span style={{ fontSize: '13px', color: '#c9a84c', fontWeight: 600, fontFamily: 'Montserrat,sans-serif' }}>
            {unidConf}
          </span>
          <span style={{ color: '#444', fontSize: '12px' }}>/{unidEst}</span>
        </div>
        {unidEst > 0 && (
          <>
            <div style={s.miniBar}>
              <div style={{ ...s.miniBarFill, width: `${pct}%` }} />
            </div>
            <div style={{ fontSize: '10px', color: '#555' }}>{pct}%</div>
          </>
        )}
      </td>

      {/* Precio */}
      <td style={s.td}>
        {grupo.precio_final
          ? <span style={{ fontSize: '13px', color: '#c9a84c', fontWeight: 600, fontFamily: 'Montserrat,sans-serif' }}>{parseFloat(grupo.precio_final).toFixed(2)} €</span>
          : <span style={{ color: '#444', fontSize: '13px' }}>—</span>
        }
      </td>

      {/* Producción */}
      <td style={s.td}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '10px', color: '#555', width: '52px' }}>Fotógrafo</span>
            <span style={{ ...s.statusBadge, color: fotoEst.color, background: fotoEst.bg, fontSize: '10px' }}>{fotoEst.label}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '10px', color: '#555', width: '52px' }}>Diseñador</span>
            <span style={{ ...s.statusBadge, color: diseEst.color, background: diseEst.bg, fontSize: '10px' }}>{diseEst.label}</span>
          </div>
        </div>
      </td>

      {/* Acciones */}
      <td style={{ ...s.td, textAlign: 'right' }}>
        <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
          <ActionBtn title="Ver detalle" onClick={onVerDetalle} color="#4a9eff">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
            </svg>
          </ActionBtn>
          <ActionBtn title="Editar" onClick={onEditar} color="#888">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </ActionBtn>
        </div>
      </td>
    </tr>
  );
}

function ActionBtn({ title, onClick, color, children }) {
  return (
    <button title={title} onClick={onClick} style={{ ...s.actionBtn, color }}
      onMouseEnter={(e) => { e.currentTarget.style.background = color + '18'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}>
      {children}
    </button>
  );
}

const s = {
  page: { padding: '28px 32px', flex: 1 },
  header: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' },
  pageTitle: { fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '22px', color: '#f0f0f0' },
  pageSubtitle: { fontSize: '12px', color: '#555', marginTop: '3px' },
  exportBtn: {
    display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 16px',
    background: 'none', border: '1px solid #2a2a2a', borderRadius: '8px',
    color: '#888', fontSize: '13px', cursor: 'pointer', fontFamily: 'Inter, sans-serif',
  },
  metricsRow: { display: 'flex', gap: '14px', marginBottom: '20px' },
  metricCard: {
    flex: 1, background: '#111', border: '1px solid #1e1e1e', borderRadius: '10px',
    padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '6px',
  },
  metricValue: { fontSize: '26px', fontWeight: 700, fontFamily: 'Montserrat, sans-serif' },
  metricLabel: { fontSize: '11px', color: '#555' },
  unidadesHeader: { display: 'flex', alignItems: 'center', gap: '8px' },
  unidadesPct: {
    marginLeft: 'auto', fontSize: '13px', fontWeight: 700, color: '#c9a84c',
    fontFamily: 'Montserrat, sans-serif',
  },
  unidadesNums: { display: 'flex', alignItems: 'baseline', gap: '0px' },
  globalBar: { height: '4px', background: '#1e1e1e', borderRadius: '2px', overflow: 'hidden', marginTop: '4px' },
  globalFill: { height: '100%', background: 'linear-gradient(90deg, #c9a84c, #4cae74)', borderRadius: '2px', transition: 'width 0.3s' },
  filtersBar: { display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '16px' },
  searchWrap: { position: 'relative', display: 'flex', alignItems: 'center', flex: '1', minWidth: '200px' },
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
  tableWrap: { background: '#111', border: '1px solid #1e1e1e', borderRadius: '10px', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: {
    padding: '10px 14px', fontSize: '11px', fontWeight: 600, color: '#444',
    letterSpacing: '0.8px', textTransform: 'uppercase', borderBottom: '1px solid #1a1a1a',
    background: '#0e0e0e', whiteSpace: 'nowrap',
  },
  tr: { borderBottom: '1px solid #161616' },
  td: { padding: '11px 14px', verticalAlign: 'middle' },
  groupName: { fontSize: '13px', fontWeight: 600, color: '#e0e0e0', marginBottom: '3px' },
  groupMeta: { display: 'flex', gap: '5px', flexWrap: 'wrap' },
  metaBadge: {
    display: 'inline-block', padding: '2px 7px', borderRadius: '4px', fontSize: '10px',
    fontWeight: 500, border: '1px solid #2a2a2a', color: '#666', background: '#0d0d0d',
  },
  statusBadge: {
    display: 'inline-block', padding: '2px 8px', borderRadius: '5px',
    fontSize: '11px', fontWeight: 600,
  },
  unidCell: { display: 'flex', alignItems: 'baseline', gap: '2px', marginBottom: '4px' },
  miniBar: { height: '4px', background: '#1e1e1e', borderRadius: '2px', overflow: 'hidden', marginBottom: '3px', maxWidth: '80px' },
  miniBarFill: { height: '100%', background: 'linear-gradient(90deg, #c9a84c, #4cae74)', borderRadius: '2px' },
  actionBtn: {
    background: 'none', border: 'none', cursor: 'pointer', padding: '6px',
    borderRadius: '6px', display: 'flex', alignItems: 'center', transition: 'background 0.15s',
  },
  emptyState: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px' },
  spinner: {
    width: '28px', height: '28px', border: '2px solid #1e1e1e',
    borderTop: '2px solid #c9a84c', borderRadius: '50%', animation: 'spin 0.7s linear infinite',
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
    borderRadius: '7px', color: '#888', fontSize: '13px', cursor: 'pointer', fontFamily: 'Inter, sans-serif',
  },
  dangerBtn: {
    padding: '9px 18px', background: '#e05252', border: 'none',
    borderRadius: '7px', color: '#fff', fontSize: '13px', cursor: 'pointer',
    fontFamily: 'Montserrat, sans-serif', fontWeight: 700,
  },
  toast: {
    position: 'fixed', bottom: '24px', right: '24px', padding: '12px 20px',
    borderRadius: '8px', border: '1px solid', fontSize: '13px', zIndex: 2000,
    boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
  },
};

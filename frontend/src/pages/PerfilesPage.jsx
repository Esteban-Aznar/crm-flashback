import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout.jsx';
import UsuarioModal, { RolBadge } from '../components/UsuarioModal.jsx';
import CambiarRolModal from '../components/CambiarRolModal.jsx';
import { usuariosApi } from '../api/usuarios.js';
import { useAuth } from '../context/AuthContext';
import { ROL_CONFIG } from '../data/provincias.js';

export default function PerfilesPage() {
  const { user: currentUser } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [solicitudes, setSolicitudes] = useState([]);
  const [totalAdmins, setTotalAdmins] = useState(1);
  const [loading, setLoading] = useState(true);

  const [showCreate, setShowCreate] = useState(false);
  const [viewUsuario, setViewUsuario] = useState(null);
  const [editUsuario, setEditUsuario] = useState(null);
  const [rolUsuario, setRolUsuario] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'ok') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [usuariosRes, solicitudesRes] = await Promise.all([
        usuariosApi.getUsuarios(),
        usuariosApi.getSolicitudesRol(),
      ]);
      setUsuarios(usuariosRes.data);
      setSolicitudes(solicitudesRes.data.solicitudes || []);
      setTotalAdmins(solicitudesRes.data.total_admins || 1);
    } catch {
      showToast('Error al cargar datos.', 'err');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreateSave = async (data) => {
    await usuariosApi.createUsuario(data);
    showToast('Usuario creado correctamente.');
    setShowCreate(false);
    fetchData();
  };

  const handleEditSave = async (data) => {
    await usuariosApi.updateUsuario(editUsuario.id, data);
    showToast('Usuario actualizado.');
    setEditUsuario(null);
    fetchData();
  };

  const handleCambiarRol = async (rolNuevo) => {
    const { data } = await usuariosApi.cambiarRol(rolUsuario.id, rolNuevo);
    fetchData();
    return data; // { directo, message }
  };

  const handleToggleActivar = async (usuario) => {
    try {
      await usuariosApi.toggleActivar(usuario.id, !usuario.activo);
      showToast(`Usuario ${!usuario.activo ? 'activado' : 'desactivado'}.`);
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Error.', 'err');
    }
  };

  const handleDelete = async () => {
    try {
      await usuariosApi.deleteUsuario(deleteConfirm.id);
      showToast('Usuario eliminado.');
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Error al eliminar.', 'err');
    }
    setDeleteConfirm(null);
  };

  const handleAprobar = async (id) => {
    try {
      const { data } = await usuariosApi.aprobarSolicitud(id);
      showToast(data.message);
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Error.', 'err');
    }
  };

  const handleRechazar = async (id) => {
    try {
      await usuariosApi.rechazarSolicitud(id);
      showToast('Solicitud rechazada.');
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Error.', 'err');
    }
  };

  const myId = currentUser?.id;

  return (
    <Layout>
      <div style={s.page}>
        {/* Header */}
        <div style={s.header}>
          <div>
            <h1 style={s.pageTitle}>Perfiles y Usuarios</h1>
            <p style={s.pageSubtitle}>{usuarios.length} usuarios registrados</p>
          </div>
          <button style={s.newBtn} onClick={() => setShowCreate(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Nuevo usuario
          </button>
        </div>

        {/* Solicitudes pendientes */}
        {solicitudes.length > 0 && (
          <div style={s.solicitudesCard}>
            <div style={s.solicitudesHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={s.solicitudesBadge}>{solicitudes.length}</span>
                <span style={s.solicitudesTitle}>Solicitudes de cambio de rol pendientes de aprobación</span>
              </div>
            </div>
            <div style={s.solicitudesList}>
              {solicitudes.map((sol) => {
                const yaAprobeMio = sol.aprobaciones.includes(myId);
                const aprobCount = sol.aprobaciones.length;
                return (
                  <div key={sol.id} style={s.solicitudRow}>
                    <div style={s.solicitudInfo}>
                      <div style={s.solicitudUser}>
                        <div style={s.solicitudAvatar}>{sol.usuario_nombre?.[0]?.toUpperCase()}</div>
                        <div>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: '#ddd' }}>
                            {sol.usuario_nombre} {sol.usuario_apellidos}
                          </span>
                          <span style={{ fontSize: '11px', color: '#555', marginLeft: '6px' }}>{sol.usuario_email}</span>
                        </div>
                      </div>
                      <div style={s.solicitudRoles}>
                        <RolBadge rol={sol.rol_actual} />
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2">
                          <polyline points="9 18 15 12 9 6"/>
                        </svg>
                        <RolBadge rol={sol.rol_solicitado} />
                      </div>
                      <div style={s.solicitudMeta}>
                        Solicitado por <strong style={{ color: '#aaa' }}>{sol.solicitante_nombre} {sol.solicitante_apellidos}</strong>
                        {' · '}
                        <span style={{ color: aprobCount >= totalAdmins ? '#4cae74' : '#f0a500' }}>
                          {aprobCount}/{totalAdmins} aprobaciones
                        </span>
                        {yaAprobeMio && <span style={{ color: '#4cae74', marginLeft: '6px' }}>· Ya aprobaste</span>}
                      </div>
                    </div>
                    <div style={s.solicitudActions}>
                      <button
                        style={{ ...s.aprobBtn, opacity: yaAprobeMio ? 0.4 : 1 }}
                        onClick={() => !yaAprobeMio && handleAprobar(sol.id)}
                        disabled={yaAprobeMio}
                        title={yaAprobeMio ? 'Ya aprobaste' : 'Aprobar'}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        Aprobar
                      </button>
                      <button style={s.rechazBtn} onClick={() => handleRechazar(sol.id)}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                        Rechazar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tabla usuarios */}
        <div style={s.tableWrap}>
          {loading ? (
            <div style={s.emptyState}><div style={s.spinner} /></div>
          ) : usuarios.length === 0 ? (
            <div style={s.emptyState}>
              <p style={{ color: '#444', fontSize: '14px' }}>No hay usuarios registrados.</p>
            </div>
          ) : (
            <table style={s.table}>
              <thead>
                <tr>
                  <Th>Usuario</Th>
                  <Th>Email</Th>
                  <Th>Teléfono</Th>
                  <Th>Rol</Th>
                  <Th>Estado</Th>
                  <Th align="right">Acciones</Th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((u) => (
                  <tr key={u.id} style={s.tr}>
                    <td style={s.td}>
                      <div style={s.userCell}>
                        <div style={{ ...s.cellAvatar, background: ROL_CONFIG[u.rol]?.color + '22', color: ROL_CONFIG[u.rol]?.color }}>
                          {u.nombre?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: '#e0e0e0' }}>{u.nombre} {u.apellidos}</div>
                          <div style={{ fontSize: '11px', color: '#555', marginTop: '1px' }}>
                            ID #{u.id} · {new Date(u.created_at).toLocaleDateString('es-ES')}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={s.td}><span style={{ fontSize: '13px', color: '#aaa' }}>{u.email}</span></td>
                    <td style={s.td}><span style={{ fontSize: '13px', color: '#888' }}>{u.telefono || '—'}</span></td>
                    <td style={s.td}><RolBadge rol={u.rol} /></td>
                    <td style={s.td}>
                      <span style={{ ...s.statusBadge, ...(u.activo ? s.activoBadge : s.inactivoBadge) }}>
                        {u.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td style={{ ...s.td, textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '3px', justifyContent: 'flex-end' }}>
                        <ActionBtn title="Ver detalle" color="#4a9eff" onClick={() => setViewUsuario(u)}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                          </svg>
                        </ActionBtn>
                        <ActionBtn title="Editar" color="#888" onClick={() => setEditUsuario(u)}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </ActionBtn>
                        <ActionBtn title="Cambiar rol" color="#c9a84c" onClick={() => setRolUsuario(u)}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="16 3 21 3 21 8"/>
                            <line x1="4" y1="20" x2="21" y2="3"/>
                            <polyline points="21 16 21 21 16 21"/>
                            <line x1="15" y1="15" x2="21" y2="21"/>
                          </svg>
                        </ActionBtn>
                        <ActionBtn title={u.activo ? 'Desactivar' : 'Activar'} color={u.activo ? '#f0a500' : '#4cae74'} onClick={() => handleToggleActivar(u)}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            {u.activo
                              ? <><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></>
                              : <><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/></>
                            }
                          </svg>
                        </ActionBtn>
                        {u.id !== myId && (
                          <ActionBtn title="Eliminar" color="#e05252" onClick={() => setDeleteConfirm(u)}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3 6 5 6 21 6"/>
                              <path d="M19 6l-1 14H6L5 6"/>
                              <path d="M10 11v6"/><path d="M14 11v6"/>
                              <path d="M9 6V4h6v2"/>
                            </svg>
                          </ActionBtn>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modales */}
      {showCreate && (
        <UsuarioModal onClose={() => setShowCreate(false)} onSave={handleCreateSave} />
      )}
      {viewUsuario && (
        <UsuarioModal usuario={viewUsuario} readOnly onClose={() => setViewUsuario(null)} />
      )}
      {editUsuario && (
        <UsuarioModal usuario={editUsuario} onClose={() => setEditUsuario(null)} onSave={handleEditSave} />
      )}
      {rolUsuario && (
        <CambiarRolModal
          usuario={rolUsuario}
          onClose={() => setRolUsuario(null)}
          onConfirm={handleCambiarRol}
        />
      )}

      {/* Confirmar eliminar */}
      {deleteConfirm && (
        <div style={s.miniOverlay}>
          <div style={s.miniModal}>
            <div style={{ fontSize: '28px', marginBottom: '12px' }}>🗑️</div>
            <h3 style={{ color: '#f0f0f0', fontFamily: 'Montserrat,sans-serif', marginBottom: '8px', fontSize: '16px' }}>
              Eliminar usuario
            </h3>
            <p style={{ color: '#888', fontSize: '13px', lineHeight: 1.5, marginBottom: '20px' }}>
              ¿Eliminar a <strong style={{ color: '#ddd' }}>{deleteConfirm.nombre} {deleteConfirm.apellidos}</strong>?
              Esta acción no se puede deshacer.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button style={s.cancelBtn} onClick={() => setDeleteConfirm(null)}>Cancelar</button>
              <button style={s.dangerBtn} onClick={handleDelete}>Eliminar</button>
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
  newBtn: {
    display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 18px',
    background: 'linear-gradient(135deg, #c9a84c, #a08030)', border: 'none', borderRadius: '8px',
    color: '#0a0a0a', fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '13px', cursor: 'pointer',
  },
  solicitudesCard: {
    background: 'rgba(201,168,76,0.05)', border: '1px solid rgba(201,168,76,0.2)',
    borderRadius: '10px', marginBottom: '20px', overflow: 'hidden',
  },
  solicitudesHeader: {
    padding: '12px 16px', borderBottom: '1px solid rgba(201,168,76,0.12)',
    display: 'flex', alignItems: 'center',
  },
  solicitudesBadge: {
    minWidth: '20px', height: '20px', borderRadius: '10px', background: '#e05252',
    color: '#fff', fontSize: '11px', fontWeight: 700,
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px',
  },
  solicitudesTitle: { fontSize: '13px', fontWeight: 600, color: '#c9a84c' },
  solicitudesList: { display: 'flex', flexDirection: 'column' },
  solicitudRow: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '12px 16px', borderBottom: '1px solid rgba(201,168,76,0.08)', gap: '16px',
  },
  solicitudInfo: { flex: 1, display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' },
  solicitudUser: { display: 'flex', alignItems: 'center', gap: '8px' },
  solicitudAvatar: {
    width: '28px', height: '28px', borderRadius: '6px',
    background: 'rgba(201,168,76,0.15)', color: '#c9a84c',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 700, fontSize: '12px', flexShrink: 0,
  },
  solicitudRoles: { display: 'flex', alignItems: 'center', gap: '6px' },
  solicitudMeta: { fontSize: '11px', color: '#666' },
  solicitudActions: { display: 'flex', gap: '8px', flexShrink: 0 },
  aprobBtn: {
    display: 'flex', alignItems: 'center', gap: '5px',
    padding: '7px 14px', background: 'rgba(76,174,116,0.08)', border: '1px solid rgba(76,174,116,0.3)',
    borderRadius: '7px', color: '#4cae74', fontSize: '12px', cursor: 'pointer',
    fontFamily: 'Montserrat, sans-serif', fontWeight: 600,
  },
  rechazBtn: {
    display: 'flex', alignItems: 'center', gap: '5px',
    padding: '7px 14px', background: 'rgba(224,82,82,0.08)', border: '1px solid rgba(224,82,82,0.25)',
    borderRadius: '7px', color: '#e05252', fontSize: '12px', cursor: 'pointer',
    fontFamily: 'Montserrat, sans-serif', fontWeight: 600,
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
  userCell: { display: 'flex', alignItems: 'center', gap: '10px' },
  cellAvatar: {
    width: '32px', height: '32px', borderRadius: '8px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 700, fontSize: '13px', flexShrink: 0,
  },
  statusBadge: { display: 'inline-block', padding: '3px 10px', borderRadius: '5px', fontSize: '11px', fontWeight: 600 },
  activoBadge: { color: '#4cae74', background: 'rgba(76,174,116,0.12)' },
  inactivoBadge: { color: '#888', background: 'rgba(136,136,136,0.12)' },
  actionBtn: {
    background: 'none', border: 'none', cursor: 'pointer', padding: '6px',
    borderRadius: '6px', display: 'flex', alignItems: 'center', transition: 'background 0.15s',
  },
  emptyState: { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '50px' },
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

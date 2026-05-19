import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ROL_CONFIG, ROLES_LISTA } from '../data/provincias.js';
import { RolBadge } from './UsuarioModal.jsx';

export default function CambiarRolModal({ usuario, onClose, onConfirm }) {
  const { user: currentUser } = useAuth();
  const [rolNuevo, setRolNuevo] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null); // { ok, directo, message }
  const [error, setError] = useState('');

  const esDirectorComercial = currentUser?.rol === 'director_comercial';
  const rolesDisponibles = ROLES_LISTA.filter((r) => r !== usuario?.rol && (!esDirectorComercial || r === 'comercial'));

  const necesitaAprobacion = rolNuevo && rolNuevo !== 'comercial';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rolNuevo) { setError('Selecciona un rol.'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await onConfirm(rolNuevo);
      setResult(res);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al procesar el cambio de rol.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.overlay} onClick={(e) => e.target === e.currentTarget && !result && onClose()}>
      <div style={s.modal}>
        <div style={s.header}>
          <h2 style={s.title}>Cambiar rol</h2>
          <button style={s.closeBtn} onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div style={s.body}>
          {result ? (
            /* Estado final */
            <div style={s.resultBox}>
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>{result.directo ? '✅' : '📋'}</div>
              <h3 style={{ color: '#f0f0f0', fontFamily: 'Montserrat,sans-serif', marginBottom: '8px', fontSize: '15px' }}>
                {result.directo ? 'Rol actualizado' : 'Solicitud creada'}
              </h3>
              <p style={{ color: '#888', fontSize: '13px', lineHeight: 1.6 }}>{result.message}</p>
              {!result.directo && (
                <div style={s.infoBox}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  Todos los administradores activos recibirán una notificación y deberán aprobarla para que el cambio se aplique.
                </div>
              )}
              <button style={s.submitBtn} onClick={onClose}>Cerrar</button>
            </div>
          ) : (
            <>
              {/* Usuario actual */}
              <div style={s.userCard}>
                <div style={s.userAvatar}>{usuario?.nombre?.[0]?.toUpperCase()}</div>
                <div>
                  <div style={s.userName}>{usuario?.nombre} {usuario?.apellidos}</div>
                  <div style={s.userEmail}>{usuario?.email}</div>
                </div>
                <div style={{ marginLeft: 'auto' }}>
                  <RolBadge rol={usuario?.rol} />
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                <label style={s.label}>Nuevo rol</label>
                <div style={s.rolesGrid}>
                  {rolesDisponibles.map((rol) => {
                    const cfg = ROL_CONFIG[rol];
                    const selected = rolNuevo === rol;
                    return (
                      <button
                        key={rol}
                        type="button"
                        onClick={() => setRolNuevo(rol)}
                        style={{
                          ...s.rolOption,
                          borderColor: selected ? cfg.color : '#2a2a2a',
                          background: selected ? cfg.bg : '#0d0d0d',
                        }}
                      >
                        <span style={{ color: cfg.color, fontSize: '13px', fontWeight: 600 }}>{cfg.label}</span>
                        {selected && (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={cfg.color} strokeWidth="2.5" style={{ marginLeft: 'auto' }}>
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>

                {rolNuevo && (
                  <div style={necesitaAprobacion ? s.warningBox : s.successBox}>
                    {necesitaAprobacion ? (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: '1px' }}>
                          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                          <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                        </svg>
                        <span>El rol <strong>{ROL_CONFIG[rolNuevo]?.label}</strong> requiere aprobación de todos los administradores activos. Se creará una solicitud.</span>
                      </>
                    ) : (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        <span>El cambio a <strong>Comercial</strong> se aplicará inmediatamente.</span>
                      </>
                    )}
                  </div>
                )}

                {error && <div style={s.errorBox}>{error}</div>}

                <div style={s.footer}>
                  <button type="button" style={s.cancelBtn} onClick={onClose} disabled={loading}>Cancelar</button>
                  <button type="submit" style={s.submitBtn} disabled={loading || !rolNuevo}>
                    {loading ? 'Procesando...' : necesitaAprobacion ? 'Crear solicitud' : 'Aplicar cambio'}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const s = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '24px',
  },
  modal: {
    background: '#111', border: '1px solid #222', borderRadius: '14px',
    width: '100%', maxWidth: '500px',
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '20px 24px', borderBottom: '1px solid #1e1e1e',
  },
  title: { fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '17px', color: '#f0f0f0' },
  closeBtn: {
    background: 'none', border: 'none', color: '#555', cursor: 'pointer',
    padding: '4px', display: 'flex', alignItems: 'center', borderRadius: '6px',
  },
  body: { padding: '22px 24px' },
  userCard: {
    display: 'flex', alignItems: 'center', gap: '12px',
    padding: '12px 14px', background: '#0d0d0d', border: '1px solid #1e1e1e',
    borderRadius: '9px', marginBottom: '20px',
  },
  userAvatar: {
    width: '34px', height: '34px', borderRadius: '8px',
    background: 'linear-gradient(135deg, #c9a84c, #a08030)', color: '#0a0a0a',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 700, fontSize: '14px', flexShrink: 0,
  },
  userName: { fontSize: '13px', fontWeight: 600, color: '#ddd' },
  userEmail: { fontSize: '11px', color: '#555', marginTop: '2px' },
  label: { display: 'block', fontSize: '11px', fontWeight: 500, color: '#666', marginBottom: '10px' },
  rolesGrid: { display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' },
  rolOption: {
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '10px 14px', border: '1px solid', borderRadius: '8px',
    cursor: 'pointer', background: '#0d0d0d', transition: 'border-color 0.15s, background 0.15s',
    fontFamily: 'inherit',
  },
  warningBox: {
    display: 'flex', gap: '8px', alignItems: 'flex-start',
    padding: '11px 14px', background: 'rgba(240,165,0,0.06)', border: '1px solid rgba(240,165,0,0.25)',
    borderRadius: '8px', color: '#f0a500', fontSize: '12px', lineHeight: 1.5, marginBottom: '14px',
  },
  successBox: {
    display: 'flex', gap: '8px', alignItems: 'center',
    padding: '11px 14px', background: 'rgba(76,174,116,0.06)', border: '1px solid rgba(76,174,116,0.25)',
    borderRadius: '8px', color: '#4cae74', fontSize: '12px', marginBottom: '14px',
  },
  errorBox: {
    padding: '10px 14px', background: 'rgba(224,82,82,0.08)', border: '1px solid rgba(224,82,82,0.25)',
    borderRadius: '7px', color: '#e05252', fontSize: '13px', marginBottom: '14px',
  },
  footer: { display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '14px', borderTop: '1px solid #1e1e1e' },
  cancelBtn: {
    padding: '10px 20px', background: 'none', border: '1px solid #2a2a2a',
    borderRadius: '7px', color: '#888', fontSize: '13px', cursor: 'pointer', fontFamily: 'Inter, sans-serif',
  },
  submitBtn: {
    padding: '10px 22px', background: 'linear-gradient(135deg, #c9a84c, #a08030)',
    border: 'none', borderRadius: '7px', color: '#0a0a0a',
    fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '13px', cursor: 'pointer',
  },
  resultBox: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '8px 0 4px',
  },
  infoBox: {
    display: 'flex', gap: '8px', alignItems: 'flex-start',
    padding: '12px 14px', background: 'rgba(74,158,255,0.06)', border: '1px solid rgba(74,158,255,0.2)',
    borderRadius: '8px', color: '#4a9eff', fontSize: '12px', lineHeight: 1.5,
    marginTop: '12px', marginBottom: '16px', textAlign: 'left',
  },
};

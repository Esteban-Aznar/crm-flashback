import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { gruposApi } from '../api/grupos.js';
import {
  ESTADO_CONFIG, ESTADO_APROBACION_CONFIG,
  ESTADO_FOTOGRAFO_CONFIG, ESTADO_DISENADOR_CONFIG,
  ESTADOS_FOTOGRAFO, ESTADOS_DISENADOR, ESTADOS_LEAD,
} from '../data/provincias.js';

export default function GrupoDetailModal({ grupo: initial, onClose, onUpdate, onEdit }) {
  const { user } = useAuth();
  const [grupo, setGrupo] = useState(initial);
  const [notasCambios, setNotasCambios] = useState(initial.notas || '');
  const [savingNota, setSavingNota] = useState(false);
  const [toast, setToast] = useState(null);

  const isAdmin      = user?.rol === 'administrador';
  const isFotografo  = user?.rol === 'fotografo' || isAdmin;
  const isDisenador  = user?.rol === 'disenador' || isAdmin;
  const isComercial  = ['comercial', 'director_comercial', 'administrador'].includes(user?.rol);

  const notify = (msg, type = 'ok') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const refresh = (updated) => { setGrupo(updated); setNotasCambios(updated.notas || ''); onUpdate?.(updated); };

  const handleAprobar = async () => {
    try {
      const { data } = await gruposApi.aprobarGrupo(grupo.id);
      refresh(data);
      notify('Grupo aprobado correctamente.');
    } catch (err) {
      notify(err.response?.data?.message || 'Error al aprobar.', 'err');
    }
  };

  const handleEstadoVenta = async (estado) => {
    try {
      const { data } = await gruposApi.updateEstadoVenta(grupo.id, estado);
      refresh(data);
      notify('Estado de venta actualizado.');
    } catch (err) {
      notify(err.response?.data?.message || 'Error.', 'err');
    }
  };

  const handleEstadoFoto = async (estado) => {
    try {
      const { data } = await gruposApi.updateEstadoFotografo(grupo.id, estado);
      refresh(data);
      notify('Estado fotógrafo actualizado.');
    } catch (err) {
      notify(err.response?.data?.message || 'Error.', 'err');
    }
  };

  const handleEstadoDise = async (estado) => {
    try {
      const { data } = await gruposApi.updateEstadoDisenador(grupo.id, estado);
      refresh(data);
      notify('Estado diseñador actualizado.');
    } catch (err) {
      notify(err.response?.data?.message || 'Error.', 'err');
    }
  };

  const handleVerificarPago = async (verificado) => {
    try {
      const { data } = await gruposApi.verificarPago(grupo.id, verificado);
      refresh(data);
      notify(verificado ? 'Pago verificado.' : 'Verificación revocada.');
    } catch (err) {
      notify(err.response?.data?.message || 'Error.', 'err');
    }
  };

  const handleGuardarNota = async () => {
    setSavingNota(true);
    try {
      const { data } = await gruposApi.updateGrupo(grupo.id, { ...grupo, notas: notasCambios });
      refresh(data);
      notify('Notas guardadas.');
    } catch {
      notify('Error al guardar.', 'err');
    } finally {
      setSavingNota(false);
    }
  };

  const est      = ESTADO_CONFIG[grupo.estado_venta] || {};
  const aprobEst = ESTADO_APROBACION_CONFIG[grupo.estado_aprobacion] || {};
  const fotoEst  = ESTADO_FOTOGRAFO_CONFIG[grupo.estado_fotografo] || {};
  const diseEst  = ESTADO_DISENADOR_CONFIG[grupo.estado_disenador] || {};

  const pct = grupo.unidades_estimadas
    ? Math.min(100, Math.round(((grupo.unidades_confirmadas || 0) / grupo.unidades_estimadas) * 100))
    : 0;

  return (
    <div style={s.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={s.modal}>
        {/* Header */}
        <div style={s.header}>
          <div style={s.headerLeft}>
            <div style={s.headerTop}>
              <span style={{ ...s.badge, color: aprobEst.color, background: aprobEst.bg }}>
                {aprobEst.label}
              </span>
              <span style={{ ...s.badge, color: est.color, background: est.bg }}>
                {est.label}
              </span>
            </div>
            <h2 style={s.title}>{grupo.nombre_grupo || '—'}</h2>
            <p style={s.subtitle}>
              {[grupo.tipo_grupo, grupo.curso, grupo.pack].filter(Boolean).join(' · ')}
            </p>
          </div>
          <div style={s.headerRight}>
            {isAdmin && grupo.estado_aprobacion === 'pendiente' && (
              <button style={s.approveBtn} onClick={handleAprobar}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Aprobar grupo
              </button>
            )}
            <button style={s.editBtn} onClick={onEdit}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              Editar
            </button>
            <button style={s.closeBtn} onClick={onClose}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={s.body}>
          {/* Info general + Contacto */}
          <div style={s.twoCol}>
            <div>
              <SectionTitle>Información general</SectionTitle>
              <InfoGrid>
                <InfoItem label="Pack" value={grupo.pack_personalizado || grupo.pack || '—'} />
                <InfoItem label="Precio final" value={grupo.precio_final ? `${parseFloat(grupo.precio_final).toFixed(2)} €/alumno` : '—'} highlight />
                <InfoItem label="Comercial" value={grupo.comercial_nombre?.trim() || 'Sin asignar'} />
                <InfoItem label="Email comercial" value={grupo.comercial_email || '—'} />
              </InfoGrid>

              <SectionTitle style={{ marginTop: '20px' }}>Organizador</SectionTitle>
              <InfoGrid>
                <InfoItem label="Nombre" value={[grupo.nombre_contacto, grupo.apellidos_contacto].filter(Boolean).join(' ') || '—'} />
                <InfoItem label="Teléfono" value={grupo.telefono_contacto || '—'} />
                <InfoItem label="Email" value={grupo.email_contacto || '—'} />
                <InfoItem label="Localización" value={[grupo.barrio, grupo.ciudad, grupo.provincia, grupo.comunidad_autonoma].filter(Boolean).join(', ') || '—'} />
              </InfoGrid>
            </div>

            <div>
              <SectionTitle>Unidades</SectionTitle>
              <div style={s.unidadesBox}>
                <div style={s.unidadesNumbers}>
                  <span style={s.unidadesConfirmadas}>{grupo.unidades_confirmadas ?? '—'}</span>
                  <span style={s.unidadesSep}>/</span>
                  <span style={s.unidadesEstimadas}>{grupo.unidades_estimadas ?? '—'}</span>
                </div>
                <div style={s.unidadesLabel}>confirmadas / estimadas</div>
                {grupo.unidades_estimadas > 0 && (
                  <>
                    <div style={s.progressBar}>
                      <div style={{ ...s.progressFill, width: `${pct}%` }} />
                    </div>
                    <div style={s.progressPct}>{pct}% completado</div>
                  </>
                )}
              </div>

              {/* Estado venta (editable) */}
              <SectionTitle style={{ marginTop: '20px' }}>Estado de venta</SectionTitle>
              <select
                style={{ ...s.stateSelect, color: est.color, borderColor: est.color + '44', background: est.bg }}
                value={grupo.estado_venta}
                onChange={(e) => handleEstadoVenta(e.target.value)}
                disabled={!['administrador','director_comercial','comercial'].includes(user?.rol)}
              >
                {ESTADOS_LEAD.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
              </select>
            </div>
          </div>

          <Divider />

          {/* Producción */}
          <div style={s.twoCol}>
            {/* Fotógrafo */}
            <div>
              <SectionTitle>Estado fotógrafo</SectionTitle>
              <div style={s.estadoCard}>
                <span style={{ ...s.estadoBadgeLg, color: fotoEst.color, background: fotoEst.bg }}>
                  {fotoEst.label}
                </span>
                {isFotografo && (
                  <div style={{ marginTop: '12px' }}>
                    <label style={s.smallLabel}>Cambiar estado</label>
                    <select style={s.stateSelectSm} value={grupo.estado_fotografo} onChange={(e) => handleEstadoFoto(e.target.value)}>
                      {ESTADOS_FOTOGRAFO.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Diseñador */}
            <div>
              <SectionTitle>Estado diseñador</SectionTitle>
              <div style={s.estadoCard}>
                <span style={{ ...s.estadoBadgeLg, color: diseEst.color, background: diseEst.bg }}>
                  {diseEst.label}
                </span>
                {isDisenador && (
                  <div style={{ marginTop: '12px' }}>
                    <label style={s.smallLabel}>Cambiar estado</label>
                    <select style={s.stateSelectSm} value={grupo.estado_disenador} onChange={(e) => handleEstadoDise(e.target.value)}>
                      {ESTADOS_DISENADOR.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
                    </select>
                  </div>
                )}
              </div>
            </div>
          </div>

          <Divider />

          {/* Pago */}
          <SectionTitle>Pago</SectionTitle>
          <div style={s.pagoBox}>
            <div style={s.pagoStatus}>
              <div style={{
                ...s.pagoIndicator,
                background: grupo.pago_verificado ? 'rgba(76,174,116,0.12)' : 'rgba(240,165,0,0.12)',
                borderColor: grupo.pago_verificado ? '#4cae74' : '#f0a500',
              }}>
                <span style={{ fontSize: '18px' }}>{grupo.pago_verificado ? '✅' : '⏳'}</span>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: grupo.pago_verificado ? '#4cae74' : '#f0a500' }}>
                    {grupo.pago_verificado ? 'Pago verificado' : 'Pago pendiente de verificación'}
                  </div>
                  <div style={{ fontSize: '11px', color: '#555', marginTop: '2px' }}>
                    {grupo.pago_verificado
                      ? 'El administrador ha confirmado el cobro.'
                      : 'Envía el recibo al administrador para que pueda verificarlo.'}
                  </div>
                </div>
              </div>
            </div>
            {isAdmin && (
              <div style={{ display: 'flex', gap: '8px' }}>
                {!grupo.pago_verificado ? (
                  <button style={s.verifyBtn} onClick={() => handleVerificarPago(true)}>
                    Verificar pago
                  </button>
                ) : (
                  <button style={{ ...s.verifyBtn, background: 'rgba(224,82,82,0.08)', borderColor: 'rgba(224,82,82,0.3)', color: '#e05252' }} onClick={() => handleVerificarPago(false)}>
                    Revocar verificación
                  </button>
                )}
              </div>
            )}
          </div>

          <Divider />

          {/* Instrucciones maquetación */}
          {grupo.instrucciones_maquetacion && (
            <>
              <SectionTitle>Instrucciones de maquetación</SectionTitle>
              <div style={s.readonlyBox}>{grupo.instrucciones_maquetacion}</div>
              <Divider />
            </>
          )}

          {/* Solicitar cambios orla / Notas */}
          <SectionTitle>
            {isComercial ? 'Solicitar cambios / Notas' : 'Notas'}
          </SectionTitle>
          {isComercial ? (
            <>
              <textarea
                style={s.textarea}
                value={notasCambios}
                onChange={(e) => setNotasCambios(e.target.value)}
                placeholder="Escribe aquí las solicitudes de cambios, instrucciones adicionales o notas..."
                rows={4}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button style={s.saveNotaBtn} onClick={handleGuardarNota} disabled={savingNota}>
                  {savingNota ? 'Guardando...' : 'Guardar nota'}
                </button>
              </div>
            </>
          ) : (
            <div style={s.readonlyBox}>{grupo.notas || <span style={{ color: '#444' }}>Sin notas.</span>}</div>
          )}
        </div>

        {/* Toast */}
        {toast && (
          <div style={{
            ...s.toast,
            background: toast.type === 'err' ? '#2a1010' : '#0d2a1a',
            borderColor: toast.type === 'err' ? '#e05252' : '#4cae74',
            color: toast.type === 'err' ? '#e05252' : '#4cae74',
          }}>
            {toast.msg}
          </div>
        )}
      </div>
    </div>
  );
}

function SectionTitle({ children, style: extra }) {
  return <div style={{ ...st.sectionTitle, ...extra }}>{children}</div>;
}
function Divider() { return <div style={st.divider} />; }
function InfoGrid({ children }) { return <div style={st.infoGrid}>{children}</div>; }
function InfoItem({ label, value, highlight }) {
  return (
    <div>
      <div style={st.infoLabel}>{label}</div>
      <div style={{ ...st.infoValue, color: highlight ? '#c9a84c' : '#ddd' }}>{value}</div>
    </div>
  );
}

const s = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
    display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
    zIndex: 1000, padding: '24px', overflowY: 'auto',
  },
  modal: {
    background: '#111', border: '1px solid #222', borderRadius: '14px',
    width: '100%', maxWidth: '860px', flexShrink: 0, marginTop: 'auto', marginBottom: 'auto',
    position: 'relative',
  },
  header: {
    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
    padding: '20px 24px', borderBottom: '1px solid #1e1e1e', gap: '16px',
  },
  headerLeft: { flex: 1, minWidth: 0 },
  headerRight: { display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 },
  headerTop: { display: 'flex', gap: '6px', marginBottom: '8px' },
  badge: {
    display: 'inline-block', padding: '3px 9px', borderRadius: '5px',
    fontSize: '11px', fontWeight: 600,
  },
  title: { fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '20px', color: '#f0f0f0', marginBottom: '4px' },
  subtitle: { fontSize: '12px', color: '#666' },
  approveBtn: {
    display: 'flex', alignItems: 'center', gap: '6px',
    padding: '8px 16px', background: 'linear-gradient(135deg, #4cae74, #2d8a55)',
    border: 'none', borderRadius: '7px', color: '#fff',
    fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '12px', cursor: 'pointer',
  },
  editBtn: {
    display: 'flex', alignItems: 'center', gap: '6px',
    padding: '8px 14px', background: 'none', border: '1px solid #2a2a2a',
    borderRadius: '7px', color: '#888', fontSize: '12px', cursor: 'pointer',
  },
  closeBtn: {
    background: 'none', border: 'none', color: '#555', cursor: 'pointer',
    padding: '6px', display: 'flex', alignItems: 'center', borderRadius: '6px',
  },
  body: { padding: '24px', overflowY: 'auto', maxHeight: 'calc(90vh - 100px)' },
  twoCol: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '4px' },
  unidadesBox: {
    background: '#0d0d0d', border: '1px solid #1e1e1e', borderRadius: '10px',
    padding: '16px', textAlign: 'center',
  },
  unidadesNumbers: { display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '4px', marginBottom: '4px' },
  unidadesConfirmadas: { fontSize: '32px', fontWeight: 700, color: '#c9a84c', fontFamily: 'Montserrat, sans-serif' },
  unidadesSep: { fontSize: '20px', color: '#333' },
  unidadesEstimadas: { fontSize: '20px', color: '#555' },
  unidadesLabel: { fontSize: '11px', color: '#555', marginBottom: '12px' },
  progressBar: { height: '6px', background: '#1e1e1e', borderRadius: '3px', overflow: 'hidden', marginBottom: '6px' },
  progressFill: { height: '100%', background: 'linear-gradient(90deg, #c9a84c, #4cae74)', borderRadius: '3px', transition: 'width 0.3s' },
  progressPct: { fontSize: '12px', color: '#888' },
  stateSelect: {
    width: '100%', padding: '7px 10px', borderRadius: '7px', fontSize: '12px', fontWeight: 600,
    border: '1px solid', cursor: 'pointer', outline: 'none', fontFamily: 'Inter, sans-serif',
  },
  estadoCard: {
    background: '#0d0d0d', border: '1px solid #1e1e1e', borderRadius: '10px', padding: '16px',
  },
  estadoBadgeLg: {
    display: 'inline-block', padding: '6px 14px', borderRadius: '7px', fontSize: '13px', fontWeight: 600,
  },
  smallLabel: { display: 'block', fontSize: '11px', color: '#555', marginBottom: '6px' },
  stateSelectSm: {
    width: '100%', padding: '7px 10px', background: '#111', border: '1px solid #2a2a2a',
    borderRadius: '7px', color: '#ccc', fontSize: '12px', outline: 'none',
    fontFamily: 'Inter, sans-serif', cursor: 'pointer',
  },
  pagoBox: { display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '4px' },
  pagoStatus: { flex: 1 },
  pagoIndicator: {
    display: 'flex', gap: '12px', alignItems: 'center',
    padding: '12px 16px', borderRadius: '10px', border: '1px solid',
  },
  verifyBtn: {
    padding: '9px 18px', background: 'rgba(76,174,116,0.08)', border: '1px solid rgba(76,174,116,0.3)',
    borderRadius: '7px', color: '#4cae74', fontSize: '13px', cursor: 'pointer',
    fontFamily: 'Montserrat, sans-serif', fontWeight: 600, whiteSpace: 'nowrap',
  },
  readonlyBox: {
    background: '#0d0d0d', border: '1px solid #1e1e1e', borderRadius: '8px',
    padding: '12px 14px', fontSize: '13px', color: '#aaa', lineHeight: 1.6, marginBottom: '4px',
    whiteSpace: 'pre-wrap',
  },
  textarea: {
    width: '100%', padding: '10px 12px', background: '#0d0d0d', border: '1px solid #2a2a2a',
    borderRadius: '8px', color: '#f0f0f0', fontSize: '13px', outline: 'none',
    fontFamily: 'Inter, sans-serif', resize: 'vertical', minHeight: '96px', boxSizing: 'border-box',
  },
  saveNotaBtn: {
    padding: '8px 18px', background: 'linear-gradient(135deg, #c9a84c, #a08030)',
    border: 'none', borderRadius: '7px', color: '#0a0a0a',
    fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '12px', cursor: 'pointer',
  },
  toast: {
    position: 'absolute', bottom: '16px', right: '16px', padding: '10px 16px',
    borderRadius: '8px', border: '1px solid', fontSize: '12px', fontWeight: 500,
  },
};

const st = {
  sectionTitle: {
    fontSize: '11px', fontWeight: 600, color: '#c9a84c', letterSpacing: '1.5px',
    textTransform: 'uppercase', marginBottom: '10px',
  },
  divider: { height: '1px', background: '#1a1a1a', margin: '20px 0' },
  infoGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  infoLabel: { fontSize: '10px', color: '#555', fontWeight: 500, marginBottom: '3px', letterSpacing: '0.3px' },
  infoValue: { fontSize: '13px', fontWeight: 500 },
};

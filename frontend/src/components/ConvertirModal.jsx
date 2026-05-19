import React, { useState, useEffect } from 'react';
import { PACKS } from '../data/provincias.js';

export default function ConvertirModal({ lead, onClose, onConfirm }) {
  const [form, setForm] = useState({
    precio_final: '', pack: '', pack_personalizado: '',
    nombre_contacto: '', apellidos_contacto: '', email_contacto: '', telefono_contacto: '',
    unidades_estimadas: '', notas: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (lead) {
      setForm({
        precio_final: lead.precio_estimado || '',
        pack: lead.pack || '',
        pack_personalizado: lead.pack_personalizado || '',
        nombre_contacto: lead.nombre_contacto || '',
        apellidos_contacto: lead.apellidos_contacto || '',
        email_contacto: lead.email_contacto || '',
        telefono_contacto: lead.telefono_contacto || '',
        unidades_estimadas: '',
        notas: lead.notas || '',
      });
    }
  }, [lead]);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleConfirm = async () => {
    setError('');
    setLoading(true);
    try {
      await onConfirm({
        ...form,
        precio_final: form.precio_final === '' ? null : parseFloat(form.precio_final),
        unidades_estimadas: form.unidades_estimadas === '' ? null : parseInt(form.unidades_estimadas),
        pack_personalizado: form.pack !== 'Personalizado' ? null : form.pack_personalizado,
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Error al convertir el lead.');
    } finally {
      setLoading(false);
    }
  };

  if (!lead) return null;

  return (
    <div style={s.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={s.modal}>
        <div style={s.header}>
          <div>
            <h2 style={s.title}>Convertir a Grupo</h2>
            <p style={s.subtitle}>{lead.nombre_grupo}</p>
          </div>
          <button style={s.closeBtn} onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div style={s.body}>
          <div style={s.infoBox}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            Revisa y ajusta los datos antes de confirmar. El lead desaparecerá de la lista y se creará como grupo con estado "Pendiente de aprobación".
          </div>

          <div style={s.grid}>
            <div>
              <label style={s.label}>Pack</label>
              <select style={s.input} value={form.pack} onChange={(e) => { set('pack', e.target.value); if (e.target.value !== 'Personalizado') set('pack_personalizado', ''); }}>
                <option value="">Seleccionar...</option>
                {PACKS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            {form.pack === 'Personalizado' && (
              <div>
                <label style={s.label}>Descripción pack personalizado</label>
                <input style={s.input} value={form.pack_personalizado} onChange={(e) => set('pack_personalizado', e.target.value)} />
              </div>
            )}

            <div>
              <label style={s.label}>Precio final por alumno (€)</label>
              <input style={s.input} type="number" min="0" step="0.01" value={form.precio_final} onChange={(e) => set('precio_final', e.target.value)} placeholder="0.00" />
            </div>

            <div>
              <label style={s.label}>Unidades estimadas</label>
              <input style={s.input} type="number" min="0" value={form.unidades_estimadas} onChange={(e) => set('unidades_estimadas', e.target.value)} placeholder="Nº de alumnos aprox." />
            </div>
          </div>

          <div style={s.sectionLabel}>Datos del contacto</div>
          <div style={s.grid}>
            <div>
              <label style={s.label}>Nombre</label>
              <input style={s.input} value={form.nombre_contacto} onChange={(e) => set('nombre_contacto', e.target.value)} />
            </div>
            <div>
              <label style={s.label}>Apellidos</label>
              <input style={s.input} value={form.apellidos_contacto} onChange={(e) => set('apellidos_contacto', e.target.value)} />
            </div>
            <div>
              <label style={s.label}>Email</label>
              <input style={s.input} type="email" value={form.email_contacto} onChange={(e) => set('email_contacto', e.target.value)} />
            </div>
            <div>
              <label style={s.label}>Teléfono</label>
              <input style={s.input} type="tel" value={form.telefono_contacto} onChange={(e) => set('telefono_contacto', e.target.value)} />
            </div>
          </div>

          <div style={s.sectionLabel}>Notas</div>
          <textarea
            style={{ ...s.input, resize: 'vertical', minHeight: '72px' }}
            value={form.notas}
            onChange={(e) => set('notas', e.target.value)}
            placeholder="Notas para el grupo..."
          />

          {error && <div style={s.errorBox}>{error}</div>}
        </div>

        <div style={s.footer}>
          <button style={s.cancelBtn} onClick={onClose} disabled={loading}>Cancelar</button>
          <button style={s.confirmBtn} onClick={handleConfirm} disabled={loading}>
            {loading ? 'Convirtiendo...' : 'Confirmar conversión'}
          </button>
        </div>
      </div>
    </div>
  );
}

const s = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000, padding: '24px',
  },
  modal: {
    background: '#111', border: '1px solid #222', borderRadius: '14px',
    width: '100%', maxWidth: '580px', maxHeight: '90vh', display: 'flex', flexDirection: 'column',
  },
  header: {
    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
    padding: '20px 24px', borderBottom: '1px solid #1e1e1e', gap: '12px',
  },
  title: {
    fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '17px', color: '#f0f0f0',
  },
  subtitle: { fontSize: '13px', color: '#888', marginTop: '2px' },
  closeBtn: {
    background: 'none', border: 'none', color: '#555', cursor: 'pointer',
    padding: '4px', display: 'flex', alignItems: 'center', borderRadius: '6px', flexShrink: 0,
  },
  body: { padding: '20px 24px', overflowY: 'auto', flex: 1 },
  infoBox: {
    display: 'flex', gap: '8px', alignItems: 'flex-start',
    padding: '12px 14px', background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.2)',
    borderRadius: '8px', color: '#a08030', fontSize: '12px', lineHeight: '1.5', marginBottom: '20px',
  },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' },
  sectionLabel: {
    fontSize: '11px', fontWeight: 600, color: '#c9a84c', letterSpacing: '1.5px',
    textTransform: 'uppercase', marginBottom: '10px',
  },
  label: { display: 'block', fontSize: '11px', fontWeight: 500, color: '#666', marginBottom: '6px' },
  input: {
    width: '100%', padding: '9px 12px', background: '#0d0d0d', border: '1px solid #2a2a2a',
    borderRadius: '7px', color: '#f0f0f0', fontSize: '13px', outline: 'none',
    fontFamily: 'Inter, sans-serif', boxSizing: 'border-box',
  },
  errorBox: {
    marginTop: '12px', padding: '10px 14px', background: 'rgba(224,82,82,0.08)',
    border: '1px solid rgba(224,82,82,0.25)', borderRadius: '7px', color: '#e05252', fontSize: '13px',
  },
  footer: {
    display: 'flex', gap: '10px', justifyContent: 'flex-end',
    padding: '16px 24px', borderTop: '1px solid #1e1e1e',
  },
  cancelBtn: {
    padding: '10px 20px', background: 'none', border: '1px solid #2a2a2a',
    borderRadius: '7px', color: '#888', fontSize: '13px', cursor: 'pointer',
    fontFamily: 'Inter, sans-serif',
  },
  confirmBtn: {
    padding: '10px 24px', background: 'linear-gradient(135deg, #c9a84c, #a08030)',
    border: 'none', borderRadius: '7px', color: '#0a0a0a',
    fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '13px', cursor: 'pointer',
  },
};

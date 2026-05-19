import React, { useState, useEffect } from 'react';
import { PROVINCIAS, CURSOS_COLEGIO, TIPOS_GRUPO, PACKS, ESTADOS_LEAD } from '../data/provincias.js';

const EMPTY = {
  nombre_grupo: '', tipo_grupo: '', curso: '', pack: '', pack_personalizado: '',
  precio_final: '', unidades_estimadas: '', unidades_confirmadas: '',
  nombre_contacto: '', apellidos_contacto: '', email_contacto: '', telefono_contacto: '',
  provincia: '', comunidad_autonoma: '', ciudad: '', barrio: '',
  notas: '', instrucciones_maquetacion: '', comercial_id: '',
};

export default function GrupoEditModal({ grupo, comerciales, onClose, onSave }) {
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (grupo) {
      setForm({
        nombre_grupo:            grupo.nombre_grupo || '',
        tipo_grupo:              grupo.tipo_grupo || '',
        curso:                   grupo.curso || '',
        pack:                    grupo.pack || '',
        pack_personalizado:      grupo.pack_personalizado || '',
        precio_final:            grupo.precio_final || '',
        unidades_estimadas:      grupo.unidades_estimadas || '',
        unidades_confirmadas:    grupo.unidades_confirmadas || '',
        nombre_contacto:         grupo.nombre_contacto || '',
        apellidos_contacto:      grupo.apellidos_contacto || '',
        email_contacto:          grupo.email_contacto || '',
        telefono_contacto:       grupo.telefono_contacto || '',
        provincia:               grupo.provincia || '',
        comunidad_autonoma:      grupo.comunidad_autonoma || '',
        ciudad:                  grupo.ciudad || '',
        barrio:                  grupo.barrio || '',
        notas:                   grupo.notas || '',
        instrucciones_maquetacion: grupo.instrucciones_maquetacion || '',
        comercial_id:            grupo.comercial_id || '',
      });
    }
  }, [grupo]);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleProvincia = (prov) => {
    const match = PROVINCIAS.find((p) => p.provincia === prov);
    setForm((f) => ({ ...f, provincia: prov, comunidad_autonoma: match ? match.comunidad : '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nombre_grupo.trim()) { setError('El nombre del grupo es requerido.'); return; }
    setError('');
    setLoading(true);
    try {
      await onSave({
        ...form,
        precio_final:         form.precio_final === '' ? null : parseFloat(form.precio_final),
        unidades_estimadas:   form.unidades_estimadas === '' ? null : parseInt(form.unidades_estimadas),
        unidades_confirmadas: form.unidades_confirmadas === '' ? null : parseInt(form.unidades_confirmadas),
        comercial_id:         form.comercial_id === '' ? null : parseInt(form.comercial_id),
        curso:                form.tipo_grupo !== 'Colegio/Instituto' ? null : form.curso,
        pack_personalizado:   form.pack !== 'Personalizado' ? null : form.pack_personalizado,
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={s.modal}>
        <div style={s.header}>
          <h2 style={s.title}>Editar Grupo</h2>
          <button style={s.closeBtn} onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} style={s.body}>
          <Section label="Datos del grupo">
            <Field label="Nombre del grupo *" span={2}>
              <Input value={form.nombre_grupo} onChange={(v) => set('nombre_grupo', v)} placeholder="Nombre del grupo" />
            </Field>
            <Field label="Tipo de grupo">
              <Select value={form.tipo_grupo} onChange={(v) => { set('tipo_grupo', v); if (v !== 'Colegio/Instituto') set('curso', ''); }}>
                <option value="">Seleccionar...</option>
                {TIPOS_GRUPO.map((t) => <option key={t} value={t}>{t}</option>)}
              </Select>
            </Field>
            {form.tipo_grupo === 'Colegio/Instituto' && (
              <Field label="Curso">
                <Select value={form.curso} onChange={(v) => set('curso', v)}>
                  <option value="">Seleccionar...</option>
                  {CURSOS_COLEGIO.map((g) => (
                    <optgroup key={g.group} label={g.group}>
                      {g.options.map((o) => <option key={o} value={o}>{o}</option>)}
                    </optgroup>
                  ))}
                </Select>
              </Field>
            )}
            <Field label="Pack">
              <Select value={form.pack} onChange={(v) => { set('pack', v); if (v !== 'Personalizado') set('pack_personalizado', ''); }}>
                <option value="">Seleccionar...</option>
                {PACKS.map((p) => <option key={p} value={p}>{p}</option>)}
              </Select>
            </Field>
            {form.pack === 'Personalizado' && (
              <Field label="Descripción del pack personalizado">
                <Input value={form.pack_personalizado} onChange={(v) => set('pack_personalizado', v)} placeholder="Describe el pack..." />
              </Field>
            )}
            <Field label="Precio final por alumno (€)">
              <Input type="number" min="0" step="0.01" value={form.precio_final} onChange={(v) => set('precio_final', v)} placeholder="0.00" />
            </Field>
            <Field label="Comercial asignado">
              <Select value={form.comercial_id} onChange={(v) => set('comercial_id', v)}>
                <option value="">Sin asignar</option>
                {comerciales.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre} {c.apellidos} — {c.rol}</option>
                ))}
              </Select>
            </Field>
          </Section>

          <Section label="Unidades">
            <Field label="Unidades estimadas">
              <Input type="number" min="0" value={form.unidades_estimadas} onChange={(v) => set('unidades_estimadas', v)} placeholder="0" />
            </Field>
            <Field label="Unidades confirmadas">
              <Input type="number" min="0" value={form.unidades_confirmadas} onChange={(v) => set('unidades_confirmadas', v)} placeholder="0" />
            </Field>
          </Section>

          <Section label="Contacto organizador">
            <Field label="Nombre">
              <Input value={form.nombre_contacto} onChange={(v) => set('nombre_contacto', v)} placeholder="Nombre" />
            </Field>
            <Field label="Apellidos">
              <Input value={form.apellidos_contacto} onChange={(v) => set('apellidos_contacto', v)} placeholder="Apellidos" />
            </Field>
            <Field label="Email">
              <Input type="email" value={form.email_contacto} onChange={(v) => set('email_contacto', v)} placeholder="correo@ejemplo.com" />
            </Field>
            <Field label="Teléfono">
              <Input type="tel" value={form.telefono_contacto} onChange={(v) => set('telefono_contacto', v)} placeholder="6XX XXX XXX" />
            </Field>
          </Section>

          <Section label="Localización">
            <Field label="Provincia">
              <Select value={form.provincia} onChange={(v) => handleProvincia(v)}>
                <option value="">Seleccionar...</option>
                {PROVINCIAS.map((p) => <option key={p.provincia} value={p.provincia}>{p.provincia}</option>)}
              </Select>
            </Field>
            <Field label="Comunidad autónoma">
              <Input value={form.comunidad_autonoma} onChange={() => {}} placeholder="Auto-completado" readOnly style={{ opacity: 0.6 }} />
            </Field>
            <Field label="Ciudad">
              <Input value={form.ciudad} onChange={(v) => set('ciudad', v)} placeholder="Ciudad" />
            </Field>
            <Field label="Barrio / Zona">
              <Input value={form.barrio} onChange={(v) => set('barrio', v)} placeholder="Barrio o zona" />
            </Field>
          </Section>

          <Section label="Notas e instrucciones">
            <Field label="Instrucciones de maquetación" span={2}>
              <Textarea value={form.instrucciones_maquetacion} onChange={(v) => set('instrucciones_maquetacion', v)} placeholder="Instrucciones para el diseñador..." rows={3} />
            </Field>
            <Field label="Notas generales" span={2}>
              <Textarea value={form.notas} onChange={(v) => set('notas', v)} placeholder="Notas adicionales..." rows={3} />
            </Field>
          </Section>

          {error && <div style={s.errorBox}>{error}</div>}

          <div style={s.footer}>
            <button type="button" style={s.cancelBtn} onClick={onClose} disabled={loading}>Cancelar</button>
            <button type="submit" style={s.submitBtn} disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Section({ label, children }) {
  return (
    <div style={{ marginBottom: '22px' }}>
      <div style={s.sectionLabel}>{label}</div>
      <div style={s.grid}>{children}</div>
    </div>
  );
}

function Field({ label, children, span }) {
  return (
    <div style={{ gridColumn: span === 2 ? '1 / -1' : undefined }}>
      <label style={s.label}>{label}</label>
      {children}
    </div>
  );
}

function Input({ onChange, readOnly, style: extra, ...props }) {
  return (
    <input {...props} readOnly={readOnly} style={{ ...s.input, ...extra }}
      onChange={readOnly ? undefined : (e) => onChange(e.target.value)} />
  );
}

function Select({ value, onChange, children }) {
  return (
    <select style={s.input} value={value} onChange={(e) => onChange(e.target.value)}>
      {children}
    </select>
  );
}

function Textarea({ value, onChange, rows = 3, placeholder }) {
  return (
    <textarea style={{ ...s.input, resize: 'vertical', minHeight: `${rows * 24 + 16}px` }}
      value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows} />
  );
}

const s = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
    display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
    zIndex: 1000, padding: '24px', overflowY: 'auto',
  },
  modal: {
    background: '#111', border: '1px solid #222', borderRadius: '14px',
    width: '100%', maxWidth: '700px', flexShrink: 0, marginTop: 'auto', marginBottom: 'auto',
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '20px 24px', borderBottom: '1px solid #1e1e1e',
  },
  title: { fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '18px', color: '#f0f0f0' },
  closeBtn: {
    background: 'none', border: 'none', color: '#555', cursor: 'pointer',
    padding: '4px', display: 'flex', alignItems: 'center', borderRadius: '6px',
  },
  body: { padding: '24px' },
  sectionLabel: {
    fontSize: '11px', fontWeight: 600, color: '#c9a84c', letterSpacing: '1.5px',
    textTransform: 'uppercase', marginBottom: '12px',
  },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' },
  label: { display: 'block', fontSize: '11px', fontWeight: 500, color: '#666', marginBottom: '6px' },
  input: {
    width: '100%', padding: '9px 12px', background: '#0d0d0d', border: '1px solid #2a2a2a',
    borderRadius: '7px', color: '#f0f0f0', fontSize: '13px', outline: 'none',
    fontFamily: 'Inter, sans-serif', boxSizing: 'border-box',
  },
  errorBox: {
    padding: '10px 14px', background: 'rgba(224,82,82,0.08)', border: '1px solid rgba(224,82,82,0.25)',
    borderRadius: '7px', color: '#e05252', fontSize: '13px', marginBottom: '16px',
  },
  footer: {
    display: 'flex', gap: '10px', justifyContent: 'flex-end',
    paddingTop: '16px', borderTop: '1px solid #1e1e1e',
  },
  cancelBtn: {
    padding: '10px 20px', background: 'none', border: '1px solid #2a2a2a',
    borderRadius: '7px', color: '#888', fontSize: '13px', cursor: 'pointer', fontFamily: 'Inter, sans-serif',
  },
  submitBtn: {
    padding: '10px 24px', background: 'linear-gradient(135deg, #c9a84c, #a08030)',
    border: 'none', borderRadius: '7px', color: '#0a0a0a',
    fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '13px', cursor: 'pointer',
  },
};

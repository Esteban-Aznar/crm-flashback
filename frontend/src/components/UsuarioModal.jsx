import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ROL_CONFIG, ROLES_LISTA } from '../data/provincias.js';

const EMPTY = { nombre: '', apellidos: '', email: '', telefono: '', password: '', rol: '' };

export default function UsuarioModal({ usuario, onClose, onSave, readOnly }) {
  const { user: currentUser } = useAuth();
  const isEdit = !!usuario;
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const esDirectorComercial = currentUser?.rol === 'director_comercial';

  useEffect(() => {
    if (usuario) {
      setForm({
        nombre:    usuario.nombre || '',
        apellidos: usuario.apellidos || '',
        email:     usuario.email || '',
        telefono:  usuario.telefono || '',
        password:  '',
        rol:       usuario.rol || '',
      });
    }
  }, [usuario]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim() || !form.email.trim() || !form.rol) {
      setError('Nombre, email y rol son requeridos.');
      return;
    }
    if (!isEdit && !form.password.trim()) {
      setError('La contraseña es requerida para nuevos usuarios.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const data = { nombre: form.nombre, apellidos: form.apellidos, email: form.email, telefono: form.telefono, rol: form.rol };
      if (!isEdit || form.password.trim()) data.password = form.password;
      await onSave(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar.');
    } finally {
      setLoading(false);
    }
  };

  const rolesDisponibles = esDirectorComercial ? ['comercial'] : ROLES_LISTA;

  const title = readOnly ? 'Detalle de usuario' : isEdit ? 'Editar usuario' : 'Nuevo usuario';

  return (
    <div style={s.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={s.modal}>
        <div style={s.header}>
          <h2 style={s.title}>{title}</h2>
          <button style={s.closeBtn} onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {readOnly ? (
          <div style={s.body}>
            <div style={s.readGrid}>
              <ReadItem label="Nombre" value={`${usuario?.nombre || ''} ${usuario?.apellidos || ''}`.trim()} />
              <ReadItem label="Email" value={usuario?.email} />
              <ReadItem label="Teléfono" value={usuario?.telefono || '—'} />
              <ReadItem label="Rol">
                <RolBadge rol={usuario?.rol} />
              </ReadItem>
              <ReadItem label="Estado">
                <span style={{ ...s.statusBadge, ...(usuario?.activo ? s.activoBadge : s.inactivoBadge) }}>
                  {usuario?.activo ? 'Activo' : 'Inactivo'}
                </span>
              </ReadItem>
              <ReadItem label="Miembro desde" value={usuario?.created_at ? new Date(usuario.created_at).toLocaleDateString('es-ES') : '—'} />
            </div>
            <div style={s.footer}>
              <button style={s.cancelBtn} onClick={onClose}>Cerrar</button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={s.body}>
            <div style={s.grid}>
              <Field label="Nombre *">
                <input style={s.input} value={form.nombre} onChange={(e) => set('nombre', e.target.value)} placeholder="Nombre" required />
              </Field>
              <Field label="Apellidos">
                <input style={s.input} value={form.apellidos} onChange={(e) => set('apellidos', e.target.value)} placeholder="Apellidos" />
              </Field>
              <Field label="Email *">
                <input style={s.input} type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="correo@ejemplo.com" required />
              </Field>
              <Field label="Teléfono">
                <input style={s.input} type="tel" value={form.telefono} onChange={(e) => set('telefono', e.target.value)} placeholder="6XX XXX XXX" />
              </Field>
              <Field label={isEdit ? 'Nueva contraseña (opcional)' : 'Contraseña inicial *'}>
                <input style={s.input} type="password" value={form.password} onChange={(e) => set('password', e.target.value)} placeholder={isEdit ? 'Dejar vacío para no cambiar' : '••••••••'} />
              </Field>
              <Field label="Rol *">
                <select style={s.input} value={form.rol} onChange={(e) => set('rol', e.target.value)} required>
                  <option value="">Seleccionar rol...</option>
                  {rolesDisponibles.map((r) => (
                    <option key={r} value={r}>{ROL_CONFIG[r]?.label || r}</option>
                  ))}
                </select>
              </Field>
            </div>

            {form.rol && (
              <div style={s.rolPreview}>
                <span style={{ fontSize: '12px', color: '#555' }}>Rol seleccionado: </span>
                <RolBadge rol={form.rol} />
              </div>
            )}

            {error && <div style={s.errorBox}>{error}</div>}

            <div style={s.footer}>
              <button type="button" style={s.cancelBtn} onClick={onClose} disabled={loading}>Cancelar</button>
              <button type="submit" style={s.submitBtn} disabled={loading}>
                {loading ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear usuario'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export function RolBadge({ rol }) {
  const cfg = ROL_CONFIG[rol];
  if (!cfg) return <span style={{ color: '#555', fontSize: '12px' }}>{rol || '—'}</span>;
  return (
    <span style={{
      display: 'inline-block', padding: '3px 10px', borderRadius: '5px',
      fontSize: '11px', fontWeight: 600, color: cfg.color, background: cfg.bg,
    }}>
      {cfg.label}
    </span>
  );
}

function ReadItem({ label, value, children }) {
  return (
    <div>
      <div style={{ fontSize: '10px', color: '#555', marginBottom: '4px', letterSpacing: '0.3px', textTransform: 'uppercase', fontWeight: 500 }}>{label}</div>
      {children || <div style={{ fontSize: '13px', color: '#ddd', fontWeight: 500 }}>{value || '—'}</div>}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label style={s.label}>{label}</label>
      {children}
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
    width: '100%', maxWidth: '540px',
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
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' },
  readGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' },
  label: { display: 'block', fontSize: '11px', fontWeight: 500, color: '#666', marginBottom: '6px' },
  input: {
    width: '100%', padding: '9px 12px', background: '#0d0d0d', border: '1px solid #2a2a2a',
    borderRadius: '7px', color: '#f0f0f0', fontSize: '13px', outline: 'none',
    fontFamily: 'Inter, sans-serif', boxSizing: 'border-box',
  },
  rolPreview: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' },
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
    padding: '10px 24px', background: 'linear-gradient(135deg, #c9a84c, #a08030)',
    border: 'none', borderRadius: '7px', color: '#0a0a0a',
    fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '13px', cursor: 'pointer',
  },
  statusBadge: { display: 'inline-block', padding: '3px 10px', borderRadius: '5px', fontSize: '11px', fontWeight: 600 },
  activoBadge: { color: '#4cae74', background: 'rgba(76,174,116,0.12)' },
  inactivoBadge: { color: '#888', background: 'rgba(136,136,136,0.12)' },
};

import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usuariosApi } from '../api/usuarios.js';

const NAV = [
  {
    label: 'Dashboard',
    to: '/dashboard',
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
        <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
      </svg>
    ),
  },
];

const NAV_SECTIONS = [
  {
    section: 'Ventas',
    items: [
      {
        label: 'Leads',
        to: '/ventas/leads',
        icon: (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        ),
      },
      {
        label: 'Grupos',
        to: '/ventas/grupos',
        icon: (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
        ),
      },
    ],
  },
];

const NAV_ADMIN = [
  {
    label: 'Perfiles',
    to: '/perfiles',
    hasBadge: true,
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    ),
  },
];

const ROL_LABELS = {
  administrador: 'Administrador',
  director_comercial: 'Director Comercial',
  comercial: 'Comercial',
  fotografo: 'Fotógrafo',
  disenador: 'Diseñador',
  desarrollador: 'Desarrollador',
};

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [pendingSolicitudes, setPendingSolicitudes] = useState(0);

  const isAdmin = user?.rol === 'administrador';

  useEffect(() => {
    if (!isAdmin) return;
    const fetch = () => {
      usuariosApi.getSolicitudesRol()
        .then(({ data }) => setPendingSolicitudes(data.solicitudes?.length || 0))
        .catch(() => {});
    };
    fetch();
    const interval = setInterval(fetch, 60000);
    return () => clearInterval(interval);
  }, [isAdmin]);

  const handleLogout = () => { logout(); navigate('/login', { replace: true }); };
  const isActive = (to) => location.pathname === to || location.pathname.startsWith(to + '/');

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#0a0a0a', overflow: 'hidden' }}>
      <aside style={{ ...s.sidebar, width: collapsed ? '60px' : '220px' }}>
        <div style={s.logoRow}>
          {!collapsed && <span style={s.logoText}>FLASHBACK</span>}
          <button style={s.collapseBtn} onClick={() => setCollapsed(!collapsed)} title="Colapsar menú">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {collapsed ? <polyline points="9 18 15 12 9 6"/> : <polyline points="15 18 9 12 15 6"/>}
            </svg>
          </button>
        </div>

        <nav style={s.nav}>
          {NAV.map((item) => (
            <Link key={item.to} to={item.to} style={{ ...s.navItem, ...(isActive(item.to) ? s.navItemActive : {}) }}>
              <span style={s.navIcon}>{item.icon}</span>
              {!collapsed && <span style={s.navLabel}>{item.label}</span>}
            </Link>
          ))}

          {NAV_SECTIONS.map((sec) => (
            <div key={sec.section}>
              {!collapsed && <div style={s.sectionLabel}>{sec.section}</div>}
              {collapsed && <div style={s.sectionDivider} />}
              {sec.items.map((item) => (
                <Link key={item.to} to={item.to} style={{ ...s.navItem, ...(isActive(item.to) ? s.navItemActive : {}) }}>
                  <span style={s.navIcon}>{item.icon}</span>
                  {!collapsed && <span style={s.navLabel}>{item.label}</span>}
                </Link>
              ))}
            </div>
          ))}

          {isAdmin && (
            <div>
              {!collapsed && <div style={s.sectionLabel}>Administración</div>}
              {collapsed && <div style={s.sectionDivider} />}
              {NAV_ADMIN.map((item) => (
                <Link key={item.to} to={item.to} style={{ ...s.navItem, ...(isActive(item.to) ? s.navItemActive : {}) }}>
                  <span style={s.navIcon}>{item.icon}</span>
                  {!collapsed && <span style={s.navLabel}>{item.label}</span>}
                  {item.hasBadge && pendingSolicitudes > 0 && (
                    <span style={s.badge}>{pendingSolicitudes}</span>
                  )}
                </Link>
              ))}
            </div>
          )}
        </nav>

        <div style={s.sidebarFooter}>
          <div style={s.avatar}>{user?.nombre?.[0]?.toUpperCase() || 'U'}</div>
          {!collapsed && (
            <div style={s.userMeta}>
              <span style={s.userName}>{user?.nombre} {user?.apellidos}</span>
              <span style={s.userRol}>{ROL_LABELS[user?.rol] || user?.rol}</span>
            </div>
          )}
          <button style={s.logoutBtn} onClick={handleLogout} title="Cerrar sesión">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </aside>

      <main style={s.main}>{children}</main>
    </div>
  );
}

const s = {
  sidebar: {
    flexShrink: 0, background: '#111', borderRight: '1px solid #1a1a1a',
    display: 'flex', flexDirection: 'column', transition: 'width 0.2s ease', overflow: 'hidden',
  },
  logoRow: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '20px 14px 16px', borderBottom: '1px solid #1a1a1a', minHeight: '60px',
  },
  logoText: {
    fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '14px', letterSpacing: '4px',
    background: 'linear-gradient(135deg, #c9a84c, #e2c078)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', whiteSpace: 'nowrap',
  },
  collapseBtn: {
    background: 'none', border: 'none', color: '#444', cursor: 'pointer',
    padding: '4px', display: 'flex', alignItems: 'center', borderRadius: '4px', flexShrink: 0,
  },
  nav: {
    flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column',
    gap: '2px', overflowY: 'auto', overflowX: 'hidden',
  },
  navItem: {
    display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 10px',
    borderRadius: '7px', fontSize: '13px', color: '#666', textDecoration: 'none',
    transition: 'background 0.15s, color 0.15s', whiteSpace: 'nowrap', overflow: 'hidden',
  },
  navItemActive: { color: '#c9a84c', background: 'rgba(201,168,76,0.08)' },
  navIcon: { flexShrink: 0, display: 'flex', alignItems: 'center' },
  navLabel: { fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 },
  badge: {
    marginLeft: 'auto', minWidth: '18px', height: '18px', borderRadius: '9px',
    background: '#e05252', color: '#fff', fontSize: '10px', fontWeight: 700,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '0 5px', flexShrink: 0,
  },
  sectionLabel: {
    fontSize: '10px', fontWeight: 600, color: '#333', letterSpacing: '1.5px',
    textTransform: 'uppercase', padding: '14px 10px 6px',
  },
  sectionDivider: { height: '1px', background: '#1e1e1e', margin: '8px 0' },
  sidebarFooter: {
    padding: '12px', borderTop: '1px solid #1a1a1a',
    display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden',
  },
  avatar: {
    width: '30px', height: '30px', borderRadius: '7px',
    background: 'linear-gradient(135deg, #c9a84c, #a08030)', color: '#0a0a0a',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 700, fontSize: '12px', flexShrink: 0, fontFamily: 'Montserrat, sans-serif',
  },
  userMeta: { flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 },
  userName: { fontSize: '12px', fontWeight: 600, color: '#ccc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  userRol: { fontSize: '10px', color: '#444' },
  logoutBtn: {
    background: 'none', border: 'none', color: '#444', padding: '5px',
    borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', flexShrink: 0,
  },
  main: { flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' },
};

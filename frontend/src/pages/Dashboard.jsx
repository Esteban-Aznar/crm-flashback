import React from 'react';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout.jsx';

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <Layout>
      <div style={s.page}>
        <div style={s.header}>
          <h1 style={s.pageTitle}>Dashboard</h1>
          <p style={s.pageSubtitle}>Bienvenido/a, {user?.nombre}.</p>
        </div>

        <div style={s.cards}>
          {[
            { label: 'Leads activos', value: '—', icon: '📋' },
            { label: 'Grupos en producción', value: '—', icon: '📸' },
            { label: 'Pendientes de aprobación', value: '—', icon: '✅' },
            { label: 'Incidencias abiertas', value: '—', icon: '⚠️' },
          ].map((card) => (
            <div key={card.label} style={s.card}>
              <span style={s.cardIcon}>{card.icon}</span>
              <span style={s.cardValue}>{card.value}</span>
              <span style={s.cardLabel}>{card.label}</span>
            </div>
          ))}
        </div>

        <div style={s.emptyState}>
          <div style={s.emptyIcon}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#2a2a2a" strokeWidth="1.5">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <p style={s.emptyText}>El panel de control está siendo configurado.</p>
          <p style={s.emptySubtext}>Las secciones se irán activando en próximas fases del desarrollo.</p>
        </div>
      </div>
    </Layout>
  );
}

const s = {
  page: { padding: '28px 32px' },
  header: { marginBottom: '28px' },
  pageTitle: { fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '22px', color: '#f0f0f0' },
  pageSubtitle: { fontSize: '13px', color: '#555', marginTop: '4px' },
  cards: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '14px', marginBottom: '40px' },
  card: {
    background: '#111', border: '1px solid #1e1e1e', borderRadius: '10px',
    padding: '18px', display: 'flex', flexDirection: 'column', gap: '8px',
  },
  cardIcon: { fontSize: '20px' },
  cardValue: { fontSize: '28px', fontWeight: 700, color: '#c9a84c', fontFamily: 'Montserrat, sans-serif' },
  cardLabel: { fontSize: '12px', color: '#555' },
  emptyState: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '50px 20px', gap: '10px' },
  emptyIcon: { marginBottom: '6px' },
  emptyText: { fontSize: '14px', color: '#444', fontWeight: 500 },
  emptySubtext: { fontSize: '13px', color: '#333' },
};

import React from 'react';
import { Briefcase, Home, LogOut, Shield, Tool } from 'react-feather';

export default function Navbar({ 
  currentUser, 
  projects, 
  currentProjectId, 
  setCurrentProjectId, 
  onLogout 
}) {
  const isAdmin = currentUser?.role === 'admin';

  return (
    <header style={{
      background: '#ffffff',
      borderBottom: '1px solid var(--border-color)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      padding: '12px 24px'
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        {/* Brand Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '8px',
            background: '#d97706',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            fontWeight: 'bold'
          }}>
            <Briefcase size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0f172a' }}>
                BuildMaster ERP
              </h1>
              <span className={`badge ${isAdmin ? 'badge-amber' : 'badge-blue'}`}>
                {isAdmin ? 'Admin Portal' : 'Site Engineer Portal'}
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: '#64748b' }}>
              Construction Management System
            </p>
          </div>
        </div>

        {/* Project Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Home size={18} color="#d97706" />
          {(() => {
            const userName = (currentUser?.name || '').trim().toLowerCase();
            const userEmail = (currentUser?.email || '').trim().toLowerCase();

            const selectableProjects = isAdmin 
              ? (projects || []) 
              : (projects || []).filter(p => {
                  if (p.status === 'Pending Acceptance' || p.status === 'Rejected') return false;
                  const acceptedByName = (p.acceptedBy || '').trim().toLowerCase();
                  const acceptedByEmail = (p.acceptedByEmail || '').trim().toLowerCase();
                  const engName = (p.engineerInCharge || '').trim().toLowerCase();
                  return (acceptedByName && acceptedByName === userName) ||
                         (acceptedByEmail && acceptedByEmail === userEmail) ||
                         (engName === userName || engName === userEmail);
                });

            return (
              <select 
                value={currentProjectId} 
                onChange={(e) => setCurrentProjectId(e.target.value)}
                className="form-control"
                disabled={!isAdmin && selectableProjects.length === 0}
                style={{ 
                  minWidth: '250px', 
                  padding: '7px 12px', 
                  background: selectableProjects.length === 0 && !isAdmin ? '#f1f5f9' : '#f8fafc', 
                  fontWeight: 600, 
                  color: '#0f172a', 
                  border: '1.5px solid #d97706',
                  opacity: selectableProjects.length === 0 && !isAdmin ? 0.75 : 1
                }}
              >
                {selectableProjects && selectableProjects.length > 0 ? (
                  <>
                    {selectableProjects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                    {isAdmin && <option value="ALL">View All Projects</option>}
                  </>
                ) : (
                  <option value="">{isAdmin ? 'No Active Projects' : 'No Active Project Assigned'}</option>
                )}
              </select>
            );
          })()}
        </div>

        {/* Logged-In User Profile Info & Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
              {isAdmin ? <Shield size={16} color="#d97706" /> : <Tool size={16} color="#2563eb" />}
              {currentUser?.name || 'User'}
            </div>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
              {currentUser?.email}
            </span>
          </div>

          <button 
            className="btn btn-sm btn-secondary" 
            onClick={onLogout} 
            title="Logout"
            style={{ color: '#dc2626', borderColor: '#fecaca', background: '#ffffff' }}
          >
            <LogOut size={16} /> Logout
          </button>

        </div>
      </div>
    </header>
  );
}

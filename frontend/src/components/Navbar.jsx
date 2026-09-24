import React, { useState, useEffect, useRef } from 'react';
import { Briefcase, Home, LogOut, Shield, Tool, Bell, CheckCircle, Clock, X, Check, DollarSign, FileText, Package } from 'react-feather';

export default function Navbar({ 
  currentUser, 
  projects, 
  currentProjectId, 
  setCurrentProjectId, 
  onLogout 
}) {
  const isAdmin = currentUser?.role === 'admin';
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Fetch notifications from MongoDB notifications collection
  const fetchNotifications = async () => {
    try {
      const roleParam = currentUser?.role || '';
      const emailParam = encodeURIComponent(currentUser?.email || '');
      const res = await fetch(`/api/notifications?role=${roleParam}&email=${emailParam}`).then(r => r.json());
      if (res.success && Array.isArray(res.notifications)) {
        setNotifications(res.notifications);
      }
    } catch (e) {
      // silent fail fallback
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 6000);
    return () => clearInterval(interval);
  }, [currentUser]);

  // Click outside listener to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAllRead = async () => {
    try {
      await fetch('/api/notifications/mark-all-read', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: currentUser?.role, email: currentUser?.email })
      });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (e) {}
  };

  const handleNotificationClick = async (notif) => {
    try {
      if (!notif.read) {
        await fetch(`/api/notifications/${notif.id}/read`, { method: 'PATCH' });
        setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
      }
    } catch (e) {}
    setShowDropdown(false);
    if (notif.link) {
      window.location.href = notif.link;
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'payment':
        return <DollarSign size={14} color="#059669" />;
      case 'dpr':
        return <FileText size={14} color="#d97706" />;
      case 'material':
        return <Package size={14} color="#2563eb" />;
      default:
        return <CheckCircle size={14} color="#2563eb" />;
    }
  };

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
              <h1 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                BuildMaster ERP
              </h1>
              <span className={`badge ${isAdmin ? 'badge-amber' : 'badge-blue'}`}>
                {isAdmin ? 'Admin Portal' : 'Site Engineer Portal'}
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>
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
                  minWidth: '240px', 
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

        {/* Right Section: Notification Bell + Profile Info + Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>

          {/* Header Notification Bell with Glowing Red Badge */}
          <div ref={dropdownRef} style={{ position: 'relative' }}>
            <button 
              type="button"
              onClick={() => setShowDropdown(prev => !prev)}
              style={{
                position: 'relative',
                background: showDropdown ? '#fef3c7' : '#f8fafc',
                border: '1px solid ' + (showDropdown ? '#fde68a' : '#e2e8f0'),
                borderRadius: '8px',
                padding: '8px 10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: showDropdown ? '#b45309' : '#475569',
                transition: 'all 0.15s ease'
              }}
              title="View Notifications"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span 
                  style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    width: '18px',
                    height: '18px',
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    color: '#ffffff',
                    backgroundColor: '#dc2626',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                    boxShadow: '0 0 0 2px #ffffff'
                  }}
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Popover Dropdown */}
            {showDropdown && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 10px)',
                right: 0,
                width: '340px',
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '12px',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                zIndex: 1000,
                overflow: 'hidden',
                animation: 'fadeIn 0.15s ease-out'
              }}>
                {/* Popover Header */}
                <div style={{
                  padding: '12px 16px',
                  background: '#f8fafc',
                  borderBottom: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9rem' }}>Notifications</span>
                    {unreadCount > 0 && (
                      <span style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', fontSize: '0.7rem', fontWeight: 700, padding: '1px 6px', borderRadius: '10px' }}>
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={handleMarkAllRead}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        color: '#2563eb',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        padding: 0
                      }}
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                {/* Popover Notification List */}
                <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: '28px', textAlign: 'center', color: '#94a3b8', fontSize: '0.84rem' }}>
                      <Bell size={24} color="#cbd5e1" style={{ margin: '0 auto 8px auto', display: 'block' }} />
                      No notifications yet
                    </div>
                  ) : (
                    notifications.slice(0, 15).map((n) => (
                      <div
                        key={n.id}
                        onClick={() => handleNotificationClick(n)}
                        style={{
                          padding: '10px 14px',
                          borderBottom: '1px solid #f1f5f9',
                          background: n.read ? '#ffffff' : '#f0f9ff',
                          cursor: 'pointer',
                          display: 'flex',
                          gap: '10px',
                          alignItems: 'flex-start',
                          transition: 'background 0.15s ease'
                        }}
                      >
                        <div style={{
                          marginTop: '2px',
                          padding: '5px',
                          borderRadius: '6px',
                          background: n.read ? '#f1f5f9' : '#e0f2fe'
                        }}>
                          {getTypeIcon(n.type)}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
                            <strong style={{ fontSize: '0.82rem', color: '#0f172a' }}>{n.title}</strong>
                            {!n.read && (
                              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#2563eb', display: 'inline-block' }} />
                            )}
                          </div>
                          <p style={{ margin: '2px 0 0 0', fontSize: '0.76rem', color: '#475569', lineHeight: 1.35 }}>
                            {n.message}
                          </p>
                          <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={10} />
                            {n.createdAt ? new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Popover Footer */}
                <div style={{ padding: '8px 14px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                    Synced to MongoDB <span style={{ fontFamily: 'monospace' }}>notifications</span> collection
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Info */}
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
              {isAdmin ? <Shield size={16} color="#d97706" /> : <Tool size={16} color="#2563eb" />}
              {currentUser?.name || 'User'}
            </div>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
              {currentUser?.email}
            </span>
          </div>

          {/* Logout Button */}
          <button 
            className="btn btn-sm btn-secondary" 
            onClick={onLogout} 
            title="Logout"
            style={{ color: '#dc2626', borderColor: '#fecaca', background: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <LogOut size={16} /> Logout
          </button>

        </div>
      </div>
    </header>
  );
}

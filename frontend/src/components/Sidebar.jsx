import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Grid, Briefcase, Package, Users, FileText, CheckSquare, TrendingUp, Clipboard, DollarSign, LogOut, Camera, ChevronDown, ChevronRight
} from 'react-feather';
import { CONSTRUCTION_LABOR_CATEGORIES, isWorkerInTrade } from '../utils/laborCategories';

export default function Sidebar({ currentUser, onLogout, hasPendingProjects, workers = [] }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = currentUser?.role === 'admin';

  // Read active category from URL search parameters if on workers page
  const searchParams = new URLSearchParams(location.search);
  const activeCategoryParam = location.pathname.startsWith('/site/workers') ? (searchParams.get('category') || 'all') : null;

  // Keep labor submenu open if on /site/workers
  const [laborMenuOpen, setLaborMenuOpen] = React.useState(true);

  const adminNav = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: Grid },
    { path: '/admin/projects', label: 'Projects & Sites', icon: Briefcase },
    { path: '/admin/engineers', label: 'Site Engineers', icon: Users },
    { path: '/admin/expenses', label: 'Expenses', icon: DollarSign },
    { path: '/admin/reports', label: 'Daily Reports', icon: FileText }
  ];

  const engineerNav = [
    { path: '/site/dashboard', label: 'Dashboard', icon: Grid },
    { path: '/site/projects', label: 'My Projects', icon: Briefcase, hasBadge: hasPendingProjects },
    { path: '/site/tasks', label: 'Tasks', icon: CheckSquare },
    { path: '/site/workers', label: 'Site Labor', icon: Users, isLaborMenu: true },
    { path: '/site/site-progress', label: 'Site Progress', icon: TrendingUp },
    { path: '/site/reports', label: 'Daily Reports', icon: Clipboard }
  ];

  const navItems = isAdmin ? adminNav : engineerNav;

  const getCategoryCount = (catId) => {
    if (!workers || !Array.isArray(workers)) return 0;
    if (catId === 'all') return workers.length;
    return workers.filter(w => isWorkerInTrade(w.trade, catId)).length;
  };

  return (
    <aside style={{
      width: '240px',
      background: '#ffffff',
      borderRight: '1px solid #e2e8f0',
      minHeight: 'calc(100vh - 65px)',
      padding: '20px 14px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between'
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div style={{ padding: '0 8px 10px 8px', fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {isAdmin ? 'Admin Menu' : 'Site Engineer Menu'}
        </div>

        {navItems.map(item => {
          const Icon = item.icon;
          const isExactActive = location.pathname === item.path;
          const isDashboardActive = location.pathname === '/' && item.path.includes('dashboard');
          const isActive = isExactActive || isDashboardActive;

          if (item.isLaborMenu) {
            const isLaborPage = location.pathname.startsWith('/site/workers');
            return (
              <div key={item.path} style={{ display: 'flex', flexDirection: 'column' }}>
                <div
                  onClick={() => {
                    navigate('/site/workers');
                    setLaborMenuOpen(prev => !prev);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    background: isLaborPage ? '#eff6ff' : 'transparent',
                    color: isLaborPage ? '#1d4ed8' : '#475569',
                    fontWeight: isLaborPage ? 700 : 500,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    userSelect: 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Icon size={17} color={isLaborPage ? '#2563eb' : '#64748b'} />
                    <span>{item.label}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{
                      fontSize: '0.7rem',
                      background: isLaborPage ? '#dbeafe' : '#f1f5f9',
                      color: isLaborPage ? '#1e40af' : '#64748b',
                      padding: '1px 6px',
                      borderRadius: '10px',
                      fontWeight: 700
                    }}>
                      {workers.length}
                    </span>
                    {laborMenuOpen ? <ChevronDown size={14} color="#64748b" /> : <ChevronRight size={14} color="#64748b" />}
                  </div>
                </div>

                {/* Submenu for Labor Categories */}
                {laborMenuOpen && (
                  <div style={{
                    marginLeft: '12px',
                    paddingLeft: '10px',
                    borderLeft: '2px solid #e2e8f0',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                    marginTop: '4px',
                    marginBottom: '6px'
                  }}>
                    {/* All Labor Link */}
                    <button
                      type="button"
                      onClick={() => navigate('/site/workers')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '5px 8px',
                        borderRadius: '6px',
                        border: 'none',
                        background: (isLaborPage && (!activeCategoryParam || activeCategoryParam === 'all')) ? '#e0f2fe' : 'transparent',
                        color: (isLaborPage && (!activeCategoryParam || activeCategoryParam === 'all')) ? '#0369a1' : '#64748b',
                        fontSize: '0.76rem',
                        fontWeight: (isLaborPage && (!activeCategoryParam || activeCategoryParam === 'all')) ? 700 : 500,
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                    >
                      <span>All Categories</span>
                      <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b' }}>
                        {workers.length}
                      </span>
                    </button>

                    {/* Specific Category Links */}
                    {CONSTRUCTION_LABOR_CATEGORIES.map(cat => {
                      const count = getCategoryCount(cat.id);
                      const isCatActive = isLaborPage && (activeCategoryParam === cat.id || activeCategoryParam === cat.label);

                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => navigate(`/site/workers?category=${encodeURIComponent(cat.id)}`)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '5px 8px',
                            borderRadius: '6px',
                            border: 'none',
                            background: isCatActive ? '#e0f2fe' : 'transparent',
                            color: isCatActive ? '#0369a1' : (count > 0 ? '#334155' : '#94a3b8'),
                            fontSize: '0.76rem',
                            fontWeight: isCatActive ? 700 : 500,
                            cursor: 'pointer',
                            textAlign: 'left'
                          }}
                        >
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {cat.label}
                          </span>
                          <span style={{
                            fontSize: '0.67rem',
                            background: count > 0 ? (isCatActive ? '#bae6fd' : '#f1f5f9') : '#f8fafc',
                            color: count > 0 ? (isCatActive ? '#0284c7' : '#475569') : '#cbd5e1',
                            padding: '1px 5px',
                            borderRadius: '8px',
                            fontWeight: 700,
                            minWidth: '18px',
                            textAlign: 'center'
                          }}>
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '9px 12px',
                borderRadius: '8px',
                border: 'none',
                background: isActive ? '#fef3c7' : 'transparent',
                color: isActive ? '#b45309' : '#475569',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.85rem',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
                position: 'relative'
              }}
            >
              <Icon size={17} color={isActive ? '#d97706' : '#64748b'} />
              <span>{item.label}</span>

              {item.hasBadge && (
                <span 
                  className="red-notification-dot" 
                  style={{ marginLeft: 'auto' }}
                  title="New pending project invitation available!"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Logout Item at bottom of Sidebar */}
      <button
        onClick={onLogout}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '10px 14px',
          borderRadius: '8px',
          border: '1px solid #fecaca',
          background: '#fff1f2',
          color: '#dc2626',
          fontWeight: 600,
          fontSize: '0.875rem',
          cursor: 'pointer',
          marginTop: '20px'
        }}
      >
        <LogOut size={18} color="#dc2626" />
        <span>Logout</span>
      </button>
    </aside>
  );
}

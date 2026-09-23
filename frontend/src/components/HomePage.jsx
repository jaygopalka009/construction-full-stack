import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, ArrowRight, Shield, Tool, CheckCircle, Phone, Mail, MapPin } from 'react-feather';

export default function HomePage({ currentUser }) {
  const navigate = useNavigate();

  const handleEnterDashboard = () => {
    if (currentUser) {
      const target = currentUser.role === 'admin' ? '/admin/dashboard' : '/site/dashboard';
      navigate(target);
    } else {
      navigate('/login');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#ffffff', color: '#1e293b', fontFamily: 'var(--font-family, sans-serif)' }}>
      {/* Simple Clean Navbar */}
      <header style={{
        background: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        padding: '16px 32px',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => navigate('/')}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '8px',
              background: '#d97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff'
            }}>
              <Briefcase size={20} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#0f172a', lineHeight: 1.2 }}>
                BuildMaster ERP
              </h1>
              <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>
                Construction Management
              </p>
            </div>
          </div>

          {/* Nav Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {currentUser ? (
              <button
                onClick={handleEnterDashboard}
                style={{
                  background: '#d97706',
                  color: '#ffffff',
                  border: 'none',
                  padding: '9px 18px',
                  borderRadius: '6px',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                Go to Dashboard <ArrowRight size={15} />
              </button>
            ) : (
              <>
                <button
                  onClick={() => navigate('/login')}
                  style={{
                    background: 'transparent',
                    color: '#334155',
                    border: '1px solid #cbd5e1',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    fontWeight: 600,
                    fontSize: '0.88rem',
                    cursor: 'pointer'
                  }}
                >
                  Sign In
                </button>
                <button
                  onClick={() => navigate('/login')}
                  style={{
                    background: '#d97706',
                    color: '#ffffff',
                    border: 'none',
                    padding: '8px 18px',
                    borderRadius: '6px',
                    fontWeight: 600,
                    fontSize: '0.88rem',
                    cursor: 'pointer'
                  }}
                >
                  Login Portal
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Clean Hero Section */}
      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '48px 20px 60px 20px', textAlign: 'center' }}>
        {/* Simple Badge */}
        <div style={{
          display: 'inline-block',
          background: '#fef3c7',
          color: '#92400e',
          padding: '4px 14px',
          borderRadius: '20px',
          fontSize: '0.82rem',
          fontWeight: 600,
          marginBottom: '16px'
        }}>
          Simple & Reliable Construction Management
        </div>

        {/* Sober Headline */}
        <h2 style={{
          fontSize: 'clamp(2rem, 4vw, 2.8rem)',
          fontWeight: 800,
          color: '#0f172a',
          margin: '0 auto 16px auto',
          maxWidth: '800px',
          lineHeight: 1.25
        }}>
          Digital Site Supervision & Progress Tracking
        </h2>

        {/* Clean Subtitle */}
        <p style={{
          fontSize: '1.05rem',
          color: '#475569',
          maxWidth: '680px',
          margin: '0 auto 28px auto',
          lineHeight: 1.6
        }}>
          Manage construction sites, heavy machinery fleet, labor attendance, material inventory, and daily progress reports all in one simple system.
        </p>

        {/* Simple Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap', marginBottom: '36px' }}>
          <button
            onClick={() => navigate('/login?role=admin')}
            style={{
              background: '#0f172a',
              color: '#ffffff',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '0.95rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Shield size={16} /> Admin Portal
          </button>

          <button
            onClick={() => navigate('/login?role=site_engineer')}
            style={{
              background: '#d97706',
              color: '#ffffff',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '0.95rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Tool size={16} /> Site Engineer Portal
          </button>
        </div>

        {/* ONE BIG PROMINENT PHOTO FROM /img FOLDER */}
        <div style={{
          margin: '0 auto 50px auto',
          maxWidth: '960px',
          borderRadius: '14px',
          overflow: 'hidden',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)',
          border: '1px solid #e2e8f0',
          background: '#f8fafc'
        }}>
          <img
            src="/img/hero.png"
            alt="Construction Project Site"
            style={{
              width: '100%',
              maxHeight: '480px',
              objectFit: 'cover',
              display: 'block'
            }}
            onError={(e) => {
              // Fallback to roww house.png if hero.png has issue
              e.currentTarget.src = '/img/roww house.png';
            }}
          />
        </div>

        {/* Simple 4 Feature Highlights */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '20px',
          textAlign: 'left',
          marginTop: '20px'
        }}>
          {[
            {
              title: 'Project Tracking',
              desc: 'Monitor multi-storey buildings, row houses, bungalows, roads, and bridge milestones.'
            },
            {
              title: 'Heavy Machinery Fleet',
              desc: 'Track JCB excavators, transit mixers, rollers, running hours, and fuel readings.'
            },
            {
              title: 'Labor & Wages',
              desc: 'Daily worker attendance, category wages, and site labor records.'
            },
            {
              title: 'Daily Site Reports (DPR)',
              desc: 'Site engineers submit daily work logs and high-resolution photo evidence.'
            }
          ].map((item, idx) => (
            <div key={idx} style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              padding: '20px',
              borderRadius: '10px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <CheckCircle size={18} color="#d97706" />
                <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>
                  {item.title}
                </h3>
              </div>
              <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </main>

      {/* Simple Sober Footer */}
      <footer style={{
        background: '#f8fafc',
        borderTop: '1px solid #e2e8f0',
        padding: '30px 20px',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '24px',
              height: '24px',
              borderRadius: '6px',
              background: '#d97706',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Briefcase size={14} />
            </div>
            <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
              BuildMaster ERP
            </span>
          </div>

          <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0 }}>
            Construction Site & Project Management System &bull; Clean & Simple Edition
          </p>
        </div>
      </footer>
    </div>
  );
}

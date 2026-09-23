import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Phone, Mail, MapPin, CheckCircle, ChevronRight, Layers, Award, Shield } from 'react-feather';

// Modern Architectural Construction Logo
function AppLogo({ size = 40 }) {
  return (
    <div style={{
      width: `${size}px`,
      height: `${size}px`,
      borderRadius: '10px',
      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#ffffff',
      boxShadow: '0 4px 12px rgba(217, 119, 6, 0.3)',
      flexShrink: 0
    }}>
      <svg width={Math.round(size * 0.58)} height={Math.round(size * 0.58)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 21h18" />
        <path d="M5 21V7l8-4v18" />
        <path d="M19 21V11l-6-4" />
        <path d="M9 9v.01" />
        <path d="M9 12v.01" />
        <path d="M9 15v.01" />
        <path d="M9 18v.01" />
      </svg>
    </div>
  );
}

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

  const projectTypes = [
    {
      title: 'Commercial & Residential Towers',
      badge: 'Building',
      desc: 'Multi-storey column casting, basement excavation, AAC block masonry, electrical/plumbing rough-in, and lift safety installations.'
    },
    {
      title: 'Bridge & Flyover Infrastructure',
      badge: 'Bridge',
      desc: 'Hydrological surveys, deep riverbed pile piers, concrete pier caps, pre-stressed girders, and deck slab casting.'
    },
    {
      title: 'Integrated Row Housing Communities',
      badge: 'Row House',
      desc: 'Trench boundary layout, combined footings, multi-unit frame casting, modular brickwork, and vitrified floor finishes.'
    },
    {
      title: 'Luxury Bungalows & Villas',
      badge: 'Bungalow',
      desc: 'Foundation soil excavation, plinth beams, RCC slab curing, architectural brickwork, and modular interior millwork.'
    },
    {
      title: 'Highways & Concrete Roadways',
      badge: 'Road Work',
      desc: 'Terrain leveling, subgrade compaction, Granular Sub-Base (GSB), Wet Mix Macadam (WMM), and bituminous surface rolling.'
    }
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#ffffff', color: '#1e293b', fontFamily: 'var(--font-family, sans-serif)' }}>
      {/* Header with Navigation & Contact Phone */}
      <header style={{
        background: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        padding: '16px 32px',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => navigate('/')}>
            <AppLogo size={42} />
            <div>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#0f172a', lineHeight: 1.2 }}>
                BuildMaster <span style={{ color: '#d97706' }}>ERP</span>
              </h1>
              <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>
                Construction Management
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '28px' }} className="hide-on-mobile">
            <a href="#projects" style={{ color: '#334155', textDecoration: 'none', fontSize: '0.92rem', fontWeight: 600 }}>
              Projects
            </a>
            <a href="#about" style={{ color: '#334155', textDecoration: 'none', fontSize: '0.92rem', fontWeight: 600 }}>
              About Us
            </a>
            <a href="#contact" style={{ color: '#334155', textDecoration: 'none', fontSize: '0.92rem', fontWeight: 600 }}>
              Contact Us
            </a>
            <a href="tel:9876543210" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: '#d97706',
              textDecoration: 'none',
              fontSize: '0.88rem',
              fontWeight: 700,
              background: '#fef3c7',
              padding: '6px 12px',
              borderRadius: '20px'
            }}>
              <Phone size={14} /> +91 98765 43210
            </a>
          </nav>

          {/* Right Action Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {currentUser ? (
              <button
                onClick={handleEnterDashboard}
                style={{
                  background: '#d97706',
                  color: '#ffffff',
                  border: 'none',
                  padding: '9px 18px',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                Dashboard <ArrowRight size={15} />
              </button>
            ) : (
              <button
                onClick={() => navigate('/login')}
                style={{
                  background: '#0f172a',
                  color: '#ffffff',
                  border: 'none',
                  padding: '9px 18px',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  cursor: 'pointer'
                }}
              >
                Login
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '44px 20px 40px 20px', textAlign: 'center' }}>
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

        <h2 style={{
          fontSize: 'clamp(2rem, 4vw, 2.75rem)',
          fontWeight: 800,
          color: '#0f172a',
          margin: '0 auto 16px auto',
          maxWidth: '820px',
          lineHeight: 1.25
        }}>
          Digital Site Supervision & Progress Tracking
        </h2>

        <p style={{
          fontSize: '1.05rem',
          color: '#475569',
          maxWidth: '680px',
          margin: '0 auto 36px auto',
          lineHeight: 1.6
        }}>
          Manage construction sites, heavy machinery fleet, labor attendance, material inventory, and daily progress reports all in one simple system.
        </p>

        {/* ONE BIG PROMINENT PHOTO FROM /img FOLDER */}
        <div style={{
          margin: '0 auto 60px auto',
          maxWidth: '980px',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 12px 35px rgba(0, 0, 0, 0.08)',
          border: '1px solid #e2e8f0',
          background: '#f8fafc'
        }}>
          <img
            src="/img/construction-hero.jpg"
            alt="Construction Project Site"
            style={{
              width: '100%',
              maxHeight: '500px',
              objectFit: 'cover',
              display: 'block'
            }}
            onError={(e) => {
              e.currentTarget.src = '/img/hero.png';
            }}
          />
        </div>

        {/* 4 Feature Highlights */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '20px',
          textAlign: 'left',
          marginBottom: '80px'
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
              padding: '22px',
              borderRadius: '12px'
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

        {/* Projects Section */}
        <section id="projects" style={{
          padding: '50px 0',
          borderTop: '1px solid #e2e8f0',
          textAlign: 'left'
        }}>
          <div style={{ marginBottom: '32px', textAlign: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Civil Categories
            </span>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', margin: '6px 0' }}>
              Supported Construction Projects
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.92rem' }}>
              Standardized automated milestone stages for each construction project classification.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '20px'
          }}>
            {projectTypes.map((proj, idx) => (
              <div key={idx} style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                padding: '24px',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
              }}>
                <span style={{
                  display: 'inline-block',
                  background: '#fef3c7',
                  color: '#92400e',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '3px 10px',
                  borderRadius: '12px',
                  marginBottom: '10px'
                }}>
                  {proj.badge}
                </span>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', margin: '0 0 8px 0' }}>
                  {proj.title}
                </h3>
                <p style={{ fontSize: '0.86rem', color: '#64748b', lineHeight: 1.5, margin: 0 }}>
                  {proj.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* About Us Section */}
        <section id="about" style={{
          padding: '60px 0',
          borderTop: '1px solid #e2e8f0',
          textAlign: 'left'
        }}>
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '40px'
          }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              About Us
            </span>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', margin: '8px 0 16px 0' }}>
              About BuildMaster ERP
            </h2>
            <p style={{ fontSize: '0.95rem', color: '#475569', lineHeight: 1.7, marginBottom: '16px' }}>
              BuildMaster ERP is a comprehensive, full-stack construction and infrastructure project management platform designed for civil engineering contractors, developers, and project managers. We bridge the gap between administrative oversight and real-world job site execution.
            </p>
            <p style={{ fontSize: '0.95rem', color: '#475569', lineHeight: 1.7, margin: 0 }}>
              From heavy equipment tracking to real-time labor wage auditing and photo-verified daily progress reporting, BuildMaster ERP delivers transparency, operational efficiency, and timely project delivery across Gujarat and India.
            </p>
          </div>
        </section>

        {/* Contact Us Section */}
        <section id="contact" style={{
          padding: '60px 0 20px 0',
          borderTop: '1px solid #e2e8f0',
          textAlign: 'left'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Get In Touch
            </span>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', margin: '6px 0' }}>
              Contact Us
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.92rem' }}>
              Have questions or need assistance with your site operations? Reach out directly.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px'
          }}>
            {/* Phone Card */}
            <div style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              padding: '28px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '16px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
            }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '10px',
                background: '#fef3c7',
                color: '#d97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Phone size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 6px 0', color: '#0f172a' }}>
                  Call Us
                </h3>
                <a href="tel:9876543210" style={{ fontSize: '1.05rem', fontWeight: 700, color: '#d97706', textDecoration: 'none' }}>
                  +91 98765 43210
                </a>
                <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '4px 0 0 0' }}>
                  Monday to Saturday: 9:00 AM – 7:00 PM
                </p>
              </div>
            </div>

            {/* Address Card */}
            <div style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              padding: '28px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '16px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
            }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '10px',
                background: '#e0f2fe',
                color: '#0284c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <MapPin size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 6px 0', color: '#0f172a' }}>
                  Office Address
                </h3>
                <p style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1e293b', margin: 0 }}>
                  Ahmedabad, Gujarat - 380015
                </p>
                <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '4px 0 0 0' }}>
                  Construction ERP Corporate Headquarters
                </p>
              </div>
            </div>

            {/* Email Card */}
            <div style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              padding: '28px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '16px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
            }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '10px',
                background: '#dcfce7',
                color: '#15803d',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Mail size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 6px 0', color: '#0f172a' }}>
                  Email Support
                </h3>
                <a href="mailto:info@buildmaster.erp" style={{ fontSize: '0.95rem', fontWeight: 600, color: '#15803d', textDecoration: 'none' }}>
                  info@buildmaster.erp
                </a>
                <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '4px 0 0 0' }}>
                  24/7 dedicated query assistance
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Clean Sober Footer with Address and Phone */}
      <footer style={{
        background: '#0f172a',
        color: '#ffffff',
        padding: '48px 24px 32px 24px',
        marginTop: '60px'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '30px',
          paddingBottom: '32px',
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}>
          {/* Brand & Address */}
          <div style={{ maxWidth: '380px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <AppLogo size={36} />
              <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff' }}>
                BuildMaster <span style={{ color: '#f59e0b' }}>ERP</span>
              </span>
            </div>
            <p style={{ fontSize: '0.86rem', color: '#94a3b8', lineHeight: 1.6, margin: '0 0 12px 0' }}>
              Next-generation construction management system for tracking sites, heavy fleet, labor attendance, and daily progress.
            </p>
            <div style={{ fontSize: '0.85rem', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapPin size={15} color="#f59e0b" /> Ahmedabad, Gujarat - 380015
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Phone size={15} color="#f59e0b" /> +91 98765 43210
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#ffffff', marginBottom: '14px' }}>
              Quick Navigation
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.86rem' }}>
              <a href="#projects" style={{ color: '#94a3b8', textDecoration: 'none' }}>Projects</a>
              <a href="#about" style={{ color: '#94a3b8', textDecoration: 'none' }}>About Us</a>
              <a href="#contact" style={{ color: '#94a3b8', textDecoration: 'none' }}>Contact Us</a>
              <span onClick={() => navigate('/login')} style={{ color: '#f59e0b', cursor: 'pointer', fontWeight: 600 }}>Login Portal</span>
            </div>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div style={{ maxWidth: '1200px', margin: '20px auto 0 auto', textAlign: 'center', fontSize: '0.8rem', color: '#64748b' }}>
          &copy; {new Date().getFullYear()} BuildMaster ERP &bull; Ahmedabad, Gujarat - 380015 &bull; All Rights Reserved.
        </div>
      </footer>
    </div>
  );
}

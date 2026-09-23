import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase, Truck, Users, Package, Clipboard, CheckCircle,
  TrendingUp, ArrowRight, Shield, Tool, Activity, FileText,
  Layers, Zap, Check, ChevronRight, Phone, ExternalLink
} from 'react-feather';

export default function HomePage({ currentUser, onLoginSuccess }) {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('Building');

  const categories = [
    {
      id: 'Building',
      title: 'Commercial & Residential Towers',
      badge: 'Multi-Storey',
      desc: 'Foundation soil excavation, column casting, floor slabs, AAC blocks, electrical/plumbing rough-in, and lift safety installations.',
      stages: [
        'Soil Testing & Tower Demarcation',
        'Basement Excavation & Retaining Wall RCC',
        'Multi-Storey Column Casting & Floor Slabs',
        'Exterior AAC Block Masonry & Plaster',
        'Concealed Electrical & Plumbing Rough-In',
        'Flooring Tiles & Kitchen Platform',
        'Door Shutters, Windows & Hardware',
        'Exterior Weatherproof Paint',
        'Lift Installation & Fire Safety',
        'Final Building Audit & Handover'
      ]
    },
    {
      id: 'Bridge',
      title: 'Bridges & Flyover Infrastructure',
      badge: 'Heavy Civil',
      desc: 'Hydrological surveys, riverbed pile foundations, pier caps, pre-stressed concrete girders, deck slab casting, and expansion joints.',
      stages: [
        'Hydrological Survey & Borehole Audit',
        'Riverbed Deep Foundation Pile Pier Casting',
        'Pier Cap & Concrete Abutment Construction',
        'Pre-Stressed Concrete Girder Launching',
        'Deck Slab Reinforcement & Concrete Casting',
        'Bridge Expansion Joints & Asphalt Paving'
      ]
    },
    {
      id: 'Bungalows',
      title: 'Luxury Bungalows & Villas',
      badge: 'Architectural',
      desc: 'Plot demarcation, footing beams, RCC slab casting, premium brick masonry, concealed piping, and architectural interior millwork.',
      stages: [
        'Land Survey & Plot Layout Planning',
        'Foundation Soil Excavation',
        'Footing, Plinth Beam & Concrete Structure',
        'RCC Slab Casting & Curing',
        'Brickwork Masonry & Internal/External Plaster',
        'Concealed Electrical & Sanitary Piping',
        'Flooring & Luxury Bathroom Wall Tiles',
        'Wooden Doors & Modular Joinery',
        'Interior & Exterior Paint Coating',
        'Deep Site Cleaning & Final Handover'
      ]
    },
    {
      id: 'Row House',
      title: 'Integrated Row Housing Projects',
      badge: 'Residential Community',
      desc: 'Trench boundary layout, combined footings, multi-unit frame casting, modular brickwork, and community road finishing.',
      stages: [
        'Demarcation & Boundary Trench Excavation',
        'Combined Footing & Plinth Beam Casting',
        'Ground & First Floor RCC Frame Work',
        'Brick Masonry & Plastering',
        'Concealed Conduit Wiring & Sanitary Lines',
        'Vitrified Flooring & Bathroom Tiles',
        'Wooden Doors, Windows & Millwork',
        'Two-Coat Exterior & Interior Painting',
        'Site Deep Cleaning & Final Touchup'
      ]
    },
    {
      id: 'Road Work',
      title: 'Highways & Concrete Roadways',
      badge: 'Transportation',
      desc: 'Terrain leveling, subgrade compaction, Granular Sub-Base (GSB), Wet Mix Macadam (WMM), and dense bituminous concrete rolling.',
      stages: [
        'Terrain Survey, Leveling & Subgrade Excavation',
        'Soil Compaction & Granular Sub-Base (GSB)',
        'Wet Mix Macadam (WMM) Base Layer Laying',
        'Bituminous Prime Coat & DBM Layer',
        'Bituminous Concrete Top Surface Rolling',
        'Curb Stone Fitting & Road Line Marking'
      ]
    }
  ];

  const currentCategoryData = categories.find(c => c.id === selectedCategory) || categories[0];

  const handleQuickDemoLogin = (role) => {
    navigate(`/login?role=${role}`);
  };

  const handleEnterPlatform = () => {
    if (currentUser) {
      const target = currentUser.role === 'admin' ? '/admin/dashboard' : '/site/dashboard';
      navigate(target);
    } else {
      navigate('/login');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0b1329', color: '#f8fafc', fontFamily: 'var(--font-family)' }}>
      {/* Top Navigation Bar */}
      <header style={{
        background: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        padding: '16px 28px'
      }}>
        <div style={{ maxWidth: '1360px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px' }}>
          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => navigate('/')}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 14px rgba(245, 158, 11, 0.35)'
            }}>
              <Briefcase size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#ffffff' }}>
                  BuildMaster <span style={{ color: '#f59e0b' }}>ERP</span>
                </span>
                <span style={{
                  fontSize: '0.68rem',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  background: 'rgba(245, 158, 11, 0.15)',
                  color: '#fbbf24',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  fontWeight: 700
                }}>
                  v2.0
                </span>
              </div>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0 }}>
                Enterprise Construction Intelligence
              </p>
            </div>
          </div>

          {/* Nav Links */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '28px' }} className="hide-on-mobile">
            <a href="#features" style={{ color: '#cbd5e1', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500, transition: 'color 0.2s' }}>
              Core Modules
            </a>
            <a href="#projects" style={{ color: '#cbd5e1', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500, transition: 'color 0.2s' }}>
              Project Types
            </a>
            <a href="#portals" style={{ color: '#cbd5e1', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500, transition: 'color 0.2s' }}>
              Dual Portals
            </a>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.78rem',
              color: '#34d399',
              background: 'rgba(16, 185, 129, 0.12)',
              padding: '4px 10px',
              borderRadius: '20px',
              border: '1px solid rgba(16, 185, 129, 0.25)'
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }}></span>
              Server Online
            </span>
          </nav>

          {/* Right Action */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {currentUser ? (
              <button
                onClick={handleEnterPlatform}
                style={{
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '10px 18px',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
                }}
              >
                Go to Dashboard <ArrowRight size={16} />
              </button>
            ) : (
              <>
                <button
                  onClick={() => navigate('/login')}
                  style={{
                    background: 'transparent',
                    color: '#f8fafc',
                    border: '1px solid rgba(255, 255, 255, 0.18)',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Sign In
                </button>
                <button
                  onClick={() => navigate('/login')}
                  style={{
                    background: '#f59e0b',
                    color: '#0f172a',
                    border: 'none',
                    padding: '8px 18px',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  Get Started <ChevronRight size={15} />
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{
        position: 'relative',
        padding: '75px 24px 60px 24px',
        overflow: 'hidden',
        background: 'radial-gradient(ellipse at top, rgba(245, 158, 11, 0.15) 0%, rgba(11, 19, 41, 0) 70%)'
      }}>
        <div style={{ maxWidth: '1240px', margin: '0 auto', textAlign: 'center' }}>
          {/* Pill Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(245, 158, 11, 0.12)',
            border: '1px solid rgba(245, 158, 11, 0.35)',
            padding: '6px 16px',
            borderRadius: '30px',
            color: '#fbbf24',
            fontSize: '0.82rem',
            fontWeight: 700,
            marginBottom: '24px'
          }}>
            <Zap size={14} /> Full-Stack Construction & Infrastructure ERP Platform
          </div>

          <h1 style={{
            fontSize: 'clamp(2.4rem, 5vw, 4.2rem)',
            fontWeight: 900,
            lineHeight: 1.15,
            letterSpacing: '-0.03em',
            margin: '0 auto 20px auto',
            maxWidth: '980px',
            color: '#ffffff'
          }}>
            Architecting Tomorrow's Sites with{' '}
            <span style={{
              background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 60%, #ffffff 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Precision Intelligence
            </span>
          </h1>

          <p style={{
            fontSize: 'clamp(1rem, 2vw, 1.25rem)',
            color: '#94a3b8',
            maxWidth: '780px',
            margin: '0 auto 36px auto',
            lineHeight: 1.6
          }}>
            Real-time multi-site tracking, heavy machinery telemetry, workforce attendance & daily wage audits, automated material stock deduction, and photo-verified Daily Progress Reports (DPR).
          </p>

          {/* CTA Buttons */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap', marginBottom: '50px' }}>
            <button
              onClick={() => handleQuickDemoLogin('admin')}
              style={{
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: '#ffffff',
                border: 'none',
                padding: '14px 28px',
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '1rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                boxShadow: '0 8px 24px rgba(245, 158, 11, 0.4)'
              }}
            >
              <Shield size={18} /> Enter Admin Portal <ArrowRight size={18} />
            </button>

            <button
              onClick={() => handleQuickDemoLogin('site_engineer')}
              style={{
                background: 'rgba(30, 41, 59, 0.8)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                padding: '14px 28px',
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '1rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                backdropFilter: 'blur(8px)'
              }}
            >
              <Tool size={18} color="#38bdf8" /> Enter Site Engineer Console
            </button>
          </div>

          {/* Hero KPI Stat Row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
            maxWidth: '1080px',
            margin: '0 auto'
          }}>
            {[
              { label: 'Infrastructure Types', val: '5 Modes', sub: 'Buildings, Bridges, Roads, Villas' },
              { label: 'Heavy Machinery Fleet', val: '100% Tracked', sub: 'Shift hours, fuel & service intervals' },
              { label: 'Workforce & Labor', val: '10 Trade Crafts', sub: 'Masons, steel fixers, operators' },
              { label: 'Daily Progress Reports', val: 'Photo-Verified', sub: 'Real-time site auditing' }
            ].map((kpi, idx) => (
              <div key={idx} style={{
                background: 'rgba(15, 23, 42, 0.65)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                padding: '20px 16px',
                borderRadius: '14px',
                textAlign: 'center',
                backdropFilter: 'blur(6px)'
              }}>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f59e0b', marginBottom: '4px' }}>
                  {kpi.val}
                </div>
                <div style={{ fontSize: '0.92rem', fontWeight: 600, color: '#ffffff', marginBottom: '4px' }}>
                  {kpi.label}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  {kpi.sub}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Core ERP Modules Section */}
      <section id="features" style={{ padding: '80px 24px', background: '#070d1e' }}>
        <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '50px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Comprehensive Modules
            </span>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#ffffff', margin: '8px 0 16px 0' }}>
              Engineered for Site & Management Mastery
            </h2>
            <p style={{ color: '#94a3b8', maxWidth: '640px', margin: '0 auto', fontSize: '0.95rem' }}>
              Seamlessly unify executive administration with harsh ground reality through coordinated data flows.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            {[
              {
                icon: Truck,
                color: '#f59e0b',
                title: 'Machinery & Equipment Fleet',
                desc: 'Track excavators, transit mixers, tower cranes, and rollers. Monitor daily shift running meter hours, fuel consumption, overhaul reminders, and site dispatches.'
              },
              {
                icon: Users,
                color: '#10b981',
                title: 'Site Labor & Daily Wages',
                desc: 'Manage masons, bar benders, carpenters, plumbers, and helpers. Automated attendance logging, standard market wages, and daily expenditure calculation.'
              },
              {
                icon: Package,
                color: '#3b82f6',
                title: 'Material Stock & Inventory',
                desc: 'Catalog TMT steel bars (Fe 550D), OPC/PPC cement, RMC concrete, sand, and asphalt. Automatic inventory deductions when site engineers log consumed materials.'
              },
              {
                icon: Clipboard,
                color: '#8b5cf6',
                title: 'Daily Progress Reports (DPR)',
                desc: 'Structured daily submission capturing work executed, weather parameters, labor count, material usage, and high-resolution photo evidence.'
              },
              {
                icon: TrendingUp,
                color: '#ec4899',
                title: 'Stage Milestone Tracking',
                desc: 'Automatic 10-stage execution plan per project type. Real-time percentage progress bar synced across Admin and Engineer consoles.'
              },
              {
                icon: Shield,
                color: '#06b6d4',
                title: 'Role-Based Security & Audits',
                desc: 'Distinct privileges for Super Admin and Site Engineers. Approvals for task completion, photo inspections, and material purchase indents.'
              }
            ].map((feature, i) => (
              <div
                key={i}
                style={{
                  background: 'rgba(15, 23, 42, 0.75)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '16px',
                  padding: '28px',
                  transition: 'transform 0.2s, border-color 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px'
                }}
              >
                <div style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  background: `${feature.color}1a`,
                  color: feature.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <feature.icon size={22} />
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>
                  {feature.title}
                </h3>
                <p style={{ fontSize: '0.88rem', color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Project Types & Stages Showcase */}
      <section id="projects" style={{ padding: '80px 24px', background: '#0b1329' }}>
        <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Project Archetypes
            </span>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#ffffff', margin: '8px 0 16px 0' }}>
              Tailored Execution Workflows
            </h2>
            <p style={{ color: '#94a3b8', maxWidth: '640px', margin: '0 auto', fontSize: '0.95rem' }}>
              Every construction classification triggers automated, industry-standard milestone timelines.
            </p>
          </div>

          {/* Category Selector Tabs */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '36px' }}>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                style={{
                  background: selectedCategory === cat.id ? '#f59e0b' : 'rgba(30, 41, 59, 0.7)',
                  color: selectedCategory === cat.id ? '#0f172a' : '#cbd5e1',
                  border: selectedCategory === cat.id ? '1px solid #f59e0b' : '1px solid rgba(255, 255, 255, 0.1)',
                  padding: '10px 20px',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {cat.id}
              </button>
            ))}
          </div>

          {/* Category Detail Card */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            borderRadius: '20px',
            padding: '36px',
            maxWidth: '1000px',
            margin: '0 auto',
            boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
              <div>
                <span style={{
                  fontSize: '0.75rem',
                  padding: '4px 10px',
                  borderRadius: '12px',
                  background: 'rgba(245, 158, 11, 0.2)',
                  color: '#fbbf24',
                  fontWeight: 700
                }}>
                  {currentCategoryData.badge}
                </span>
                <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ffffff', margin: '8px 0 4px 0' }}>
                  {currentCategoryData.title}
                </h3>
                <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: 0 }}>
                  {currentCategoryData.desc}
                </p>
              </div>
            </div>

            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '14px' }}>
              Automated Construction Milestone Stages:
            </h4>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '12px'
            }}>
              {currentCategoryData.stages.map((stage, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  background: 'rgba(30, 41, 59, 0.5)',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.05)'
                }}>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: 'rgba(16, 185, 129, 0.2)',
                    color: '#34d399',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    flexShrink: 0
                  }}>
                    {idx + 1}
                  </div>
                  <span style={{ fontSize: '0.85rem', color: '#e2e8f0', fontWeight: 500 }}>
                    {stage}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Dual Portals Overview */}
      <section id="portals" style={{ padding: '80px 24px', background: '#070d1e' }}>
        <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '50px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Dual Portals
            </span>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#ffffff', margin: '8px 0 16px 0' }}>
              Designed for Executives & Field Engineers
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '30px', maxWidth: '1000px', margin: '0 auto' }}>
            {/* Admin Console Card */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.85)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: '20px',
              padding: '32px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '24px'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    background: 'rgba(245, 158, 11, 0.2)',
                    color: '#fbbf24',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Shield size={22} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>Admin Command Center</h3>
                    <span style={{ fontSize: '0.78rem', color: '#f59e0b', fontWeight: 600 }}>Executive Control</span>
                  </div>
                </div>

                <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '20px' }}>
                  High-level oversight across all sites, budget approvals, machinery allocation, and site engineer project assignments.
                </p>

                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {['Enterprise multi-site dashboard', 'Project creation & client budgets', 'Review DPRs & approve task photos', 'Fleet machinery reallocation & dispatch'].map((item, idx) => (
                    <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.86rem', color: '#e2e8f0' }}>
                      <Check size={16} color="#f59e0b" /> {item}
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => handleQuickDemoLogin('admin')}
                style={{
                  background: '#f59e0b',
                  color: '#0f172a',
                  border: 'none',
                  padding: '12px 20px',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '0.92rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                Access Admin Portal <ArrowRight size={16} />
              </button>
            </div>

            {/* Site Engineer Card */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.85)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: '20px',
              padding: '32px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '24px'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    background: 'rgba(56, 189, 248, 0.2)',
                    color: '#38bdf8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Tool size={22} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>Site Engineer Portal</h3>
                    <span style={{ fontSize: '0.78rem', color: '#38bdf8', fontWeight: 600 }}>Field Operations</span>
                  </div>
                </div>

                <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '20px' }}>
                  Optimized for ground execution, daily progress reports, material usage tracking, and worker attendance.
                </p>

                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {['Daily Progress Report (DPR) with photos', 'Task completion checklists', 'Worker attendance & wage tally', 'Material indent orders to Admin'].map((item, idx) => (
                    <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.86rem', color: '#e2e8f0' }}>
                      <Check size={16} color="#38bdf8" /> {item}
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => handleQuickDemoLogin('site_engineer')}
                style={{
                  background: 'rgba(56, 189, 248, 0.15)',
                  color: '#38bdf8',
                  border: '1px solid rgba(56, 189, 248, 0.4)',
                  padding: '12px 20px',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '0.92rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                Access Site Engineer Console <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        background: '#040814',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '40px 24px',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '1240px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              background: '#f59e0b',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Briefcase size={16} />
            </div>
            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff' }}>
              BuildMaster ERP
            </span>
          </div>

          <p style={{ color: '#64748b', fontSize: '0.84rem', margin: 0 }}>
            Enterprise Construction & Heavy Infrastructure Management System &bull; All Rights Reserved
          </p>

          <div style={{ display: 'flex', gap: '16px', fontSize: '0.82rem', color: '#94a3b8' }}>
            <span onClick={() => handleQuickDemoLogin('admin')} style={{ cursor: 'pointer', textDecoration: 'underline' }}>
              Admin Login
            </span>
            &bull;
            <span onClick={() => handleQuickDemoLogin('site_engineer')} style={{ cursor: 'pointer', textDecoration: 'underline' }}>
              Site Engineer Login
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

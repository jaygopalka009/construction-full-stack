import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, User, Phone, ArrowRight, CheckCircle, ArrowLeft } from 'react-feather';

// Modern Architectural Construction Logo
function AppLogo({ size = 42 }) {
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
      boxShadow: '0 4px 12px rgba(217, 119, 6, 0.35)',
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

export default function AuthPage({ onLoginSuccess }) {
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('mode') !== 'register';
    } catch {
      return true;
    }
  });

  React.useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('mode') === 'register') {
        setIsLogin(false);
      } else if (params.get('mode') === 'login') {
        setIsLogin(true);
      }
    } catch {}
  }, []);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    if (!isLogin) {
      const cleanPhone = formData.phone ? formData.phone.replace(/\D/g, '') : '';
      if (!cleanPhone || cleanPhone.length !== 10) {
        setErrorMsg('Phone number must be exactly 10 digits');
        setLoading(false);
        return;
      }
    }

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    const payload = isLogin
      ? { email: formData.email, password: formData.password }
      : {
          name: formData.name,
          email: formData.email,
          phone: formData.phone.replace(/\D/g, ''),
          password: formData.password
        };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(r => r.json());

      if (res.success) {
        onLoginSuccess(res.user, res.token);
      } else {
        setErrorMsg(res.message || 'Authentication failed');
      }
    } catch (err) {
      setErrorMsg('Server connection error. Please check your network.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f8fafc',
      padding: '24px'
    }}>
      {/* Split-screen Modal Card */}
      <div style={{
        width: '100%',
        maxWidth: '960px',
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '20px',
        boxShadow: '0 20px 45px -10px rgba(0, 0, 0, 0.08)',
        overflow: 'hidden',
        display: 'flex',
        minHeight: '560px'
      }}>
        {/* Left Side: Branded Hero Construction Image */}
        <div style={{
          flex: '1 1 50%',
          position: 'relative',
          background: '#0f172a',
          backgroundImage: 'url(/img/construction-hero.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '40px',
          color: '#ffffff'
        }} className="hide-on-mobile">
          {/* Subtle dark gradient overlay */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.4) 0%, rgba(15, 23, 42, 0.88) 100%)',
            zIndex: 1
          }}></div>

          {/* Top Logo */}
          <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: '12px' }}>
            <AppLogo size={42} />
            <div>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#ffffff' }}>
                BuildMaster <span style={{ color: '#f59e0b' }}>ERP</span>
              </span>
              <p style={{ fontSize: '0.75rem', color: '#cbd5e1', margin: 0 }}>
                Construction Management
              </p>
            </div>
          </div>

          {/* Bottom Highlights */}
          <div style={{ position: 'relative', zIndex: 2 }}>
            <h3 style={{ fontSize: '1.45rem', fontWeight: 800, margin: '0 0 10px 0', lineHeight: 1.3 }}>
              Engineered for Site & Management Precision
            </h3>
            <p style={{ fontSize: '0.88rem', color: '#cbd5e1', lineHeight: 1.6, margin: '0 0 20px 0' }}>
              Real-time multi-site civil operations, heavy machinery telemetry, workforce attendance, and automated daily progress audits.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                'Multi-Storey, Bridge, Road & Villa Workflows',
                'Live Machinery Shift Hours & Fuel Tracking',
                'Site Photo Evidence & Progress Approval'
              ].map((text, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: '#f8fafc' }}>
                  <CheckCircle size={15} color="#f59e0b" /> {text}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Clean Sober Auth Form */}
        <div style={{
          flex: '1 1 50%',
          padding: '40px 44px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          background: '#ffffff'
        }}>
          {/* Back to Home Link */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <button
              onClick={() => navigate('/')}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#64748b',
                fontSize: '0.84rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: 0
              }}
            >
              <ArrowLeft size={15} /> Back to Home
            </button>

            <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 500 }}>
              Secure Access
            </span>
          </div>

          {/* Form Header with Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <AppLogo size={38} />
            <div>
              <h2 style={{ fontSize: '1.4rem', color: '#0f172a', fontWeight: '800', margin: 0 }}>
                {isLogin ? 'Sign In' : 'Create Account'}
              </h2>
              <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0 }}>
                {isLogin ? 'Access your Construction ERP portal' : 'Register a new Site Engineer account'}
              </p>
            </div>
          </div>

          {/* Tab Switcher */}
          <div style={{
            display: 'flex',
            background: '#f1f5f9',
            padding: '4px',
            borderRadius: '8px',
            marginBottom: '18px'
          }}>
            <button
              type="button"
              style={{
                flex: 1,
                padding: '8px',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 600,
                fontSize: '0.88rem',
                cursor: 'pointer',
                background: isLogin ? '#ffffff' : 'transparent',
                color: isLogin ? '#d97706' : '#64748b',
                boxShadow: isLogin ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.15s ease'
              }}
              onClick={() => { setIsLogin(true); setErrorMsg(''); }}
            >
              Login
            </button>
            <button
              type="button"
              style={{
                flex: 1,
                padding: '8px',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 600,
                fontSize: '0.88rem',
                cursor: 'pointer',
                background: !isLogin ? '#ffffff' : 'transparent',
                color: !isLogin ? '#d97706' : '#64748b',
                boxShadow: !isLogin ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.15s ease'
              }}
              onClick={() => { setIsLogin(false); setErrorMsg(''); }}
            >
              Register
            </button>
          </div>

          {/* Error Alert */}
          {errorMsg && (
            <div style={{
              padding: '10px 14px',
              background: '#fee2e2',
              border: '1px solid #fecaca',
              color: '#dc2626',
              borderRadius: '8px',
              fontSize: '0.85rem',
              marginBottom: '14px'
            }}>
              {errorMsg}
            </div>
          )}

          {/* Auth Form */}
          <form onSubmit={handleSubmit}>
            {/* Register Name field */}
            {!isLogin && (
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label className="form-label" style={{ fontSize: '0.84rem', fontWeight: 600, color: '#334155', marginBottom: '5px', display: 'block' }}>
                  Full Name
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={17} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                  <input
                    className="form-control"
                    style={{ paddingLeft: '38px', borderRadius: '8px' }}
                    placeholder="Enter your name"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
              </div>
            )}

            {/* Email field */}
            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label className="form-label" style={{ fontSize: '0.84rem', fontWeight: 600, color: '#334155', marginBottom: '5px', display: 'block' }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={17} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                <input
                  className="form-control"
                  type="email"
                  style={{ paddingLeft: '38px', borderRadius: '8px' }}
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Phone Number field (Only on Registration) */}
            {!isLogin && (
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label className="form-label" style={{ fontSize: '0.84rem', fontWeight: 600, color: '#334155', marginBottom: '5px', display: 'block' }}>
                  Phone Number
                </label>
                <div style={{ position: 'relative' }}>
                  <Phone size={17} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                  <input
                    className="form-control"
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    style={{ paddingLeft: '38px', borderRadius: '8px' }}
                    placeholder="Enter your phone number"
                    value={formData.phone}
                    onChange={e => {
                      const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setFormData({ ...formData, phone: digits });
                    }}
                    required
                  />
                </div>
              </div>
            )}

            {/* Password field */}
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label" style={{ fontSize: '0.84rem', fontWeight: 600, color: '#334155', marginBottom: '5px', display: 'block' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={17} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                <input
                  className="form-control"
                  type="password"
                  style={{ paddingLeft: '38px', borderRadius: '8px' }}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '11px',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.92rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
              disabled={loading}
            >
              {loading ? 'Authenticating...' : isLogin ? 'Login to Portal' : 'Create Site Engineer Account'}
              <ArrowRight size={17} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Briefcase, Lock, Mail, User, ArrowRight, CheckCircle, ArrowLeft } from 'react-feather';

export default function AuthPage({ onLoginSuccess }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [isLogin, setIsLogin] = useState(true); // true = Login, false = Register
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Auto pre-fill if role was passed from Home Page
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const role = params.get('role');
    if (role === 'admin') {
      setFormData(prev => ({
        ...prev,
        email: prev.email || 'admin@gmail.com',
        password: prev.password || 'admin'
      }));
    }
  }, [location.search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    const payload = isLogin
      ? { email: formData.email, password: formData.password }
      : { name: formData.name, email: formData.email, password: formData.password };

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
      background: '#f1f5f9',
      padding: '24px'
    }}>
      {/* Split-screen Modal Card */}
      <div style={{
        width: '100%',
        maxWidth: '980px',
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '20px',
        boxShadow: '0 20px 45px -10px rgba(0, 0, 0, 0.08)',
        overflow: 'hidden',
        display: 'flex',
        minHeight: '580px'
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
          {/* Subtle dark gradient overlay to ensure text readability */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.4) 0%, rgba(15, 23, 42, 0.85) 100%)',
            zIndex: 1
          }}></div>

          {/* Top Logo */}
          <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: '#d97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 12px rgba(217, 119, 6, 0.4)'
            }}>
              <Briefcase size={22} />
            </div>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#ffffff' }}>
              BuildMaster <span style={{ color: '#f59e0b' }}>ERP</span>
            </span>
          </div>

          {/* Bottom Highlights */}
          <div style={{ position: 'relative', zIndex: 2 }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 10px 0', lineHeight: 1.3 }}>
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
          padding: '40px 48px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#ffffff'
        }}>
          <div>
            {/* Back to Home Link */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
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
                Secure Portal
              </span>
            </div>

            {/* Title */}
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '1.6rem', color: '#0f172a', fontWeight: '800', margin: '0 0 6px 0' }}>
                {isLogin ? 'Sign In to Portal' : 'Create Account'}
              </h2>
              <p style={{ fontSize: '0.86rem', color: '#64748b', margin: 0 }}>
                {isLogin ? 'Enter your credentials to access your dashboard' : 'Register a new Site Engineer account'}
              </p>
            </div>

            {/* Tab Switcher */}
            <div style={{
              display: 'flex',
              background: '#f1f5f9',
              padding: '4px',
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              <button
                type="button"
                style={{
                  flex: 1,
                  padding: '9px',
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
                  padding: '9px',
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
                marginBottom: '16px'
              }}>
                {errorMsg}
              </div>
            )}

            {/* Auth Form */}
            <form onSubmit={handleSubmit}>
              {/* Register Name field */}
              {!isLogin && (
                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label className="form-label" style={{ fontSize: '0.84rem', fontWeight: 600, color: '#334155', marginBottom: '6px', display: 'block' }}>
                    Full Name
                  </label>
                  <div style={{ position: 'relative' }}>
                    <User size={17} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                    <input
                      className="form-control"
                      style={{ paddingLeft: '38px', borderRadius: '8px' }}
                      placeholder="e.g. Ramesh Patel"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                </div>
              )}

              {/* Email field */}
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label" style={{ fontSize: '0.84rem', fontWeight: 600, color: '#334155', marginBottom: '6px', display: 'block' }}>
                  Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={17} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                  <input
                    className="form-control"
                    type="email"
                    style={{ paddingLeft: '38px', borderRadius: '8px' }}
                    placeholder="name@erp.com"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Password field */}
              <div className="form-group" style={{ marginBottom: '18px' }}>
                <label className="form-label" style={{ fontSize: '0.84rem', fontWeight: 600, color: '#334155', marginBottom: '6px', display: 'block' }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={17} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                  <input
                    className="form-control"
                    type="password"
                    style={{ paddingLeft: '38px', borderRadius: '8px' }}
                    placeholder="••••••••"
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
                  padding: '12px',
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

          {/* Quick Demo Credentials Footer */}
          <div style={{
            marginTop: '20px',
            paddingTop: '16px',
            borderTop: '1px solid #f1f5f9',
            fontSize: '0.78rem',
            color: '#64748b',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>Demo Admin: <strong>admin@gmail.com</strong></span>
            <span
              onClick={() => setFormData({ name: '', email: 'admin@gmail.com', password: 'admin' })}
              style={{ color: '#d97706', cursor: 'pointer', fontWeight: 600 }}
            >
              Fill Demo
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

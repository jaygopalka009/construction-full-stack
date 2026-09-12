import React, { useState } from 'react';
import { Briefcase, Lock, Mail, User, ArrowRight } from 'react-feather';

export default function AuthPage({ onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true); // true = Login, false = Register
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

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
      background: '#f8fafc',
      padding: '24px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '420px',
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '16px',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)',
        padding: '32px'
      }}>
        
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '12px',
            background: '#d97706',
            color: '#ffffff',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '12px',
            boxShadow: '0 4px 12px rgba(217, 119, 6, 0.25)'
          }}>
            <Briefcase size={28} />
          </div>
          <h2 style={{ fontSize: '1.5rem', color: '#0f172a', fontWeight: '800' }}>
            BuildMaster ERP
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '4px' }}>
            {isLogin ? 'Log in to your account' : 'Register a new Site Engineer account'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div style={{
          display: 'flex',
          background: '#f1f5f9',
          padding: '4px',
          borderRadius: '8px',
          marginBottom: '24px'
        }}>
          <button
            style={{
              flex: 1,
              padding: '8px',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
              background: isLogin ? '#ffffff' : 'transparent',
              color: isLogin ? '#d97706' : '#64748b',
              boxShadow: isLogin ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.15s ease'
            }}
            onClick={() => { setIsLogin(true); setErrorMsg(''); setFormData({ name: '', email: '', password: '' }); }}
          >
            Login
          </button>
          <button
            style={{
              flex: 1,
              padding: '8px',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
              background: !isLogin ? '#ffffff' : 'transparent',
              color: !isLogin ? '#d97706' : '#64748b',
              boxShadow: !isLogin ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.15s ease'
            }}
            onClick={() => { setIsLogin(false); setErrorMsg(''); setFormData({ name: '', email: '', password: '' }); }}
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
            borderRadius: '6px',
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
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <div style={{ position: 'relative' }}>
                <User size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '11px' }} />
                <input 
                  className="form-control" 
                  style={{ paddingLeft: '38px' }}
                  placeholder="e.g. Amit Shah" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  required 
                />
              </div>
            </div>
          )}

          {/* Email field */}
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '11px' }} />
              <input 
                className="form-control" 
                type="email"
                style={{ paddingLeft: '38px' }}
                placeholder="name@erp.com" 
                value={formData.email} 
                onChange={e => setFormData({...formData, email: e.target.value})} 
                required 
              />
            </div>
          </div>

          {/* Password field */}
          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '11px' }} />
              <input 
                className="form-control" 
                type="password"
                style={{ paddingLeft: '38px' }}
                placeholder="••••••••" 
                value={formData.password} 
                onChange={e => setFormData({...formData, password: e.target.value})} 
                required 
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: '12px', padding: '11px' }}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : isLogin ? 'Login Now' : 'Create Site Engineer Account'} <ArrowRight size={18} />
          </button>
        </form>

      </div>
    </div>
  );
}

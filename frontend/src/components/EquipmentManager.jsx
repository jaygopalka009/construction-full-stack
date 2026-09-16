import React, { useState } from 'react';
import { 
  Truck, Tool, Search, Plus, Trash2, RefreshCw, CheckCircle, AlertTriangle, 
  Clock, User, Phone, Droplet, Check, X, Briefcase, Download 
} from 'react-feather';

export default function EquipmentManager({ 
  equipment = [], 
  projects = [],
  isAdmin = false, 
  onAddEquipment, 
  onUpdateStatus, 
  onLogShift,
  onDeleteEquipment 
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [projectFilter, setProjectFilter] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Shift Meter Logger Modal State
  const [showLogModal, setShowLogModal] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [shiftHours, setShiftHours] = useState('8');
  const [shiftFuel, setShiftFuel] = useState('80%');
  const [shiftNotes, setShiftNotes] = useState('');

  // New Equipment Form State
  const [newMachine, setNewMachine] = useState({
    name: '',
    type: 'Excavator / Loader',
    registrationNo: '',
    status: 'Operating',
    operatorName: '',
    operatorPhone: '',
    fuelLevel: '80%',
    runningHours: '',
    hourlyRate: '',
    notes: ''
  });

  const equipmentTypes = [
    'Excavator / Loader',
    'Tower Crane',
    'Concrete Mixer',
    'Soil Roller',
    'Dumper Truck',
    'Hydraulic Piling Rig',
    'Asphalt Paver',
    'Concrete Pump'
  ];

  // Calculations for stats cards
  const totalCount = equipment.length;
  const operatingCount = equipment.filter(e => e.status === 'Operating').length;
  const idleCount = equipment.filter(e => e.status === 'Idle').length;
  const maintenanceCount = equipment.filter(e => e.status === 'Maintenance').length;

  // Filtered Equipment List
  const filteredEquipment = equipment.filter(item => {
    const matchesSearch = 
      (item.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.type || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.registrationNo || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.operatorName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.project || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
    const matchesProject = projectFilter === 'All' || (item.project && item.project === projectFilter);
    return matchesSearch && matchesStatus && matchesProject;
  });

  const handleCreateMachine = async (e) => {
    e.preventDefault();
    if (!newMachine.name.trim()) return;
    setIsSubmitting(true);
    try {
      if (onAddEquipment) {
        await onAddEquipment(newMachine);
      }
      setShowAddModal(false);
      setNewMachine({
        name: '',
        type: 'Excavator / Loader',
        registrationNo: '',
        status: 'Operating',
        operatorName: '',
        operatorPhone: '',
        fuelLevel: '80%',
        runningHours: '',
        hourlyRate: '',
        notes: ''
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenLogModal = (machine) => {
    setSelectedMachine(machine);
    setShiftHours('8');
    setShiftFuel(machine.fuelLevel || '75%');
    setShiftNotes('');
    setShowLogModal(true);
  };

  const handleSubmitShiftLog = async (e) => {
    e.preventDefault();
    if (!selectedMachine) return;
    if (onLogShift) {
      await onLogShift(selectedMachine.id, {
        hoursWorked: Number(shiftHours) || 0,
        fuelLevel: shiftFuel,
        shiftNotes: shiftNotes
      });
    }
    setShowLogModal(false);
  };

  const handleExportCsv = () => {
    const headers = ['Machine Name', 'Category', 'Registration No', 'Status', 'Allocated Site', 'Operator', 'Contact', 'Running Hours', 'Fuel Level'];
    const rows = filteredEquipment.map(item => [
      `"${item.name || ''}"`,
      `"${item.type || ''}"`,
      `"${item.registrationNo || ''}"`,
      `"${item.status || ''}"`,
      `"${item.project || 'General Site'}"`,
      `"${item.operatorName || ''}"`,
      `"${item.operatorPhone || ''}"`,
      item.runningHours || 0,
      `"${item.fuelLevel || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Equipment_Fleet_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'Operating':
        return { bg: '#dcfce7', color: '#15803d', border: '#bbf7d0', label: 'In Operation' };
      case 'Idle':
        return { bg: '#fef3c7', color: '#b45309', border: '#fde68a', label: 'Idle / Standby' };
      case 'Maintenance':
        return { bg: '#fee2e2', color: '#b91c1c', border: '#fecaca', label: 'Under Maintenance' };
      default:
        return { bg: '#f1f5f9', color: '#475569', border: '#e2e8f0', label: status };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Banner */}
      <div className="glass-card" style={{ padding: '22px 26px', borderLeft: '4px solid #f59e0b' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span className="badge badge-amber" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Truck size={13} /> Fleet & Heavy Machinery
              </span>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                {isAdmin ? 'Central Plant & Machinery Vault' : 'Site Allocated Machinery'}
              </span>
            </div>
            <h2 style={{ fontSize: '1.45rem', margin: '4px 0', color: '#0f172a', fontWeight: 800 }}>
              Heavy Machinery & Equipment Fleet
            </h2>
            <p style={{ color: '#475569', fontSize: '0.875rem', margin: 0 }}>
              Real-time monitoring of excavators, cranes, transit mixers, rollers, running hours, and operational status.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button 
              className="btn btn-secondary" 
              onClick={handleExportCsv}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
              title="Download fleet list as CSV"
            >
              <Download size={15} /> Export Fleet (CSV)
            </button>
            <button 
              className="btn btn-primary" 
              onClick={() => setShowAddModal(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#d97706', borderColor: '#b45309' }}
            >
              <Plus size={16} /> Register Machinery
            </button>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        {/* Total Equipment */}
        <div className="card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '16px', background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Truck size={24} color="#2563eb" />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Total Fleet</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a' }}>{totalCount}</div>
            <div style={{ fontSize: '0.75rem', color: '#2563eb', fontWeight: 500 }}>Active Construction Assets</div>
          </div>
        </div>

        {/* Operating */}
        <div className="card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '16px', background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle size={24} color="#059669" />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>In Operation</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#059669' }}>{operatingCount}</div>
            <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 500 }}>Working on Sites</div>
          </div>
        </div>

        {/* Idle */}
        <div className="card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '16px', background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={24} color="#d97706" />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Idle / Standby</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#d97706' }}>{idleCount}</div>
            <div style={{ fontSize: '0.75rem', color: '#b45309', fontWeight: 500 }}>Available for Dispatch</div>
          </div>
        </div>

        {/* Maintenance */}
        <div className="card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '16px', background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertTriangle size={24} color="#dc2626" />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Maintenance</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#dc2626' }}>{maintenanceCount}</div>
            <div style={{ fontSize: '0.75rem', color: '#dc2626', fontWeight: 500 }}>Service / Repair Underway</div>
          </div>
        </div>
      </div>

      {/* Control Bar: Search & Status Filter */}
      <div style={{ 
        background: '#ffffff', 
        padding: '16px 20px', 
        borderRadius: '12px', 
        border: '1px solid #e2e8f0', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        flexWrap: 'wrap', 
        gap: '14px' 
      }}>
        {/* Search Box */}
        <div style={{ position: 'relative', minWidth: '280px', flex: 1 }}>
          <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text"
            placeholder="Search machinery by name, type, reg. number, or operator..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 12px 9px 36px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '0.875rem',
              outline: 'none'
            }}
          />
        </div>

        {/* Project Site Filter Dropdown */}
        {projects && projects.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Briefcase size={15} color="#64748b" />
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              style={{
                padding: '7px 10px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.825rem',
                fontWeight: 600,
                color: '#334155',
                background: '#f8fafc',
                cursor: 'pointer'
              }}
            >
              <option value="All">All Site Locations</option>
              {projects.map(p => (
                <option key={p.id || p.name} value={p.name}>{p.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Status Filter Tabs */}
        <div style={{ display: 'flex', gap: '6px', background: '#f1f5f9', padding: '4px', borderRadius: '8px' }}>
          {['All', 'Operating', 'Idle', 'Maintenance'].map(status => {
            const isActive = statusFilter === status;
            return (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '0.8rem',
                  fontWeight: isActive ? 700 : 500,
                  background: isActive ? '#ffffff' : 'transparent',
                  color: isActive ? '#0f172a' : '#64748b',
                  boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {status}
              </button>
            );
          })}
        </div>
      </div>

      {/* Machinery Grid / Cards View */}
      {filteredEquipment.length === 0 ? (
        <div style={{ 
          background: '#ffffff', 
          padding: '48px 24px', 
          borderRadius: '12px', 
          textAlign: 'center', 
          border: '1px dashed #cbd5e1' 
        }}>
          <Truck size={40} color="#94a3b8" style={{ margin: '0 auto 12px auto' }} />
          <h3 style={{ fontSize: '1.1rem', color: '#1e293b', margin: 0, fontWeight: 700 }}>No Machinery Found</h3>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '6px' }}>
            {searchQuery ? 'Try adjusting your search criteria.' : 'Click "Register Machinery" to add heavy equipment to this site.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '16px' }}>
          {filteredEquipment.map(item => {
            const badge = getStatusBadgeStyle(item.status);
            const runHours = Number(item.runningHours) || 0;
            const nextSvc = Number(item.nextServiceHours) || 0;
            const isServiceDue = nextSvc > 0 && (runHours >= nextSvc || (nextSvc - runHours) <= 50);

            return (
              <div 
                key={item.id}
                className="card"
                style={{
                  background: '#ffffff',
                  borderRadius: '12px',
                  border: isServiceDue ? '1px solid #fed7aa' : '1px solid #e2e8f0',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                }}
              >
                <div>
                  {/* Top Bar: Type & Status Badge */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ 
                      fontSize: '0.75rem', 
                      fontWeight: 700, 
                      color: '#475569', 
                      background: '#f1f5f9', 
                      padding: '3px 8px', 
                      borderRadius: '6px' 
                    }}>
                      {item.type}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {isServiceDue && (
                        <span style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          color: '#c2410c',
                          background: '#ffedd5',
                          padding: '2px 7px',
                          borderRadius: '10px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px'
                        }}>
                          <AlertTriangle size={11} /> Service Due
                        </span>
                      )}
                      <span style={{ 
                        fontSize: '0.75rem', 
                        fontWeight: 700, 
                        color: badge.color, 
                        background: badge.bg, 
                        border: `1px solid ${badge.border}`,
                        padding: '3px 10px', 
                        borderRadius: '12px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: badge.color }} />
                        {badge.label}
                      </span>
                    </div>
                  </div>

                  {/* Machine Name & Reg Number */}
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0' }}>
                    {item.name}
                  </h3>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>Reg: <span style={{ color: '#1e293b', background: '#f8fafc', padding: '2px 6px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>{item.registrationNo || 'N/A'}</span></span>
                    {item.project && (
                      <span style={{ fontSize: '0.75rem', color: '#2563eb', background: '#eff6ff', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                        {item.project}
                      </span>
                    )}
                  </div>

                  {/* Key Metrics: Operator, Running Hours, Fuel */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem' }}>
                      <span style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <User size={13} /> Operator:
                      </span>
                      <span style={{ fontWeight: 600, color: '#1e293b' }}>
                        {item.operatorName || 'Unassigned'}
                      </span>
                    </div>

                    {item.operatorPhone && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem' }}>
                        <span style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <Phone size={13} /> Contact:
                        </span>
                        <span style={{ fontWeight: 600, color: '#2563eb' }}>
                          {item.operatorPhone}
                        </span>
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem' }}>
                      <span style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Clock size={13} /> Meter Hours:
                      </span>
                      <span style={{ fontWeight: 700, color: '#0f172a' }}>
                        {item.runningHours || 0} hrs
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem' }}>
                      <span style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Droplet size={13} /> Fuel / Power:
                      </span>
                      <span style={{ fontWeight: 700, color: '#059669' }}>
                        {item.fuelLevel || 'N/A'}
                      </span>
                    </div>
                  </div>

                  {item.notes && (
                    <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '10px 0 0 0', fontStyle: 'italic' }}>
                      "{item.notes}"
                    </p>
                  )}
                </div>

                {/* Card Actions / Quick Status Switcher */}
                <div style={{ 
                  marginTop: '16px', 
                  paddingTop: '12px', 
                  borderTop: '1px solid #f1f5f9', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  gap: '8px'
                }}>
                  {/* Quick Status Toggle */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Set Status:</span>
                    <select
                      value={item.status}
                      onChange={(e) => onUpdateStatus && onUpdateStatus(item.id, e.target.value)}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.775rem',
                        fontWeight: 600,
                        color: '#1e293b',
                        background: '#ffffff',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="Operating">Operating</option>
                      <option value="Idle">Idle</option>
                      <option value="Maintenance">Maintenance</option>
                    </select>
                  </div>

                  {/* Delete Button (for Admin) */}
                  {isAdmin && (
                    <button
                      onClick={() => onDeleteEquipment && onDeleteEquipment(item.id)}
                      title="Remove Equipment"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#94a3b8',
                        cursor: 'pointer',
                        padding: '4px',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.color = '#dc2626'}
                      onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Register Machinery Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '560px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '18px 24px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#f8fafc'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ background: '#fef3c7', padding: '6px', borderRadius: '8px' }}>
                  <Truck size={18} color="#d97706" />
                </div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#0f172a', fontWeight: 800 }}>
                  Register Construction Machinery
                </h3>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleCreateMachine} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Machine Name *
                  </label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. JCB 3DX Backhoe"
                    value={newMachine.name}
                    onChange={(e) => setNewMachine({ ...newMachine, name: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Machinery Category
                  </label>
                  <select 
                    value={newMachine.type}
                    onChange={(e) => setNewMachine({ ...newMachine, type: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  >
                    {equipmentTypes.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Registration / Asset No.
                  </label>
                  <input 
                    type="text"
                    placeholder="e.g. GJ-01-EQ-9988"
                    value={newMachine.registrationNo}
                    onChange={(e) => setNewMachine({ ...newMachine, registrationNo: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Initial Status
                  </label>
                  <select 
                    value={newMachine.status}
                    onChange={(e) => setNewMachine({ ...newMachine, status: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  >
                    <option value="Operating">Operating (Active)</option>
                    <option value="Idle">Idle (Standby)</option>
                    <option value="Maintenance">Under Maintenance</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Assigned Operator Name
                  </label>
                  <input 
                    type="text"
                    placeholder="e.g. Ramesh Kumar"
                    value={newMachine.operatorName}
                    onChange={(e) => setNewMachine({ ...newMachine, operatorName: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Operator Mobile
                  </label>
                  <input 
                    type="text"
                    placeholder="+91 98980 00000"
                    value={newMachine.operatorPhone}
                    onChange={(e) => setNewMachine({ ...newMachine, operatorPhone: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Current Running Hours
                  </label>
                  <input 
                    type="number"
                    placeholder="e.g. 500"
                    value={newMachine.runningHours}
                    onChange={(e) => setNewMachine({ ...newMachine, runningHours: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Fuel / Battery Level
                  </label>
                  <input 
                    type="text"
                    placeholder="e.g. 85% or Diesel Full"
                    value={newMachine.fuelLevel}
                    onChange={(e) => setNewMachine({ ...newMachine, fuelLevel: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Site Allocation Notes
                </label>
                <textarea 
                  rows={2}
                  placeholder="Task assignment notes, maintenance schedule, etc."
                  value={newMachine.notes}
                  onChange={(e) => setNewMachine({ ...newMachine, notes: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', resize: 'vertical' }}
                />
              </div>

              {/* Modal Footer Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button 
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary"
                  style={{ background: '#d97706', borderColor: '#b45309' }}
                >
                  {isSubmitting ? 'Saving...' : 'Register Machinery'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log Daily Shift Hours & Fuel Modal */}
      {showLogModal && selectedMachine && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '440px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#f8fafc'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={18} color="#0284c7" />
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a', fontWeight: 700 }}>
                  Log Daily Shift Running Hours
                </h3>
              </div>
              <button 
                onClick={() => setShowLogModal(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitShiftLog} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Machinery:</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
                  {selectedMachine.name} ({selectedMachine.registrationNo})
                </div>
                <div style={{ fontSize: '0.78rem', color: '#0369a1', marginTop: '2px' }}>
                  Current Total: {selectedMachine.runningHours || 0} hrs
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Hours Worked in Today's Shift
                </label>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                  {['4', '6', '8', '10'].map(hrs => (
                    <button
                      key={hrs}
                      type="button"
                      onClick={() => setShiftHours(hrs)}
                      style={{
                        flex: 1,
                        padding: '6px',
                        borderRadius: '6px',
                        border: shiftHours === hrs ? '2px solid #0284c7' : '1px solid #cbd5e1',
                        background: shiftHours === hrs ? '#eff6ff' : '#ffffff',
                        color: shiftHours === hrs ? '#0369a1' : '#475569',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        cursor: 'pointer'
                      }}
                    >
                      +{hrs} hrs
                    </button>
                  ))}
                </div>
                <input 
                  type="number" 
                  step="0.5"
                  required
                  value={shiftHours}
                  onChange={(e) => setShiftHours(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Remaining Fuel / Power Level
                </label>
                <input 
                  type="text" 
                  placeholder="e.g. 70% or 45 Litres"
                  value={shiftFuel}
                  onChange={(e) => setShiftFuel(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Shift Remarks / Work Done
                </label>
                <input 
                  type="text" 
                  placeholder="e.g. Excavation along grid line A-C"
                  value={shiftNotes}
                  onChange={(e) => setShiftNotes(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowLogModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  style={{ background: '#0284c7', borderColor: '#0369a1' }}
                >
                  Save Shift Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

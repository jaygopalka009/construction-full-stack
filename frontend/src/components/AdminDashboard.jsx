import React, { useState } from 'react';
import { 
  Building2, IndianRupee, AlertTriangle, CheckCircle, XCircle, 
  Package, FileCheck, Plus, RefreshCw, TrendingUp, Users, Wrench, FileText, CheckCircle2, Clock, MapPin, User, HardHat, Camera, Phone, Image,
  CreditCard, DollarSign, Send, Trash2, Eye, Briefcase, ChevronDown, ChevronUp
} from 'lucide-react';
import { Check, X, MessageSquare, ChevronLeft, ChevronRight } from 'react-feather';
import { formatCurrency } from '../utils/formatters';

export default function AdminDashboard({ 
  activeTab = 'dashboard',
  projects = [], 
  currentProjectId,
  currentProject,
  setCurrentProjectId,
  materials = [], 
  materialRequests = [], 
  engineers = [],
  workers = [],
  expenses = [],
  onAddWorker,
  onToggleWorkerAttendance,
  onDeleteWorker,
  dprs = [],
  tasks = [],
  onApproveTask,
  onRejectTask,
  onReviewPhoto,
  onApproveMaterialReq, 
  onRejectMaterialReq,
  onUpdateStock,
  onAddProject,
  onUpdateProject,
  onDeleteProject,
  onPayExpense,
  onSendWalletAdvance,
  onWipeDatabase
}) {
  // Local state for manual additions
  const [projectList, setProjectList] = useState(projects);
  const [employeeList, setEmployeeList] = useState([]);
  const [workerList, setWorkerList] = useState([]);
  const [expenseList, setExpenseList] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);

  // Modal Control States
  const [modalType, setModalType] = useState(null); // 'project', 'edit_project', 'employee', 'worker', 'material', 'expense'
  const [editingProject, setEditingProject] = useState(null);
  const [rejectingPhoto, setRejectingPhoto] = useState(null);
  const [rejectionMessage, setRejectionMessage] = useState('');
  const [photoFilter, setPhotoFilter] = useState('Pending');
  const [viewPhotoUrl, setViewPhotoUrl] = useState(null);
  const [viewPhotoGallery, setViewPhotoGallery] = useState([]);
  const [viewPhotoIndex, setViewPhotoIndex] = useState(0);
  const [projectTabFilter, setProjectTabFilter] = useState('All');
  const [expandedProjects, setExpandedProjects] = useState({});
  const [expandedDprs, setExpandedDprs] = useState({});
  const [rejectingTask, setRejectingTask] = useState(null);
  const [taskRejectRemark, setTaskRejectRemark] = useState('');

  // Expenses & Wallet Management State
  const [payingExpense, setPayingExpense] = useState(null);
  const [paymentMode, setPaymentMode] = useState('UPI / Bank Transfer');
  const [paymentNote, setPaymentNote] = useState('');
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [advanceData, setAdvanceData] = useState({
    projectId: '',
    projectName: '',
    engineerEmail: '',
    engineerName: '',
    amountVal: '',
    amountUnit: 'Hajar', // 'Cr', 'Lakh', 'Hajar', 'Hundred', 'Rupees'
    paymentMode: 'Cash in Hand',
    notes: 'Site petty cash advance'
  });
  const [expenseFilterTab, setExpenseFilterTab] = useState('All');
  
  // Modal Form Input States
  const [newProj, setNewProj] = useState({ 
    name: '', 
    projectType: 'Building', // 'Building', 'Row House', 'Bungalows', 'Bridge', 'Road Work'
    budgetVal: '1', 
    budgetUnit: 'Cr', // 'Cr', 'Lakh', 'Thousand', 'Rupees'
    clientType: 'Private Client', // 'Private Client', 'Government', 'Corporate Builder', 'Housing Society'
    clientName: '', 
    clientPhone: '',
    location: '', 
    engineerInCharge: '',
    totalBuildings: '1 Building',
    floorsCount: 'G+7 Floors',
    buildingBhk: '2 BHK',
    rowHouseUnits: '10 Units',
    rowHouseBhk: '3 BHK Row House',
    bungalowBhk: '4 BHK Luxury Villa',
    roadLanes: '2-Lane Highway',
    bridgeType: 'Flyover Bridge'
  });
  const [newEmp, setNewEmp] = useState({ name: '', role: 'Site Engineer', contact: '', assignedProject: '' });
  const [newWrk, setNewWrk] = useState({ name: '', trade: 'Mason', phone: '', project: '', status: 'Present' });
  const [newMat, setNewMat] = useState({ name: '', stock: '', unit: 'Bags', unitCost: '', requiredQuantity: '' });
  const [newExp, setNewExp] = useState({ project: '', expenseType: 'Material Purchase', amount: '', date: new Date().toISOString().split('T')[0], status: 'Paid' });

  // Helper calculation for currency multiplier (Cr, Lakh, Hajar/Thousand, Hundred, Rupees)
  const getBudgetInRupees = (val, unit) => {
    const num = parseFloat(val) || 0;
    if (unit === 'Cr') return Math.round(num * 10000000);
    if (unit === 'Lakh') return Math.round(num * 100000);
    if (unit === 'Thousand' || unit === 'Hajar') return Math.round(num * 1000);
    if (unit === 'Hundred') return Math.round(num * 100);
    return Math.round(num);
  };

  // Keep local project list synced with backend projects prop
  React.useEffect(() => {
    setProjectList(projects);
  }, [projects]);

  // Calculations
  const allProjects = projects;
  const totalProjectsCount = allProjects.length;
  const activeProjectsCount = allProjects.filter(p => p.status === 'In-Progress' || p.progress < 100).length;
  const completedProjectsCount = allProjects.filter(p => p.status === 'Completed' || p.progress === 100).length;

  const allEngineers = Array.isArray(engineers) ? engineers : [];
  const getEngineerAssignedProjects = (eng) => {
    const engName = (eng.name || '').trim().toLowerCase();
    const engEmail = (eng.email || '').trim().toLowerCase();
    return (projects || []).filter(p => {
      const accName = (p.acceptedBy || '').trim().toLowerCase();
      const accEmail = (p.acceptedByEmail || '').trim().toLowerCase();
      const inCharge = (p.engineerInCharge || '').trim().toLowerCase();
      return (accName && accName === engName) || 
             (accEmail && accEmail === engEmail) || 
             (inCharge && inCharge === engName);
    });
  };

  const totalEmployeesCount = employeeList.length;
  const totalWorkersCount = workerList.length;
  const presentWorkersCount = workerList.filter(w => w.status === 'Present').length;
  const absentWorkersCount = workerList.filter(w => w.status === 'Absent').length;
  // Clean expenses list: Real site claims and wallet advance transfers only
  const allExpenses = (expenseList || []).filter(e => !String(e.id || '').startsWith('task_exp_') && e.category !== 'Task Operational Cost');
  const totalExpensesAmount = allExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  // Collect all photos from all projects AND tasks for the Photo Approvals view
  const allUploadedPhotos = allProjects.reduce((acc, p) => {
    const pPhotos = (p.photos && p.photos.length > 0) ? p.photos.map(ph => ({
      ...ph,
      projectId: p.id,
      projectName: p.name,
      projectLocation: p.location,
      engineerName: ph.engineerName || p.acceptedBy || p.engineerInCharge || 'Site Engineer',
      engineerPhone: ph.engineerPhone || p.contactPhone || '9795798450'
    })) : [];

    // Also include all photos attached to tasks for this project
    const projTasks = (tasks || []).filter(t => t.projectId === p.id || t.project === p.name);
    const taskPhotos = [];
    projTasks.forEach(t => {
      const tPhotosList = Array.isArray(t.photos) && t.photos.length > 0 ? t.photos : (t.photo ? [t.photo] : []);
      tPhotosList.forEach((url, idx) => {
        if (!url) return;
        if (!pPhotos.some(ph => ph.url === url)) {
          taskPhotos.push({
            id: `tp_${t.id}_${idx}`,
            url,
            date: t.dueDate || new Date().toISOString().split('T')[0],
            progress: p.progress,
            caption: `${t.name} (Evidence ${idx + 1})`,
            status: t.status === 'Completed' ? 'Approved' : (t.status === 'Rejected' ? 'Rejected' : (t.status === 'Awaiting Approval' ? 'Pending' : 'Pending')),
            taskId: t.id,
            projectId: p.id,
            projectName: p.name,
            projectLocation: p.location,
            engineerName: p.acceptedBy || p.engineerInCharge || 'Site Engineer',
            engineerPhone: p.contactPhone || '9795798450'
          });
        }
      });
    });

    return [...acc, ...pPhotos, ...taskPhotos];
  }, []);
  
  const pendingPhotosCount = allUploadedPhotos.filter(p => p.status === 'Pending').length;
  const approvedPhotosCount = allUploadedPhotos.filter(p => p.status === 'Approved').length;
  const rejectedPhotosCount = allUploadedPhotos.filter(p => p.status === 'Rejected').length;
  
  const filteredPhotos = allUploadedPhotos.filter(p => photoFilter === 'All' || p.status === photoFilter);

  // Manual Handlers
  const handleOpenAddProjectModal = () => {
    setNewProj({
      name: '',
      projectType: 'Building',
      budgetVal: '',
      budgetUnit: 'Cr',
      clientType: 'Private Client',
      clientName: '',
      clientPhone: '',
      location: '',
      engineerInCharge: 'Unassigned',
      totalBuildings: '1 Building',
      floorsCount: 'G+7 Floors',
      buildingBhk: '2 BHK',
      rowHouseUnits: '10 Units',
      rowHouseBhk: '3 BHK Row House',
      bungalowBhk: '4 BHK Luxury Villa',
      roadLanes: '2-Lane Highway',
      bridgeType: 'Flyover Bridge'
    });
    setModalType('project');
  };

  const handleAddProject = (e) => {
    e.preventDefault();
    if (!newProj.name) return;

    const totalBudget = getBudgetInRupees(newProj.budgetVal, newProj.budgetUnit);
    const finalClient = newProj.clientName ? `${newProj.clientName} (${newProj.clientType})` : newProj.clientType;
    const finalLocation = newProj.location;

    let specs = {};
    if (newProj.projectType === 'Building') {
      specs = {
        buildingsCount: newProj.totalBuildings,
        floors: newProj.floorsCount,
        bhk: newProj.buildingBhk
      };
    } else if (newProj.projectType === 'Row House') {
      specs = {
        unitsCount: newProj.rowHouseUnits,
        bhk: newProj.rowHouseBhk
      };
    } else if (newProj.projectType === 'Bungalows') {
      specs = {
        bhk: newProj.bungalowBhk
      };
    } else if (newProj.projectType === 'Road Work') {
      specs = {
        lanes: newProj.roadLanes
      };
    } else if (newProj.projectType === 'Bridge') {
      specs = {
        bridgeType: newProj.bridgeType
      };
    }

    const created = {
      id: `proj_${Date.now()}`,
      name: `${newProj.name} [${newProj.projectType}]`,
      type: newProj.projectType,
      clientName: finalClient,
      clientPhone: newProj.clientPhone,
      contactPhone: newProj.clientPhone,
      location: finalLocation,
      budget: totalBudget,
      spent: 0,
      progress: 0,
      status: 'Pending Acceptance',
      engineerInCharge: newProj.engineerInCharge || 'Unassigned',
      engineerEmail: newProj.engineerEmail || '',
      acceptedBy: (newProj.engineerInCharge && newProj.engineerInCharge !== 'Unassigned') ? newProj.engineerInCharge : '',
      acceptedByEmail: newProj.engineerEmail || '',
      specifications: specs
    };

    onAddProject(created);
    setProjectList([created, ...projectList]);
    setRecentActivities([{ 
      id: `act_${Date.now()}`, 
      type: "New Project Added", 
      description: `Added ${newProj.projectType} "${created.name}" in ${finalLocation}`, 
      time: "Just now" 
    }, ...recentActivities]);

    setNewProj({
      name: '',
      projectType: 'Building',
      budgetVal: '',
      budgetUnit: 'Cr',
      clientType: 'Private Client',
      clientName: '',
      clientPhone: '',
      location: '',
      engineerInCharge: 'Unassigned',
      engineerEmail: '',
      totalBuildings: '1 Building',
      floorsCount: 'G+7 Floors',
      buildingBhk: '2 BHK',
      rowHouseUnits: '10 Units',
      rowHouseBhk: '3 BHK Row House',
      bungalowBhk: '4 BHK Luxury Villa',
      roadLanes: '2-Lane Highway',
      bridgeType: 'Flyover Bridge'
    });
    setModalType(null);
  };

  const handleAddEmployee = (e) => {
    e.preventDefault();
    if (!newEmp.name) return;
    const emp = { id: `e_${Date.now()}`, ...newEmp, status: 'Active' };
    setEmployeeList([emp, ...employeeList]);
    setRecentActivities([{ id: `act_${Date.now()}`, type: "Employee Added", description: `Registered employee "${emp.name}" (${emp.role})`, time: "Just now" }, ...recentActivities]);
    setModalType(null);
  };

  const handleAddWorker = async (e) => {
    e.preventDefault();
    if (!newWrk.name || !newWrk.name.trim()) {
      alert('Please enter worker full name');
      return;
    }
    const cleanPhone = (newWrk.phone || '').replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length !== 10) {
      alert('Please enter a valid 10-digit mobile number (e.g. 9876543210)');
      return;
    }
    if (onAddWorker) {
      await onAddWorker({
        name: newWrk.name.trim(),
        trade: newWrk.trade || 'Mason',
        phone: cleanPhone,
        status: newWrk.status || 'Present',
        projectId: currentProjectId || ''
      });
    }
    const wrk = { id: `w_${Date.now()}`, ...newWrk, phone: cleanPhone };
    setWorkerList([wrk, ...workerList]);
    setRecentActivities([{ id: `act_${Date.now()}`, type: "Worker Added", description: `Added worker "${wrk.name}" (${wrk.trade})`, time: "Just now" }, ...recentActivities]);
    setModalType(null);
    setNewWrk({ name: '', trade: 'Mason', phone: '', project: '', status: 'Present' });
  };

  const handleAddExpense = (e) => {
    e.preventDefault();
    if (!newExp.amount) return;
    const exp = { id: `exp_${Date.now()}`, ...newExp, amount: Number(newExp.amount) };
    setExpenseList([exp, ...expenseList]);
    setRecentActivities([{ id: `act_${Date.now()}`, type: "Expense Added", description: `Added ₹${exp.amount.toLocaleString('en-IN')} expense for ${exp.project}`, time: "Just now" }, ...recentActivities]);
    setModalType(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Header Banner */}
      <div className="glass-card" style={{ padding: '20px 24px', borderLeft: '4px solid #d97706' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="badge badge-amber">Admin Owner Control</span>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Account: admin@erp.com</span>
            </div>
            <h2 style={{ fontSize: '1.4rem', marginTop: '4px', color: '#0f172a' }}>
              {activeTab === 'projects' ? 'Projects & Sites Management' : 
               (activeTab === 'engineers' || activeTab === 'employees') ? 'Site Engineers Management' : 
               activeTab === 'expenses' ? 'Expenses Tracker' : 
               activeTab === 'reports' ? 'Daily Reports & Photo Evidence' : 
               'Admin Dashboard Overview'}
            </h2>
            <p style={{ color: '#475569', fontSize: '0.875rem' }}>
              Full executive control over construction projects, assigned site engineers, daily progress reports, and expenses.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button className="btn btn-primary btn-sm" onClick={() => setModalType('project')}>
              <Plus size={14} /> Add Project
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => setModalType('expense')}>
              <Plus size={14} /> Add Expense
            </button>
          </div>
        </div>
      </div>

      {/* 5 Dashboard Cards (Shown on Dashboard overview tab) */}
      {(activeTab === 'dashboard') && (
        <>
          {pendingPhotosCount > 0 && (
            <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderLeft: '4px solid #d97706', padding: '16px', borderRadius: '8px', marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: '#fef3c7', padding: '8px', borderRadius: '50%' }}>
                  <Camera size={20} color="#d97706" />
                </div>
                <div>
                  <h4 style={{ fontSize: '1rem', color: '#92400e', margin: 0, fontWeight: 700 }}>{pendingPhotosCount} Photo Evidence Pending Review</h4>
                  <p style={{ fontSize: '0.85rem', color: '#b45309', margin: '2px 0 0 0' }}>Site Engineers have uploaded progress photos that require your approval.</p>
                </div>
              </div>
              <button 
                className="btn btn-primary" 
                style={{ background: '#d97706', borderColor: '#b45309' }}
                onClick={() => {
                  const navButton = document.querySelector('button[title="Photo Approvals"]') || 
                                    Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Daily Reports'));
                  if (navButton) navButton.click();
                }}
              >
                Review Photos Now
              </button>
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
          
          {/* Card 1: Total Projects */}
          <div className="glass-card" style={{ padding: '16px' }}>
            <p style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>Total Projects</p>
            <h3 style={{ fontSize: '1.6rem', marginTop: '2px', color: '#0f172a' }}>{totalProjectsCount}</h3>
            <p style={{ fontSize: '0.75rem', color: '#2563eb', marginTop: '2px' }}>Total Registered Sites</p>
          </div>

          {/* Card 2: Active Projects */}
          <div className="glass-card" style={{ padding: '16px' }}>
            <p style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>Active Projects</p>
            <h3 style={{ fontSize: '1.6rem', marginTop: '2px', color: '#d97706' }}>{activeProjectsCount}</h3>
            <p style={{ fontSize: '0.75rem', color: '#059669', marginTop: '2px' }}>In Construction</p>
          </div>

          {/* Card 3: Completed Projects */}
          <div className="glass-card" style={{ padding: '16px' }}>
            <p style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>Completed</p>
            <h3 style={{ fontSize: '1.6rem', marginTop: '2px', color: '#059669' }}>{completedProjectsCount}</h3>
            <p style={{ fontSize: '0.75rem', color: '#059669', marginTop: '2px' }}>Finished Sites</p>
          </div>

          {/* Card 4: Site Engineers */}
          <div className="glass-card" style={{ padding: '16px' }}>
            <p style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>Site Engineers</p>
            <h3 style={{ fontSize: '1.6rem', marginTop: '2px', color: '#2563eb' }}>{allEngineers.length}</h3>
            <p style={{ fontSize: '0.75rem', color: '#059669', marginTop: '2px' }}>
              {allEngineers.filter(e => getEngineerAssignedProjects(e).length > 0).length} Active On-Site
            </p>
          </div>

          {/* Card 5: Total Expenses */}
          <div className="glass-card" style={{ padding: '16px' }}>
            <p style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>Total Expenses</p>
            <h3 style={{ fontSize: '1.35rem', marginTop: '2px', color: '#dc2626' }}>
              ₹{(totalExpensesAmount / 100000).toFixed(1)}L
            </h3>
            <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>Total Expenditure</p>
          </div>

        </div>
        </>
      )}

      {/* SECTION 1: Projects Management & Site Work with Integrated Task & Photo Approvals */}
      {(activeTab === 'projects') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Top Control Bar */}
          <div className="glass-card" style={{ padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', margin: 0, fontWeight: 700 }}>
                <Building2 size={20} color="#d97706" /> Projects & Site Work
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '4px 0 0 0' }}>
                Manage ongoing sites, verify signed site engineers, and review site task photo evidence right inside each project.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              {currentProjectId && currentProjectId !== 'ALL' && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#fef3c7', border: '1px solid #fde68a', padding: '5px 12px', borderRadius: '6px', fontSize: '0.8rem', color: '#92400e', fontWeight: 600 }}>
                  <span>Viewing Selected Site:</span>
                  <strong style={{ color: '#78350f' }}>{allProjects.find(p => p.id === currentProjectId)?.name || currentProjectId}</strong>
                  <button
                    onClick={() => setCurrentProjectId && setCurrentProjectId('ALL')}
                    style={{ border: 'none', background: '#d97706', color: '#ffffff', borderRadius: '4px', padding: '2px 8px', fontSize: '0.72rem', cursor: 'pointer', fontWeight: 700 }}
                    title="Click to view all projects"
                  >
                    View All Sites
                  </button>
                </div>
              )}

              {/* Filter Tabs */}
              <div style={{ display: 'flex', background: '#f1f5f9', padding: '4px', borderRadius: '8px', gap: '4px' }}>
                {[
                  { id: 'All', label: `All (${allProjects.length})` },
                  { id: 'Ongoing', label: `Ongoing (${allProjects.filter(p => p.status === 'In-Progress' || (p.status !== 'Pending Acceptance' && p.progress < 100)).length})` },
                  { id: 'Pending', label: `Pending Booking (${allProjects.filter(p => p.status === 'Pending Acceptance').length})` },
                  { id: 'Completed', label: `100% Completed (${allProjects.filter(p => p.status === 'Completed' || p.progress === 100).length})` }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setProjectTabFilter(tab.id)}
                    style={{
                      border: 'none',
                      background: projectTabFilter === tab.id ? '#ffffff' : 'transparent',
                      color: projectTabFilter === tab.id ? '#0f172a' : '#64748b',
                      fontWeight: projectTabFilter === tab.id ? 700 : 500,
                      fontSize: '0.78rem',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      boxShadow: projectTabFilter === tab.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <button className="btn btn-primary btn-sm" onClick={handleOpenAddProjectModal} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Plus size={15} /> Add New Project
              </button>
            </div>
          </div>

          {/* Pending Tasks Alert Banner across sites if any */}
          {(() => {
            const pendingAwaitingCount = (allProjects && allProjects.length > 0)
              ? (tasks || []).filter(t => {
                  const projExists = allProjects.some(p => p.id === t.projectId || p.name === t.project);
                  return projExists && t.status === 'Awaiting Approval';
                }).length
              : 0;
            if (pendingAwaitingCount > 0) {
              return (
                <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderLeft: '4px solid #2563eb', padding: '14px 18px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ background: '#dbeafe', padding: '6px', borderRadius: '50%' }}>
                      <Camera size={18} color="#2563eb" />
                    </div>
                    <div>
                      <span style={{ fontWeight: 700, color: '#1e40af', fontSize: '0.9rem' }}>
                        {pendingAwaitingCount} Site Task(s) with Photo Evidence Awaiting Your Approval!
                      </span>
                      <p style={{ margin: 0, fontSize: '0.78rem', color: '#3b82f6' }}>
                        Site Engineers have submitted completed task photos. Review and click "Approve" below to advance progress.
                      </p>
                    </div>
                  </div>
                  <span className="badge badge-blue">{pendingAwaitingCount} Pending</span>
                </div>
              );
            }
            return null;
          })()}

          {/* Projects Cards Container */}
          {(() => {
            const filtered = allProjects.filter(p => {
              if (currentProjectId && currentProjectId !== 'ALL' && p.id !== currentProjectId) {
                return false;
              }
              if (projectTabFilter === 'Ongoing') return p.status === 'In-Progress' || (p.status !== 'Pending Acceptance' && p.progress < 100);
              if (projectTabFilter === 'Pending') return p.status === 'Pending Acceptance';
              if (projectTabFilter === 'Completed') return p.status === 'Completed' || p.progress === 100;
              return true;
            });

            if (filtered.length === 0) {
              return (
                <div className="glass-card" style={{ padding: '50px 20px', textAlign: 'center', background: '#ffffff' }}>
                  <Building2 size={40} color="#94a3b8" style={{ margin: '0 auto 12px auto' }} />
                  <h4 style={{ color: '#334155', marginBottom: '6px', fontSize: '1.1rem' }}>No projects in this category</h4>
                  <p style={{ fontSize: '0.85rem', color: '#64748b', maxWidth: '400px', margin: '0 auto 16px auto' }}>
                    {projectTabFilter === 'All' ? 'No projects added yet. Click Add New Project to create your first construction site.' : `There are no ${projectTabFilter.toLowerCase()} projects at this time.`}
                  </p>
                  <button className="btn btn-primary btn-sm" onClick={handleOpenAddProjectModal}>
                    <Plus size={14} /> Add New Project
                  </button>
                </div>
              );
            }

            return filtered.map(p => {
              const projTasks = (tasks || []).filter(t => t.projectId === p.id || t.project === p.name);
              const awaitingTasks = projTasks.filter(t => t.status === 'Awaiting Approval');
              const completedTasks = projTasks.filter(t => t.status === 'Completed');
              const isPending = p.status === 'Pending Acceptance';
              const isCompleted = p.status === 'Completed' || p.progress === 100;
              const isExpanded = expandedProjects[p.id] !== false; // expanded by default

              return (
                <div 
                  key={p.id} 
                  className="glass-card" 
                  style={{ 
                    padding: '22px', 
                    background: '#ffffff', 
                    border: isPending ? '1px solid #fed7aa' : isCompleted ? '1px solid #bbf7d0' : '1px solid #e2e8f0',
                    borderLeft: `5px solid ${isPending ? '#d97706' : isCompleted ? '#059669' : '#2563eb'}`
                  }}
                >
                  {/* Card Header: Title, Status, Action Buttons */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px', marginBottom: '16px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', background: '#e0f2fe', color: '#0369a1', fontWeight: 800 }}>
                          Project #{p.id}
                        </span>
                        <span className={`badge ${isPending ? 'badge-amber' : isCompleted ? 'badge-emerald' : 'badge-blue'}`}>
                          {isPending ? 'Incoming Booking (Pending Acceptance)' : isCompleted ? '100% Completed Site' : 'Ongoing Site Work'}
                        </span>
                        <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', background: '#f1f5f9', color: '#475569', fontWeight: 600 }}>
                          Category: {p.type || 'Building'}
                        </span>
                        {p.specifications && (
                          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            {[
                              p.specifications.buildingsCount,
                              p.specifications.floors,
                              p.specifications.bhk,
                              p.specifications.unitsCount,
                              p.specifications.lanes,
                              p.specifications.bridgeType
                            ].filter(Boolean).join(' • ')}
                          </span>
                        )}
                      </div>

                      <h3 style={{ fontSize: '1.3rem', color: '#0f172a', marginTop: '6px', marginBottom: '2px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Building2 size={22} color={isPending ? '#d97706' : isCompleted ? '#059669' : '#2563eb'} /> {p.name}
                      </h3>
                      <div style={{ fontSize: '0.85rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <MapPin size={14} color="#64748b" /> Location: <strong style={{ color: '#334155' }}>{p.location}</strong>
                      </div>
                    </div>

                    {/* Edit / Delete / Toggle Buttons */}
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <button 
                        className="btn btn-sm btn-secondary"
                        onClick={() => {
                          setEditingProject(p);
                          setNewProj({
                            name: p.name || '',
                            projectType: p.type || 'Building',
                            budgetVal: (p.budget ? (p.budget >= 10000000 ? p.budget / 10000000 : p.budget >= 100000 ? p.budget / 100000 : p.budget) : 1).toString(),
                            budgetUnit: p.budget >= 10000000 ? 'Cr' : p.budget >= 100000 ? 'Lakh' : 'Rupees',
                            clientType: 'Private Client',
                            clientName: p.clientName || '',
                            clientPhone: p.clientPhone || p.contactPhone || '',
                            location: p.location || '',
                            engineerInCharge: p.engineerInCharge || 'Unassigned'
                          });
                          setModalType('edit_project');
                        }}
                        style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                      >
                        Edit
                      </button>

                      <button 
                        className="btn btn-sm"
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to delete "${p.name}"?`)) {
                            if (onDeleteProject) onDeleteProject(p.id);
                            setProjectList(projectList.filter(proj => proj.id !== p.id));
                          }
                        }}
                        style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca', padding: '6px 12px', fontSize: '0.8rem' }}
                      >
                        Delete
                      </button>

                      <button
                        className="btn btn-sm"
                        onClick={() => setExpandedProjects(prev => ({ ...prev, [p.id]: !isExpanded }))}
                        style={{ background: '#f8fafc', border: '1px solid #cbd5e1', color: '#334155', fontWeight: 600, padding: '6px 12px', fontSize: '0.8rem' }}
                      >
                        {isExpanded ? 'Hide Site Tasks ▲' : `View Site Tasks (${projTasks.length}) ▼`}
                      </button>
                    </div>
                  </div>

                  {/* SIGNED & ASSIGNED DETAILS INFO BAR */}
                  <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '14px 16px', border: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '16px' }}>
                    
                    {/* Assigned Site Engineer & Signature Status */}
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Site Engineer Assigned</div>
                      <div style={{ fontSize: '0.92rem', color: '#0f172a', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                        <HardHat size={16} color="#2563eb" /> {
                          (p.acceptedBy && p.acceptedBy !== 'Unassigned') 
                            ? p.acceptedBy 
                            : (p.engineerInCharge && p.engineerInCharge !== 'Unassigned') 
                              ? p.engineerInCharge 
                              : (p.acceptedAt ? (engineers[0]?.name || 'jay (Site Engineer)') : 'Unassigned')
                        }
                      </div>
                      <div style={{ marginTop: '4px' }}>
                        {isPending ? (
                          <span style={{ fontSize: '0.76rem', color: '#d97706', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={13} /> Waiting for Engineer Acceptance
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.76rem', color: '#059669', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle2 size={13} /> Accepted & Signed on Site ({p.acceptedAt || 'Active'})
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Client Information */}
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Client Details</div>
                      <div style={{ fontSize: '0.92rem', color: '#0f172a', fontWeight: 700, marginTop: '3px' }}>
                        {p.clientName || 'General Client'}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#2563eb', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                        <Phone size={13} /> {p.clientPhone || p.contactPhone || 'N/A'}
                      </div>
                    </div>

                    {/* Financial Budget & Spent */}
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Total Budget / Spent</div>
                      <div style={{ fontSize: '0.92rem', color: '#059669', fontWeight: 700, marginTop: '3px' }}>
                        {formatCurrency(p.budget)}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                        Spent: {formatCurrency(
                          (tasks || []).filter(t => t.projectId === p.id || t.project === p.name).reduce((sum, t) => sum + (Number(t.totalCost) || 0), 0)
                          || (Number(p.spent) || 0)
                        )}
                      </div>
                    </div>

                    {/* Execution Stage & Progress */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Site Progress</span>
                        <strong style={{ color: isCompleted ? '#059669' : '#d97706', fontSize: '0.85rem' }}>{p.progress}%</strong>
                      </div>
                      <div className="progress-track" style={{ width: '100%', height: '8px', marginTop: '6px' }}>
                        <div className="progress-fill" style={{ width: `${p.progress}%`, background: isCompleted ? '#059669' : '#d97706' }}></div>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        Stage: <strong>{p.currentStage || 'Stage In-Progress'}</strong>
                      </div>
                    </div>

                  </div>

                  {/* INTEGRATED SITE WORK TASKS & PHOTO EVIDENCE APPROVALS */}
                  {isExpanded && (
                    <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '16px', marginTop: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <h4 style={{ fontSize: '1rem', color: '#0f172a', margin: 0, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Camera size={18} color="#2563eb" /> Site Tasks & Photo Evidence Approvals
                          </h4>
                          <span style={{ fontSize: '0.75rem', background: '#e2e8f0', color: '#334155', padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>
                            {completedTasks.length} of {projTasks.length || 10} Done
                          </span>
                        </div>

                        {awaitingTasks.length > 0 && (
                          <span className="badge" style={{ background: '#dbeafe', color: '#1e40af', border: '1px solid #93c5fd', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#2563eb', display: 'inline-block' }}></span>
                            {awaitingTasks.length} Photo Evidence Waiting For Your Approval
                          </span>
                        )}
                      </div>

                      {/* Tasks Table */}
                      {projTasks.length > 0 ? (
                        <div style={{ overflowX: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                            <thead>
                              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#64748b' }}>
                                <th style={{ padding: '8px 10px', width: '30%' }}>Construction Stage / Task</th>
                                <th style={{ padding: '8px 10px', width: '15%' }}>Status</th>
                                <th style={{ padding: '8px 10px', width: '25%' }}>Photo Evidence</th>
                                <th style={{ padding: '8px 10px', width: '30%', textAlign: 'right' }}>Admin Verification Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {projTasks.map((t, idx) => {
                                const hasPhoto = t.photo || (t.photos && t.photos.length > 0);
                                const photoSrc = t.photo || (t.photos && t.photos[0]);

                                return (
                                  <tr 
                                    key={t.id} 
                                    style={{ 
                                      borderBottom: '1px solid #f1f5f9',
                                      background: t.status === 'Awaiting Approval' ? '#f0fdf4' : t.status === 'Rejected' ? '#fef2f2' : 'transparent'
                                    }}
                                  >
                                    {/* Task Name & Cost Details */}
                                    <td style={{ padding: '10px', fontWeight: 600, color: '#0f172a' }}>
                                      <div>{t.name}</div>
                                      <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 400 }}>Stage {idx + 1}</div>
                                      {(t.totalCost > 0 || (Array.isArray(t.materialsUsed) && t.materialsUsed.length > 0)) && (
                                        <div style={{ marginTop: '6px', background: '#f8fafc', padding: '5px 8px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.72rem' }}>
                                          <span style={{ color: '#059669', fontWeight: 800 }}>Expense: ₹{Number(t.totalCost || 0).toLocaleString('en-IN')}</span>
                                          <span style={{ color: '#64748b', marginLeft: '6px' }}>(Mat: ₹{Number(t.materialCost || 0).toLocaleString('en-IN')} + Labor: ₹{Number(t.laborCost || 0).toLocaleString('en-IN')})</span>
                                        </div>
                                      )}
                                    </td>

                                    {/* Status Pill */}
                                    <td style={{ padding: '10px' }}>
                                      <span className={`badge ${
                                        t.status === 'Completed' ? 'badge-emerald' : 
                                        t.status === 'Awaiting Approval' ? 'badge-blue' : 
                                        t.status === 'In-Progress' ? 'badge-amber' : 
                                        t.status === 'Rejected' ? 'badge-rose' : 'badge-gray'
                                      }`}>
                                        {t.status === 'Completed' ? 'Approved' : 
                                         t.status === 'Awaiting Approval' ? 'Photo Uploaded' : 
                                         t.status === 'In-Progress' ? 'On Site' : 
                                         t.status === 'Rejected' ? 'Rework Needed' : 'Pending'}
                                      </span>
                                    </td>

                                    {/* Photo Evidence with Multi-Photo Preview */}
                                    <td style={{ padding: '10px' }}>
                                      {(() => {
                                        const allTaskPhotos = Array.isArray(t.photos) && t.photos.length > 0 ? t.photos : (t.photo ? [t.photo] : []);
                                        if (allTaskPhotos.length === 0) {
                                          return (
                                            <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontStyle: 'italic' }}>
                                              No photo uploaded yet
                                            </span>
                                          );
                                        }

                                        const engName = (p.acceptedBy && p.acceptedBy !== 'Unassigned') ? p.acceptedBy : (p.engineerInCharge !== 'Unassigned' ? p.engineerInCharge : 'Site Engineer');
                                        const engPhone = p.engineerPhone || (engineers.find(e => e.name === engName)?.phone) || p.contactPhone || p.clientPhone || '9795798450';

                                        return (
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                              {allTaskPhotos.slice(0, 3).map((imgUrl, pIdx) => (
                                                <div 
                                                  key={pIdx}
                                                  onClick={() => {
                                                    setViewPhotoGallery(allTaskPhotos);
                                                    setViewPhotoIndex(pIdx);
                                                    setViewPhotoUrl(imgUrl);
                                                  }}
                                                  style={{ 
                                                    width: '48px', 
                                                    height: '48px', 
                                                    borderRadius: '6px', 
                                                    overflow: 'hidden', 
                                                    cursor: 'pointer', 
                                                    border: '2px solid #2563eb',
                                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                                    position: 'relative'
                                                  }}
                                                  title={`Click to zoom photo ${pIdx + 1} of ${allTaskPhotos.length}`}
                                                >
                                                  <img src={imgUrl} alt={t.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                </div>
                                              ))}
                                              {allTaskPhotos.length > 3 && (
                                                <div 
                                                  onClick={() => {
                                                    setViewPhotoGallery(allTaskPhotos);
                                                    setViewPhotoIndex(3);
                                                    setViewPhotoUrl(allTaskPhotos[3]);
                                                  }}
                                                  style={{ 
                                                    width: '32px', height: '48px', borderRadius: '4px', background: '#eff6ff', border: '1px solid #bfdbfe',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 700, color: '#2563eb', cursor: 'pointer'
                                                  }}
                                                  title="Click to view all photos"
                                                >
                                                  +{allTaskPhotos.length - 3}
                                                </div>
                                              )}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: '#475569' }}>
                                              <div style={{ fontWeight: 700, color: '#0f172a' }}>{allTaskPhotos.length} Photo Evidence</div>
                                              <div style={{ color: '#2563eb' }}>By: {engName}</div>
                                              <a 
                                                href={`tel:${engPhone}`} 
                                                style={{ color: '#059669', fontWeight: 600, fontSize: '0.72rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '3px', marginTop: '2px' }}
                                                title="Direct call to Site Engineer"
                                              >
                                                <Phone size={11} /> {engPhone}
                                              </a>
                                            </div>
                                          </div>
                                        );
                                      })()}
                                    </td>

                                    {/* Action Buttons for Admin */}
                                    <td style={{ padding: '10px', textAlign: 'right' }}>
                                      {t.status === 'Awaiting Approval' ? (
                                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                                          <button
                                            className="btn btn-sm btn-primary"
                                            onClick={() => onApproveTask && onApproveTask(t.id)}
                                            style={{ background: '#059669', borderColor: '#047857', fontWeight: 700, padding: '6px 12px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                            title="Approve this task and increase project progress"
                                          >
                                            <Check size={14} /> Approve (+Progress)
                                          </button>

                                          <button
                                            className="btn btn-sm btn-primary"
                                            onClick={() => {
                                              const engName = (p.acceptedBy && p.acceptedBy !== 'Unassigned') ? p.acceptedBy : (p.engineerInCharge !== 'Unassigned' ? p.engineerInCharge : (engineers[0]?.name || 'Site Engineer'));
                                              const engPhone = p.engineerPhone || (engineers.find(e => e.name === engName)?.phone) || p.contactPhone || p.clientPhone || '9795798450';
                                              setRejectingTask({ 
                                                taskId: t.id, 
                                                taskName: t.name, 
                                                projectName: p.name,
                                                engineerName: engName,
                                                engineerPhone: engPhone
                                              });
                                              setTaskRejectRemark('');
                                            }}
                                            style={{ background: '#dc2626', borderColor: '#b91c1c', fontWeight: 600, padding: '6px 10px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                            title="Reject evidence with remark to engineer"
                                          >
                                            <X size={14} /> Reject
                                          </button>
                                        </div>
                                      ) : t.status === 'Completed' ? (
                                        <div style={{ color: '#059669', fontWeight: 700, fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                          <CheckCircle2 size={16} /> Approved & Verified
                                        </div>
                                      ) : t.status === 'Rejected' ? (
                                        <div>
                                          <span style={{ color: '#dc2626', fontWeight: 700, fontSize: '0.78rem', display: 'block' }}>
                                            Rejected by Admin
                                          </span>
                                          {t.adminRemark && (
                                            <span style={{ fontSize: '0.74rem', color: '#991b1b', background: '#fee2e2', padding: '3px 8px', borderRadius: '4px', display: 'inline-block', marginTop: '3px', border: '1px solid #fecaca', fontWeight: 600 }}>
                                              Reason: "{t.adminRemark}"
                                            </span>
                                          )}
                                        </div>
                                      ) : (
                                        <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                                          {t.status === 'In-Progress' ? 'Engineer Working on Site' : 'Pending Site Execution'}
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div style={{ padding: '16px', textAlign: 'center', background: '#f8fafc', borderRadius: '8px', color: '#64748b', fontSize: '0.82rem' }}>
                          Construction tasks will automatically appear once the project is accepted by the Site Engineer.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            });
          })()}
        </div>
      )}

      {/* SECTION 2: Site Engineers */}
      {(activeTab === 'engineers' || activeTab === 'employees') && (
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
                <Users size={20} color="#2563eb" /> Registered Site Engineers Directory
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                Field supervisors managing active construction sites & submitting daily progress reports
              </p>
            </div>
          </div>

          {/* Metric Cards Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '20px' }}>
            <div style={{ padding: '14px 18px', background: '#eff6ff', borderRadius: '10px', border: '1px solid #bfdbfe' }}>
              <span style={{ fontSize: '0.75rem', color: '#1d4ed8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Engineers</span>
              <h3 style={{ fontSize: '1.8rem', color: '#1e40af', margin: '4px 0 0 0', fontWeight: 800 }}>{allEngineers.length}</h3>
              <span style={{ fontSize: '0.75rem', color: '#3b82f6', fontWeight: 500 }}>Registered portal accounts</span>
            </div>

            <div style={{ padding: '14px 18px', background: '#ecfdf5', borderRadius: '10px', border: '1px solid #a7f3d0' }}>
              <span style={{ fontSize: '0.75rem', color: '#047857', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active On Site</span>
              <h3 style={{ fontSize: '1.8rem', color: '#065f46', margin: '4px 0 0 0', fontWeight: 800 }}>
                {allEngineers.filter(e => getEngineerAssignedProjects(e).length > 0).length}
              </h3>
              <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 500 }}>Executing assigned sites</span>
            </div>

            <div style={{ padding: '14px 18px', background: '#fffbeb', borderRadius: '10px', border: '1px solid #fde68a' }}>
              <span style={{ fontSize: '0.75rem', color: '#92400e', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Available Engineers</span>
              <h3 style={{ fontSize: '1.8rem', color: '#b45309', margin: '4px 0 0 0', fontWeight: 800 }}>
                {allEngineers.filter(e => getEngineerAssignedProjects(e).length === 0).length}
              </h3>
              <span style={{ fontSize: '0.75rem', color: '#d97706', fontWeight: 500 }}>Ready for new bookings</span>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1.5px solid #cbd5e1', textAlign: 'left', color: '#475569', background: '#f8fafc' }}>
                  <th style={{ padding: '12px 10px', fontWeight: 700 }}>Engineer Name</th>
                  <th style={{ padding: '12px 10px', fontWeight: 700 }}>Email Address</th>
                  <th style={{ padding: '12px 10px', fontWeight: 700 }}>Contact Phone</th>
                  <th style={{ padding: '12px 10px', fontWeight: 700 }}>Current Site Project(s)</th>
                  <th style={{ padding: '12px 10px', fontWeight: 700 }}>Duty Status</th>
                  <th style={{ padding: '12px 10px', textAlign: 'right', fontWeight: 700 }}>Contact</th>
                </tr>
              </thead>
              <tbody>
                {allEngineers.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        <Users size={32} color="#cbd5e1" />
                        <p style={{ margin: 0, fontWeight: 600 }}>No Site Engineers registered yet.</p>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>When an engineer registers on the portal, they will appear here automatically.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  allEngineers.map(eng => {
                    const assignedProjs = getEngineerAssignedProjects(eng);
                    const isActive = assignedProjs.length > 0;
                    const phone = eng.phone || '9795798450';

                    return (
                      <tr key={eng.id || eng.email} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 10px', fontWeight: 600, color: '#0f172a' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '50%',
                              background: '#eff6ff',
                              border: '1.5px solid #bfdbfe',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#2563eb',
                              fontWeight: 700,
                              fontSize: '0.9rem'
                            }}>
                              {(eng.name || 'E').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem' }}>{eng.name}</div>
                              <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Site Engineer</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '12px 10px', color: '#475569' }}>
                          {eng.email}
                        </td>
                        <td style={{ padding: '12px 10px', color: '#0f172a', fontWeight: 600 }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <Phone size={13} color="#2563eb" /> {phone}
                          </span>
                        </td>
                        <td style={{ padding: '12px 10px' }}>
                          {assignedProjs.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              {assignedProjs.map(p => (
                                <span 
                                  key={p.id} 
                                  style={{ 
                                    background: '#ecfdf5', 
                                    color: '#065f46', 
                                    border: '1px solid #a7f3d0', 
                                    padding: '3px 8px', 
                                    borderRadius: '6px', 
                                    fontSize: '0.75rem', 
                                    fontWeight: 600,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '5px'
                                  }}
                                >
                                  <Building2 size={12} color="#059669" /> {p.name} ({p.progress || 0}%)
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span style={{ color: '#94a3b8', fontSize: '0.78rem', fontStyle: 'italic' }}>
                              Available (Unassigned)
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '12px 10px' }}>
                          <span className={`badge ${isActive ? 'badge-emerald' : 'badge-amber'}`} style={{ fontWeight: 700 }}>
                            {isActive ? 'Active on Site' : 'Available'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 10px', textAlign: 'right' }}>
                          <a 
                            href={`tel:${phone}`}
                            className="btn btn-sm btn-secondary"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', textDecoration: 'none', color: '#2563eb', borderColor: '#bfdbfe', background: '#ffffff', fontWeight: 600 }}
                            title={`Call ${eng.name} directly`}
                          >
                            <Phone size={12} /> Call
                          </a>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 5: Expenses & Site Engineer Wallets */}
      {(activeTab === 'expenses') && (() => {
        const siteExpenses = expenses || [];
        const totalPaid = siteExpenses.filter(e => e.status === 'Paid').reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
        const totalPending = siteExpenses.filter(e => e.status === 'Pending').reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
        const totalAll = totalPaid + totalPending;

        const filteredExpenses = siteExpenses.filter(e => {
          if (expenseFilterTab === 'Pending') return e.status === 'Pending';
          if (expenseFilterTab === 'Paid') return e.status === 'Paid';
          return true;
        });

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Top Summary Card */}
            <div className="glass-card" style={{ padding: '24px', background: '#ffffff', borderLeft: '5px solid #059669' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="badge badge-emerald" style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                      <CreditCard size={13} style={{ marginRight: '4px' }} /> Site Wallet & Petty Cash Control
                    </span>
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      Admin Finance Desk
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1.35rem', color: '#0f172a', fontWeight: 800, margin: '6px 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <IndianRupee size={22} color="#059669" /> Site Expenses & Wallet Payment Releases
                  </h3>
                  <p style={{ fontSize: '0.84rem', color: '#64748b', margin: 0 }}>
                    Review expense claims submitted by Site Engineers. Clicking <strong>"Pay / Release Funds"</strong> marks the claim as Paid and instantly credits the engineer's Site Wallet.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      const firstP = (projects && projects.length > 0) ? projects[0] : null;
                      const hEmail = firstP?.acceptedByEmail || (firstP?.engineerInCharge?.includes('@') ? firstP.engineerInCharge : '');
                      const hName = firstP?.acceptedBy || firstP?.engineerInCharge || '';
                      const firstEng = (engineers && engineers.length > 0) ? engineers[0] : null;

                      setAdvanceData({
                        projectId: firstP?.id || '',
                        projectName: firstP?.name || '',
                        engineerEmail: hEmail || firstEng?.email || '',
                        engineerName: hName || firstEng?.name || 'Site Engineer',
                        amountVal: '',
                        amountUnit: 'Hajar',
                        paymentMode: 'Cash in Hand',
                        notes: 'Site petty cash advance'
                      });
                      setShowAdvanceModal(true);
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#059669', borderColor: '#047857', fontWeight: 700, fontSize: '0.85rem' }}
                  >
                    <Send size={15} /> Send Advance Cash to Engineer
                  </button>

                  {onWipeDatabase && (
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={onWipeDatabase}
                      title="Wipe all projects, users, reports, and reset database to clean default state"
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#fff1f2', color: '#dc2626', border: '1px solid #fecaca', fontWeight: 700, fontSize: '0.85rem' }}
                    >
                      <Trash2 size={15} /> Clean Reset Database
                    </button>
                  )}
                </div>
              </div>

              {/* Summary Metric Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                <div style={{ padding: '16px', background: '#ecfdf5', borderRadius: '10px', border: '1.5px solid #a7f3d0' }}>
                  <span style={{ fontSize: '0.75rem', color: '#047857', fontWeight: 700, textTransform: 'uppercase' }}>
                    Total Released / Paid to Wallets
                  </span>
                  <h3 style={{ fontSize: '1.7rem', color: '#065f46', margin: '6px 0 2px 0', fontWeight: 900 }}>
                    ₹{totalPaid.toLocaleString('en-IN')}
                  </h3>
                  <div style={{ fontSize: '0.74rem', color: '#047857', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle size={13} color="#059669" /> Credited to Engineers
                  </div>
                </div>

                <div style={{ padding: '16px', background: '#fffbeb', borderRadius: '10px', border: '1.5px solid #fde68a' }}>
                  <span style={{ fontSize: '0.75rem', color: '#92400e', fontWeight: 700, textTransform: 'uppercase' }}>
                    Pending Payment Releases
                  </span>
                  <h3 style={{ fontSize: '1.7rem', color: '#b45309', margin: '6px 0 2px 0', fontWeight: 900 }}>
                    ₹{totalPending.toLocaleString('en-IN')}
                  </h3>
                  <div style={{ fontSize: '0.74rem', color: '#92400e', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={13} color="#d97706" /> {siteExpenses.filter(e => e.status === 'Pending').length} Claims waiting for payment
                  </div>
                </div>

                <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                    Total Site Claims Processed
                  </span>
                  <h3 style={{ fontSize: '1.7rem', color: '#0f172a', margin: '6px 0 2px 0', fontWeight: 900 }}>
                    {siteExpenses.length}
                  </h3>
                  <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                    Total Volume: ₹{totalAll.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            </div>

            {/* Filter Tabs & Claims Table */}
            <div className="glass-card" style={{ padding: '22px', background: '#ffffff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {['All', 'Pending', 'Paid'].map(tab => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setExpenseFilterTab(tab)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '6px',
                        border: 'none',
                        background: expenseFilterTab === tab ? '#059669' : '#f1f5f9',
                        color: expenseFilterTab === tab ? '#ffffff' : '#475569',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        cursor: 'pointer'
                      }}
                    >
                      {tab} ({tab === 'All' ? siteExpenses.length : siteExpenses.filter(e => e.status === tab).length})
                    </button>
                  ))}
                </div>

                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  Showing {filteredExpenses.length} Claims
                </span>
              </div>

              {filteredExpenses.length === 0 ? (
                <div style={{ padding: '36px', textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                  <DollarSign size={32} color="#cbd5e1" style={{ margin: '0 auto 8px auto', display: 'block' }} />
                  <p style={{ margin: 0, fontSize: '0.88rem' }}>No expense claims in this filter.</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase' }}>
                        <th style={{ padding: '12px 14px' }}>Date</th>
                        <th style={{ padding: '12px 14px' }}>Site Engineer</th>
                        <th style={{ padding: '12px 14px' }}>Project</th>
                        <th style={{ padding: '12px 14px' }}>Expense Title & Details</th>
                        <th style={{ padding: '12px 14px' }}>Category</th>
                        <th style={{ padding: '12px 14px' }}>Amount (₹)</th>
                        <th style={{ padding: '12px 14px', textAlign: 'center' }}>Wallet Action / Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredExpenses.map((exp, idx) => {
                        const isPaid = exp.status === 'Paid';
                        const linkedTask = exp.taskId ? tasks.find(t => t.id === exp.taskId) : null;
                        const isTaskApproved = !exp.taskId || (linkedTask && (linkedTask.status === 'Completed' || linkedTask.adminRemark === 'Approved by Admin'));

                        return (
                          <tr key={exp.id || idx} style={{ borderBottom: '1px solid #e2e8f0', background: isPaid ? '#ffffff' : '#fffbeb' }}>
                            <td style={{ padding: '12px 14px', whiteSpace: 'nowrap', color: '#64748b', fontSize: '0.82rem' }}>
                              {exp.date}
                            </td>
                            <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                              <div style={{ fontWeight: 700, color: '#0f172a' }}>{exp.engineerName || 'Site Engineer'}</div>
                              {exp.engineerEmail && (
                                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{exp.engineerEmail}</div>
                              )}
                            </td>
                            <td style={{ padding: '12px 14px', whiteSpace: 'nowrap', color: '#475569', fontSize: '0.82rem' }}>
                              {exp.projectName || 'General Site'}
                            </td>
                            <td style={{ padding: '12px 14px' }}>
                              <div style={{ fontWeight: 700, color: '#0f172a' }}>{exp.title}</div>
                              {exp.description && (
                                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                                  {exp.description}
                                </div>
                              )}
                              {isPaid && (
                                <div style={{ fontSize: '0.72rem', color: '#059669', marginTop: '3px', fontWeight: 600 }}>
                                  Paid via {exp.paymentMode || 'Cash'} {exp.paidAt ? `(${new Date(exp.paidAt).toLocaleDateString('en-GB')})` : ''}
                                </div>
                              )}
                            </td>
                            <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                              <span style={{ background: '#f1f5f9', color: '#475569', padding: '3px 8px', borderRadius: '4px', fontSize: '0.74rem', fontWeight: 600 }}>
                                {exp.category}
                              </span>
                            </td>
                            <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                              <strong style={{ fontSize: '1rem', color: isPaid ? '#059669' : '#b45309' }}>
                                ₹{Number(exp.amount).toLocaleString('en-IN')}
                              </strong>
                            </td>
                            <td style={{ padding: '12px 14px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                              {isPaid ? (
                                <span className="badge badge-emerald" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.76rem', fontWeight: 700, padding: '4px 10px' }}>
                                  <CheckCircle size={13} /> Paid to Wallet
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  className="btn btn-sm btn-primary"
                                  onClick={() => {
                                    setPayingExpense(exp);
                                    setPaymentMode('Cash in Hand');
                                    setPaymentNote('');
                                  }}
                                  style={{ background: '#059669', borderColor: '#047857', padding: '6px 14px', fontWeight: 700, fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                                >
                                  <IndianRupee size={13} /> Pay / Release Funds
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        );
      })()}

      {/* SECTION 6: Daily Reports (DPR) & Recent Activities */}
      {(activeTab === 'reports') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Daily Progress Reports Header */}
          <div className="glass-card" style={{ padding: '18px 22px', borderLeft: '4px solid #d97706', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="badge badge-amber">Admin DPR Review</span>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Live Site Reports & Progress Logs</span>
              </div>
              <h3 style={{ fontSize: '1.25rem', margin: '4px 0 0 0', color: '#0f172a', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={20} color="#d97706" /> Daily Progress Reports (DPR)
              </h3>
              <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '2px 0 0 0' }}>
                Review daily site work summaries, project progress %, and photo evidence submitted by site engineers.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="badge badge-blue" style={{ fontSize: '0.82rem', padding: '6px 14px', fontWeight: 700 }}>
                {dprs.length} Total DPR Reports
              </span>
            </div>
          </div>

          {/* DPR Reports List (Collapsible Accordion by Default) */}
          {dprs.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {dprs.map((dpr, idx) => {
                const reportPhotos = Array.isArray(dpr.photos) && dpr.photos.length > 0 
                  ? dpr.photos 
                  : (dpr.sitePhoto ? [dpr.sitePhoto] : []);
                const matchingProject = allProjects.find(p => p.id === dpr.projectId || p.name === dpr.projectName);
                const engineerPhone = dpr.engineerPhone || matchingProject?.clientPhone || matchingProject?.contactPhone || '9876543210';
                const dprKey = dpr.id || `dpr_${idx}`;
                const isExpanded = !!expandedDprs[dprKey];
                const totalExp = Number(dpr.totalCost || ((Number(dpr.materialCost || 0) + Number(dpr.laborCost || 0) + Number(dpr.machineryCharge || 0))));

                return (
                  <div 
                    key={dprKey} 
                    className="glass-card" 
                    style={{ 
                      padding: '14px 18px', 
                      borderRadius: '10px', 
                      border: '1px solid #e2e8f0', 
                      boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
                      background: '#ffffff',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {/* Compact Top Header Bar with Side Arrow Dropdown */}
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      flexWrap: 'wrap', 
                      gap: '12px' 
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', flex: 1, minWidth: '260px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                              {dpr.projectName}
                            </span>
                            {matchingProject?.location && (
                              <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                <MapPin size={12} /> {matchingProject.location}
                              </span>
                            )}
                            <span className="badge badge-emerald" style={{ fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px' }}>
                              Site DPR
                            </span>
                          </div>
                          <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px' }}>
                            Date: <strong>{dpr.date}</strong> • Engineer: <strong style={{ color: '#1e293b' }}>{dpr.engineerName || matchingProject?.acceptedBy || 'Site Engineer'}</strong>
                          </div>
                        </div>
                      </div>

                      {/* Right Side Stats & Dropdown Arrow Button */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '0.68rem', color: '#64748b', display: 'block', fontWeight: 600 }}>Total Expense</span>
                          <strong style={{ fontSize: '0.92rem', color: '#059669', fontWeight: 800 }}>
                            ₹{totalExp.toLocaleString('en-IN')}
                          </strong>
                        </div>

                        <div style={{ textAlign: 'right', minWidth: '85px' }}>
                          <span style={{ fontSize: '0.68rem', color: '#64748b', display: 'block', fontWeight: 600 }}>Progress</span>
                          <strong style={{ fontSize: '0.92rem', color: '#d97706', fontWeight: 800 }}>
                            {dpr.progress !== undefined && dpr.progress !== null ? `${dpr.progress}%` : `${matchingProject?.progress || 0}%`}
                          </strong>
                        </div>

                        {/* Collapsible Dropdown Arrow Button */}
                        <button
                          type="button"
                          onClick={() => setExpandedDprs(prev => ({ ...prev, [dprKey]: !prev[dprKey] }))}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: isExpanded ? '#f1f5f9' : '#eff6ff',
                            border: '1px solid ' + (isExpanded ? '#cbd5e1' : '#bfdbfe'),
                            color: isExpanded ? '#334155' : '#2563eb',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontSize: '0.76rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            userSelect: 'none',
                            transition: 'all 0.15s ease'
                          }}
                          title={isExpanded ? 'Click to collapse details' : 'Click to view full report details'}
                        >
                          <span>{isExpanded ? 'Collapse' : 'Details'}</span>
                          {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                        </button>
                      </div>
                    </div>

                    {/* Single-line Summary preview when collapsed */}
                    {!isExpanded && (
                      <div style={{ 
                        marginTop: '10px', 
                        paddingTop: '8px', 
                        borderTop: '1px dashed #e2e8f0', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        fontSize: '0.8rem',
                        color: '#475569',
                        flexWrap: 'wrap',
                        gap: '8px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '650px' }}>
                          <span style={{ fontWeight: 700, color: '#334155' }}>Work Executed:</span>
                          <span style={{ color: '#0f172a' }}>{dpr.workDone}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.74rem', color: '#64748b' }}>
                          <span>Workforce: <strong style={{ color: '#059669' }}>{dpr.laborCount || 20} Workers</strong></span>
                          {reportPhotos.length > 0 && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: '#2563eb', fontWeight: 600 }}>
                              <Camera size={12} /> {reportPhotos.length} Photo{reportPhotos.length > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Full Detailed Report Section (Shown ONLY when clicked / expanded) */}
                    {isExpanded && (
                      <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid #e2e8f0', animation: 'fadeIn 0.2s ease-in-out' }}>
                        {/* Site Engineer Info with Direct Call Button */}
                        <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ background: '#eff6ff', padding: '6px', borderRadius: '50%' }}>
                              <User size={16} color="#2563eb" />
                            </div>
                            <div>
                              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a' }}>
                                Site Engineer: {dpr.engineerName || matchingProject?.acceptedBy || 'Site Engineer'}
                              </div>
                              <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                                Phone: {engineerPhone}
                              </div>
                            </div>
                          </div>

                          <a
                            href={`tel:${engineerPhone}`}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              background: '#059669',
                              color: '#ffffff',
                              textDecoration: 'none',
                              padding: '5px 12px',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: 700
                            }}
                            title="Direct Call to Site Engineer"
                          >
                            <Phone size={12} /> Direct Call ({engineerPhone})
                          </a>
                        </div>

                        {/* Work Completed Content */}
                        <div style={{ marginBottom: '12px' }}>
                          <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#475569', marginBottom: '4px', textTransform: 'uppercase' }}>
                            Work Executed on Site
                          </div>
                          <div style={{ background: '#ffffff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', color: '#1e293b', lineHeight: 1.5 }}>
                            {dpr.workDone}
                          </div>
                        </div>

                        {/* Materials Consumed & Site Workforce */}
                        <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '12px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#0f172a' }}>
                            <HardHat size={14} color="#059669" />
                            <strong>Workforce on Site:</strong> <span style={{ color: '#059669', fontWeight: 700 }}>{dpr.laborCount || 20} Workers</span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#0f172a', flex: 1, minWidth: '220px' }}>
                            <Package size={14} color="#d97706" />
                            <strong>Daily Materials Consumed:</strong>
                            <span style={{ color: '#b45309', fontWeight: 600, background: '#fef3c7', padding: '2px 8px', borderRadius: '4px', border: '1px solid #fde68a' }}>
                              {dpr.materialsUsed || 'Standard Construction Materials'}
                            </span>
                          </div>

                          {dpr.remarks && dpr.remarks !== 'None' && (
                            <div style={{ fontSize: '0.76rem', color: '#64748b', width: '100%', marginTop: '2px' }}>
                              <strong>Notes / Remarks:</strong> {dpr.remarks}
                            </div>
                          )}
                        </div>

                        {/* Dedicated Expense Breakdown Field */}
                        <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '12px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <IndianRupee size={14} color="#059669" /> Daily Site Operational Expense Breakdown:
                            </span>
                            <span style={{ fontSize: '0.92rem', fontWeight: 900, color: '#059669', background: '#ecfdf5', padding: '2px 10px', borderRadius: '6px', border: '1px solid #a7f3d0' }}>
                              Total: ₹{totalExp.toLocaleString('en-IN')}
                            </span>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: dpr.machineryUsed && dpr.machineryUsed !== 'None' ? 'repeat(auto-fit, minmax(170px, 1fr))' : '1fr 1fr', gap: '10px' }}>
                            <div style={{ background: '#fffbeb', padding: '8px 12px', borderRadius: '6px', border: '1px solid #fde68a' }}>
                              <div style={{ fontSize: '0.72rem', color: '#92400e', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Package size={12} /> Material Cost:
                              </div>
                              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#b45309', marginTop: '2px' }}>
                                ₹{Number(dpr.materialCost || 0).toLocaleString('en-IN')}
                              </div>
                              {Array.isArray(dpr.materialsBreakdown) && dpr.materialsBreakdown.length > 0 && (
                                <div style={{ fontSize: '0.68rem', color: '#78350f', marginTop: '3px' }}>
                                  {dpr.materialsBreakdown.map(m => `${m.name}: ${m.quantity} ${m.unit}`).join(', ')}
                                </div>
                              )}
                            </div>

                            <div style={{ background: '#eff6ff', padding: '8px 12px', borderRadius: '6px', border: '1px solid #bfdbfe' }}>
                              <div style={{ fontSize: '0.72rem', color: '#1e40af', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Users size={12} /> Labor Wages:
                              </div>
                              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1d4ed8', marginTop: '2px' }}>
                                ₹{Number(dpr.laborCost || 0).toLocaleString('en-IN')}
                              </div>
                              <div style={{ fontSize: '0.68rem', color: '#2563eb', marginTop: '3px' }}>
                                {dpr.laborCount || 20} Workers on site
                                {Array.isArray(dpr.laborBreakdown) && dpr.laborBreakdown.length > 0 && (
                                  <div style={{ color: '#64748b', fontSize: '0.65rem', marginTop: '2px' }}>
                                    {dpr.laborBreakdown.map(l => `${l.role}: ${l.count} @ ₹${l.dailyWage}`).join(' • ')}
                                  </div>
                                )}
                              </div>
                            </div>

                            {dpr.machineryUsed && dpr.machineryUsed !== 'None' && (
                              <div style={{ background: '#f0f9ff', padding: '8px 12px', borderRadius: '6px', border: '1px solid #bae6fd' }}>
                                <div style={{ fontSize: '0.72rem', color: '#0369a1', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <Briefcase size={12} /> Machinery Charge:
                                </div>
                                <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0284c7', marginTop: '2px' }}>
                                  ₹{Number(dpr.machineryCharge || 0).toLocaleString('en-IN')}
                                </div>
                                <div style={{ fontSize: '0.68rem', color: '#0369a1', marginTop: '3px' }}>
                                  {dpr.machineryUsed}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Photo Evidence Gallery */}
                        {reportPhotos.length > 0 && (
                          <div>
                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Camera size={13} color="#2563eb" /> Photo Evidence Attached ({reportPhotos.length})
                            </div>
                            <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', padding: '2px' }}>
                              {reportPhotos.map((photoUrl, pIdx) => (
                                <div 
                                  key={pIdx}
                                  onClick={() => {
                                    setViewPhotoGallery(reportPhotos);
                                    setViewPhotoIndex(pIdx);
                                    setViewPhotoUrl(photoUrl);
                                  }}
                                  style={{ width: '110px', height: '75px', borderRadius: '6px', overflow: 'hidden', border: '1px solid #cbd5e1', cursor: 'pointer', flexShrink: 0, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}
                                >
                                  <img 
                                    src={photoUrl} 
                                    alt={`DPR Photo ${pIdx + 1}`} 
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    onError={(e) => {
                                      e.target.onerror = null;
                                      e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="110" height="75" fill="%23f1f5f9"><rect width="100%" height="100%" fill="%23e2e8f0"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="10" fill="%2364748b">DPR Photo</text></svg>';
                                    }}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="glass-card" style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
              <FileText size={36} color="#cbd5e1" style={{ margin: '0 auto 12px auto', display: 'block' }} />
              <h4 style={{ fontSize: '1rem', color: '#0f172a', margin: '0 0 6px 0' }}>No Daily Reports (DPR) Submitted Yet</h4>
              <p style={{ fontSize: '0.82rem', margin: 0 }}>
                When site engineers submit their daily progress reports from the field, they will automatically appear here with progress %, work done, and photos.
              </p>
            </div>
          )}

          {/* Recent Activities Timeline */}
          <div className="glass-card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a' }}>
              <Clock size={18} color="#2563eb" /> Recent System Activities
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {recentActivities.length > 0 ? recentActivities.map(act => (
                <div key={act.id} style={{ padding: '12px 14px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className="badge badge-amber">{act.type}</span>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a' }}>{act.description}</span>
                  </div>
                  <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{act.time}</span>
                </div>
              )) : (
                <div style={{ fontSize: '0.82rem', color: '#94a3b8', textAlign: 'center', padding: '12px' }}>
                  No recent activities logged yet.
                </div>
              )}
            </div>
          </div>

        </div>
      )}
{/* SECTION 7: Tasks Management */}
{(activeTab === 'tasks') && (
  <div className="glass-card" style={{ padding: '20px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
      <h3 style={{ fontSize: '1.1rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Check size={18} color="#2563eb" /> 7. Tasks Management
      </h3>
    </div>
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: '#64748b' }}>
            <th style={{ padding: '10px 8px' }}>Task & Project</th>
            <th style={{ padding: '10px 8px' }}>Due Stage</th>
            <th style={{ padding: '10px 8px' }}>Status</th>
            <th style={{ padding: '10px 8px' }}>Photo Evidence</th>
            <th style={{ padding: '10px 8px' }}>Materials Consumed</th>
            <th style={{ padding: '10px 8px' }}>Expense Breakdown (Materials & Labor)</th>
            <th style={{ padding: '10px 8px' }}>Admin Remark</th>
            <th style={{ padding: '10px 8px', textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map(t => {
            const allTaskPhotos = Array.isArray(t.photos) && t.photos.length > 0 ? t.photos : (t.photo ? [t.photo] : []);
            const calculatedTotal = Number(t.totalCost || ((Number(t.materialCost || 0) + Number(t.laborCost || 0))));

            return (
              <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '10px 8px' }}>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>{t.name}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>{t.project}</div>
                </td>
                <td style={{ padding: '10px 8px', color: '#64748b' }}>{t.dueDate}</td>
                <td style={{ padding: '10px 8px' }}>
                  <span className={`badge ${t.status === 'Completed' ? 'badge-emerald' : t.status === 'Awaiting Approval' ? 'badge-blue' : t.status === 'Rejected' ? 'badge-rose' : 'badge-amber'}`}>
                    {t.status}
                  </span>
                </td>
                <td style={{ padding: '10px 8px' }}>
                  {allTaskPhotos.length > 0 ? (
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                      {allTaskPhotos.slice(0, 2).map((imgUrl, pIdx) => (
                        <div 
                          key={pIdx}
                          onClick={() => {
                            setViewPhotoGallery(allTaskPhotos);
                            setViewPhotoIndex(pIdx);
                            setViewPhotoUrl(imgUrl);
                          }}
                          style={{ width: '48px', height: '48px', borderRadius: '4px', overflow: 'hidden', border: '1.5px solid #2563eb', cursor: 'pointer', flexShrink: 0 }}
                          title="Click to zoom evidence"
                        >
                          <img src={imgUrl} alt="Evidence" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      ))}
                      {allTaskPhotos.length > 2 && (
                        <span style={{ fontSize: '0.72rem', color: '#2563eb', fontWeight: 700 }}>+{allTaskPhotos.length - 2}</span>
                      )}
                    </div>
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>No photo</span>
                  )}
                </td>

                {/* Materials Consumed Column */}
                <td style={{ padding: '10px 8px' }}>
                  {Array.isArray(t.materialsUsed) && t.materialsUsed.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      {t.materialsUsed.map((m, mIdx) => (
                        <span key={mIdx} style={{ fontSize: '0.72rem', background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                          {m.name}: {m.quantity} {m.unit}
                        </span>
                      ))}
                    </div>
                  ) : t.materialsSummary ? (
                    <span style={{ fontSize: '0.74rem', color: '#475569' }}>{t.materialsSummary}</span>
                  ) : (
                    <span style={{ fontSize: '0.74rem', color: '#94a3b8', fontStyle: 'italic' }}>Standard Materials</span>
                  )}
                </td>

                {/* Dedicated Expense Breakdown Field */}
                <td style={{ padding: '10px 8px' }}>
                  <div style={{ background: '#f8fafc', padding: '8px 10px', borderRadius: '8px', border: '1.5px solid #e2e8f0', minWidth: '175px' }}>
                    <div style={{ fontSize: '0.86rem', fontWeight: 900, color: '#059669', marginBottom: '3px' }}>
                      Total Cost: ₹{calculatedTotal.toLocaleString('en-IN')}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#b45309', fontWeight: 700 }}>
                      Material: ₹{Number(t.materialCost || 0).toLocaleString('en-IN')}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#1d4ed8', fontWeight: 700, marginTop: '2px' }}>
                      Labor: ₹{Number(t.laborCost || 0).toLocaleString('en-IN')} ({t.laborCount || 0} Workers)
                      {Array.isArray(t.laborDetails) && t.laborDetails.length > 0 && (
                        <div style={{ fontSize: '0.67rem', color: '#64748b', fontWeight: 500, marginTop: '2px' }}>
                          {t.laborDetails.map(l => `${l.role}: ${l.count} @ ₹${l.dailyWage}`).join(' • ')}
                        </div>
                      )}
                    </div>
                  </div>
                </td>

                <td style={{ padding: '10px 8px', fontSize: '0.78rem', color: '#475569' }}>{t.adminRemark || '-'}</td>
                <td style={{ padding: '10px 8px', textAlign: 'right' }}>
                  {t.status === 'Awaiting Approval' && (
                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                      <button
                        className="btn btn-sm btn-success"
                        onClick={() => onApproveTask(t.id)}
                        style={{ padding: '5px 10px', fontSize: '0.78rem', fontWeight: 700 }}
                      >
                        <Check size={14} /> Approve (+DPR)
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => {
                          const remark = window.prompt('Enter rejection remark for Site Engineer:');
                          if (remark !== null) onRejectTask(t.id, remark);
                        }}
                        style={{ padding: '5px 8px', fontSize: '0.78rem' }}
                      >
                        <X size={14} /> Reject
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </div>
)}



      {/* SLEEK HIGH-LEVEL ENTERPRISE MODAL: Add New Project */}
      {modalType === 'project' && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="glass-card" style={{ padding: '28px', width: '100%', maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto', background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '14px' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', color: '#0f172a', fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>Add New Project</h3>
                <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '4px 0 0 0' }}>Configure project specifications, budget allocation, and site assignment</p>
              </div>
              <button 
                type="button" 
                onClick={() => setModalType(null)}
                style={{ border: 'none', background: '#f8fafc', borderRadius: '8px', width: '32px', height: '32px', cursor: 'pointer', color: '#64748b', fontWeight: '600', fontSize: '1.1rem' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddProject} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              
              {/* 1. Project Title */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.85rem' }}>Project Title / Name *</label>
                <input 
                  className="form-control" 
                  placeholder="e.g. Royal Heights Residency" 
                  value={newProj.name} 
                  onChange={e => setNewProj({...newProj, name: e.target.value})} 
                  required 
                  style={{ padding: '10px 14px', fontSize: '0.9rem', borderRadius: '8px' }}
                />
              </div>

              {/* 2. Construction Type Select Dropdown */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.85rem' }}>
                  Project Category / Construction Type *
                </label>
                <select 
                  className="form-control" 
                  value={newProj.projectType}
                  onChange={e => setNewProj({...newProj, projectType: e.target.value})}
                  style={{ padding: '10px 12px', fontSize: '0.9rem', borderRadius: '8px' }}
                >
                  <option value="Building">Building</option>
                  <option value="Row House">Row House</option>
                  <option value="Bungalows">Bungalows</option>
                  <option value="Bridge">Bridge</option>
                  <option value="Road Work">Road Work</option>
                </select>
              </div>

              {/* Dynamic Category Specifications Dropdowns */}
              {newProj.projectType === 'Building' && (
                <div style={{ background: '#eff6ff', padding: '14px', borderRadius: '10px', border: '1px solid #bfdbfe', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <label style={{ fontWeight: 700, color: '#1e40af', fontSize: '0.85rem' }}>Building Specifications (Dropdown Options)</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                    <div>
                      <span style={{ fontSize: '0.72rem', color: '#475569', fontWeight: 600, display: 'block', marginBottom: '2px' }}>Buildings Count</span>
                      <select className="form-control" value={newProj.totalBuildings} onChange={e => setNewProj({...newProj, totalBuildings: e.target.value})} style={{ fontSize: '0.82rem', padding: '6px 8px', borderRadius: '6px' }}>
                        <option value="1 Building">1 Building Block</option>
                        <option value="2 Buildings">2 Buildings / Twin Towers</option>
                        <option value="3 Buildings">3 Buildings Complex</option>
                        <option value="4 Buildings">4 Buildings Complex</option>
                        <option value="5+ Buildings">5+ Multi-Tower Society</option>
                      </select>
                    </div>

                    <div>
                      <span style={{ fontSize: '0.72rem', color: '#475569', fontWeight: 600, display: 'block', marginBottom: '2px' }}>Number of Floors</span>
                      <select className="form-control" value={newProj.floorsCount} onChange={e => setNewProj({...newProj, floorsCount: e.target.value})} style={{ fontSize: '0.82rem', padding: '6px 8px', borderRadius: '6px' }}>
                        <option value="G+3 Floors">G+3 Low Rise</option>
                        <option value="G+5 Floors">G+5 Mid Rise</option>
                        <option value="G+7 Floors">G+7 Standard Building</option>
                        <option value="G+10 Floors">G+10 High Rise</option>
                        <option value="G+14 Floors">G+14 High Rise Tower</option>
                        <option value="G+20+ Floors">G+20+ Skyscraper</option>
                      </select>
                    </div>

                    <div>
                      <span style={{ fontSize: '0.72rem', color: '#475569', fontWeight: 600, display: 'block', marginBottom: '2px' }}>Flat / BHK Type</span>
                      <select className="form-control" value={newProj.buildingBhk} onChange={e => setNewProj({...newProj, buildingBhk: e.target.value})} style={{ fontSize: '0.82rem', padding: '6px 8px', borderRadius: '6px' }}>
                        <option value="1 BHK">1 BHK Apartments</option>
                        <option value="2 BHK">2 BHK Apartments</option>
                        <option value="3 BHK">3 BHK Apartments</option>
                        <option value="4 BHK Luxury">4 BHK Luxury Apartments</option>
                        <option value="2 & 3 BHK Mixed">2 & 3 BHK Mixed Flats</option>
                        <option value="3 & 4 BHK Penthouse">3 & 4 BHK Penthouse / Duplex</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {newProj.projectType === 'Row House' && (
                <div style={{ background: '#fef3c7', padding: '14px', borderRadius: '10px', border: '1px solid #fde68a', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <label style={{ fontWeight: 700, color: '#92400e', fontSize: '0.85rem' }}>Row House Specifications (Dropdown Options)</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <span style={{ fontSize: '0.72rem', color: '#475569', fontWeight: 600, display: 'block', marginBottom: '2px' }}>Total Row Houses</span>
                      <select className="form-control" value={newProj.rowHouseUnits} onChange={e => setNewProj({...newProj, rowHouseUnits: e.target.value})} style={{ fontSize: '0.85rem', padding: '6px 8px', borderRadius: '6px' }}>
                        <option value="5 Units">5 Units Scheme</option>
                        <option value="10 Units">10 Units Scheme</option>
                        <option value="15 Units">15 Units Scheme</option>
                        <option value="20 Units">20 Units Scheme</option>
                        <option value="30+ Units">30+ Gated Row House Community</option>
                      </select>
                    </div>

                    <div>
                      <span style={{ fontSize: '0.72rem', color: '#475569', fontWeight: 600, display: 'block', marginBottom: '2px' }}>BHK Configuration</span>
                      <select className="form-control" value={newProj.rowHouseBhk} onChange={e => setNewProj({...newProj, rowHouseBhk: e.target.value})} style={{ fontSize: '0.85rem', padding: '6px 8px', borderRadius: '6px' }}>
                        <option value="1 BHK Row House">1 BHK Row House</option>
                        <option value="2 BHK Row House">2 BHK Row House</option>
                        <option value="3 BHK Row House">3 BHK Row House</option>
                        <option value="4 BHK Luxury Row House">4 BHK Luxury Row House</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {newProj.projectType === 'Bungalows' && (
                <div style={{ background: '#f0fdf4', padding: '14px', borderRadius: '10px', border: '1px solid #bbf7d0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <label style={{ fontWeight: 700, color: '#166534', fontSize: '0.85rem' }}>Bungalow Specifications (Dropdown Options)</label>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: '#475569', fontWeight: 600, display: 'block', marginBottom: '2px' }}>Villa / BHK Configuration</span>
                    <select className="form-control" value={newProj.bungalowBhk} onChange={e => setNewProj({...newProj, bungalowBhk: e.target.value})} style={{ fontSize: '0.85rem', padding: '6px 8px', borderRadius: '6px' }}>
                      <option value="1 BHK Bungalow">1 BHK Individual Bungalow</option>
                      <option value="2 BHK Bungalow">2 BHK Individual Bungalow</option>
                      <option value="3 BHK Bungalow">3 BHK Individual Bungalow</option>
                      <option value="4 BHK Luxury Villa">4 BHK Luxury Villa</option>
                      <option value="5 BHK Grand Villa">5 BHK Grand Villa</option>
                      <option value="6+ BHK Mansion Villa">6+ BHK Mansion Villa</option>
                    </select>
                  </div>
                </div>
              )}

              {newProj.projectType === 'Road Work' && (
                <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #cbd5e1', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <label style={{ fontWeight: 700, color: '#334155', fontSize: '0.85rem' }}>Road Work Specifications (Dropdown Options)</label>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: '#475569', fontWeight: 600, display: 'block', marginBottom: '2px' }}>Lane Configuration</span>
                    <select className="form-control" value={newProj.roadLanes} onChange={e => setNewProj({...newProj, roadLanes: e.target.value})} style={{ fontSize: '0.85rem', padding: '6px 8px', borderRadius: '6px' }}>
                      <option value="Single Lane Road">Single Lane Road</option>
                      <option value="2-Lane Highway">2-Lane Highway</option>
                      <option value="3-Lane Road">3-Lane Road</option>
                      <option value="4-Lane Highway">4-Lane Highway / Expressway</option>
                      <option value="6-Lane Super Highway">6-Lane Super Highway</option>
                    </select>
                  </div>
                </div>
              )}

              {newProj.projectType === 'Bridge' && (
                <div style={{ background: '#faf5ff', padding: '14px', borderRadius: '10px', border: '1px solid #e9d5ff', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <label style={{ fontWeight: 700, color: '#6b21a8', fontSize: '0.85rem' }}>Bridge Construction Specifications</label>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: '#475569', fontWeight: 600, display: 'block', marginBottom: '2px' }}>Bridge Category</span>
                    <select className="form-control" value={newProj.bridgeType} onChange={e => setNewProj({...newProj, bridgeType: e.target.value})} style={{ fontSize: '0.85rem', padding: '6px 8px', borderRadius: '6px' }}>
                      <option value="Flyover Bridge">Flyover Overbridge</option>
                      <option value="River Bridge">River Bridge</option>
                      <option value="Railway Overbridge">Railway Overbridge (ROB)</option>
                      <option value="Pedestrian Footbridge">Pedestrian Footbridge</option>
                    </select>
                  </div>
                </div>
              )}

              {/* 3. Budget Input & Currency Scale Select Dropdown */}
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <label className="form-label" style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.85rem', marginBottom: '8px', display: 'block' }}>
                  Financial Budget Allocation
                </label>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: '4px', fontWeight: 500 }}>Budget Amount</span>
                    <input 
                      className="form-control" 
                      type="number" 
                      step="any"
                      placeholder="e.g. 1.5 or 50" 
                      value={newProj.budgetVal} 
                      onChange={e => setNewProj({...newProj, budgetVal: e.target.value})} 
                      required
                      style={{ fontSize: '0.9rem', fontWeight: 600, borderRadius: '8px', padding: '10px 12px' }}
                    />
                  </div>

                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: '4px', fontWeight: 500 }}>Currency Scale</span>
                    <select 
                      className="form-control" 
                      value={newProj.budgetUnit}
                      onChange={e => setNewProj({...newProj, budgetUnit: e.target.value})}
                      style={{ padding: '10px 12px', fontSize: '0.9rem', borderRadius: '8px' }}
                    >
                      <option value="Cr">Crore (Cr)</option>
                      <option value="Lakh">Lakh (L)</option>
                      <option value="Thousand">Thousand (K)</option>
                      <option value="Hundred">Hundred</option>
                      <option value="Rupees">Rupees (₹)</option>
                    </select>
                  </div>
                </div>

                {/* Calculated Budget Summary */}
                <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px dashed #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Total Formatted Budget:</span>
                  <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#059669' }}>
                    {formatCurrency(getBudgetInRupees(newProj.budgetVal, newProj.budgetUnit))}
                  </span>
                </div>
              </div>

              {/* 4. Client Category Select Dropdown */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.85rem' }}>
                  Client Category & Account *
                </label>
                <select 
                  className="form-control" 
                  value={newProj.clientType}
                  onChange={e => setNewProj({...newProj, clientType: e.target.value})}
                  style={{ padding: '10px 12px', fontSize: '0.9rem', borderRadius: '8px', marginBottom: '8px' }}
                >
                  <option value="Private Client">Private Client</option>
                  <option value="Government">Government</option>
                  <option value="Corporate Builder">Corporate Builder</option>
                  <option value="Housing Society">Housing Society</option>
                </select>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <input 
                      className="form-control" 
                      placeholder="Client Name / Organization *" 
                      value={newProj.clientName} 
                      onChange={e => setNewProj({...newProj, clientName: e.target.value})} 
                      required
                      style={{ padding: '8px 12px', fontSize: '0.85rem', borderRadius: '8px' }}
                    />
                  </div>
                  <div>
                    <input 
                      className="form-control" 
                      type="tel"
                      maxLength={10}
                      pattern="[0-9]{10}"
                      placeholder="Client 10-Digit Mobile *" 
                      value={newProj.clientPhone} 
                      onChange={e => setNewProj({...newProj, clientPhone: e.target.value.replace(/\D/g, '').slice(0, 10)})} 
                      required
                      style={{ padding: '8px 12px', fontSize: '0.85rem', borderRadius: '8px' }}
                    />
                  </div>
                </div>
              </div>

              {/* 5. Location Field */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.85rem' }}>
                  Site Location / Address *
                </label>
                <input 
                  className="form-control" 
                  placeholder="e.g. Satellite, Ahmedabad" 
                  value={newProj.location} 
                  onChange={e => setNewProj({...newProj, location: e.target.value})} 
                  required 
                  style={{ padding: '10px 14px', fontSize: '0.9rem', borderRadius: '8px' }}
                />
              </div>

              {/* Form Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '6px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setModalType(null)} style={{ padding: '9px 18px', borderRadius: '8px', fontSize: '0.875rem' }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ padding: '9px 22px', fontWeight: 600, background: '#d97706', borderColor: '#b45309', borderRadius: '8px', fontSize: '0.875rem' }}>
                  Create Project
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL: Edit Project */}
      {modalType === 'edit_project' && editingProject && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-card" style={{ width: '90%', maxWidth: '540px', padding: '24px', background: '#ffffff', borderRadius: '14px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: '1.2rem', color: '#0f172a', fontWeight: 700, margin: 0 }}>Edit Project Specifications</h3>
              <button onClick={() => { setModalType(null); setEditingProject(null); }} style={{ background: 'transparent', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#64748b' }}>✕</button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              const totalBudget = getBudgetInRupees(newProj.budgetVal, newProj.budgetUnit);
              
              let specs = {};
              if (newProj.projectType === 'Building') {
                specs = {
                  buildingsCount: newProj.totalBuildings,
                  floors: newProj.floorsCount,
                  bhk: newProj.buildingBhk
                };
              } else if (newProj.projectType === 'Row House') {
                specs = {
                  unitsCount: newProj.rowHouseUnits,
                  bhk: newProj.rowHouseBhk
                };
              } else if (newProj.projectType === 'Bungalows') {
                specs = {
                  bhk: newProj.bungalowBhk
                };
              } else if (newProj.projectType === 'Road Work') {
                specs = {
                  lanes: newProj.roadLanes
                };
              } else if (newProj.projectType === 'Bridge') {
                specs = {
                  bridgeType: newProj.bridgeType
                };
              }

              const updatedData = {
                name: newProj.name,
                type: newProj.projectType,
                budget: totalBudget,
                clientName: newProj.clientName,
                clientPhone: newProj.clientPhone,
                location: newProj.location,
                engineerInCharge: newProj.engineerInCharge,
                specifications: specs
              };

              if (onUpdateProject) {
                onUpdateProject(editingProject.id, updatedData);
              }

              setProjectList(projectList.map(p => p.id === editingProject.id ? { ...p, ...updatedData } : p));
              setModalType(null);
              setEditingProject(null);
            }} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.85rem' }}>Project Name *</label>
                <input className="form-control" value={newProj.name} onChange={e => setNewProj({...newProj, name: e.target.value})} required style={{ padding: '8px 12px', fontSize: '0.9rem', borderRadius: '8px' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.85rem' }}>Category</label>
                  <select className="form-control" value={newProj.projectType} onChange={e => setNewProj({...newProj, projectType: e.target.value})} style={{ padding: '8px 12px', fontSize: '0.9rem', borderRadius: '8px' }}>
                    <option value="Building">Building</option>
                    <option value="Row House">Row House</option>
                    <option value="Bungalows">Bungalows</option>
                    <option value="Bridge">Bridge</option>
                    <option value="Road Work">Road Work</option>
                  </select>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.85rem' }}>Budget Scale</label>
                  <select className="form-control" value={newProj.budgetUnit} onChange={e => setNewProj({...newProj, budgetUnit: e.target.value})} style={{ padding: '8px 12px', fontSize: '0.9rem', borderRadius: '8px' }}>
                    <option value="Cr">Crore (Cr)</option>
                    <option value="Lakh">Lakh (L)</option>
                    <option value="Thousand">Thousand (K)</option>
                    <option value="Hundred">Hundred</option>
                    <option value="Rupees">Rupees (₹)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.85rem' }}>Budget Amount *</label>
                  <input className="form-control" type="number" step="any" value={newProj.budgetVal} onChange={e => setNewProj({...newProj, budgetVal: e.target.value})} required style={{ padding: '8px 12px', fontSize: '0.9rem', borderRadius: '8px' }} />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.85rem' }}>Client Name</label>
                  <input className="form-control" value={newProj.clientName} onChange={e => setNewProj({...newProj, clientName: e.target.value})} style={{ padding: '8px 12px', fontSize: '0.9rem', borderRadius: '8px' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.85rem' }}>Client Mobile</label>
                  <input className="form-control" type="tel" maxLength={10} value={newProj.clientPhone} onChange={e => setNewProj({...newProj, clientPhone: e.target.value.replace(/\D/g, '').slice(0, 10)})} style={{ padding: '8px 12px', fontSize: '0.9rem', borderRadius: '8px' }} />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.85rem' }}>Location / Site Address</label>
                  <input className="form-control" value={newProj.location} onChange={e => setNewProj({...newProj, location: e.target.value})} style={{ padding: '8px 12px', fontSize: '0.9rem', borderRadius: '8px' }} />
                </div>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.85rem' }}>Assign Site Engineer</label>
                <select className="form-control" value={newProj.engineerInCharge} onChange={e => setNewProj({...newProj, engineerInCharge: e.target.value})} style={{ padding: '8px 12px', fontSize: '0.9rem', borderRadius: '8px' }}>
                  <option value="Unassigned">-- Select Engineer --</option>
                  {engineers.map(eng => (
                    <option key={eng.id} value={eng.name}>{eng.name} ({eng.email})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
                <button type="button" className="btn btn-secondary" onClick={() => { setModalType(null); setEditingProject(null); }} style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '0.875rem' }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ padding: '8px 20px', fontWeight: 600, background: '#2563eb', borderColor: '#1d4ed8', borderRadius: '8px', fontSize: '0.875rem' }}>
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANUAL MODAL: Add Employee */}
      {modalType === 'employee' && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-card" style={{ padding: '24px', width: '90%', maxWidth: '480px' }}>
            <h3 style={{ marginBottom: '14px', color: '#0f172a' }}>Manually Add Employee</h3>
            <form onSubmit={handleAddEmployee}>
              <div className="form-group">
                <label className="form-label">Employee Name</label>
                <input className="form-control" placeholder="e.g. Amit Shah" value={newEmp.name} onChange={e => setNewEmp({...newEmp, name: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="form-label">Role / Position</label>
                <input className="form-control" placeholder="e.g. Site Senior Engineer" value={newEmp.role} onChange={e => setNewEmp({...newEmp, role: e.target.value})} required />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Contact Phone</label>
                  <input className="form-control" placeholder="+91 98765 43210" value={newEmp.contact} onChange={e => setNewEmp({...newEmp, contact: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Assigned Project</label>
                  <input className="form-control" placeholder="e.g. Project Name" value={newEmp.assignedProject} onChange={e => setNewEmp({...newEmp, assignedProject: e.target.value})} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setModalType(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add Employee</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANUAL MODAL: Add Worker */}
      {modalType === 'worker' && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-card" style={{ padding: '24px', width: '90%', maxWidth: '480px' }}>
            <h3 style={{ marginBottom: '14px', color: '#0f172a' }}>Manually Add Worker</h3>
            <form onSubmit={handleAddWorker}>
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Worker Name *</label>
                <input className="form-control" placeholder="e.g. Ramesh Kumar" value={newWrk.name} onChange={e => setNewWrk({...newWrk, name: e.target.value})} required />
              </div>
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                  Mobile Number (10 Digits) <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  className="form-control"
                  type="tel"
                  placeholder="Enter 10-digit mobile"
                  value={newWrk.phone}
                  maxLength={10}
                  onChange={e => {
                    const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setNewWrk({ ...newWrk, phone: digits });
                  }}
                  required
                />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Trade</label>
                  <input className="form-control" placeholder="Mason / Bar Bender" value={newWrk.trade} onChange={e => setNewWrk({...newWrk, trade: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-control" value={newWrk.status} onChange={e => setNewWrk({...newWrk, status: e.target.value})}>
                    <option value="Present">Present</option>
                    <option value="Absent">Absent</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setModalType(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add Worker</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANUAL MODAL: Add Expense */}
      {modalType === 'expense' && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-card" style={{ padding: '24px', width: '90%', maxWidth: '480px' }}>
            <h3 style={{ marginBottom: '14px', color: '#0f172a' }}>Manually Add Expense</h3>
            <form onSubmit={handleAddExpense}>
              <div className="form-group">
                <label className="form-label">Project</label>
                <input className="form-control" value={newExp.project} onChange={e => setNewExp({...newExp, project: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="form-label">Expense Category / Type</label>
                <input className="form-control" placeholder="Material Purchase / Labor Payout" value={newExp.expenseType} onChange={e => setNewExp({...newExp, expenseType: e.target.value})} required />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Amount (₹)</label>
                  <input className="form-control" type="number" placeholder="450000" value={newExp.amount} onChange={e => setNewExp({...newExp, amount: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input className="form-control" type="date" value={newExp.date} onChange={e => setNewExp({...newExp, date: e.target.value})} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setModalType(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add Expense</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ENHANCED PHOTO PREVIEW MODAL WITH GALLERY SUPPORT */}
      {viewPhotoUrl && (
        <div 
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200 }} 
          onClick={() => { setViewPhotoUrl(null); setViewPhotoGallery([]); }}
        >
          <div 
            style={{ position: 'relative', width: '90%', maxWidth: '850px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }} 
            onClick={e => e.stopPropagation()}
          >
            {/* Top Bar */}
            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', color: '#ffffff' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                {viewPhotoGallery.length > 1 ? `Photo ${viewPhotoIndex + 1} of ${viewPhotoGallery.length}` : 'Site Photo Evidence'}
              </span>
              <button 
                style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer', padding: '4px' }}
                onClick={() => { setViewPhotoUrl(null); setViewPhotoGallery([]); }}
              >
                <X size={26} />
              </button>
            </div>

            {/* Main Image with Navigation Arrows */}
            <div style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {viewPhotoGallery.length > 1 && (
                <button
                  type="button"
                  style={{
                    position: 'absolute', left: '-15px', background: 'rgba(15, 23, 42, 0.75)', color: '#ffffff',
                    border: '1px solid rgba(255,255,255,0.3)', borderRadius: '50%', width: '40px', height: '40px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10
                  }}
                  onClick={() => {
                    const prevIdx = (viewPhotoIndex - 1 + viewPhotoGallery.length) % viewPhotoGallery.length;
                    setViewPhotoIndex(prevIdx);
                    setViewPhotoUrl(viewPhotoGallery[prevIdx]);
                  }}
                >
                  <ChevronLeft size={22} />
                </button>
              )}

              <img 
                src={viewPhotoUrl} 
                alt="Enlarged Site Evidence" 
                style={{ maxWidth: '100%', maxHeight: '72vh', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }} 
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" fill="%23e2e8f0"><rect width="100%" height="100%" fill="%231e293b"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="16" fill="%2394a3b8">Photo Evidence Not Available</text></svg>';
                }}
              />

              {viewPhotoGallery.length > 1 && (
                <button
                  type="button"
                  style={{
                    position: 'absolute', right: '-15px', background: 'rgba(15, 23, 42, 0.75)', color: '#ffffff',
                    border: '1px solid rgba(255,255,255,0.3)', borderRadius: '50%', width: '40px', height: '40px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10
                  }}
                  onClick={() => {
                    const nextIdx = (viewPhotoIndex + 1) % viewPhotoGallery.length;
                    setViewPhotoIndex(nextIdx);
                    setViewPhotoUrl(viewPhotoGallery[nextIdx]);
                  }}
                >
                  <ChevronRight size={22} />
                </button>
              )}
            </div>

            {/* Bottom Thumbnails Strip */}
            {viewPhotoGallery.length > 1 && (
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px', overflowX: 'auto', maxWidth: '100%', padding: '4px' }}>
                {viewPhotoGallery.map((thumb, tIdx) => (
                  <div
                    key={tIdx}
                    onClick={() => { setViewPhotoIndex(tIdx); setViewPhotoUrl(thumb); }}
                    style={{
                      width: '50px', height: '50px', borderRadius: '4px', overflow: 'hidden', cursor: 'pointer',
                      border: viewPhotoIndex === tIdx ? '2px solid #3b82f6' : '1px solid rgba(255,255,255,0.3)',
                      opacity: viewPhotoIndex === tIdx ? 1 : 0.6, flexShrink: 0
                    }}
                  >
                    <img 
                      src={thumb} 
                      alt={`Thumb ${tIdx + 1}`} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" fill="%231e293b"><rect width="100%" height="100%" fill="%23334155"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="10" fill="%2394a3b8">Photo</text></svg>';
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* PHOTO REJECTION MODAL */}
      {rejectingPhoto && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '20px' }}>
          <div className="glass-card" style={{ padding: '24px', width: '100%', maxWidth: '540px', background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.2rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <XCircle size={22} color="#dc2626" /> Reject Photo Evidence
              </h3>
              <button 
                type="button" 
                onClick={() => { setRejectingPhoto(null); setRejectionMessage(''); }}
                style={{ border: 'none', background: '#f8fafc', borderRadius: '6px', width: '28px', height: '28px', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={16} />
              </button>
            </div>
            
            <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
              <img src={rejectingPhoto.url} alt="To Reject" style={{ width: '120px', height: '90px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>{rejectingPhoto.caption}</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>Project: {rejectingPhoto.projectName}</div>
              </div>
            </div>

            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', padding: '12px', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <User size={20} color="#d97706" style={{ flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#92400e' }}>Site Engineer: {rejectingPhoto.engineerName || 'Site Engineer'}</div>
                  <div style={{ fontSize: '0.8rem', color: '#b45309', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Phone size={14} /> {rejectingPhoto.engineerPhone || '9795798450'}
                  </div>
                </div>
              </div>

              {rejectingPhoto.engineerPhone && (
                <a 
                  href={`tel:${rejectingPhoto.engineerPhone}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    background: '#059669',
                    color: '#ffffff',
                    textDecoration: 'none',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                    fontWeight: 700
                  }}
                  title="Direct call to Site Engineer"
                >
                  <Phone size={13} /> Direct Call ({rejectingPhoto.engineerPhone})
                </a>
              )}
            </div>

            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label className="form-label" style={{ fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MessageSquare size={16} color="#64748b" /> Rejection Message / Remark <span style={{ color: '#dc2626' }}>* (Required)</span>
              </label>
              <textarea 
                className="form-control" 
                rows="3" 
                placeholder="Enter rejection reason / feedback for engineer..."
                value={rejectionMessage}
                onChange={e => setRejectionMessage(e.target.value)}
                style={{ resize: 'none' }}
                required
              />
              {!rejectionMessage.trim() && (
                <div style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: '4px' }}>
                  * A rejection reason is required before rejecting this request.
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button className="btn btn-secondary" onClick={() => {
                setRejectingPhoto(null);
                setRejectionMessage('');
              }}>
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                style={{ 
                  background: rejectionMessage.trim() ? '#dc2626' : '#94a3b8', 
                  borderColor: rejectionMessage.trim() ? '#b91c1c' : '#94a3b8',
                  fontWeight: 700,
                  cursor: rejectionMessage.trim() ? 'pointer' : 'not-allowed'
                }}
                disabled={!rejectionMessage.trim()}
                onClick={() => {
                  if (!rejectionMessage.trim()) return;
                  if (onReviewPhoto) onReviewPhoto(rejectingPhoto.projectId, rejectingPhoto.id, 'Rejected', rejectionMessage.trim());
                  setRejectingPhoto(null);
                  setRejectionMessage('');
                }}
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Reject Task Evidence with Feedback Remark */}
      {rejectingTask && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '20px' }}>
          <div className="glass-card" style={{ padding: '24px', width: '100%', maxWidth: '480px', background: '#ffffff', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid #fee2e2', paddingBottom: '10px' }}>
              <h3 style={{ fontSize: '1.1rem', color: '#dc2626', margin: 0, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={18} color="#dc2626" /> Reject Site Task Evidence
              </h3>
              <button 
                type="button" 
                onClick={() => setRejectingTask(null)}
                style={{ border: 'none', background: '#f8fafc', borderRadius: '6px', width: '28px', height: '28px', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem' }}>
              <div style={{ color: '#64748b' }}>Project: <strong style={{ color: '#0f172a' }}>{rejectingTask.projectName}</strong></div>
              <div style={{ color: '#64748b', marginTop: '4px' }}>Task: <strong style={{ color: '#2563eb' }}>{rejectingTask.taskName}</strong></div>

              {/* Direct Call to Site Engineer */}
              <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <span style={{ color: '#64748b', fontSize: '0.78rem' }}>Site Engineer: </span>
                  <strong style={{ color: '#0f172a', fontSize: '0.82rem' }}>{rejectingTask.engineerName || 'Site Engineer'}</strong>
                </div>
                {rejectingTask.engineerPhone && (
                  <a 
                    href={`tel:${rejectingTask.engineerPhone}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      background: '#059669',
                      color: '#ffffff',
                      textDecoration: 'none',
                      padding: '5px 12px',
                      borderRadius: '6px',
                      fontSize: '0.78rem',
                      fontWeight: 700
                    }}
                    title="Direct call to Site Engineer"
                  >
                    <Phone size={13} /> Direct Call ({rejectingTask.engineerPhone})
                  </a>
                )}
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '18px' }}>
              <label className="form-label" style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.85rem' }}>
                Reason / Feedback for Site Engineer <span style={{ color: '#dc2626' }}>* (Required)</span>
              </label>
              <textarea 
                className="form-control" 
                rows="3" 
                placeholder="Enter rejection reason / feedback for engineer (Required)..."
                value={taskRejectRemark}
                onChange={e => setTaskRejectRemark(e.target.value)}
                style={{ resize: 'none', fontSize: '0.85rem' }}
                required
              />
              {!taskRejectRemark.trim() && (
                <div style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: '4px' }}>
                  * A rejection reason is required before rejecting this request.
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setRejectingTask(null)}>
                Cancel
              </button>
              <button 
                className="btn btn-primary btn-sm" 
                style={{ 
                  background: taskRejectRemark.trim() ? '#dc2626' : '#94a3b8', 
                  borderColor: taskRejectRemark.trim() ? '#b91c1c' : '#94a3b8', 
                  fontWeight: 700,
                  cursor: taskRejectRemark.trim() ? 'pointer' : 'not-allowed'
                }}
                disabled={!taskRejectRemark.trim()}
                onClick={() => {
                  if (!taskRejectRemark.trim()) return;
                  if (onRejectTask) {
                    onRejectTask(rejectingTask.taskId, taskRejectRemark.trim());
                  }
                  setRejectingTask(null);
                  setTaskRejectRemark('');
                }}
              >
                Send Rejection Remark
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Paying Expense Modal */}
      {payingExpense && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
          <div style={{ background: '#ffffff', width: '100%', maxWidth: '480px', borderRadius: '12px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ padding: '18px 22px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#0f172a', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CreditCard size={18} color="#059669" /> Release Payment to Site Wallet
                </h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.76rem', color: '#64748b' }}>
                  Confirm fund disbursement to {payingExpense.engineerName}'s wallet.
                </p>
              </div>
              <button 
                type="button" 
                onClick={() => setPayingExpense(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ padding: '12px 14px', background: '#ecfdf5', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
                <div style={{ fontSize: '0.76rem', color: '#047857', fontWeight: 700, textTransform: 'uppercase' }}>Amount to Credit</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#065f46', marginTop: '2px' }}>
                  ₹{Number(payingExpense.amount).toLocaleString('en-IN')}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#047857', marginTop: '4px' }}>
                  Claim: <strong>{payingExpense.title}</strong> ({payingExpense.category})
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                  Payment Mode *
                </label>
                <select
                  value={paymentMode}
                  onChange={e => setPaymentMode(e.target.value)}
                  className="input-field"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', background: '#ffffff' }}
                >
                  <option value="Cash in Hand">Cash in Hand</option>
                  <option value="Company Cheque">Company Cheque</option>
                  <option value="UPI / Bank Transfer">UPI / Bank Transfer</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                  Payment Reference / Note (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Google Pay UTR: 4892749284"
                  value={paymentNote}
                  onChange={e => setPaymentNote(e.target.value)}
                  className="input-field"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setPayingExpense(null)}
                  style={{ flex: 1, padding: '10px' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={async () => {
                    if (onPayExpense) {
                      await onPayExpense(payingExpense.id, { paymentMode, paymentNote });
                    }
                    setPayingExpense(null);
                  }}
                  style={{ flex: 1, padding: '10px', background: '#059669', borderColor: '#047857', fontWeight: 700 }}
                >
                  Confirm & Release Funds
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Advance Cash Modal */}
      {showAdvanceModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
          <div style={{ background: '#ffffff', width: '100%', maxWidth: '520px', borderRadius: '12px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ padding: '18px 22px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#0f172a', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Send size={18} color="#059669" /> Send Advance Cash to Site Wallet
                </h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.76rem', color: '#64748b' }}>
                  Disburse advance petty cash directly to a Site Engineer's wallet.
                </p>
              </div>
              <button 
                type="button" 
                onClick={() => setShowAdvanceModal(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const totalRupees = getBudgetInRupees(advanceData.amountVal, advanceData.amountUnit);
                if (!advanceData.engineerEmail || totalRupees <= 0) {
                  alert('Please enter a valid engineer email and amount.');
                  return;
                }
                if (onSendWalletAdvance) {
                  await onSendWalletAdvance({
                    projectId: advanceData.projectId,
                    projectName: advanceData.projectName,
                    engineerEmail: advanceData.engineerEmail,
                    engineerName: advanceData.engineerName,
                    amount: totalRupees,
                    paymentMode: advanceData.paymentMode,
                    notes: advanceData.notes
                  });
                }
                setShowAdvanceModal(false);
              }}
              style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}
            >
              {/* 1. Project Selection (Auto-populates Handler Engineer Email) */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                  Select Project (Auto-fills Site Engineer Email)
                </label>
                <select
                  value={advanceData.projectId}
                  onChange={e => {
                    const pId = e.target.value;
                    const selectedP = projects.find(p => String(p.id) === String(pId));
                    if (selectedP) {
                      // 1. Direct email stored on project
                      let email = selectedP.engineerEmail || selectedP.acceptedByEmail || '';
                      if (!email && selectedP.engineerInCharge && selectedP.engineerInCharge.includes('@')) {
                        email = selectedP.engineerInCharge;
                      }
                      // 2. Try match from registered engineers
                      const matchedEng = engineers.find(eng => 
                        (selectedP.acceptedByEmail && eng.email?.toLowerCase() === selectedP.acceptedByEmail.toLowerCase()) ||
                        (selectedP.engineerEmail && eng.email?.toLowerCase() === selectedP.engineerEmail.toLowerCase()) ||
                        (selectedP.acceptedBy && eng.name?.toLowerCase() === selectedP.acceptedBy.toLowerCase()) ||
                        (selectedP.engineerInCharge && (eng.name?.toLowerCase() === selectedP.engineerInCharge.toLowerCase() || eng.email?.toLowerCase() === selectedP.engineerInCharge.toLowerCase()))
                      );
                      if (!email && matchedEng) {
                        email = matchedEng.email;
                      }
                      // 3. Fallback: if project still has no email, check if there's any registered engineer
                      if (!email && engineers.length > 0) {
                        email = engineers[0].email;
                      }

                      const hName = matchedEng?.name || selectedP.acceptedBy || selectedP.engineerInCharge || 'Site Engineer';
                      setAdvanceData(prev => ({
                        ...prev,
                        projectId: selectedP.id,
                        projectName: selectedP.name,
                        engineerEmail: email,
                        engineerName: hName
                      }));
                    } else {
                      setAdvanceData(prev => ({ ...prev, projectId: '', projectName: '' }));
                    }
                  }}
                  className="input-field"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', background: '#ffffff' }}
                >
                  <option value="">-- Choose Project to Auto-fill Handler --</option>
                  {projects.map(p => {
                    const engDisplay = p.acceptedByEmail || p.engineerEmail || p.acceptedBy || p.engineerInCharge || 'Site Engineer';
                    return (
                      <option key={p.id} value={p.id}>
                        Project #{p.id} - {p.name} ({engDisplay})
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* 2. Site Engineer Email */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                  Site Engineer Email *
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. engineer@gmail.com"
                  value={advanceData.engineerEmail}
                  onChange={e => setAdvanceData(prev => ({ ...prev, engineerEmail: e.target.value, engineerName: e.target.value }))}
                  className="input-field"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                />
              </div>

              {/* 3. Advance Cash Amount with Scale: Cr, Lakh, Thousand, Hundred, Rupees */}
              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
                  Advance Cash Amount & Currency Scale *
                </label>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px' }}>
                  <div>
                    <span style={{ fontSize: '0.73rem', color: '#64748b', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                      Amount Value
                    </span>
                    <input
                      type="number"
                      step="any"
                      min="0.01"
                      required
                      placeholder="e.g. 10 or 25"
                      value={advanceData.amountVal}
                      onChange={e => setAdvanceData(prev => ({ ...prev, amountVal: e.target.value }))}
                      className="input-field"
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', fontWeight: 700 }}
                    />
                  </div>

                  <div>
                    <span style={{ fontSize: '0.73rem', color: '#64748b', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                      Unit (Scale)
                    </span>
                    <select
                      value={advanceData.amountUnit}
                      onChange={e => setAdvanceData(prev => ({ ...prev, amountUnit: e.target.value }))}
                      className="input-field"
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', fontWeight: 600, background: '#ffffff' }}
                    >
                      <option value="Thousand">Thousand (K)</option>
                      <option value="Hundred">Hundred</option>
                      <option value="Rupees">Rupees (₹)</option>
                      <option value="Lakh">Lakh (L)</option>
                      <option value="Cr">Crore (Cr)</option>
                    </select>
                  </div>
                </div>

                {/* Live Formatted Total in ₹ */}
                <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px dashed #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Total Cash to Disburse:</span>
                  <span style={{ fontSize: '1.05rem', fontWeight: 900, color: '#059669' }}>
                    ₹{getBudgetInRupees(advanceData.amountVal, advanceData.amountUnit).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* 4. Disbursement Mode */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                  Disbursement Mode
                </label>
                <select
                  value={advanceData.paymentMode}
                  onChange={e => setAdvanceData(prev => ({ ...prev, paymentMode: e.target.value }))}
                  className="input-field"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', background: '#ffffff' }}
                >
                  <option value="Cash in Hand">Cash in Hand</option>
                  <option value="UPI / Bank Transfer">UPI / Bank Transfer</option>
                  <option value="Company Cheque">Company Cheque</option>
                </select>
              </div>

              {/* 5. Transfer Note */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                  Transfer Note
                </label>
                <select
                  value={advanceData.notes}
                  onChange={e => setAdvanceData(prev => ({ ...prev, notes: e.target.value }))}
                  className="input-field"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', background: '#ffffff' }}
                >
                  <option value="Site petty cash advance">Site Petty Cash Advance</option>
                  <option value="Emergency material purchase advance">Emergency Material Purchase</option>
                  <option value="Labour / Worker weekly wage advance">Labour / Worker Wages</option>
                  <option value="Machinery fuel & diesel expense">Machinery Fuel & Diesel</option>
                  <option value="Local transport & delivery charges">Local Transport & Delivery</option>
                  <option value="Site contingency fund">Site Contingency Fund</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAdvanceModal(false)}
                  style={{ flex: 1, padding: '10px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1, padding: '10px', background: '#059669', borderColor: '#047857', fontWeight: 700 }}
                >
                  Disburse to Wallet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

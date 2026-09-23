import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import AdminDashboard from './components/AdminDashboard';
import SiteEngineerDashboard from './components/SiteEngineerDashboard';
import AuthPage from './components/AuthPage';
import HomePage from './components/HomePage';
import { CheckCircle, AlertCircle, Info } from 'react-feather';
import { categoryTaskTemplates } from './utils/taskTemplates';

// Ensure local storage is completely cleared and never used
try {
  localStorage.clear();
} catch (e) { }

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  // Pure tab session (sessionStorage only, NO localStorage)
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const sessionSaved = sessionStorage.getItem('erp_user');
      if (sessionSaved) return JSON.parse(sessionSaved);
      return null;
    } catch (e) {
      sessionStorage.removeItem('erp_user');
      return null;
    }
  });

  // Helper to read initial project ID from URL query or session
  const getInitialProjectId = () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const urlProj = urlParams.get('project') || urlParams.get('projectId');
      if (urlProj) return urlProj;
      return sessionStorage.getItem('erp_active_project') || '';
    } catch (e) {
      return '';
    }
  };

  const [projects, setProjects] = useState([]);
  const [currentProjectId, setCurrentProjectIdState] = useState(getInitialProjectId);

  // Persistent setter that updates both URL search params and tab session
  const setCurrentProjectId = (newId) => {
    setCurrentProjectIdState(newId);
    try {
      if (newId) {
        sessionStorage.setItem('erp_active_project', newId);
        const url = new URL(window.location.href);
        url.searchParams.set('project', newId);
        window.history.replaceState({}, '', url.toString());
      } else {
        sessionStorage.removeItem('erp_active_project');
        const url = new URL(window.location.href);
        url.searchParams.delete('project');
        window.history.replaceState({}, '', url.toString());
      }
    } catch (e) { }
  };

  const [materials, setMaterials] = useState([]);
  const [materialRequests, setMaterialRequests] = useState([]);
  const [dprs, setDprs] = useState([]);
  const [engineers, setEngineers] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [toast, setToast] = useState(null);
  const [hasSeenPendingProjects, setHasSeenPendingProjects] = useState(false);

  useEffect(() => {
    if (location.pathname.includes('/projects')) {
      setHasSeenPendingProjects(true);
    }
  }, [location.pathname]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch initial data from backend API
  const fetchData = async () => {
    try {
      const [projRes, matRes, matReqRes, dprRes, engRes, workerRes] = await Promise.all([
        fetch('/api/projects').then(r => r.json()).catch(() => ({ success: false })),
        fetch('/api/materials').then(r => r.json()).catch(() => ({ success: false })),
        fetch('/api/materials/requests').then(r => r.json()).catch(() => ({ success: false })),
        fetch('/api/reports/dpr').then(r => r.json()).catch(() => ({ success: false })),
        fetch('/api/auth/engineers').then(r => r.json()).catch(() => ({ success: false })),
        fetch('/api/workers').then(r => r.json()).catch(() => ({ success: false }))
      ]);

      if (projRes.success && Array.isArray(projRes.projects)) {
        setProjects(projRes.projects);
        const serverTasks = projRes.projects.flatMap(p => p.tasks || []);
        setTasks(serverTasks);
        if (projRes.projects.length > 0) {
          setCurrentProjectIdState(prev => {
            const urlParams = new URLSearchParams(window.location.search);
            const urlProj = urlParams.get('project') || urlParams.get('projectId');
            const savedProj = urlProj || sessionStorage.getItem('erp_active_project') || prev;

            if (savedProj === 'ALL') return 'ALL';
            if (savedProj && projRes.projects.some(p => p.id === savedProj)) {
              return savedProj;
            }
            return projRes.projects[0].id;
          });
        } else {
          setCurrentProjectIdState('');
        }
      }
      if (matRes.success && Array.isArray(matRes.materials)) setMaterials(matRes.materials);
      if (matReqRes.success && Array.isArray(matReqRes.requests)) setMaterialRequests(matReqRes.requests);
      if (dprRes.success && Array.isArray(dprRes.dprs)) setDprs(dprRes.dprs);
      if (engRes.success && Array.isArray(engRes.engineers)) setEngineers(engRes.engineers);
      if (workerRes.success && Array.isArray(workerRes.workers)) setWorkers(workerRes.workers);
    } catch (err) {
      console.error('Failed to connect to backend API:', err);
    }
  };

  useEffect(() => {
    fetchData();

    // Check if current cached user still exists in backend / MongoDB
    if (currentUser) {
      fetch('/api/auth/users')
        .then(r => r.json())
        .then(data => {
          if (data.success && Array.isArray(data.users)) {
            const userExists = data.users.some(
              u => u.email.toLowerCase() === (currentUser.email || '').toLowerCase()
            );
            if (!userExists) {
              // User has been removed from database, clear stale browser session
              sessionStorage.removeItem('erp_user');
              sessionStorage.removeItem('erp_token');
              localStorage.removeItem('erp_user');
              localStorage.removeItem('erp_token');
              setCurrentUser(null);
              navigate('/login', { replace: true });
            }
          }
        })
        .catch(() => { });
    }
  }, []);

  const handleLoginSuccess = (user, token) => {
    const validUser = {
      ...user,
      role: user.role || (user.email === 'admin@gmail.com' || user.email === 'admin@erp.com' ? 'admin' : 'site_engineer')
    };
    setCurrentUser(validUser);

    // Store strictly in tab sessionStorage (NO localStorage)
    sessionStorage.setItem('erp_user', JSON.stringify(validUser));
    if (token) sessionStorage.setItem('erp_token', token);
    try { localStorage.clear(); } catch (e) { }

    showToast(`Welcome back, ${validUser.name}!`);

    const targetPath = validUser.role === 'admin' ? '/admin/dashboard' : '/site/dashboard';
    navigate(targetPath);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    sessionStorage.removeItem('erp_user');
    sessionStorage.removeItem('erp_token');
    try { localStorage.clear(); } catch (e) { }
    showToast('Logged out successfully', 'info');
    navigate('/login', { replace: true });
  };

  const isAdmin = currentUser && (currentUser.role === 'admin' || currentUser.email === 'admin@gmail.com' || currentUser.email === 'admin@erp.com');
  const safeProjects = Array.isArray(projects) ? projects : [];

  // Helper function to check if a project belongs to a site engineer
  const doesProjectBelongToEngineer = (p, user) => {
    if (!user) return false;
    const userName = (user.name || '').trim().toLowerCase();
    const userEmail = (user.email || '').trim().toLowerCase();
    const acceptedByName = (p.acceptedBy || '').trim().toLowerCase();
    const acceptedByEmail = (p.acceptedByEmail || '').trim().toLowerCase();
    const engineerName = (p.engineerInCharge || '').trim().toLowerCase();

    // 1. If project is already accepted by this engineer
    if ((acceptedByName && acceptedByName === userName) || (acceptedByEmail && acceptedByEmail === userEmail)) {
      return true;
    }
    // 2. If project was assigned to this engineer by Admin and is in-progress
    if (p.status !== 'Pending Acceptance' && (engineerName === userName || engineerName === userEmail)) {
      return true;
    }
    return false;
  };

  // Helper function to check if a pending project is available for a site engineer to accept
  const isPendingProjectAvailableForEngineer = (p, user) => {
    if (!user || p.status !== 'Pending Acceptance') return false;
    const userName = (user.name || '').trim().toLowerCase();
    const userEmail = (user.email || '').trim().toLowerCase();
    const engineerName = (p.engineerInCharge || '').trim().toLowerCase();

    // Assigned specifically to this engineer
    if (engineerName === userName || engineerName === userEmail) {
      return true;
    }
    // Open for any engineer to accept (unassigned)
    if (!engineerName || engineerName === 'unassigned' || engineerName === 'open for all') {
      return true;
    }
    return false;
  };

  // For Site Engineer: only pass their own projects + pending projects they can accept
  const engineerVisibleProjects = isAdmin
    ? safeProjects
    : safeProjects.filter(p => doesProjectBelongToEngineer(p, currentUser) || isPendingProjectAvailableForEngineer(p, currentUser));

  const engineerAcceptedProjects = isAdmin
    ? safeProjects.filter(p => p.status !== 'Pending Acceptance' && p.status !== 'Rejected')
    : safeProjects.filter(p => doesProjectBelongToEngineer(p, currentUser) && p.status !== 'Pending Acceptance' && p.status !== 'Rejected');

  const currentProject = isAdmin
    ? (safeProjects.find(p => p.id === currentProjectId) || safeProjects[0] || null)
    : (engineerAcceptedProjects.find(p => p.id === currentProjectId) || engineerAcceptedProjects[0] || null);

  // Synchronize currentProjectId when switching user or when projects change
  useEffect(() => {
    if (!currentUser) return;
    if (!isAdmin) {
      if (engineerAcceptedProjects.length > 0) {
        if (!engineerAcceptedProjects.some(p => p.id === currentProjectId)) {
          setCurrentProjectId(engineerAcceptedProjects[0].id);
        }
      } else {
        if (currentProjectId !== '') {
          setCurrentProjectId('');
        }
      }
    }
  }, [isAdmin, currentUser, safeProjects]);

  // API Handlers
  const handleApproveMaterialReq = async (id) => {
    try {
      const res = await fetch(`/api/materials/requests/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved' })
      }).then(r => r.json());
      if (res.success) {
        showToast('Material order approved & stock updated!');
        fetchData();
      }
    } catch (e) {
      showToast('Error updating request', 'error');
    }
  };

  const handleRejectMaterialReq = async (id) => {
    try {
      const res = await fetch(`/api/materials/requests/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejected' })
      }).then(r => r.json());
      if (res.success) {
        showToast('Material request rejected', 'info');
        fetchData();
      }
    } catch (e) {
      showToast('Error rejecting request', 'error');
    }
  };

  const handleUpdateStock = async (id, delta) => {
    try {
      const res = await fetch(`/api/materials/${id}/stock`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delta })
      }).then(r => r.json());
      if (res.success) {
        showToast(`Stock updated by ${delta > 0 ? '+' : ''}${delta}`);
        fetchData();
      }
    } catch (e) {
      showToast('Error updating stock', 'error');
    }
  };

  const handleAddNewMaterial = async (newMaterialData) => {
    try {
      const res = await fetch('/api/materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMaterialData)
      }).then(r => r.json());
      if (res.success) {
        showToast(res.message || 'Material added to stock inventory!');
        fetchData();
        return true;
      } else {
        showToast(res.message || 'Failed to add material', 'error');
        return false;
      }
    } catch (e) {
      showToast('Error saving material', 'error');
      return false;
    }
  };

  const handleAddProject = async (newProj) => {
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProj)
      }).then(r => r.json());
      if (res.success) {
        showToast(`New project "${res.project.name}" created!`);
        setHasSeenPendingProjects(false);
        if (res.project?.id) {
          setCurrentProjectId(res.project.id);
        }
        fetchData();

        // Auto-generate Category Specific Construction Tasks
        const projType = res.project.type || newProj.type || 'Building';
        const templates = categoryTaskTemplates[projType] || categoryTaskTemplates['Building'];
        const autoTasks = templates.map((tName, i) => ({
          id: `t_${res.project.id}_${i + 1}`,
          name: tName,
          project: res.project.name,
          projectId: res.project.id,
          dueDate: `Stage ${i + 1}`,
          status: 'Pending',
          photo: '',
          photos: [],
          adminRemark: ''
        }));
        setTasks(prev => [...autoTasks, ...prev]);
      }
    } catch (e) {
      showToast('Error creating project', 'error');
    }
  };

  const handleUpdateProject = async (id, updatedData) => {
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      }).then(r => r.json());
      if (res.success) {
        fetchData();
      }
    } catch (e) {
      console.error('Error updating project', e);
    }
  };

  const handleDeleteProject = async (id) => {
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: 'DELETE'
      }).then(r => r.json());
      if (res.success) {
        showToast('Project deleted successfully!');
        fetchData();
      }
    } catch (e) {
      showToast('Error deleting project', 'error');
    }
  };

  const handleSubmitDpr = async (dprData) => {
    try {
      const res = await fetch('/api/reports/dpr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dprData)
      }).then(r => r.json());
      if (res.success) {
        showToast('Daily Progress Report (DPR) submitted to Admin successfully!');
        fetchData();
      } else {
        showToast(res.message || 'Error submitting DPR', 'error');
      }
    } catch (e) {
      showToast('Error submitting DPR', 'error');
    }
  };

  const handleAcceptProjectStatus = async (projectId, status, engineerName) => {
    try {
      const assignedEngineer = engineerName || currentUser?.name || 'Site Engineer';
      const res = await fetch(`/api/projects/${projectId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          acceptedBy: assignedEngineer,
          engineerName: assignedEngineer,
          engineerEmail: currentUser?.email || '',
          engineerPhone: currentUser?.phone || ''
        })
      }).then(r => r.json());
      if (res.success) {
        showToast(`Project accepted by ${assignedEngineer}! Status: ${status}`);
        if (status === 'In-Progress') {
          setCurrentProjectId(projectId);
        }
        fetchData();
      }
    } catch (e) {
      showToast('Error updating project status', 'error');
    }
  };

  // Purely server-synced tasks (NO localStorage)
  const [tasks, setTasks] = useState([]);

  // Workers Handlers (Synced to MongoDB via /api/workers)
  const handleAddWorker = async (workerData) => {
    try {
      const res = await fetch('/api/workers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workerData)
      }).then(r => r.json());
      if (res.success) {
        showToast(`Worker ${res.worker.name} added successfully!`);
        if (Array.isArray(res.workers)) setWorkers(res.workers);
        fetchData();
        return true;
      } else {
        showToast(res.message || 'Error adding worker', 'error');
        return false;
      }
    } catch (e) {
      showToast('Error adding worker', 'error');
      return false;
    }
  };

  const handleToggleWorkerAttendance = async (workerId) => {
    try {
      const target = workers.find(w => w.id === workerId);
      if (!target) return;
      const newStatus = target.status === 'Present' ? 'Absent' : 'Present';
      const res = await fetch(`/api/workers/${workerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      }).then(r => r.json());
      if (res.success && Array.isArray(res.workers)) {
        setWorkers(res.workers);
      } else {
        setWorkers(prev => prev.map(w => w.id === workerId ? { ...w, status: newStatus } : w));
      }
    } catch (e) {
      showToast('Error updating worker status', 'error');
    }
  };

  const handleDeleteWorker = async (workerId) => {
    try {
      const res = await fetch(`/api/workers/${workerId}`, {
        method: 'DELETE'
      }).then(r => r.json());
      if (res.success) {
        showToast('Worker deleted successfully');
        if (Array.isArray(res.workers)) setWorkers(res.workers);
        else setWorkers(prev => prev.filter(w => w.id !== workerId));
      }
    } catch (e) {
      showToast('Error deleting worker', 'error');
    }
  };

  // Synchronize tasks strictly from projects loaded from MongoDB
  useEffect(() => {
    if (!safeProjects || safeProjects.length === 0) {
      setTasks([]);
      return;
    }

    const serverTasks = safeProjects.flatMap(p => p.tasks || []);
    if (serverTasks.length > 0) {
      setTasks(serverTasks);
    }
  }, [safeProjects]);

  const handleStartTask = async (taskId) => {
    const targetTask = tasks.find(t => t.id === taskId);
    const targetProj = safeProjects.find(p => p.id === targetTask?.projectId || p.name === targetTask?.project);

    setTasks(prev => prev.map(t => {
      if (t.id === taskId && (t.status === 'Pending' || t.status === 'Rejected')) {
        return { ...t, status: 'In-Progress', adminRemark: t.adminRemark || '' };
      }
      return t;
    }));
    showToast('Task started! Upload photo evidence when complete.');

    if (targetProj) {
      try {
        await fetch(`/api/projects/${targetProj.id}/tasks/${taskId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'In-Progress' })
        });
        fetchData();
      } catch (e) { }
    }
  };

  const handleAddTask = (newTask) => {
    setTasks([newTask, ...tasks]);
    showToast(`New task "${newTask.name}" created!`);
  };

  const handleSubmitTaskForApproval = async (taskId, photoUrl, photosArray, consumptionData = {}) => {
    const photosList = Array.isArray(photosArray) && photosArray.length > 0
      ? photosArray
      : (photoUrl ? [photoUrl] : []);

    const targetTask = tasks.find(t => t.id === taskId);
    const targetProj = safeProjects.find(p => p.id === targetTask?.projectId || p.name === targetTask?.project)
      || (projects || []).find(p => p.tasks && p.tasks.some(t => t.id === taskId));

    // Optimistically update task with consumption data
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          status: 'Awaiting Approval',
          photo: photosList[0] || t.photo,
          photos: photosList.length > 0 ? photosList : (t.photos || []),
          adminRemark: '',
          materialsUsed: consumptionData.materialsUsed || t.materialsUsed || [],
          materialCost: consumptionData.materialCost !== undefined ? consumptionData.materialCost : (t.materialCost || 0),
          laborCount: consumptionData.laborCount !== undefined ? consumptionData.laborCount : (t.laborCount || 0),
          laborCost: consumptionData.laborCost !== undefined ? consumptionData.laborCost : (t.laborCost || 0),
          laborDetails: consumptionData.laborDetails || t.laborDetails || [],
          selectedWorkerIds: consumptionData.selectedWorkerIds || t.selectedWorkerIds || [],
          totalCost: consumptionData.totalCost !== undefined ? consumptionData.totalCost : (t.totalCost || 0),
          materialsSummary: consumptionData.materialsSummary || t.materialsSummary || ''
        };
      }
      return t;
    }));

    // Optimistically deduct consumed materials from local stock
    if (Array.isArray(consumptionData.materialsUsed) && consumptionData.materialsUsed.length > 0) {
      setMaterials(prev => prev.map(m => {
        const consumed = consumptionData.materialsUsed.find(c =>
          (c.materialId && c.materialId === m.id) ||
          (c.name && c.name.toLowerCase() === m.name.toLowerCase())
        );
        if (consumed && consumed.quantity) {
          return {
            ...m,
            stock: Math.max(0, m.stock - Number(consumed.quantity)),
            lastUpdated: new Date().toISOString().split('T')[0]
          };
        }
        return m;
      }));
    }

    showToast('Task with photo evidence, materials & labor costs submitted for Admin approval!');

    if (targetProj) {
      try {
        await fetch(`/api/projects/${targetProj.id}/tasks/${taskId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'Awaiting Approval',
            photos: photosList,
            photo: photosList[0] || '',
            adminRemark: '',
            materialsUsed: consumptionData.materialsUsed,
            materialCost: consumptionData.materialCost,
            laborCount: consumptionData.laborCount,
            laborCost: consumptionData.laborCost,
            laborDetails: consumptionData.laborDetails,
            selectedWorkerIds: consumptionData.selectedWorkerIds || [],
            totalCost: consumptionData.totalCost,
            materialsSummary: consumptionData.materialsSummary
          })
        });
        fetchData();
      } catch (e) {
        console.error('Error submitting task to server:', e);
      }
    }
  };

  const handleAddMoreTaskPhotos = async (taskId, newPhotosArray) => {
    if (!newPhotosArray || newPhotosArray.length === 0) return;

    const targetTask = tasks.find(t => t.id === taskId);
    const targetProj = safeProjects.find(p => p.id === targetTask?.projectId || p.name === targetTask?.project);

    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const existing = t.photos || (t.photo ? [t.photo] : []);
        const combined = [...existing];
        newPhotosArray.forEach(np => {
          if (np) combined.push(np);
        });
        return {
          ...t,
          photos: combined,
          photo: combined[0] || t.photo,
          status: t.status === 'In-Progress' || t.status === 'Rejected' ? 'Awaiting Approval' : t.status
        };
      }
      return t;
    }));
    showToast(`${newPhotosArray.length} additional photo(s) attached successfully!`);

    if (targetProj) {
      try {
        await fetch(`/api/projects/${targetProj.id}/tasks/${taskId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            newPhotos: newPhotosArray,
            status: targetTask?.status === 'In-Progress' || targetTask?.status === 'Rejected' ? 'Awaiting Approval' : undefined
          })
        });
        fetchData();
      } catch (e) {
        console.error('Error adding more photos:', e);
      }
    }
  };

  const handleApproveTask = async (taskId) => {
    const targetTask = tasks.find(t => t.id === taskId);
    const targetProj = safeProjects.find(p => p.id === targetTask?.projectId || p.name === targetTask?.project);

    const updatedTasks = tasks.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          status: 'Completed',
          adminRemark: 'Approved by Admin'
        };
      }
      return t;
    });
    setTasks(updatedTasks);
    showToast('Task approved by Admin & added to DPR Report!');

    if (targetProj && targetTask) {
      try {
        await fetch(`/api/projects/${targetProj.id}/tasks/${taskId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'Completed',
            adminRemark: 'Approved by Admin'
          })
        });
      } catch (e) { }

      const projTasks = updatedTasks.filter(t => t.project === targetTask.project || t.projectId === targetTask.projectId);
      const completedCount = projTasks.filter(t => t.status === 'Completed').length;
      const progressPercent = projTasks.length > 0 ? Math.round((completedCount / projTasks.length) * 100) : 100;

      handleUpdateProject(targetProj.id, { progress: progressPercent, currentStage: targetTask.name });

      // Automatically compile DPR with dedicated material and labor costs
      const materialsSummaryText = targetTask.materialsSummary ||
        (Array.isArray(targetTask.materialsUsed) && targetTask.materialsUsed.length > 0
          ? targetTask.materialsUsed.map(m => `${m.name}: ${m.quantity} ${m.unit}`).join(', ')
          : 'Standard Construction Materials');

      handleSubmitDpr({
        projectId: targetProj ? targetProj.id : '',
        projectName: targetTask.project,
        engineerName: targetProj.acceptedBy || targetProj.engineerInCharge || 'Site Engineer',
        date: new Date().toISOString().split('T')[0],
        workDone: targetTask.name,
        laborCount: targetTask.laborCount || '20',
        laborCost: targetTask.laborCost || 0,
        materialsUsed: materialsSummaryText,
        materialCost: targetTask.materialCost || 0,
        totalCost: targetTask.totalCost || 0,
        materialsBreakdown: targetTask.materialsUsed || [],
        remarks: `Task Stage Approved: ${targetTask.name}. Operational Cost: ₹${targetTask.totalCost || 0} (Materials: ₹${targetTask.materialCost || 0}, Labor: ₹${targetTask.laborCost || 0})`,
        progress: progressPercent,
        sitePhoto: targetTask.photo || (targetTask.photos && targetTask.photos[0]) || ''
      });
      fetchData();
    }
  };

  const handleRejectTask = async (taskId, remark) => {
    const targetTask = tasks.find(t => t.id === taskId);
    const targetProj = safeProjects.find(p => p.id === targetTask?.projectId || p.name === targetTask?.project);

    setTasks(tasks.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          status: 'Rejected',
          adminRemark: remark || 'Work incomplete, re-work required'
        };
      }
      return t;
    }));
    showToast('Task rejected with remark sent to engineer!', 'error');

    if (targetProj) {
      try {
        await fetch(`/api/projects/${targetProj.id}/tasks/${taskId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'Rejected',
            adminRemark: remark || 'Work incomplete, re-work required'
          })
        });
        fetchData();
      } catch (e) { }
    }
  };

  const handleReviewPhoto = async (projectId, photoId, status, remark) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/photos/${photoId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, remark })
      }).then(r => r.json());
      if (res.success) {
        showToast(`Photo evidence ${status} successfully!`, status === 'Rejected' ? 'error' : 'success');
        fetchData();
      }
    } catch (e) {
      showToast('Error reviewing photo', 'error');
    }
  };

  const handleSubmitMaterialRequest = async (matData) => {
    try {
      const res = await fetch('/api/materials/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(matData)
      }).then(r => r.json());
      if (res.success) {
        showToast('Material order indent sent to Admin for approval!');
        fetchData();
      }
    } catch (e) {
      showToast('Error submitting material request', 'error');
    }
  };



  const defaultDashboardPath = isAdmin ? '/admin/dashboard' : '/site/dashboard';

  // Map URL Path to activeTab string
  const getActiveTabFromPath = (path) => {
    if (path.includes('/equipment') || path.includes('/machinery')) return 'equipment';
    if (path.includes('/projects') || path.includes('/photos')) return isAdmin ? 'projects' : 'my_projects';
    if (path.includes('/engineers') || path.includes('/employees')) return 'engineers';
    if (path.includes('/workers')) return 'workers';
    if (path.includes('/materials')) return 'materials';
    if (path.includes('/expenses')) return 'expenses';
    if (path.includes('/reports')) return isAdmin ? 'reports' : 'daily_reports';
    if (path.includes('/tasks')) return 'tasks';
    if (path.includes('/site-progress')) return 'site_progress';
    return 'dashboard';
  };

  const activeTab = getActiveTabFromPath(location.pathname);

  return (
    <Routes>
      {/* Public Landing & Home Page */}
      {['/', '/home'].map(path => (
        <Route
          key={path}
          path={path}
          element={<HomePage currentUser={currentUser} onLoginSuccess={handleLoginSuccess} />}
        />
      ))}

      {/* Authentication Login Routes */}
      {['/login', '/site/login', '/admin/login'].map(path => (
        <Route
          key={path}
          path={path}
          element={<AuthPage onLoginSuccess={handleLoginSuccess} />}
        />
      ))}

      {/* Main ERP Protected Routes */}
      <Route
        path="/*"
        element={
          !currentUser ? (
            <Navigate to="/login" replace />
          ) : (
            <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
              {/* Top Navbar */}
              <Navbar
                currentUser={currentUser}
                projects={isAdmin ? safeProjects : engineerAcceptedProjects}
                currentProjectId={currentProjectId}
                setCurrentProjectId={setCurrentProjectId}
                onLogout={handleLogout}
              />

              {/* Main Body Layout: Left Sidebar + Right Content Area */}
              <div style={{ flex: 1, display: 'flex' }}>
                {/* Left Sidebar Menu */}
                <Sidebar
                  currentUser={currentUser}
                  onLogout={handleLogout}
                  hasPendingProjects={!hasSeenPendingProjects && engineerVisibleProjects.some(p => isPendingProjectAvailableForEngineer(p, currentUser))}
                  workers={workers}
                />

                {/* Right Main Content View */}
                <main style={{ flex: 1, padding: '24px', maxWidth: '1400px' }}>
                  {isAdmin ? (
                    <AdminDashboard
                      activeTab={activeTab}
                      projects={safeProjects}
                      currentProjectId={currentProjectId}
                      currentProject={currentProject}
                      setCurrentProjectId={setCurrentProjectId}
                      materials={materials}
                      materialRequests={materialRequests}
                      engineers={engineers}
                      workers={workers}
                      onAddWorker={handleAddWorker}
                      onToggleWorkerAttendance={handleToggleWorkerAttendance}
                      onDeleteWorker={handleDeleteWorker}
                      dprs={dprs}
                      tasks={tasks}
                      onApproveTask={handleApproveTask}
                      onRejectTask={handleRejectTask}
                      onReviewPhoto={handleReviewPhoto}
                      onApproveMaterialReq={handleApproveMaterialReq}
                      onRejectMaterialReq={handleRejectMaterialReq}
                      onUpdateStock={handleUpdateStock}
                      onAddProject={handleAddProject}
                      onUpdateProject={handleUpdateProject}
                      onDeleteProject={handleDeleteProject}
                    />
                  ) : (
                    <SiteEngineerDashboard
                      currentUser={currentUser}
                      activeTab={activeTab}
                      currentProject={currentProject}
                      currentProjectId={currentProjectId}
                      setCurrentProjectId={setCurrentProjectId}
                      projects={engineerVisibleProjects}
                      materials={materials}
                      materialRequests={materialRequests}
                      workers={workers}
                      onAddWorker={handleAddWorker}
                      onToggleWorkerAttendance={handleToggleWorkerAttendance}
                      onDeleteWorker={handleDeleteWorker}
                      dprs={dprs}
                      tasks={tasks}
                      onStartTask={handleStartTask}
                      onSubmitTaskForApproval={handleSubmitTaskForApproval}
                      onAddMoreTaskPhotos={handleAddMoreTaskPhotos}
                      onAddTask={handleAddTask}
                      onSubmitDpr={handleSubmitDpr}
                      onSubmitMaterialRequest={handleSubmitMaterialRequest}
                      onAcceptProjectStatus={handleAcceptProjectStatus}
                      onUpdateStock={handleUpdateStock}
                      onAddNewMaterial={handleAddNewMaterial}
                    />
                  )}
                </main>
              </div>

              {/* Footer */}
              <footer style={{
                textAlign: 'center',
                padding: '16px',
                borderTop: '1px solid var(--border-color)',
                color: '#64748b',
                fontSize: '0.8rem',
                marginTop: 'auto',
                background: '#ffffff'
              }}>
                BuildMaster Construction ERP &copy; 2026 | Node.js, Express & React Application
              </footer>

              {/* Toast Notification */}
              {toast && (
                <div className="toast-container">
                  <div className="toast">
                    {toast.type === 'error' ? (
                      <AlertCircle size={20} color="#dc2626" />
                    ) : toast.type === 'info' ? (
                      <Info size={20} color="#2563eb" />
                    ) : (
                      <CheckCircle size={20} color="#059669" />
                    )}
                    <span>{toast.message}</span>
                  </div>
                </div>
              )}
            </div>
          )
        }
      />
    </Routes>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import {
  Home, CheckSquare, Users, Package, TrendingUp, Clipboard,
  Send, AlertCircle, Plus, CheckCircle, Clock, Calendar, Phone, FileText, Image, Camera, Bell, MapPin, Eye, Upload, XCircle, AlertTriangle, Briefcase, X, ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
  Trash2, PlusCircle, Check, Edit3, Search, DollarSign, CreditCard
} from 'react-feather';
import { formatCurrency } from '../utils/formatters';
import { CONSTRUCTION_MATERIAL_CATALOG } from '../utils/materialCatalog';
import { CONSTRUCTION_LABOR_CATEGORIES, getCategoryDefaultWage, isWorkerInTrade } from '../utils/laborCategories';

export default function SiteEngineerDashboard({
  currentUser,
  activeTab = 'dashboard',
  currentProject,
  currentProjectId,
  setCurrentProjectId,
  projects = [],
  materials = [],
  materialRequests = [],
  workers = [],
  expenses = [],
  onAddExpense,
  onAddWorker,
  onToggleWorkerAttendance,
  onDeleteWorker,
  dprs = [],
  tasks = [],
  onStartTask,
  onSubmitTaskForApproval,
  onAddMoreTaskPhotos,
  onAddTask,
  onSubmitDpr,
  onSubmitMaterialRequest,
  onAcceptProjectStatus,
  onUpdateStock,
  onAddNewMaterial
}) {
  const userName = (currentUser?.name || '').trim().toLowerCase();
  const userEmail = (currentUser?.email || '').trim().toLowerCase();

  // Filter projects strictly belonging to THIS site engineer
  const isProjectForMe = (p) => {
    if (!p) return false;
    const acceptedByName = (p.acceptedBy || '').trim().toLowerCase();
    const acceptedByEmail = (p.acceptedByEmail || '').trim().toLowerCase();
    const engInCharge = (p.engineerInCharge || '').trim().toLowerCase();
    return (
      (acceptedByName && acceptedByName === userName) ||
      (acceptedByEmail && acceptedByEmail === userEmail) ||
      (p.status !== 'Pending Acceptance' && (engInCharge === userName || engInCharge === userEmail))
    );
  };

  const myAcceptedProjects = (projects || []).filter(p => isProjectForMe(p) && p.status !== 'Pending Acceptance' && p.status !== 'Rejected');

  // Pending projects available for this engineer to accept (specifically assigned or open unassigned)
  const pendingProjects = (projects || []).filter(p => {
    if (p.status !== 'Pending Acceptance') return false;
    const engInCharge = (p.engineerInCharge || '').trim().toLowerCase();
    return engInCharge === userName || engInCharge === userEmail || !engInCharge || engInCharge === 'unassigned' || engInCharge === 'open for all';
  });

  const selectedProj = myAcceptedProjects.find(p => p.id === currentProjectId);
  const activeProj = selectedProj || (currentProject && isProjectForMe(currentProject) ? currentProject : null) || myAcceptedProjects[0] || null;
  const hasAcceptedProject = Boolean(activeProj && activeProj.id);

  const proj = activeProj || {
    id: '',
    name: pendingProjects.length > 0 ? 'Project Invitation Waiting' : 'No Active Site Project',
    location: pendingProjects.length > 0 ? 'Accept the pending project below' : 'No project assigned yet',
    progress: 0,
    status: pendingProjects.length > 0 ? 'Pending Acceptance' : 'No Assignment',
    currentStage: pendingProjects.length > 0 ? 'Accept project to begin site supervision' : 'Awaiting project assignment from Admin',
    workCompleted: 'None',
    workPending: 'None',
    budget: 0,
    engineerInCharge: currentUser?.name || 'Site Engineer',
    photos: []
  };

  // Filter tasks strictly for the active accepted project of this engineer only
  const projectTasks = hasAcceptedProject && proj && proj.id
    ? (tasks || []).filter(t => t.projectId === proj.id || t.project === proj.name)
    : [];
  const taskList = projectTasks;

  // Modal State for Viewing Detailed Project Specifications
  const [selectedProjectDetails, setSelectedProjectDetails] = useState(null);

  // Tasks Workflow State
  const [newTaskName, setNewTaskName] = useState('');
  const [showAddTask, setShowAddTask] = useState(false);
  const [expandedTasks, setExpandedTasks] = useState({});
  const toggleTaskExpand = (taskId) => {
    setExpandedTasks(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }));
  };
  const [photoUploadTaskId, setPhotoUploadTaskId] = useState(null);
  const [isAddMoreMode, setIsAddMoreMode] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoList, setPhotoList] = useState([]);
  const [viewPhotoUrl, setViewPhotoUrl] = useState(null);
  const [viewPhotoGallery, setViewPhotoGallery] = useState([]);
  const [viewPhotoIndex, setViewPhotoIndex] = useState(0);
  const fileInputRef = useRef(null);

  // Derive full construction materials catalog for quick selection in task evidence modal
  const ALL_CATALOG_MATERIALS = Object.entries(CONSTRUCTION_MATERIAL_CATALOG).flatMap(([catKey, catObj]) =>
    catObj.items.map(item => ({
      name: item.name,
      unit: item.defaultUnit,
      defaultCost: Number(item.defaultCost) || 0,
      categoryKey: catKey,
      categoryLabel: catObj.label
    }))
  );

  const COMMON_MATERIALS = ALL_CATALOG_MATERIALS;

  // Construction Machinery & Heavy Equipment Options for DPR
  const MACHINERY_OPTIONS = [
    'None',
    'JCB 3DX Super Backhoe Loader',
    'Potain Tower Crane',
    'Schwing Stetter Transit Mixer',
    'Hamm 311 Soil Compactor Roller',
    'Tata Prima 2830.K Dumper Truck',
    'Casagrande Hydraulic Piling Rig',
    'Vögele Super 1800 Asphalt Paver',
    'Putzmeister Concrete Boom Pump',
    'Mini Excavator 3-Ton',
    'Hydraulic Mobile Crane (25T)',
    'Crawler Dozer'
  ];

  // Standard construction workforce roles with their default daily wage rates (₹)
  const STANDARD_WORKER_ROLES = [
    { role: 'Mason', defaultWage: '800' },
    { role: 'Helper / General Labor', defaultWage: '450' },
    { role: 'Bar Bender / Steel Fixer', defaultWage: '700' },
    { role: 'Carpenter / Shuttering', defaultWage: '750' },
    { role: 'Plumber', defaultWage: '650' },
    { role: 'Electrician', defaultWage: '650' },
    { role: 'Painter', defaultWage: '600' },
    { role: 'Tiles Mason', defaultWage: '850' },
    { role: 'Welder', defaultWage: '700' },
    { role: 'Machine Operator', defaultWage: '900' }
  ];

  // Task Material & Labor Consumption State for Evidence Submission
  const [taskMaterials, setTaskMaterials] = useState([
    { selectedOption: '', name: '', quantity: '', unit: 'Units', unitRate: '', cost: '' }
  ]);
  const [taskLaborRows, setTaskLaborRows] = useState([
    { role: 'Mason', customRole: '', count: '', dailyWage: '800', cost: '' }
  ]);
  const [selectedWorkerIds, setSelectedWorkerIds] = useState([]);
  const [workerPickerOpen, setWorkerPickerOpen] = useState(false);
  const [pickerCategoryFilter, setPickerCategoryFilter] = useState('all');
  const [pickerSearchQuery, setPickerSearchQuery] = useState('');
  const [taskDrafts, setTaskDrafts] = useState({});

  // Auto-sync active task modal state into taskDrafts so closing modal or switching tabs never loses data
  useEffect(() => {
    if (!photoUploadTaskId) return;
    setTaskDrafts(prev => ({
      ...prev,
      [photoUploadTaskId]: {
        photoList,
        taskMaterials,
        selectedWorkerIds,
        isEditMode,
        isAddMoreMode
      }
    }));
  }, [photoUploadTaskId, photoList, taskMaterials, selectedWorkerIds, isEditMode, isAddMoreMode]);

  const getCategoryWorkerCount = (roleName) => {
    if (!workers || !Array.isArray(workers)) return 0;
    return workers.filter(w => isWorkerInTrade(w.trade, roleName)).length;
  };

  // Open Task Evidence Modal and initialize items
  const openTaskPhotoModal = (taskId, isAddMore = false, isEdit = false) => {
    setPhotoUploadTaskId(taskId);
    if (fileInputRef.current) fileInputRef.current.value = '';

    const targetTask = (tasks || []).find(t => t.id === taskId);
    const existingDraft = taskDrafts[taskId];

    // Priority 1: Restore any active draft the user was working on
    if (existingDraft) {
      setPhotoList(existingDraft.photoList || []);
      setTaskMaterials(existingDraft.taskMaterials && existingDraft.taskMaterials.length > 0 ? existingDraft.taskMaterials : [
        { selectedOption: '', name: '', quantity: '', unit: 'Units', unitRate: '', cost: '' }
      ]);
      const validDraftWorkerIds = (existingDraft.selectedWorkerIds || []).filter(id => {
        const w = (workers || []).find(x => x.id === id);
        return w && w.status !== 'Absent';
      });
      setSelectedWorkerIds(validDraftWorkerIds);
      setIsAddMoreMode(existingDraft.isAddMoreMode !== undefined ? existingDraft.isAddMoreMode : isAddMore);
      setIsEditMode(existingDraft.isEditMode !== undefined ? existingDraft.isEditMode : isEdit);
      return;
    }

    setIsAddMoreMode(isAddMore);
    setIsEditMode(isEdit);

    // Priority 2: If editing or task already has materials / photos / workers:
    if (targetTask && (isEdit || isAddMore || (Array.isArray(targetTask.materialsUsed) && targetTask.materialsUsed.length > 0) || (targetTask.photos && targetTask.photos.length > 0) || (Array.isArray(targetTask.selectedWorkerIds) && targetTask.selectedWorkerIds.length > 0))) {
      // 1. Existing Photos
      const existingPhotos = Array.isArray(targetTask.photos) && targetTask.photos.length > 0
        ? targetTask.photos
        : (targetTask.photo ? [targetTask.photo] : []);
      setPhotoList(existingPhotos);

      // 2. Existing Materials
      if (Array.isArray(targetTask.materialsUsed) && targetTask.materialsUsed.length > 0) {
        setTaskMaterials(targetTask.materialsUsed.map(m => {
          const match = ALL_CATALOG_MATERIALS.find(c => c.name.toLowerCase() === (m.name || '').toLowerCase()) || COMMON_MATERIALS.find(c => c.name.toLowerCase() === (m.name || '').toLowerCase());
          return {
            selectedOption: match ? match.name : '__custom__',
            name: m.name || '',
            quantity: String(m.quantity || ''),
            unit: m.unit || (match ? match.unit : 'Units'),
            unitRate: String(m.unitCost || (match ? match.defaultCost : '')),
            cost: String(m.totalCost || '')
          };
        }));
      } else {
        const firstItem = COMMON_MATERIALS[0];
        setTaskMaterials([{
          selectedOption: firstItem.name,
          name: firstItem.name,
          quantity: '',
          unit: firstItem.unit,
          unitRate: firstItem.defaultCost,
          cost: ''
        }]);
      }

      // 3. Existing Labor (support individual workers selection, strictly excluding Absent workers)
      if (Array.isArray(targetTask.selectedWorkerIds) && targetTask.selectedWorkerIds.length > 0) {
        const validIds = targetTask.selectedWorkerIds.filter(id => {
          const w = (workers || []).find(x => x.id === id);
          return w && w.status !== 'Absent';
        });
        setSelectedWorkerIds(validIds);
      } else if (Array.isArray(targetTask.laborDetails) && targetTask.laborDetails.length > 0) {
        const matched = [];
        targetTask.laborDetails.forEach(l => {
          if (Array.isArray(l.workerNames)) {
            l.workerNames.forEach(wn => {
              const f = (workers || []).find(w => w.name.toLowerCase() === wn.toLowerCase() && w.status !== 'Absent');
              if (f && !matched.includes(f.id)) matched.push(f.id);
            });
          }
        });
        setSelectedWorkerIds(matched.length > 0 ? matched : (workers || []).filter(w => w.status === 'Present').map(w => w.id));
      } else {
        setSelectedWorkerIds([]);
      }
    } else {
      // Clean blank submission
      setPhotoList([]);
      setTaskMaterials([
        {
          selectedOption: '',
          name: '',
          quantity: '',
          unit: 'Units',
          unitRate: '',
          cost: ''
        }
      ]);
      setSelectedWorkerIds([]);
    }
  };

  const handleAddMaterialRow = () => {
    setTaskMaterials(prev => [
      ...prev,
      {
        selectedOption: '',
        name: '',
        quantity: '',
        unit: 'Units',
        unitRate: '',
        cost: ''
      }
    ]);
  };

  const handleRemoveMaterialRow = (idx) => {
    if (taskMaterials.length <= 1) return;
    setTaskMaterials(prev => prev.filter((_, i) => i !== idx));
  };

  const handleMaterialChange = (idx, selectedVal) => {
    if (selectedVal === '__custom__') {
      setTaskMaterials(prev => prev.map((row, i) => {
        if (i === idx) {
          return {
            ...row,
            selectedOption: '__custom__',
            name: '',
            unit: 'Units',
            unitRate: '',
            cost: ''
          };
        }
        return row;
      }));
      return;
    }

    const preset = COMMON_MATERIALS.find(m => m.name === selectedVal);
    if (!preset) return;
    setTaskMaterials(prev => prev.map((row, i) => {
      if (i === idx) {
        const qty = Number(row.quantity) || 0;
        return {
          ...row,
          selectedOption: preset.name,
          name: preset.name,
          unit: preset.unit,
          unitRate: preset.defaultCost,
          cost: qty > 0 ? String(qty * preset.defaultCost) : row.cost
        };
      }
      return row;
    }));
  };

  const handleCustomNameChange = (idx, customName) => {
    setTaskMaterials(prev => prev.map((row, i) => {
      if (i === idx) {
        return { ...row, name: customName };
      }
      return row;
    }));
  };

  const handleQuantityChange = (idx, val) => {
    setTaskMaterials(prev => prev.map((row, i) => {
      if (i === idx) {
        const qty = Number(val);
        const rate = Number(row.unitRate);
        const autoCost = (!isNaN(qty) && qty > 0 && !isNaN(rate) && rate > 0) ? String(qty * rate) : row.cost;
        return { ...row, quantity: val, cost: autoCost };
      }
      return row;
    }));
  };

  const handleUnitChange = (idx, val) => {
    setTaskMaterials(prev => prev.map((row, i) => {
      if (i === idx) {
        return { ...row, unit: val };
      }
      return row;
    }));
  };

  const handleItemCostChange = (idx, val) => {
    setTaskMaterials(prev => prev.map((row, i) => {
      if (i === idx) {
        return { ...row, cost: val };
      }
      return row;
    }));
  };

  // Workforce Multi-Row Handlers for Different Worker Roles & Wage Charges
  const handleAddLaborRow = () => {
    setTaskLaborRows(prev => [
      ...prev,
      { role: 'Helper / General Labor', customRole: '', count: '', dailyWage: '450', cost: '' }
    ]);
  };

  const handleRemoveLaborRow = (idx) => {
    if (taskLaborRows.length <= 1) {
      setTaskLaborRows([{ role: 'Mason', customRole: '', count: '', dailyWage: '800', cost: '' }]);
      return;
    }
    setTaskLaborRows(prev => prev.filter((_, i) => i !== idx));
  };

  const handleLaborRoleChange = (idx, roleVal) => {
    const defaultWage = getCategoryDefaultWage(roleVal);

    setTaskLaborRows(prev => prev.map((row, i) => {
      if (i === idx) {
        const countNum = Number(row.count) || 0;
        const wageNum = Number(defaultWage) || 0;
        return {
          ...row,
          role: roleVal,
          customRole: roleVal === '__custom__' ? '' : row.customRole,
          dailyWage: String(defaultWage),
          cost: countNum > 0 ? String(countNum * wageNum) : ''
        };
      }
      return row;
    }));
  };

  const handleLaborCustomRoleChange = (idx, customVal) => {
    setTaskLaborRows(prev => prev.map((row, i) => {
      if (i === idx) {
        return { ...row, customRole: customVal };
      }
      return row;
    }));
  };

  const handleLaborRowCountChange = (idx, countVal) => {
    setTaskLaborRows(prev => prev.map((row, i) => {
      if (i === idx) {
        const cnt = Number(countVal) || 0;
        const wage = Number(row.dailyWage) || 0;
        return {
          ...row,
          count: countVal,
          cost: cnt > 0 ? String(cnt * wage) : ''
        };
      }
      return row;
    }));
  };

  const handleLaborRowWageChange = (idx, wageVal) => {
    setTaskLaborRows(prev => prev.map((row, i) => {
      if (i === idx) {
        const cnt = Number(row.count) || 0;
        const wage = Number(wageVal) || 0;
        return {
          ...row,
          dailyWage: wageVal,
          cost: cnt > 0 ? String(cnt * wage) : ''
        };
      }
      return row;
    }));
  };

  const handleLaborRowCostChange = (idx, costVal) => {
    setTaskLaborRows(prev => prev.map((row, i) => {
      if (i === idx) {
        return { ...row, cost: costVal };
      }
      return row;
    }));
  };

  const handleAutoFillPresentWorkers = () => {
    const presentWorkers = (workers && Array.isArray(workers)) ? workers.filter(w => w.status === 'Present') : [];
    if (presentWorkers.length === 0) {
      alert('No workers are currently marked as Present in Site Labor.');
      return;
    }
    const map = {};
    presentWorkers.forEach(w => {
      const tradeName = w.trade || 'Helper / General Labor';
      const wage = String(w.dailyWage || getCategoryDefaultWage(tradeName));
      const key = tradeName;
      if (!map[key]) {
        map[key] = { role: tradeName, count: 0, dailyWage: wage };
      }
      map[key].count += 1;
    });

    const newRows = Object.values(map).map(item => ({
      role: item.role,
      customRole: '',
      count: String(item.count),
      dailyWage: item.dailyWage,
      cost: String(item.count * Number(item.dailyWage))
    }));
    setTaskLaborRows(newRows);
  };

  const taskTotalMaterialCost = taskMaterials.reduce((sum, m) => {
    const manualCost = Number(m.cost);
    if (!isNaN(manualCost) && m.cost !== '') {
      return sum + manualCost;
    }
    const qty = Number(m.quantity) || 0;
    const rate = Number(m.unitRate) || 0;
    return sum + (qty * rate);
  }, 0);

  const selectedWorkersList = (workers && Array.isArray(workers))
    ? workers.filter(w => selectedWorkerIds.includes(w.id) && w.status !== 'Absent')
    : [];
  const selectedWorkersLaborCost = selectedWorkersList.reduce((sum, w) => sum + (Number(w.dailyWage) || 0), 0);

  const taskTotalLaborCount = selectedWorkersList.length;
  const taskTotalLaborCost = selectedWorkersLaborCost;
  const taskTotalExpense = taskTotalMaterialCost + taskTotalLaborCost;
  const validMaterialsCount = taskMaterials.filter(m => (m.name && m.name.trim()) && Number(m.quantity) > 0).length;

  // DPR State for Site Engineer
  const [dprSubmitting, setDprSubmitting] = useState(false);
  const [machineryUsed, setMachineryUsed] = useState('None');
  const [machineryCharge, setMachineryCharge] = useState('');

  // Site Wallet & Expenses State
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseSubmitting, setExpenseSubmitting] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    title: '',
    amount: '',
    category: 'Fuel / Diesel',
    date: new Date().toISOString().split('T')[0],
    description: '',
    receiptPhoto: ''
  });

  // Filter expenses belonging to THIS engineer
  const myExpenses = (expenses || []).filter(e => {
    if (!e) return false;
    const eMail = (e.engineerEmail || '').trim().toLowerCase();
    const eName = (e.engineerName || '').trim().toLowerCase();
    return (userEmail && eMail === userEmail) || (userName && eName === userName) || (!e.engineerEmail && !e.engineerName);
  });

  const walletPaidTotal = myExpenses
    .filter(e => e.status === 'Paid')
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  const walletPendingTotal = myExpenses
    .filter(e => e.status === 'Pending')
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  const handleExpenseReceiptUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (uploadEvt) => {
      setExpenseForm(prev => ({ ...prev, receiptPhoto: uploadEvt.target.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitExpenseClaim = async (e) => {
    e.preventDefault();
    if (!expenseForm.title || !expenseForm.amount || Number(expenseForm.amount) <= 0) {
      alert('Please enter a valid expense title and amount.');
      return;
    }
    setExpenseSubmitting(true);
    try {
      if (onAddExpense) {
        await onAddExpense({
          projectId: proj.id || '',
          projectName: proj.name || 'General Site',
          engineerName: proj.acceptedBy || proj.engineerInCharge || currentUser?.name || 'Site Engineer',
          engineerEmail: currentUser?.email || '',
          title: expenseForm.title.trim(),
          category: expenseForm.category,
          amount: Number(expenseForm.amount),
          date: expenseForm.date,
          description: expenseForm.description,
          receiptPhoto: expenseForm.receiptPhoto
        });
      }
      setShowExpenseModal(false);
      setExpenseForm({
        title: '',
        amount: '',
        category: 'Fuel / Diesel',
        date: new Date().toISOString().split('T')[0],
        description: '',
        receiptPhoto: ''
      });
    } finally {
      setExpenseSubmitting(false);
    }
  };

  // Material Order Modal State
  const [showMatModal, setShowMatModal] = useState(false);
  const [matForm, setMatForm] = useState({
    materialName: '',
    quantity: '',
    unit: 'Bags',
    reason: '',
    estimatedCost: ''
  });

  // Daily Material Consumption State for DPR
  const [dailyMaterialItems, setDailyMaterialItems] = useState([]);
  const [selectedMatToAdd, setSelectedMatToAdd] = useState('');
  const [addQty, setAddQty] = useState('');

  const initialMatCategory = 'Structural Steel & Rebars';
  const initialCatItems = CONSTRUCTION_MATERIAL_CATALOG[initialMatCategory]?.items || [];
  const initialMatItem = initialCatItems[0] || { name: 'TMT Steel Bars - 12mm (Fe 550D)', defaultUnit: 'Tons', defaultCost: '57000' };

  const [newMatModalOpen, setNewMatModalOpen] = useState(false);
  const [isCustomMaterial, setIsCustomMaterial] = useState(false);
  const [newMatData, setNewMatData] = useState({
    category: initialMatCategory,
    name: initialMatItem.name,
    customName: '',
    stock: '100',
    unit: initialMatItem.defaultUnit,
    unitCost: initialMatItem.defaultCost,
    minThreshold: '20'
  });

  // Calculated Stats
  const workerList = (workers && Array.isArray(workers)) ? workers : [];
  const presentCount = workerList.filter(w => w.status === 'Present').length;
  const absentCount = workerList.filter(w => w.status === 'Absent').length;
  const totalWorkers = workerList.length;

  const [addWorkerModalOpen, setAddWorkerModalOpen] = useState(false);
  const [newWorkerData, setNewWorkerData] = useState({
    name: '',
    trade: 'Mason',
    phone: '',
    dailyWage: '800'
  });

  // Category Filtering for Site Labor
  const [laborCategoryFilter, setLaborCategoryFilter] = useState(() => {
    try {
      const p = new URLSearchParams(window.location.search);
      return p.get('category') || 'all';
    } catch (e) {
      return 'all';
    }
  });

  // Watch URL changes for category
  useEffect(() => {
    const handleUrlChange = () => {
      try {
        const p = new URLSearchParams(window.location.search);
        setLaborCategoryFilter(p.get('category') || 'all');
      } catch (e) {}
    };
    handleUrlChange();
    window.addEventListener('popstate', handleUrlChange);
    return () => window.removeEventListener('popstate', handleUrlChange);
  }, []);

  const changeLaborCategory = (catId) => {
    setLaborCategoryFilter(catId);
    try {
      const newUrl = catId === 'all' ? '/site/workers' : `/site/workers?category=${encodeURIComponent(catId)}`;
      window.history.pushState({}, '', newUrl);
    } catch (e) {}
  };

  // Batch Worker Modal State (add workers according to category count)
  const [batchWorkerModalOpen, setBatchWorkerModalOpen] = useState(false);
  const [batchWorkerCategory, setBatchWorkerCategory] = useState('Mason');
  const [batchWorkerCount, setBatchWorkerCount] = useState(3);
  const [batchWorkerRows, setBatchWorkerRows] = useState([
    { name: '', phone: '', dailyWage: '800' },
    { name: '', phone: '', dailyWage: '800' },
    { name: '', phone: '', dailyWage: '800' }
  ]);

  const openAddWorkerForCategory = (catId) => {
    const targetCat = (!catId || catId === 'all') 
      ? (laborCategoryFilter && laborCategoryFilter !== 'all' ? laborCategoryFilter : 'Mason') 
      : catId;
    const defaultWage = getCategoryDefaultWage(targetCat);
    setNewWorkerData({
      name: '',
      trade: targetCat,
      phone: '',
      dailyWage: String(defaultWage)
    });
    setAddWorkerModalOpen(true);
  };

  const openBatchAddModal = (catId = 'Mason', count = 3) => {
    const targetCat = (!catId || catId === 'all') 
      ? (laborCategoryFilter && laborCategoryFilter !== 'all' ? laborCategoryFilter : 'Mason') 
      : catId;
    const defaultWage = getCategoryDefaultWage(targetCat);
    setBatchWorkerCategory(targetCat);
    setBatchWorkerCount(count);
    const rows = Array.from({ length: count }, () => ({
      name: '',
      phone: '',
      dailyWage: String(defaultWage)
    }));
    setBatchWorkerRows(rows);
    setBatchWorkerModalOpen(true);
  };

  const handleBatchCategoryChange = (newCat) => {
    setBatchWorkerCategory(newCat);
    const defaultWage = getCategoryDefaultWage(newCat);
    setBatchWorkerRows(prev => prev.map(r => ({ ...r, dailyWage: String(defaultWage) })));
  };

  const handleBatchCountChange = (newVal) => {
    if (newVal === '') {
      setBatchWorkerCount('');
      return;
    }
    const num = parseInt(newVal, 10);
    const cnt = isNaN(num) ? 1 : Math.max(1, Math.min(50, num));
    setBatchWorkerCount(cnt);
    const defaultWage = getCategoryDefaultWage(batchWorkerCategory);
    setBatchWorkerRows(prev => {
      const rows = [...prev];
      if (cnt > rows.length) {
        for (let i = rows.length; i < cnt; i++) {
          rows.push({ name: '', phone: '', dailyWage: String(defaultWage) });
        }
      } else {
        rows.length = cnt;
      }
      return rows;
    });
  };

  const handleBatchRowChange = (index, field, value) => {
    setBatchWorkerRows(prev => prev.map((row, i) => {
      if (i === index) {
        if (field === 'phone') {
          return { ...row, phone: value.replace(/\D/g, '').slice(0, 10) };
        }
        return { ...row, [field]: value };
      }
      return row;
    }));
  };

  const handleSaveBatchWorkers = async (e) => {
    e.preventDefault();
    const count = batchWorkerRows.length;
    if (count === 0) {
      alert('Please specify at least 1 worker');
      return;
    }

    // All workers specified in count are 100% compulsory
    for (let i = 0; i < count; i++) {
      const row = batchWorkerRows[i];
      if (!row.name || !row.name.trim()) {
        alert(`Worker #${i + 1}: Name is required. All ${count} workers must be entered.`);
        return;
      }
      const cleanPhone = (row.phone || '').replace(/\D/g, '');
      if (!cleanPhone || cleanPhone.length !== 10) {
        alert(`Worker #${i + 1} (${row.name.trim()}): 10-digit mobile number is required.`);
        return;
      }
      if (!row.dailyWage || Number(row.dailyWage) <= 0) {
        alert(`Worker #${i + 1} (${row.name.trim()}): Daily wage is required.`);
        return;
      }
    }

    if (onAddWorker) {
      for (const row of batchWorkerRows) {
        const cleanPhone = (row.phone || '').replace(/\D/g, '');
        await onAddWorker({
          name: row.name.trim(),
          trade: batchWorkerCategory,
          phone: cleanPhone,
          dailyWage: Number(row.dailyWage) || getCategoryDefaultWage(batchWorkerCategory),
          projectId: currentProjectId || ''
        });
      }
      setBatchWorkerModalOpen(false);
    }
  };

  const toggleWorkerStatus = (id) => {
    if (onToggleWorkerAttendance) {
      onToggleWorkerAttendance(id);
    }
  };

  const handleSaveWorker = async (e) => {
    e.preventDefault();
    if (!newWorkerData.name || !newWorkerData.name.trim()) {
      alert('Please enter worker full name');
      return;
    }
    const cleanPhone = (newWorkerData.phone || '').replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length !== 10) {
      alert('Please enter a valid 10-digit mobile number (e.g. 9876543210)');
      return;
    }
    if (onAddWorker) {
      const ok = await onAddWorker({
        name: newWorkerData.name.trim(),
        trade: newWorkerData.trade || 'Helper / General Labor',
        phone: cleanPhone,
        dailyWage: Number(newWorkerData.dailyWage) || 500,
        projectId: currentProjectId || ''
      });
      if (ok !== false) {
        setAddWorkerModalOpen(false);
        setNewWorkerData({ name: '', trade: 'Mason', phone: '', dailyWage: '500' });
      }
    }
  };

  // Client-side image compression to optimize camera/gallery photos
  const compressImage = (file, maxWidth = 1200, quality = 0.75) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = () => resolve(e.target.result);
        img.src = e.target.result;
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  };

  const handlePhotoSubmit = (taskId) => {
    if (isAddMoreMode) {
      onAddMoreTaskPhotos && onAddMoreTaskPhotos(taskId, photoList);
      setPhotoUploadTaskId(null);
      setPhotoList([]);
      setIsAddMoreMode(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Filter and format materials used
    const compiledMaterials = taskMaterials
      .filter(m => (m.name && m.name.trim() !== '') && Number(m.quantity) > 0)
      .map(m => {
        const qty = Number(m.quantity) || 0;
        const rate = Number(m.unitRate) || 0;
        const lineCost = (m.cost !== '' && !isNaN(Number(m.cost))) ? Number(m.cost) : (qty * rate);
        return {
          name: m.name.trim(),
          quantity: qty,
          unit: m.unit || 'Units',
          unitCost: rate,
          totalCost: lineCost
        };
      });

    const totalMatCost = compiledMaterials.reduce((sum, item) => sum + item.totalCost, 0);

    // Group selected workers by trade and wage
    const compiledLabor = (() => {
      const map = {};
      selectedWorkersList.forEach(w => {
        const trade = w.trade || 'Helper / General Labor';
        const wage = Number(w.dailyWage) || 500;
        const key = `${trade}_${wage}`;
        if (!map[key]) {
          map[key] = {
            role: trade,
            count: 0,
            dailyWage: wage,
            totalCost: 0,
            workerNames: []
          };
        }
        map[key].count += 1;
        map[key].totalCost += wage;
        map[key].workerNames.push(w.name);
      });
      return Object.values(map);
    })();

    const totalLabCount = selectedWorkersList.length;
    const totalLabCost = selectedWorkersLaborCost;
    const totalExp = totalMatCost + totalLabCost;
    const summaryText = compiledMaterials.length > 0
      ? compiledMaterials.map(m => `${m.name}: ${m.quantity} ${m.unit} (₹${m.totalCost.toLocaleString('en-IN')})`).join(', ')
      : 'No materials consumed';

    const consumptionData = {
      materialsUsed: compiledMaterials,
      materialCost: totalMatCost,
      laborCount: totalLabCount,
      laborCost: totalLabCost,
      laborDetails: compiledLabor,
      selectedWorkerIds: selectedWorkerIds.filter(id => {
        const w = (workers || []).find(x => x.id === id);
        return w && w.status !== 'Absent';
      }),
      totalCost: totalExp,
      materialsSummary: summaryText
    };

    onSubmitTaskForApproval && onSubmitTaskForApproval(taskId, photoList[0] || '', photoList, consumptionData);
    setTaskDrafts(prev => {
      const copy = { ...prev };
      delete copy[taskId];
      return copy;
    });
    setPhotoUploadTaskId(null);
    setPhotoList([]);
    setIsAddMoreMode(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setIsCompressing(true);
      try {
        const compressedList = await Promise.all(files.map(f => compressImage(f)));
        const validList = compressedList.filter(Boolean);
        setPhotoList(prev => [...prev, ...validList]);
      } catch (err) {
        console.error('Error compressing images:', err);
      } finally {
        setIsCompressing(false);
      }
    }
    if (e.target) e.target.value = '';
  };

  const statusConfig = {
    'Pending': { color: '#64748b', bg: '#f1f5f9', icon: <Clock size={14} />, label: 'Pending' },
    'In-Progress': { color: '#d97706', bg: '#fffbeb', icon: <Clock size={14} />, label: 'In-Progress' },
    'Awaiting Approval': { color: '#2563eb', bg: '#eff6ff', icon: <Upload size={14} />, label: 'Awaiting Approval' },
    'Completed': { color: '#059669', bg: '#ecfdf5', icon: <CheckCircle size={14} />, label: 'Completed' },
    'Rejected': { color: '#dc2626', bg: '#fef2f2', icon: <XCircle size={14} />, label: 'Rejected' }
  };

  // Auto-calculated Daily Work Data for DPR
  const currentProjectTasks = tasks.filter(t => t.projectId === proj.id || t.project === proj.name);
  const completedStages = currentProjectTasks.filter(t => t.status === 'Completed');
  const ongoingStages = currentProjectTasks.filter(t => t.status === 'In-Progress' || t.status === 'Awaiting Approval');
  const pendingStages = currentProjectTasks.filter(t => t.status === 'Pending' || t.status === 'Rejected');

  // Today's Work Summary automatically derived from tasks
  const autoWorkDoneSummary = (() => {
    const parts = [];
    if (completedStages.length > 0) {
      parts.push(`Completed: ${completedStages.map(s => s.name).join(' | ')}`);
    }
    if (ongoingStages.length > 0) {
      parts.push(`In-Progress: ${ongoingStages.map(s => s.name).join(' | ')}`);
    }
    if (parts.length === 0) {
      return proj.currentStage || currentProjectTasks[0]?.name || 'Site Work in Progress';
    }
    return parts.join(' • ');
  })();

  // Photos automatically gathered from task evidence
  const autoTaskPhotos = currentProjectTasks.flatMap(t => {
    if (Array.isArray(t.photos) && t.photos.length > 0) return t.photos;
    if (t.photo) return [t.photo];
    return [];
  });
  const allAvailablePhotos = autoTaskPhotos.length > 0 
    ? autoTaskPhotos 
    : (proj.photos?.map(p => p.url) || []);

  const autoWorkersCount = presentCount > 0 ? presentCount : (workerList.length > 0 ? workerList.length : 24);

  // All tasks from current project that have materials / evidence submitted
  const tasksWithEvidence = currentProjectTasks.filter(t => 
    t.status === 'Completed' || t.status === 'Awaiting Approval' || (Array.isArray(t.materialsUsed) && t.materialsUsed.length > 0)
  );

  // Consolidate materials from completed/submitted tasks
  const taskMaterialsConsolidated = (() => {
    const map = {};
    tasksWithEvidence.forEach(t => {
      if (Array.isArray(t.materialsUsed)) {
        t.materialsUsed.forEach(m => {
          if (!m.name || !m.name.trim()) return;
          const key = m.name.toLowerCase().trim();
          if (!map[key]) {
            map[key] = {
              name: m.name.trim(),
              quantity: 0,
              unit: m.unit || 'Units',
              totalCost: 0,
              taskNames: []
            };
          }
          map[key].quantity += (Number(m.quantity) || 0);
          map[key].totalCost += (Number(m.totalCost) || 0);
          if (!map[key].taskNames.includes(t.name)) {
            map[key].taskNames.push(t.name);
          }
        });
      }
    });
    return Object.values(map);
  })();

  const taskLaborConsolidated = (() => {
    const map = {};
    tasksWithEvidence.forEach(t => {
      if (Array.isArray(t.laborDetails)) {
        t.laborDetails.forEach(l => {
          if (!l.role || !l.role.trim()) return;
          const key = `${l.role}_${l.dailyWage}`;
          if (!map[key]) {
            map[key] = {
              role: l.role.trim(),
              count: 0,
              dailyWage: Number(l.dailyWage) || 0,
              totalCost: 0
            };
          }
          map[key].count += (Number(l.count) || 0);
          map[key].totalCost += (Number(l.totalCost) || 0);
        });
      }
    });
    return Object.values(map);
  })();

  const dprAutoMaterialCost = tasksWithEvidence.reduce((sum, t) => sum + (Number(t.materialCost) || 0), 0);
  const dprAutoLaborCost = tasksWithEvidence.reduce((sum, t) => sum + (Number(t.laborCost) || 0), 0);
  const dprAutoLaborCount = tasksWithEvidence.reduce((max, t) => Math.max(max, Number(t.laborCount) || 0), autoWorkersCount);
  const dprAutoMachineryCharge = machineryUsed && machineryUsed !== 'None' ? (Number(machineryCharge) || 0) : 0;
  const dprAutoTotalCost = dprAutoMaterialCost + (dprAutoLaborCost > 0 ? dprAutoLaborCost : (autoWorkersCount * 500)) + dprAutoMachineryCharge;

  const handleAutoSubmitDpr = async () => {
    if (!onSubmitDpr) return;
    setDprSubmitting(true);
    const todayStr = new Date().toISOString().split('T')[0];

    const activeMaterialsUsed = taskMaterialsConsolidated.length > 0
      ? taskMaterialsConsolidated.map(m => `${m.name}: ${m.quantity} ${m.unit} (₹${m.totalCost.toLocaleString('en-IN')})`).join(', ')
      : 'Standard Construction Materials';

    const materialDeductions = taskMaterialsConsolidated
      .map(m => ({ name: m.name, quantity: Number(m.quantity) }));

    const activeMaterialsBreakdown = taskMaterialsConsolidated.map(m => ({
      name: m.name,
      quantity: m.quantity,
      unit: m.unit,
      totalCost: m.totalCost
    }));

    try {
      await onSubmitDpr({
        projectId: proj.id || '',
        projectName: proj.name,
        engineerName: proj.acceptedBy || proj.engineerInCharge || currentUser?.name || 'Site Engineer',
        engineerPhone: proj.clientPhone || proj.contactPhone || '+91 98765 43210',
        date: todayStr,
        workDone: autoWorkDoneSummary,
        laborCount: dprAutoLaborCount,
        laborCost: dprAutoLaborCost > 0 ? dprAutoLaborCost : (autoWorkersCount * 500),
        laborBreakdown: taskLaborConsolidated,
        materialCost: dprAutoMaterialCost,
        machineryUsed: machineryUsed || 'None',
        machineryCharge: dprAutoMachineryCharge,
        totalCost: dprAutoTotalCost,
        materialsUsed: activeMaterialsUsed,
        materialsBreakdown: activeMaterialsBreakdown,
        materialDeductions: materialDeductions,
        remarks: `Daily progress report auto-compiled from completed tasks: ${completedStages.length} of ${currentProjectTasks.length} tasks completed (${proj.progress || 0}%). Total Daily Site Cost: ₹${dprAutoTotalCost.toLocaleString('en-IN')}${dprAutoMachineryCharge > 0 ? ` (Includes Machinery: ${machineryUsed} @ ₹${dprAutoMachineryCharge.toLocaleString('en-IN')})` : ''}`,
        progress: Number(proj.progress || 0),
        sitePhoto: allAvailablePhotos[0] || '',
        photos: allAvailablePhotos
      });
    } finally {
      setDprSubmitting(false);
    }
  };

  const handleAddMaterialToToday = () => {
    if (!selectedMatToAdd || !addQty) return;
    const stockObj = (materials || []).find(m => m.id === selectedMatToAdd || m.name === selectedMatToAdd);
    const commonObj = COMMON_MATERIALS.find(m => m.name === selectedMatToAdd);
    const matName = stockObj ? stockObj.name : (commonObj ? commonObj.name : selectedMatToAdd);
    const matUnit = stockObj ? stockObj.unit : (commonObj ? commonObj.unit : 'Units');

    const existingIdx = dailyMaterialItems.findIndex(m => m.name.toLowerCase() === matName.toLowerCase());
    if (existingIdx >= 0) {
      const updated = [...dailyMaterialItems];
      updated[existingIdx].quantity = String(Number(updated[existingIdx].quantity || 0) + Number(addQty));
      setDailyMaterialItems(updated);
    } else {
      setDailyMaterialItems([
        ...dailyMaterialItems,
        { id: `dm_${Date.now()}`, name: matName, quantity: addQty, unit: matUnit }
      ]);
    }
    setSelectedMatToAdd('');
    setAddQty('');
  };

  const handleCategoryChange = (catKey) => {
    const catObj = CONSTRUCTION_MATERIAL_CATALOG[catKey];
    const first = catObj?.items[0];
    setIsCustomMaterial(false);
    setNewMatData(prev => ({
      ...prev,
      category: catKey,
      name: first ? first.name : '',
      customName: '',
      unit: first ? first.defaultUnit : 'Bags',
      unitCost: first ? first.defaultCost : ''
    }));
  };

  const handleMaterialSelect = (val) => {
    if (val === '__custom__') {
      setIsCustomMaterial(true);
      setNewMatData(prev => ({
        ...prev,
        name: '',
        customName: ''
      }));
    } else {
      setIsCustomMaterial(false);
      const catObj = CONSTRUCTION_MATERIAL_CATALOG[newMatData.category];
      const found = catObj?.items.find(i => i.name === val);
      setNewMatData(prev => ({
        ...prev,
        name: val,
        customName: '',
        unit: found ? found.defaultUnit : prev.unit,
        unitCost: found ? found.defaultCost : prev.unitCost
      }));
    }
  };

  const handleCreateNewMaterial = async (e) => {
    e.preventDefault();
    const finalName = (isCustomMaterial ? newMatData.customName : newMatData.name).trim();
    if (!finalName || !onAddNewMaterial) return;
    const success = await onAddNewMaterial({
      ...newMatData,
      name: finalName
    });
    if (success) {
      setNewMatModalOpen(false);
      setIsCustomMaterial(false);
      setNewMatData({
        category: initialMatCategory,
        name: initialMatItem.name,
        customName: '',
        stock: '100',
        unit: initialMatItem.defaultUnit,
        unitCost: initialMatItem.defaultCost,
        minThreshold: '20'
      });
    }
  };

  const handleMatSubmit = (e) => {
    e.preventDefault();
    onSubmitMaterialRequest({
      projectId: proj.id || '',
      projectName: proj.name,
      requestedBy: proj.engineerInCharge || 'Site Engineer',
      ...matForm
    });
    setShowMatModal(false);
  };

  const isPendingAcceptance = proj.status === 'Pending Acceptance';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Site Header Banner */}
      <div className="glass-card" style={{ padding: '20px 24px', borderLeft: '4px solid #2563eb' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="badge badge-blue">Site Engineer Portal</span>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Supervisor: {proj.engineerInCharge || 'Site Engineer'}</span>
              <span className={`badge ${proj.progress === 100 ? 'badge-emerald' : isPendingAcceptance ? 'badge-amber' : 'badge-blue'}`}>
                {proj.status || 'Ongoing'}
              </span>
            </div>
            <h2 style={{ fontSize: '1.4rem', marginTop: '4px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Briefcase size={22} color="#2563eb" /> {proj.name}
            </h2>
            <p style={{ color: '#475569', fontSize: '0.85rem', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span><MapPin size={14} style={{ display: 'inline', verticalAlign: '-2px' }} /> Location: <strong>{proj.location}</strong></span> |
              <span>Budget: <strong style={{ color: '#059669' }}>{formatCurrency(proj.budget)}</strong></span> |
              <span>Client: <strong>{proj.clientName}</strong></span>
              (<span style={{ color: '#2563eb', fontWeight: 600 }}><Phone size={13} style={{ display: 'inline', verticalAlign: '-2px' }} /> {proj.clientPhone || proj.contactPhone || '+91 98765 43210'}</span>)
            </p>
          </div>
        </div>
      </div>

      {/* PROMINENT INCOMING BOOKINGS ALERT FOR SITE ENGINEER */}
      {pendingProjects.length > 0 && (
        <div style={{ background: '#fffbeb', border: '2px solid #fcd34d', borderLeft: '6px solid #d97706', borderRadius: '12px', padding: '18px 22px', boxShadow: '0 4px 10px rgba(217, 119, 6, 0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '14px', borderBottom: '1px solid #fde68a', paddingBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ background: '#fef3c7', padding: '8px', borderRadius: '50%' }}>
                <Bell size={22} color="#d97706" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', color: '#92400e', margin: 0, fontWeight: 800 }}>
                  Incoming Project Booking / Assignment ({pendingProjects.length} Waiting)
                </h3>
                <p style={{ fontSize: '0.82rem', color: '#b45309', margin: '2px 0 0 0' }}>
                  Admin has assigned you new construction project(s). Click Accept to start site work and unlock construction tasks.
                </p>
              </div>
            </div>
            <span className="badge badge-amber" style={{ fontSize: '0.78rem', padding: '5px 12px', fontWeight: 700 }}>
              Action Required
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {pendingProjects.map(p => (
              <div key={p.id} style={{ background: '#ffffff', borderRadius: '10px', padding: '16px', border: '1px solid #fed7aa', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#0f172a' }}>{p.name}</span>
                    <span className="badge badge-blue">{p.type || 'Building'}</span>
                  </div>
                  <div style={{ fontSize: '0.84rem', color: '#475569', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                    <span><MapPin size={13} style={{ display: 'inline', verticalAlign: '-2px' }} /> Location: <strong>{p.location}</strong></span>
                    <span>Budget: <strong style={{ color: '#059669' }}>{formatCurrency(p.budget)}</strong></span>
                    <span>Client: <strong>{p.clientName}</strong> ({p.clientPhone || p.contactPhone})</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={() => setSelectedProjectDetails(p)}
                    style={{ padding: '8px 14px', fontSize: '0.82rem' }}
                  >
                    <Eye size={14} /> View Details
                  </button>
                  <button
                    className="btn btn-primary"
                    style={{ background: '#059669', borderColor: '#047857', fontWeight: 700, padding: '8px 18px', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    onClick={() => onAcceptProjectStatus && onAcceptProjectStatus(p.id, 'In-Progress', currentUser?.name)}
                  >
                    <CheckCircle size={16} /> Accept Project Booking
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5 Dashboard KPI Cards */}
      {(activeTab === 'dashboard') && (
        <>
        <div className="grid-5" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>

          {/* Card 1: My Projects */}
          <div className="glass-card" style={{ padding: '16px' }}>
            <p style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>My Projects</p>
            <h3 style={{ fontSize: '1.6rem', marginTop: '2px', color: '#0f172a' }}>{myAcceptedProjects.length}</h3>
            <p style={{ fontSize: '0.75rem', color: '#2563eb', marginTop: '2px' }}>Assigned & Active</p>
          </div>

          {/* Card 2: Today's Tasks */}
          <div className="glass-card" style={{ padding: '16px' }}>
            <p style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>Today's Tasks</p>
            <h3 style={{ fontSize: '1.6rem', marginTop: '2px', color: '#0f172a' }}>{hasAcceptedProject ? taskList.length : 0}</h3>
            <p style={{ fontSize: '0.75rem', color: '#d97706', marginTop: '2px' }}>
              {hasAcceptedProject ? taskList.filter(t => t.status !== 'Completed').length : 0} Pending Tasks
            </p>
          </div>

          {/* Card 3: Workers Present */}
          <div className="glass-card" style={{ padding: '16px' }}>
            <p style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>Workers Present</p>
            <h3 style={{ fontSize: '1.6rem', marginTop: '2px', color: '#059669' }}>
              {hasAcceptedProject ? `${presentCount} / ${totalWorkers}` : '0 / 0'}
            </h3>
            <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
              {hasAcceptedProject ? `${absentCount} Absent Today` : 'No Active Site'}
            </p>
          </div>

          {/* Card 4: Site Progress */}
          <div className="glass-card" style={{ padding: '16px' }}>
            <p style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>Site Progress</p>
            <h3 style={{ fontSize: '1.6rem', marginTop: '2px', color: '#d97706' }}>
              {hasAcceptedProject ? `${proj.progress}%` : '0%'}
            </h3>
            <p style={{ fontSize: '0.75rem', color: '#059669', marginTop: '2px' }}>
              {hasAcceptedProject ? (proj.progress === 100 ? 'Completed' : 'In Progress') : 'No Active Site'}
            </p>
          </div>

          {/* Card 5: Material Requests */}
          <div className="glass-card" style={{ padding: '16px' }}>
            <p style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>Material Requests</p>
            <h3 style={{ fontSize: '1.6rem', marginTop: '2px', color: '#0f172a' }}>
              {materialRequests.filter(r => r.status === 'pending').length}
            </h3>
            <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>Pending Indents</p>
          </div>

        </div>

        {/* Ongoing Site Work Card for Site Engineer (Only shown if an active project is accepted) */}
        {hasAcceptedProject ? (
          <div className="glass-card" style={{ padding: '20px 24px', borderLeft: '4px solid #059669', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="badge badge-emerald" style={{ fontWeight: 700, padding: '4px 10px' }}>Ongoing Site Work</span>
                <span style={{ fontSize: '0.82rem', color: '#64748b' }}>Category: <strong>{proj.type || 'Bungalows'}</strong></span>
                {proj.specifications?.bhk && <span style={{ fontSize: '0.82rem', color: '#64748b' }}>• {proj.specifications.bhk}</span>}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#059669', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle size={14} /> Accepted & Signed on Site ({proj.acceptedBy || proj.engineerInCharge || currentUser?.name || 'Site Engineer'})
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', color: '#0f172a', fontWeight: 800, margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Briefcase size={20} color="#059669" /> {proj.name}
                </h3>
                <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MapPin size={13} color="#64748b" /> Location: <strong>{proj.location}</strong>
                </p>
              </div>

              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div>
                  <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Client Details</span>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>{proj.clientName}</div>
                  <div style={{ fontSize: '0.78rem', color: '#2563eb' }}>
                    <Phone size={11} style={{ display: 'inline' }} /> {proj.clientPhone || proj.contactPhone || '+91 98765 43210'}
                  </div>
                </div>

                <div style={{ borderLeft: '1px solid #e2e8f0', paddingLeft: '16px' }}>
                  <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Total Budget</span>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#059669' }}>{formatCurrency(proj.budget)}</div>
                </div>

                <div style={{ borderLeft: '1px solid #e2e8f0', paddingLeft: '16px', minWidth: '170px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b', fontWeight: 600, marginBottom: '4px' }}>
                    <span>SITE PROGRESS</span>
                    <span style={{ color: '#d97706', fontWeight: 800 }}>{proj.progress || 0}%</span>
                  </div>
                  <div className="progress-track" style={{ height: '8px', background: '#fed7aa' }}>
                    <div className="progress-fill" style={{ width: `${proj.progress || 0}%`, background: '#d97706' }}></div>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '4px' }}>
                    Stage: {completedStages.length} of {currentProjectTasks.length} Done
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          !pendingProjects.length && (
            <div className="glass-card" style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
              <Briefcase size={36} color="#cbd5e1" style={{ margin: '0 auto 12px auto', display: 'block' }} />
              <h4 style={{ fontSize: '1.1rem', color: '#0f172a', margin: '0 0 6px 0' }}>Welcome, {currentUser?.name || 'Site Engineer'}!</h4>
              <p style={{ fontSize: '0.85rem', maxWidth: '500px', margin: '0 auto' }}>
                No construction projects are currently assigned to your account. When Admin assigns a new site to you, an invitation will appear right here for you to accept.
              </p>
            </div>
          )
        )}
        </>
      )}

      {/* SECTION 1: My Projects Directory (Only shown in My Projects tab, includes Pending Invitations & View Details button) */}
      {(activeTab === 'my_projects') && (
        <div className="glass-card" style={{ padding: '20px' }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <Briefcase size={18} color="#2563eb" /> 1. My Projects Directory
              </h3>
              {currentProjectId && currentProjectId !== 'ALL' && (
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>
                  Showing Selected Site: <strong style={{ color: '#2563eb' }}>{proj.name}</strong>
                  <button
                    onClick={() => setCurrentProjectId && setCurrentProjectId('ALL')}
                    style={{ marginLeft: '8px', border: 'none', background: '#e2e8f0', color: '#334155', borderRadius: '4px', padding: '2px 8px', fontSize: '0.72rem', cursor: 'pointer', fontWeight: 600 }}
                    title="Show all assigned sites"
                  >
                    View All Sites
                  </button>
                </div>
              )}
            </div>
            {pendingProjects.length > 0 && (
              <span className="badge" style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontWeight: 700, padding: '4px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#dc2626', display: 'inline-block' }}></span>
                {pendingProjects.length} Pending Invitation(s) Waiting
              </span>
            )}
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: '#64748b' }}>
                  <th style={{ padding: '8px' }}>Project Name</th>
                  <th style={{ padding: '8px' }}>Location</th>
                  <th style={{ padding: '8px' }}>Budget</th>
                  <th style={{ padding: '8px' }}>Client & Phone</th>
                  <th style={{ padding: '8px' }}>Status</th>
                  <th style={{ padding: '8px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const displayedProjects = (currentProjectId && currentProjectId !== 'ALL')
                    ? projects.filter(p => p.id === currentProjectId)
                    : projects;

                  return displayedProjects.length > 0 ? displayedProjects.map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9', background: p.status === 'Pending Acceptance' ? '#fffbf0' : 'transparent' }}>
                      <td style={{ padding: '10px 8px', fontWeight: 600, color: '#0f172a' }}>
                        <div>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <Briefcase size={16} color={p.status === 'Pending Acceptance' ? '#d97706' : '#2563eb'} /> {p.name}
                          </span>
                          {p.specifications && (
                            <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 500, marginTop: '2px' }}>
                              {[
                                p.specifications.buildingsCount,
                                p.specifications.floors,
                                p.specifications.bhk,
                                p.specifications.unitsCount,
                                p.specifications.lanes,
                                p.specifications.bridgeType
                              ].filter(Boolean).join(' • ')}
                            </div>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '10px 8px', color: '#475569' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <MapPin size={14} color="#64748b" /> {p.location}
                        </span>
                      </td>
                      <td style={{ padding: '10px 8px', fontWeight: 700, color: '#059669' }}>
                        {formatCurrency(p.budget)}
                      </td>
                      <td style={{ padding: '10px 8px', color: '#334155' }}>
                        <div>{p.clientName}</div>
                        <div style={{ fontSize: '0.78rem', color: '#2563eb', fontWeight: 600 }}>
                          <Phone size={12} style={{ display: 'inline', verticalAlign: '-1px' }} /> {p.clientPhone || p.contactPhone || '+91 98765 43210'}
                        </div>
                      </td>
                      <td style={{ padding: '10px 8px' }}>
                        <span className={`badge ${p.progress === 100 ? 'badge-emerald' : p.status === 'Pending Acceptance' ? 'badge-amber' : 'badge-blue'}`}>
                          {p.status || 'In-Progress'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 8px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px', alignItems: 'center' }}>

                          {/* View Details Button */}
                          <button
                            className="btn btn-sm btn-secondary"
                            onClick={() => setSelectedProjectDetails(p)}
                            style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Eye size={14} /> View Details
                          </button>

                          {/* Accept Button for Pending Projects */}
                          {p.status === 'Pending Acceptance' && (
                            <button
                              className="btn btn-sm btn-primary"
                              style={{ background: '#d97706', borderColor: '#b45309', fontWeight: 600, padding: '6px 14px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              onClick={() => onAcceptProjectStatus && onAcceptProjectStatus(p.id, 'In-Progress', currentUser?.name)}
                            >
                              <CheckCircle size={14} /> Accept Project
                            </button>
                          )}

                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>
                        No project matching the selected site found.
                      </td>
                    </tr>
                  );
                })()}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 2: Tasks - Full Workflow with Photo Evidence & Admin Approval */}
      {activeTab === 'tasks' && !hasAcceptedProject && (
        <div className="glass-card" style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
          <CheckSquare size={36} color="#cbd5e1" style={{ margin: '0 auto 12px auto', display: 'block' }} />
          <h4 style={{ fontSize: '1.1rem', color: '#0f172a', margin: '0 0 6px 0' }}>No Active Site Project</h4>
          <p style={{ fontSize: '0.85rem', margin: 0 }}>
            {pendingProjects.length > 0 
              ? 'Please accept your pending project on the Dashboard to unlock site execution tasks.' 
              : 'You do not have an active site project assigned yet.'}
          </p>
        </div>
      )}

      {((activeTab === 'tasks' && hasAcceptedProject) || (activeTab === 'dashboard' && hasAcceptedProject)) && (
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', margin: 0, fontWeight: 700 }}>
                <CheckSquare size={18} color="#d97706" /> {activeTab === 'dashboard' ? 'Active Site Tasks & Photo Evidence' : '2. Site Execution Tasks Checklist'}
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '4px 0 0 0' }}>
                Project: <strong style={{ color: '#0f172a' }}>{proj.name}</strong> ({proj.progress}% Done). Start each stage, take site photo evidence, and submit for Admin approval.
              </p>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => setShowAddTask(!showAddTask)}>
              <Plus size={14} /> Add New Task
            </button>
          </div>

          {/* Workflow Legend */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px', padding: '10px 14px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Workflow:</span>
            {Object.entries(statusConfig).map(([key, cfg]) => (
              <span key={key} style={{ fontSize: '0.72rem', color: cfg.color, background: cfg.bg, padding: '2px 8px', borderRadius: '4px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                {cfg.icon} {key}
              </span>
            ))}
          </div>

          {showAddTask && (
            <form onSubmit={(e) => {
              e.preventDefault();
              if (!newTaskName) return;
              onAddTask && onAddTask({
                id: `t_${Date.now()}`,
                name: newTaskName,
                project: proj.name || 'Site Project',
                dueDate: new Date().toLocaleDateString('en-GB'),
                status: 'Pending',
                photo: '',
                adminRemark: ''
              });
              setNewTaskName('');
              setShowAddTask(false);
            }} style={{ display: 'flex', gap: '10px', marginBottom: '16px', background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <input
                className="form-control"
                placeholder="Enter task description (e.g. Concrete curing inspection)"
                value={newTaskName}
                onChange={e => setNewTaskName(e.target.value)}
                required
                style={{ flex: 1, padding: '8px 12px', fontSize: '0.85rem' }}
              />
              <button type="submit" className="btn btn-primary btn-sm" style={{ padding: '8px 16px' }}>Save Task</button>
            </form>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {taskList.length > 0 ? taskList.map(task => {
              const cfg = statusConfig[task.status] || statusConfig['Pending'];
              const isExpanded = Boolean(expandedTasks[task.id]);
              const taskPhotos = Array.isArray(task.photos) && task.photos.length > 0 ? task.photos : (task.photo ? [task.photo] : []);
              const hasPhotos = taskPhotos.length > 0;
              const hasDetails = hasPhotos || task.totalCost > 0 || (Array.isArray(task.materialsUsed) && task.materialsUsed.length > 0) || task.adminRemark;

              return (
                <div
                  key={task.id}
                  style={{
                    padding: '8px 12px',
                    background: task.status === 'Completed' ? '#fcfdfc' : '#ffffff',
                    border: `1px solid ${task.status === 'Rejected' ? '#fecaca' : task.status === 'Completed' ? '#bbf7d0' : '#e2e8f0'}`,
                    borderRadius: '8px',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {/* Compact Single-Line Task Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    {/* Left: Checkbox + Name + Subtle info */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '220px' }}>
                      <input
                        type="checkbox"
                        checked={task.status === 'Completed'}
                        onChange={() => {
                          if (task.status === 'Pending' || task.status === 'Rejected') {
                            onStartTask && onStartTask(task.id);
                          } else if (task.status === 'In-Progress') {
                            openTaskPhotoModal(task.id, hasPhotos);
                          }
                        }}
                        title={task.status === 'Pending' ? 'Click to Start Task' : task.status === 'In-Progress' ? 'Click to Upload Photo Evidence & Materials' : task.status}
                        style={{ width: '16px', height: '16px', accentColor: '#059669', cursor: 'pointer', flexShrink: 0 }}
                      />
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{
                          fontWeight: 600,
                          fontSize: '0.84rem',
                          color: task.status === 'Completed' ? '#15803d' : '#0f172a',
                          textDecoration: task.status === 'Completed' ? 'line-through' : 'none'
                        }}>
                          {task.name}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                          Due: {task.dueDate} {task.project ? `| ${task.project}` : ''}
                        </span>
                      </div>
                    </div>

                    {/* Right: Status badge + Total Cost + Edit Details button + Toggle details */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      {/* Compact Status Badge */}
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        color: cfg.color,
                        background: '#ffffff',
                        border: `1px solid ${cfg.color}35`,
                        padding: '3px 8px',
                        borderRadius: '5px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        whiteSpace: 'nowrap'
                      }}>
                        {cfg.icon} {cfg.label}
                      </span>

                      {/* Small Cost Tag */}
                      {task.totalCost > 0 && (
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          color: '#059669',
                          background: '#ecfdf5',
                          border: '1px solid #a7f3d0',
                          padding: '3px 8px',
                          borderRadius: '5px',
                          whiteSpace: 'nowrap'
                        }}>
                          ₹{Number(task.totalCost).toLocaleString('en-IN')}
                        </span>
                      )}

                      {/* Action buttons */}
                      {task.status === 'Pending' ? (
                        <button
                          className="btn btn-sm btn-primary"
                          style={{ fontSize: '0.72rem', padding: '3px 10px', display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#d97706', borderColor: '#b45309', borderRadius: '5px' }}
                          onClick={() => onStartTask && onStartTask(task.id)}
                        >
                          <Clock size={12} /> Start
                        </button>
                      ) : task.status === 'Completed' ? (
                        <button
                          type="button"
                          className="btn btn-sm"
                          style={{
                            fontSize: '0.72rem',
                            padding: '3px 9px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: '#ffffff',
                            color: '#2563eb',
                            border: '1px solid #cbd5e1',
                            fontWeight: 600,
                            borderRadius: '5px'
                          }}
                          onClick={() => openTaskPhotoModal(task.id, false, true)}
                          title="Edit stage details, materials or photos"
                        >
                          <Edit3 size={11} color="#2563eb" /> Edit Details
                        </button>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {(hasPhotos || (Array.isArray(task.materialsUsed) && task.materialsUsed.length > 0)) && (
                            <button
                              type="button"
                              className="btn btn-sm"
                              style={{
                                fontSize: '0.72rem',
                                padding: '3px 8px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                background: '#ffffff',
                                color: '#0f172a',
                                border: '1px solid #cbd5e1',
                                fontWeight: 600,
                                borderRadius: '5px'
                              }}
                              onClick={() => openTaskPhotoModal(task.id, false, true)}
                              title="Edit materials or evidence"
                            >
                              <Edit3 size={11} color="#2563eb" /> Edit
                            </button>
                          )}
                          <button
                            type="button"
                            className="btn btn-sm btn-primary"
                            style={{
                              fontSize: '0.72rem',
                              padding: '3px 9px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              background: task.status === 'Rejected' ? '#dc2626' : hasPhotos ? '#2563eb' : '#059669',
                              borderColor: task.status === 'Rejected' ? '#b91c1c' : hasPhotos ? '#1d4ed8' : '#047857',
                              borderRadius: '5px'
                            }}
                            onClick={() => openTaskPhotoModal(task.id, hasPhotos, hasPhotos)}
                          >
                            <Camera size={11} /> {hasPhotos ? '+ Photos' : (task.status === 'Rejected' ? 'Re-upload' : 'Upload')}
                          </button>
                        </div>
                      )}

                      {/* Expand / Collapse Button */}
                      {hasDetails && (
                        <button
                          type="button"
                          onClick={() => toggleTaskExpand(task.id)}
                          style={{
                            background: isExpanded ? '#f1f5f9' : '#ffffff',
                            border: '1px solid #cbd5e1',
                            borderRadius: '5px',
                            padding: '3px 7px',
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            color: '#475569',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '2px'
                          }}
                          title={isExpanded ? 'Hide details' : 'View full details & breakdown'}
                        >
                          {isExpanded ? (
                            <>Less <ChevronUp size={11} /></>
                          ) : (
                            <>Details <ChevronDown size={11} /></>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Collapsible Details Drawer - Rendered only when user clicks Details */}
                  {isExpanded && (
                    <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed #e2e8f0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {/* Attached Photos Strip (Small & Neat) */}
                      {hasPhotos && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b' }}>
                            {taskPhotos.length} Photo(s):
                          </span>
                          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', alignItems: 'center' }}>
                            {taskPhotos.map((imgUrl, pIdx) => (
                              <div
                                key={pIdx}
                                onClick={() => {
                                  setViewPhotoGallery(taskPhotos);
                                  setViewPhotoIndex(pIdx);
                                  setViewPhotoUrl(imgUrl);
                                }}
                                style={{
                                  width: '42px',
                                  height: '42px',
                                  flexShrink: 0,
                                  borderRadius: '5px',
                                  overflow: 'hidden',
                                  border: '1.5px solid #2563eb',
                                  cursor: 'pointer',
                                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                }}
                                title={`Click to view photo ${pIdx + 1}`}
                              >
                                <img
                                  src={imgUrl}
                                  alt={`Evidence ${pIdx + 1}`}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="%23e2e8f0"><rect width="100%" height="100%" fill="%23f1f5f9"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="8" fill="%2364748b">Photo</text></svg>';
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                          {task.status === 'Completed' && (
                            <button
                              type="button"
                              onClick={() => openTaskPhotoModal(task.id, true, true)}
                              style={{
                                fontSize: '0.7rem',
                                padding: '3px 8px',
                                background: '#f8fafc',
                                border: '1px solid #cbd5e1',
                                borderRadius: '4px',
                                color: '#2563eb',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                fontWeight: 600
                              }}
                            >
                              <Camera size={11} /> + Add More Photos
                            </button>
                          )}
                        </div>
                      )}

                      {/* Small, Clean Expense Breakdown */}
                      {(task.totalCost > 0 || (Array.isArray(task.materialsUsed) && task.materialsUsed.length > 0)) && (
                        <div style={{ background: '#f8fafc', padding: '6px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.74rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                            <span style={{ fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Package size={12} color="#d97706" /> Expense Breakdown:
                            </span>
                            <span style={{ fontWeight: 800, color: '#059669' }}>
                              Total Cost: ₹{Number(task.totalCost || 0).toLocaleString('en-IN')}
                            </span>
                          </div>

                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            <div style={{ background: '#fffbeb', padding: '4px 8px', borderRadius: '4px', border: '1px solid #fde68a', flex: 1, minWidth: '160px' }}>
                              <div style={{ fontWeight: 700, color: '#b45309', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                <Package size={11} /> Material: ₹{Number(task.materialCost || 0).toLocaleString('en-IN')}
                              </div>
                              <div style={{ fontSize: '0.7rem', color: '#92400e', marginTop: '2px' }}>
                                {task.materialsSummary || (task.materialsUsed && task.materialsUsed.map(m => `${m.name}: ${m.quantity} ${m.unit}`).join(', ')) || 'No materials consumed'}
                              </div>
                            </div>

                            <div style={{ background: '#eff6ff', padding: '4px 8px', borderRadius: '4px', border: '1px solid #bfdbfe', flex: 1, minWidth: '160px' }}>
                              <div style={{ fontWeight: 700, color: '#1d4ed8', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                <Users size={11} /> Labor Wages: ₹{Number(task.laborCost || 0).toLocaleString('en-IN')}
                              </div>
                              <div style={{ fontSize: '0.7rem', color: '#1e40af', marginTop: '2px' }}>
                                {Array.isArray(task.laborDetails) && task.laborDetails.length > 0
                                  ? task.laborDetails.map(l => `${l.role}: ${l.count} @ ₹${l.dailyWage}`).join(' | ')
                                  : `${task.laborCount || 0} Workers on site`}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Status Info / Remarks */}
                      {task.status === 'Completed' && (
                        <div style={{ fontSize: '0.73rem', color: '#059669', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle size={12} /> {task.adminRemark || 'Approved by Admin'}
                        </div>
                      )}

                      {task.status === 'In-Progress' && hasPhotos && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            className="btn btn-sm btn-primary"
                            style={{ fontSize: '0.73rem', padding: '3px 10px', background: '#059669', borderColor: '#047857', borderRadius: '4px' }}
                            onClick={() => openTaskPhotoModal(task.id, false)}
                          >
                            <Send size={11} style={{ display: 'inline', verticalAlign: '-1px', marginRight: '3px' }} /> Submit Evidence for Admin Approval
                          </button>
                        </div>
                      )}

                      {task.status === 'Awaiting Approval' && (
                        <div style={{ fontSize: '0.73rem', color: '#2563eb', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={12} /> Waiting for Admin Approval...
                        </div>
                      )}

                      {task.status === 'Rejected' && (
                        <div style={{ padding: '6px 10px', background: '#fff1f2', borderRadius: '5px', border: '1px solid #fecaca', fontSize: '0.74rem' }}>
                          <div style={{ fontWeight: 700, color: '#dc2626', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <AlertTriangle size={13} /> Admin Rejection Reason:
                          </div>
                          <div style={{ color: '#991b1b', marginTop: '2px', fontWeight: 600 }}>
                            "{task.adminRemark || 'Work incomplete / Please re-upload clear photo evidence'}"
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            }) : (
              <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: '8px' }}>
                No tasks found. Click "Add New Task" to create one.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Task Evidence, Material Consumption & Labor Wages Modal */}
      {photoUploadTaskId && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, padding: '16px'
        }}>
          <div className="glass-card" style={{ padding: '24px', width: '100%', maxWidth: '680px', maxHeight: '92vh', overflowY: 'auto', background: '#ffffff', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.35)' }}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.15rem', fontWeight: 800 }}>
                  <Camera size={22} color="#2563eb" /> {isEditMode ? 'Edit Task Evidence, Materials & Worker Wages' : (isAddMoreMode ? 'Attach Additional Photo Evidence' : 'Submit Task Evidence, Materials & Worker Wages')}
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '4px 0 0 0' }}>
                  {(() => {
                    const activeUploadTask = (tasks || []).find(t => t.id === photoUploadTaskId);
                    return activeUploadTask ? `${activeUploadTask.name} (${activeUploadTask.dueDate} • ${activeUploadTask.project})` : 'Record site progress & expenses';
                  })()}
                </p>
              </div>
              <button 
                type="button" 
                onClick={() => { setPhotoUploadTaskId(null); setIsAddMoreMode(false); }}
                style={{ border: 'none', background: '#f1f5f9', borderRadius: '8px', width: '32px', height: '32px', cursor: 'pointer', color: '#64748b', fontWeight: 'bold' }}
                title="Close (Keep Draft)"
              >
                ✕
              </button>
            </div>

            {/* Rejection Alert if applicable */}
            {(() => {
              const activeUploadTask = (tasks || []).find(t => t.id === photoUploadTaskId);
              if (activeUploadTask && activeUploadTask.status === 'Rejected') {
                return (
                  <div style={{ background: '#fef2f2', border: '1.5px solid #f87171', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#dc2626', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <AlertTriangle size={15} /> Admin Rejection Reason:
                    </div>
                    <div style={{ fontSize: '0.84rem', color: '#991b1b', marginTop: '4px', fontWeight: 600 }}>
                      "{activeUploadTask.adminRemark || 'Work incomplete / please re-upload clear photo evidence'}"
                    </div>
                  </div>
                );
              }
              return null;
            })()}

            {/* SECTION 1: PHOTO EVIDENCE (Mandatory) */}
            <div style={{ marginBottom: '18px', background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <label className="form-label" style={{ fontWeight: 700, color: '#0f172a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>1. Attach Photo Evidence from Site Camera / Gallery <span style={{ color: '#dc2626' }}>*</span></span>
                <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 400 }}>Multiple photos allowed</span>
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onClick={(e) => { e.target.value = ''; }}
                onChange={handleFileSelect}
                className="form-control"
                style={{ padding: '8px', fontSize: '0.82rem', background: '#ffffff' }}
              />
              {isCompressing && (
                <div style={{ fontSize: '0.76rem', color: '#2563eb', marginTop: '6px', fontWeight: 600 }}>
                  Optimizing and loading selected photos...
                </div>
              )}

              {photoList.length > 0 ? (
                <div style={{ marginTop: '12px' }}>
                  <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#059669', marginBottom: '8px' }}>
                    {photoList.length} Photo Evidence Selected:
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                    {photoList.map((url, idx) => (
                      <div key={idx} style={{ position: 'relative', borderRadius: '6px', overflow: 'hidden', border: '1.5px solid #cbd5e1' }}>
                        <img src={url} alt={`Evidence ${idx + 1}`} style={{ width: '100%', height: '70px', objectFit: 'cover' }} />
                        <button
                          type="button"
                          onClick={() => setPhotoList(photoList.filter((_, i) => i !== idx))}
                          style={{
                            position: 'absolute', top: '2px', right: '2px', background: '#dc2626', color: '#ffffff',
                            border: 'none', borderRadius: '50%', width: '18px', height: '18px', fontSize: '11px',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ marginTop: '8px', fontSize: '0.75rem', color: '#94a3b8' }}>
                  No photos selected yet.
                </div>
              )}
            </div>

            {/* If Not AddMoreMode, show Material Consumption & Labor Details */}
            {!isAddMoreMode && (
              <>
                {/* SECTION 2: MATERIALS USED */}
                <div style={{ marginBottom: '16px', background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Package size={16} color="#2563eb" />
                      <strong style={{ fontSize: '0.88rem', color: '#0f172a' }}>
                        2. Materials Used (Optional)
                      </strong>
                    </div>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0 0 12px 0' }}>
                    Select materials only if consumed in this task stage. Leave empty if no materials were used.
                  </p>

                  {/* Material Rows */}
                  {taskMaterials.map((row, idx) => {
                    return (
                      <div key={idx} style={{ marginBottom: '10px', background: '#ffffff', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                          {/* Material Dropdown */}
                          <div style={{ flex: 2, minWidth: '190px' }}>
                            <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: '3px', display: 'block' }}>
                              Select Material:
                            </label>
                            <select
                              className="form-control"
                              value={row.selectedOption}
                              onChange={(e) => handleMaterialChange(idx, e.target.value)}
                              style={{ padding: '7px 10px', fontSize: '0.8rem', fontWeight: 600 }}
                            >
                              <option value="">-- Select Material from Construction Catalog --</option>
                              {Object.entries(CONSTRUCTION_MATERIAL_CATALOG).map(([catKey, catObj]) => (
                                <optgroup key={catKey} label={catObj.label}>
                                  {catObj.items.map(mat => (
                                    <option key={mat.name} value={mat.name}>
                                      {mat.name} ({mat.defaultUnit})
                                    </option>
                                  ))}
                                </optgroup>
                              ))}
                              <optgroup label="Other / Custom">
                                <option value="__custom__">+ Custom / Other Material (Type Specification)</option>
                              </optgroup>
                            </select>

                            {row.selectedOption === '__custom__' && (
                              <input
                                type="text"
                                placeholder="Enter custom material name"
                                value={row.name}
                                onChange={(e) => handleCustomNameChange(idx, e.target.value)}
                                className="form-control"
                                style={{ marginTop: '6px', padding: '6px 8px', fontSize: '0.8rem' }}
                              />
                            )}
                          </div>

                          {/* Quantity Used Input */}
                          <div style={{ width: '110px' }}>
                            <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: '3px', display: 'block' }}>
                              Quantity:
                            </label>
                            <input
                              type="number"
                              min="0.01"
                              step="any"
                              placeholder="0"
                              value={row.quantity}
                              onChange={(e) => handleQuantityChange(idx, e.target.value)}
                              className="form-control"
                              style={{ padding: '7px 8px', fontSize: '0.82rem', fontWeight: 700 }}
                            />
                          </div>

                          {/* Unit */}
                          <div style={{ width: '85px' }}>
                            <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: '3px', display: 'block' }}>
                              Unit:
                            </label>
                            <input
                              type="text"
                              value={row.unit}
                              onChange={(e) => handleUnitChange(idx, e.target.value)}
                              className="form-control"
                              style={{ padding: '7px 8px', fontSize: '0.8rem' }}
                              placeholder="Bags"
                            />
                          </div>

                          {/* Item Cost */}
                          <div style={{ width: '130px' }}>
                            <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: '3px', display: 'block' }}>
                              Item Cost (₹):
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="any"
                              placeholder="0"
                              value={row.cost}
                              onChange={(e) => handleItemCostChange(idx, e.target.value)}
                              className="form-control"
                              style={{ padding: '7px 8px', fontSize: '0.82rem', fontWeight: 700, color: '#059669' }}
                            />
                          </div>

                          {/* Remove Button */}
                          {taskMaterials.length > 1 && (
                            <div style={{ paddingTop: '20px' }}>
                              <button
                                type="button"
                                onClick={() => handleRemoveMaterialRow(idx)}
                                style={{ border: 'none', background: '#fee2e2', color: '#dc2626', borderRadius: '6px', padding: '7px 9px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                title="Remove item"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                    <button
                      type="button"
                      onClick={handleAddMaterialRow}
                      className="btn btn-sm btn-secondary"
                      style={{ fontSize: '0.75rem', padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#ffffff', borderColor: '#cbd5e1' }}
                    >
                      <Plus size={13} /> Add Another Material
                    </button>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>
                      Material Subtotal: <span style={{ color: '#059669' }}>₹{taskTotalMaterialCost.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>

                {/* SECTION 3: WORKERS & LABOR SELECTION (Select Workers Modal & Auto Cost Calculation) */}
                <div style={{ marginBottom: '16px', background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Users size={17} color="#2563eb" />
                      <strong style={{ fontSize: '0.88rem', color: '#0f172a' }}>
                        3. Labor & Workers Used in Task (Optional)
                      </strong>
                    </div>

                    <div>
                      <button
                        type="button"
                        onClick={() => setWorkerPickerOpen(true)}
                        className="btn btn-sm btn-primary"
                        style={{ fontSize: '0.78rem', padding: '5px 12px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                      >
                        <Users size={13} /> {selectedWorkersList.length > 0 ? `Modify Selection (${selectedWorkersList.length})` : '+ Select Workers from Site'}
                      </button>
                    </div>
                  </div>

                  <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0 0 12px 0' }}>
                    Select workers deployed on this task stage. Each worker's individual daily wage will be totaled automatically.
                  </p>

                  {selectedWorkersList.length > 0 ? (
                    <div>
                      {/* Selected Summary Bar */}
                      <div style={{ background: '#ffffff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                        <div style={{ fontSize: '0.82rem', color: '#334155' }}>
                          Deployed: <strong style={{ color: '#0f172a' }}>{selectedWorkersList.length} Worker(s)</strong>
                        </div>
                        <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#059669' }}>
                          Total Labor Cost: ₹{selectedWorkersLaborCost.toLocaleString('en-IN')}
                        </div>
                      </div>

                      {/* Selected Worker Chips / Cards */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '8px', maxHeight: '180px', overflowY: 'auto', padding: '2px' }}>
                        {selectedWorkersList.map(w => (
                          <div
                            key={w.id}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              background: '#ffffff',
                              border: '1px solid #e2e8f0',
                              borderRadius: '6px',
                              padding: '8px 10px',
                              fontSize: '0.8rem'
                            }}
                          >
                            <div style={{ overflow: 'hidden' }}>
                              <div style={{ fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {w.name}
                              </div>
                              <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span>{w.trade}</span> &bull; <strong style={{ color: '#059669' }}>₹{w.dailyWage || 500}/day</strong>
                                {w.status === 'Absent' && (
                                  <span style={{ fontSize: '0.65rem', padding: '1px 5px', background: '#fee2e2', color: '#dc2626', borderRadius: '3px', fontWeight: 700 }}>
                                    Absent
                                  </span>
                                )}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setSelectedWorkerIds(prev => prev.filter(id => id !== w.id))}
                              style={{ border: 'none', background: '#fee2e2', color: '#dc2626', cursor: 'pointer', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, marginLeft: '6px', flexShrink: 0 }}
                              title="Remove this worker"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => setWorkerPickerOpen(true)}
                      style={{
                        padding: '20px',
                        background: '#ffffff',
                        borderRadius: '8px',
                        border: '1.5px dashed #cbd5e1',
                        textAlign: 'center',
                        cursor: 'pointer',
                        color: '#64748b',
                        fontSize: '0.82rem'
                      }}
                    >
                      <Users size={26} color="#94a3b8" style={{ margin: '0 auto 6px auto', display: 'block' }} />
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>No workers assigned yet</div>
                      <div style={{ fontSize: '0.74rem', marginTop: '2px' }}>Click here to select workers from site directory</div>
                    </div>
                  )}

                  {/* Labor Subtotal Bar */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', borderTop: '1px solid #e2e8f0', paddingTop: '10px' }}>
                    <button
                      type="button"
                      onClick={() => setWorkerPickerOpen(true)}
                      className="btn btn-sm btn-secondary"
                      style={{ fontSize: '0.75rem', padding: '4px 10px', background: '#ffffff' }}
                    >
                      + Select / Modify Workers
                    </button>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>
                      Labor Subtotal: <span style={{ color: '#2563eb' }}>₹{taskTotalLaborCost.toLocaleString('en-IN')}</span> ({taskTotalLaborCount} Workers)
                    </div>
                  </div>
                </div>

                {/* SECTION 4: SIMPLE CLEAN EXPENSE BREAKDOWN */}
                <div style={{ marginBottom: '16px', background: '#ffffff', padding: '14px', borderRadius: '8px', border: '1.5px solid #cbd5e1' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Total Stage Operational Expense
                    </span>
                    <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#059669' }}>
                      ₹{taskTotalExpense.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Material Cost:</div>
                      <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                        ₹{taskTotalMaterialCost.toLocaleString('en-IN')}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '2px' }}>
                        {taskMaterials.filter(m => (m.name && m.name.trim()) && Number(m.quantity) > 0).length} Material items
                      </div>
                    </div>

                    <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Labor Wages:</div>
                      <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                        ₹{taskTotalLaborCost.toLocaleString('en-IN')}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '2px' }}>
                        {taskTotalLaborCount} Workers deployed
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Modal Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginTop: '16px', borderTop: '1px solid #f1f5f9', paddingTop: '14px' }}>
              <div>
                {taskDrafts[photoUploadTaskId] && (
                  <button
                    type="button"
                    className="btn btn-sm"
                    style={{ color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', fontSize: '0.78rem' }}
                    onClick={() => {
                      if (window.confirm('Clear all draft inputs for this task?')) {
                        setTaskDrafts(prev => {
                          const copy = { ...prev };
                          delete copy[photoUploadTaskId];
                          return copy;
                        });
                        setPhotoList([]);
                        setTaskMaterials([{ selectedOption: '', name: '', quantity: '', unit: 'Units', unitRate: '', cost: '' }]);
                        setSelectedWorkerIds([]);
                      }
                    }}
                  >
                    Clear Draft
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn btn-secondary" onClick={() => { setPhotoUploadTaskId(null); setIsAddMoreMode(false); }}>
                  Close (Keep Draft)
                </button>
                <button
                  className="btn btn-primary"
                  disabled={isCompressing}
                  style={{
                    fontWeight: 700,
                    opacity: isCompressing ? 0.6 : 1
                  }}
                  onClick={() => handlePhotoSubmit(photoUploadTaskId)}
                >
                  {isCompressing ? (
                    <>Compressing Photos...</>
                  ) : (
                    <><Send size={14} /> {isEditMode ? 'Update Task Evidence & Costs' : (isAddMoreMode ? 'Save & Attach More Photos' : 'Submit Task Evidence')}</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SEPARATE DEDICATED WORKER SELECTION MODAL (PAGE DIALOG) */}
      {workerPickerOpen && (() => {
        const allSiteWorkers = (workers && Array.isArray(workers)) ? workers : [];
        const presentWorkersCount = allSiteWorkers.filter(w => w.status === 'Present').length;

        // Filter by category
        const filteredByCategory = (pickerCategoryFilter === 'all')
          ? allSiteWorkers
          : allSiteWorkers.filter(w => isWorkerInTrade(w.trade, pickerCategoryFilter));

        // Filter by search query
        const query = (pickerSearchQuery || '').toLowerCase().trim();
        const displayWorkers = query
          ? filteredByCategory.filter(w => {
              const name = (w.name || '').toLowerCase();
              const phone = (w.phone || '').toLowerCase();
              const trade = (w.trade || '').toLowerCase();
              return name.includes(query) || phone.includes(query) || trade.includes(query);
            })
          : filteredByCategory;

        const currentModalSelectedList = allSiteWorkers.filter(w => selectedWorkerIds.includes(w.id) && w.status !== 'Absent');
        const currentModalTotalCost = currentModalSelectedList.reduce((sum, w) => sum + (Number(w.dailyWage) || 0), 0);

        const toggleWorker = (id) => {
          const target = allSiteWorkers.find(x => x.id === id);
          if (target && target.status === 'Absent') return; // Cannot select absent worker!
          setSelectedWorkerIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
          );
        };

        const handleSelectAllPresent = () => {
          const presentIds = allSiteWorkers.filter(w => w.status === 'Present').map(w => w.id);
          setSelectedWorkerIds(prev => Array.from(new Set([...prev, ...presentIds])));
        };

        const handleSelectAllFiltered = () => {
          const idsToAdd = displayWorkers.filter(w => w.status !== 'Absent').map(w => w.id);
          setSelectedWorkerIds(prev => Array.from(new Set([...prev, ...idsToAdd])));
        };

        return (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1400,
              padding: '16px'
            }}
            onClick={() => setWorkerPickerOpen(false)}
          >
            <div
              style={{
                background: '#ffffff',
                borderRadius: '8px',
                width: '100%',
                maxWidth: '850px',
                maxHeight: '85vh',
                display: 'flex',
                flexDirection: 'column',
                border: '1px solid #cbd5e1',
                overflow: 'hidden'
              }}
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div
                style={{
                  padding: '14px 18px',
                  borderBottom: '1px solid #e2e8f0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: '#f8fafc'
                }}
              >
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
                    Select Workers for Task
                  </h3>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                    Checkmark workers deployed on this stage. Wages will be totaled automatically.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setWorkerPickerOpen(false)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    padding: '4px',
                    cursor: 'pointer',
                    color: '#64748b'
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Toolbar */}
              <div style={{ padding: '12px 18px', borderBottom: '1px solid #e2e8f0', background: '#ffffff' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '10px' }}>
                  {/* Search Input */}
                  <div style={{ position: 'relative', flex: '1 1 200px' }}>
                    <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search name, trade or phone..."
                      value={pickerSearchQuery}
                      onChange={e => setPickerSearchQuery(e.target.value)}
                      style={{ paddingLeft: '32px', fontSize: '0.82rem', height: '36px' }}
                    />
                    {pickerSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setPickerSearchQuery('')}
                        style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={handleSelectAllFiltered}
                      className="btn btn-sm btn-secondary"
                      style={{ fontSize: '0.75rem' }}
                    >
                      Select All ({displayWorkers.length})
                    </button>
                    {selectedWorkerIds.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedWorkerIds([])}
                        className="btn btn-sm btn-secondary"
                        style={{ fontSize: '0.75rem', color: '#dc2626' }}
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                </div>

                {/* Category Pills */}
                <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
                  <button
                    type="button"
                    onClick={() => setPickerCategoryFilter('all')}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: pickerCategoryFilter === 'all' ? 700 : 500,
                      border: '1px solid',
                      borderColor: pickerCategoryFilter === 'all' ? '#2563eb' : '#cbd5e1',
                      background: pickerCategoryFilter === 'all' ? '#2563eb' : '#ffffff',
                      color: pickerCategoryFilter === 'all' ? '#ffffff' : '#334155',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    All ({allSiteWorkers.length})
                  </button>
                  {CONSTRUCTION_LABOR_CATEGORIES.map(cat => {
                    const count = allSiteWorkers.filter(w => isWorkerInTrade(w.trade, cat.id)).length;
                    const isActive = pickerCategoryFilter.toLowerCase() === cat.label.toLowerCase();
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setPickerCategoryFilter(cat.label)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: isActive ? 700 : 500,
                          border: '1px solid',
                          borderColor: isActive ? '#2563eb' : '#cbd5e1',
                          background: isActive ? '#2563eb' : '#ffffff',
                          color: isActive ? '#ffffff' : '#334155',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {cat.label} ({count})
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Worker List */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '14px 18px', background: '#f8fafc' }}>
                {displayWorkers.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '30px 10px', color: '#64748b' }}>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>No workers found</div>
                    <div style={{ fontSize: '0.75rem', marginTop: '3px' }}>
                      {pickerSearchQuery ? 'Try clearing your search query.' : 'No workers registered yet. Add workers from Site Labor.'}
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '8px' }}>
                    {displayWorkers.map(w => {
                      const isSelected = selectedWorkerIds.includes(w.id);
                      const isAbsent = w.status === 'Absent';
                      const wage = Number(w.dailyWage) || 500;

                      return (
                        <div
                          key={w.id}
                          onClick={() => {
                            if (!isAbsent) toggleWorker(w.id);
                          }}
                          style={{
                            background: isAbsent ? '#f8fafc' : isSelected ? '#eff6ff' : '#ffffff',
                            border: isAbsent ? '1px dashed #fca5a5' : isSelected ? '1.5px solid #2563eb' : '1px solid #cbd5e1',
                            borderRadius: '6px',
                            padding: '10px 12px',
                            cursor: isAbsent ? 'not-allowed' : 'pointer',
                            opacity: isAbsent ? 0.55 : 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '10px'
                          }}
                          title={isAbsent ? `${w.name} is marked Absent in Site Labor and cannot be selected.` : ''}
                        >
                          {/* Left: Checkbox & Worker Info */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                            <input
                              type="checkbox"
                              checked={isSelected && !isAbsent}
                              disabled={isAbsent}
                              onChange={() => {
                                if (!isAbsent) toggleWorker(w.id);
                              }}
                              style={{ width: '16px', height: '16px', cursor: isAbsent ? 'not-allowed' : 'pointer', flexShrink: 0 }}
                            />
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontWeight: 700, fontSize: '0.85rem', color: isAbsent ? '#64748b' : '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {w.name}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px', flexWrap: 'wrap' }}>
                                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                                  {w.trade || 'Helper'}
                                </span>
                                {isAbsent ? (
                                  <span style={{ fontSize: '0.68rem', padding: '1px 6px', background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: '4px', fontWeight: 700 }}>
                                    Absent (Cannot Select)
                                  </span>
                                ) : (
                                  <span style={{ fontSize: '0.68rem', padding: '1px 6px', background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', borderRadius: '4px', fontWeight: 600 }}>
                                    Present
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Right: Daily Wage */}
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <div style={{ fontWeight: 700, fontSize: '0.85rem', color: isAbsent ? '#94a3b8' : '#059669' }}>
                              ₹{wage}/day
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div
                style={{
                  padding: '12px 18px',
                  borderTop: '1px solid #e2e8f0',
                  background: '#ffffff',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '10px'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                    Selected: <strong style={{ color: '#0f172a' }}>{currentModalSelectedList.length} Worker(s)</strong>
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#059669', marginTop: '1px' }}>
                    Total Daily Labor: ₹{currentModalTotalCost.toLocaleString('en-IN')}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setWorkerPickerOpen(false)}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.82rem' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => setWorkerPickerOpen(false)}
                    className="btn btn-primary"
                    style={{ fontSize: '0.82rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Check size={15} />
                    Confirm Workforce ({currentModalSelectedList.length})
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Enhanced Photo Viewer Modal with Multi-Photo Gallery Support */}
      {viewPhotoUrl && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1300
          }}
          onClick={() => { setViewPhotoUrl(null); setViewPhotoGallery([]); }}
        >
          <div 
            style={{ position: 'relative', width: '90%', maxWidth: '850px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Top Bar: Counter & Close */}
            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', color: '#ffffff' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                {viewPhotoGallery.length > 1 ? `Photo ${viewPhotoIndex + 1} of ${viewPhotoGallery.length}` : 'Task Photo Evidence'}
              </span>
              <button
                style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer', padding: '4px' }}
                onClick={() => { setViewPhotoUrl(null); setViewPhotoGallery([]); }}
              >
                <X size={24} />
              </button>
            </div>

            {/* Main Image with Prev / Next Buttons */}
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
                alt="Task evidence" 
                style={{ maxWidth: '100%', maxHeight: '72vh', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)' }} 
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

            {/* Bottom Thumbnail Strip */}
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

      {/* SECTION 3: Categorized Site Labor Management */}
      {(activeTab === 'workers') && (() => {
        // Filter workers according to selected category
        const isCategorySelected = laborCategoryFilter && laborCategoryFilter !== 'all';
        const activeCatObj = isCategorySelected 
          ? CONSTRUCTION_LABOR_CATEGORIES.find(c => c.id.toLowerCase() === laborCategoryFilter.toLowerCase() || c.label.toLowerCase() === laborCategoryFilter.toLowerCase())
          : null;

        const displayedWorkers = isCategorySelected
          ? workerList.filter(w => isWorkerInTrade(w.trade, laborCategoryFilter))
          : workerList;

        const catPresentCount = displayedWorkers.filter(w => w.status === 'Present').length;
        const catAbsentCount = displayedWorkers.filter(w => w.status === 'Absent').length;

        const getCountForCat = (catId) => {
          return workerList.filter(w => isWorkerInTrade(w.trade, catId)).length;
        };

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Top Header Card */}
            <div className="glass-card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '1.2rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', margin: 0, fontWeight: 800 }}>
                    <Users size={20} color="#059669" /> Site Labor Workforce & Trade Categories
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>
                    Total Workforce: <strong style={{ color: '#0f172a' }}>{totalWorkers}</strong> | 
                    Present: <strong style={{ color: '#059669' }}>{presentCount}</strong> | 
                    Absent: <strong style={{ color: '#dc2626' }}>{absentCount}</strong>
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => openBatchAddModal(isCategorySelected ? activeCatObj?.id : 'Mason', 3)}
                    style={{ fontSize: '0.82rem', padding: '8px 14px', display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 600, background: '#ffffff' }}
                  >
                    <PlusCircle size={15} color="#2563eb" /> + Add Multiple Workers
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => openAddWorkerForCategory(isCategorySelected ? activeCatObj?.id : 'Mason')}
                    style={{ fontSize: '0.82rem', padding: '8px 16px', display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}
                  >
                    <Plus size={15} /> + Add Worker
                  </button>
                </div>
              </div>

              {/* Horizontal Category Navigation Tabs / Filter Pills */}
              <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '6px' }}>
                <button
                  type="button"
                  onClick={() => changeLaborCategory('all')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '20px',
                    border: '1px solid',
                    borderColor: (!isCategorySelected) ? '#2563eb' : '#cbd5e1',
                    background: (!isCategorySelected) ? '#2563eb' : '#ffffff',
                    color: (!isCategorySelected) ? '#ffffff' : '#475569',
                    fontSize: '0.78rem',
                    fontWeight: (!isCategorySelected) ? 700 : 500,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  All Categories
                  <span style={{
                    background: (!isCategorySelected) ? 'rgba(255,255,255,0.25)' : '#f1f5f9',
                    color: (!isCategorySelected) ? '#ffffff' : '#64748b',
                    padding: '1px 6px',
                    borderRadius: '10px',
                    fontSize: '0.7rem',
                    fontWeight: 700
                  }}>
                    {totalWorkers}
                  </span>
                </button>

                {CONSTRUCTION_LABOR_CATEGORIES.map(cat => {
                  const count = getCountForCat(cat.id);
                  const isSelected = isCategorySelected && (laborCategoryFilter.toLowerCase() === cat.id.toLowerCase() || laborCategoryFilter.toLowerCase() === cat.label.toLowerCase());

                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => changeLaborCategory(cat.id)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '20px',
                        border: '1px solid',
                        borderColor: isSelected ? '#2563eb' : '#cbd5e1',
                        background: isSelected ? '#2563eb' : '#ffffff',
                        color: isSelected ? '#ffffff' : (count > 0 ? '#1e293b' : '#64748b'),
                        fontSize: '0.78rem',
                        fontWeight: isSelected ? 700 : 500,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <span>{cat.label}</span>
                      <span style={{
                        background: isSelected ? 'rgba(255,255,255,0.25)' : (count > 0 ? '#dcfce7' : '#f1f5f9'),
                        color: isSelected ? '#ffffff' : (count > 0 ? '#166534' : '#94a3b8'),
                        padding: '1px 6px',
                        borderRadius: '10px',
                        fontSize: '0.7rem',
                        fontWeight: 700
                      }}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* If Specific Category Selected: Hero Details & Quick Registration Banner */}
            {isCategorySelected && activeCatObj && (
              <div className="glass-card" style={{ padding: '16px 20px', borderLeft: '4px solid #2563eb', background: '#f8fafc' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="badge badge-blue" style={{ fontSize: '0.78rem', fontWeight: 700 }}>
                        {activeCatObj.label} Category
                      </span>
                      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                        Standard Rate: <strong style={{ color: '#059669' }}>₹{activeCatObj.defaultWage}/day</strong>
                      </span>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: '#475569', margin: '6px 0 0 0' }}>
                      {activeCatObj.description}
                    </p>
                    <div style={{ marginTop: '8px', fontSize: '0.78rem', color: '#64748b' }}>
                      Registered: <strong style={{ color: '#0f172a' }}>{displayedWorkers.length} {activeCatObj.label}(s)</strong> | 
                      Present: <strong style={{ color: '#059669' }}>{catPresentCount}</strong> | 
                      Absent: <strong style={{ color: '#dc2626' }}>{catAbsentCount}</strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="btn btn-sm btn-secondary"
                      onClick={() => openBatchAddModal(activeCatObj.id, 3)}
                      style={{ fontSize: '0.78rem', padding: '6px 12px', background: '#ffffff' }}
                    >
                      <PlusCircle size={14} color="#2563eb" /> + Add Multiple {activeCatObj.label}s
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-primary"
                      onClick={() => openAddWorkerForCategory(activeCatObj.id)}
                      style={{ fontSize: '0.78rem', padding: '6px 14px', fontWeight: 700 }}
                    >
                      <Plus size={14} /> + Add {activeCatObj.label}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Workers Table */}
            <div className="glass-card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h4 style={{ fontSize: '0.95rem', color: '#0f172a', fontWeight: 700, margin: 0 }}>
                  {isCategorySelected ? `${activeCatObj?.label || laborCategoryFilter} Worker Directory` : 'Complete Site Workforce Directory'} ({displayedWorkers.length})
                </h4>
                {isCategorySelected && (
                  <button
                    type="button"
                    onClick={() => changeLaborCategory('all')}
                    style={{ border: 'none', background: '#f1f5f9', color: '#475569', borderRadius: '6px', padding: '4px 10px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}
                  >
                    View All Categories
                  </button>
                )}
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1.5px solid #cbd5e1', textAlign: 'left', color: '#475569', background: '#f8fafc' }}>
                      <th style={{ padding: '10px 8px', fontWeight: 700 }}>Worker Name</th>
                      <th style={{ padding: '10px 8px', fontWeight: 700 }}>Category / Trade</th>
                      <th style={{ padding: '10px 8px', fontWeight: 700 }}>Mobile Number</th>
                      <th style={{ padding: '10px 8px', fontWeight: 700 }}>Daily Wage (₹)</th>
                      <th style={{ padding: '10px 8px', fontWeight: 700 }}>Attendance</th>
                      <th style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 700 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedWorkers.map(w => (
                      <tr key={w.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '10px 8px', fontWeight: 600, color: '#0f172a' }}>
                          {w.name}
                        </td>
                        <td style={{ padding: '10px 8px', color: '#475569' }}>
                          <span style={{ background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, color: '#334155' }}>
                            {w.trade}
                          </span>
                        </td>
                        <td style={{ padding: '10px 8px', color: '#64748b' }}>
                          {w.phone ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <Phone size={12} /> {w.phone}
                            </span>
                          ) : '-'}
                        </td>
                        <td style={{ padding: '10px 8px', color: '#0f172a', fontWeight: 700 }}>
                          ₹{w.dailyWage || 500}
                        </td>
                        <td style={{ padding: '10px 8px' }}>
                          <button
                            type="button"
                            className="btn btn-sm"
                            onClick={() => toggleWorkerStatus(w.id)}
                            style={{
                              background: w.status === 'Present' ? '#dcfce7' : '#fee2e2',
                              color: w.status === 'Present' ? '#166534' : '#991b1b',
                              border: 'none',
                              padding: '5px 12px',
                              borderRadius: '6px',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            {w.status || 'Present'} (Click to toggle)
                          </button>
                        </td>
                        <td style={{ padding: '10px 8px', textAlign: 'right' }}>
                          <button
                            type="button"
                            onClick={() => onDeleteWorker && onDeleteWorker(w.id)}
                            style={{ border: 'none', background: '#fee2e2', color: '#dc2626', borderRadius: '6px', padding: '6px 8px', cursor: 'pointer' }}
                            title="Delete worker"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {displayedWorkers.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                    <Users size={36} color="#cbd5e1" style={{ margin: '0 auto 10px auto', display: 'block' }} />
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
                      {isCategorySelected 
                        ? `No ${activeCatObj?.label || 'workers'} registered under this category yet` 
                        : 'No Site Workers Added Yet'}
                    </div>
                    <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '6px 0 16px 0' }}>
                      {isCategorySelected
                        ? `Register names of ${activeCatObj?.label || 'workers'} for this category.`
                        : 'Register site workers, masons, laborers, and helpers to manage site attendance.'}
                    </p>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => openAddWorkerForCategory(isCategorySelected ? activeCatObj?.id : 'Mason')}
                        style={{ fontSize: '0.82rem', padding: '8px 16px', fontWeight: 700 }}
                      >
                        + Add {isCategorySelected ? activeCatObj?.label : 'Worker'}
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => openBatchAddModal(isCategorySelected ? activeCatObj?.id : 'Mason', 3)}
                        style={{ fontSize: '0.82rem', padding: '8px 16px', fontWeight: 600, background: '#ffffff' }}
                      >
                        + Batch Add Multiple Names
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        );
      })()}



      {/* SECTION 5: Site Construction Progress */}
      {(activeTab === 'site_progress') && (
        <div className="glass-card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '1.15rem', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a', fontWeight: 700 }}>
            <TrendingUp size={18} color="#059669" /> Site Construction Progress
          </h3>

          <div className="grid-2" style={{ marginBottom: '20px' }}>
            <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <p style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Current Stage</p>
              <h4 style={{ fontSize: '1rem', marginTop: '4px', color: '#0f172a', fontWeight: 700 }}>{proj.currentStage || '1. Land Survey & Plot Layout Planning'}</h4>

              <div style={{ marginTop: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                  <span>Overall Progress</span>
                  <span style={{ fontWeight: 'bold', color: '#d97706' }}>{proj.progress || 0}%</span>
                </div>
                <div className="progress-track" style={{ height: '12px' }}>
                  <div className="progress-fill" style={{ width: `${proj.progress || 0}%` }}></div>
                </div>
              </div>
            </div>

            <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ marginBottom: '10px' }}>
                <p style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 600 }}>Work Completed</p>
                <p style={{ fontSize: '0.85rem', color: '#475569', marginTop: '2px', fontWeight: 500 }}>
                  {proj.workCompleted || 'Excavation & Sub-structure Preparation'}
                </p>
              </div>
              <div>
                <p style={{ fontSize: '0.78rem', color: '#d97706', fontWeight: 600 }}>Work Pending</p>
                <p style={{ fontSize: '0.85rem', color: '#475569', marginTop: '2px', fontWeight: 500 }}>
                  {proj.workPending || 'Super-structure casting, Brickwork & Finishing'}
                </p>
              </div>
            </div>
          </div>

          {/* Execution Milestones Checklist */}
          <div>
            <h4 style={{ fontSize: '0.95rem', color: '#0f172a', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
              <CheckSquare size={16} color="#2563eb" /> Project Execution Stage Milestones
            </h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {currentProjectTasks.map((t, idx) => {
                const isDone = t.status === 'Completed';
                const isUnderApproval = t.status === 'Awaiting Approval';
                const isOngoing = t.status === 'In-Progress';

                return (
                  <div 
                    key={t.id || idx}
                    style={{
                      padding: '12px 14px',
                      background: isDone ? '#f0fdf4' : (isOngoing ? '#eff6ff' : '#f8fafc'),
                      border: `1px solid ${isDone ? '#bbf7d0' : (isOngoing ? '#bfdbfe' : '#e2e8f0')}`,
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {isDone ? (
                        <CheckCircle size={18} color="#059669" />
                      ) : isOngoing ? (
                        <Clock size={18} color="#2563eb" />
                      ) : (
                        <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '2px solid #cbd5e1' }} />
                      )}
                      <span style={{ fontSize: '0.88rem', fontWeight: isDone || isOngoing ? 700 : 500, color: isDone ? '#166534' : (isOngoing ? '#1e40af' : '#475569') }}>
                        {t.name}
                      </span>
                    </div>

                    <div>
                      <span className={`badge ${isDone ? 'badge-emerald' : isUnderApproval ? 'badge-amber' : isOngoing ? 'badge-blue' : 'badge-amber'}`}>
                        {t.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 6: Auto-Compiled Daily Progress Report (DPR) */}
      {(activeTab === 'daily_reports') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {!hasAcceptedProject ? (
            <div className="glass-card" style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
              <Clipboard size={36} color="#cbd5e1" style={{ margin: '0 auto 12px auto', display: 'block' }} />
              <h4 style={{ fontSize: '1.1rem', color: '#0f172a', margin: '0 0 6px 0' }}>No Active Site Project</h4>
              <p style={{ fontSize: '0.85rem', margin: 0 }}>
                {pendingProjects.length > 0
                  ? 'Please accept your pending project on the Dashboard to start submitting daily progress reports.'
                  : 'Daily reports will become available once Admin assigns a project to you.'}
              </p>
            </div>
          ) : (
          /* Auto-Compiled DPR Card */
          <div className="glass-card" style={{ padding: '24px', borderLeft: '5px solid #d97706' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '18px', borderBottom: '1px solid #e2e8f0', paddingBottom: '14px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="badge badge-amber" style={{ fontSize: '0.78rem', fontWeight: 700 }}>
                    Auto-Compiled Daily Report
                  </span>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    Date: <strong>{new Date().toLocaleDateString('en-GB')}</strong> ({new Date().toISOString().split('T')[0]})
                  </span>
                </div>
                <h3 style={{ fontSize: '1.25rem', marginTop: '6px', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a', fontWeight: 800 }}>
                  <Clipboard size={22} color="#d97706" /> Today's Daily Progress Report (DPR)
                </h3>
                <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0 }}>
                  Automatically prepared from ongoing site execution tasks, overall progress %, and uploaded photo evidence.
                </p>
              </div>

              {/* Status & Project Badge */}
              <div style={{ textAlign: 'right' }}>
                <span className="badge badge-blue" style={{ fontSize: '0.82rem', padding: '5px 12px' }}>
                  {proj.name}
                </span>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                  Location: <strong>{proj.location}</strong>
                </div>
              </div>
            </div>

            {/* Summary Metrics Grid */}
            <div className="grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '20px' }}>
              
              {/* Metric 1: Overall Site Progress */}
              <div style={{ padding: '14px', background: '#fffbeb', borderRadius: '10px', border: '1px solid #fde68a' }}>
                <span style={{ fontSize: '0.75rem', color: '#92400e', fontWeight: 600, textTransform: 'uppercase' }}>Site Progress</span>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: '4px' }}>
                  <h3 style={{ fontSize: '1.6rem', color: '#b45309', margin: 0, fontWeight: 800 }}>{proj.progress || 0}%</h3>
                  <span style={{ fontSize: '0.75rem', color: '#78350f', fontWeight: 600 }}>
                    {completedStages.length}/{currentProjectTasks.length} Stages
                  </span>
                </div>
                <div className="progress-track" style={{ height: '8px', marginTop: '8px', background: '#fed7aa' }}>
                  <div className="progress-fill" style={{ width: `${proj.progress || 0}%`, background: '#d97706' }}></div>
                </div>
              </div>

              {/* Metric 2: Site Engineer Assigned */}
              <div style={{ padding: '14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Site Engineer In Charge</span>
                <h4 style={{ fontSize: '1.05rem', color: '#0f172a', marginTop: '4px', margin: 0, fontWeight: 700 }}>
                  {proj.acceptedBy || proj.engineerInCharge || currentUser?.name || 'Site Engineer'}
                </h4>
                <div style={{ fontSize: '0.75rem', color: '#059669', marginTop: '6px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle size={13} /> Accepted & Signed on Site
                </div>
              </div>

              {/* Metric 3: Active Stages Status */}
              <div style={{ padding: '14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Current Execution Stage</span>
                <h4 style={{ fontSize: '0.92rem', color: '#2563eb', marginTop: '4px', margin: 0, fontWeight: 700 }}>
                  {ongoingStages[0]?.name || proj.currentStage || '1. Land Survey & Planning'}
                </h4>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '6px' }}>
                  {ongoingStages.length} In-Progress • {pendingStages.length} Next
                </div>
              </div>

              {/* Metric 4: Workforce on Site */}
              <div style={{ padding: '14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Labor & Workforce</span>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: '4px' }}>
                  <h3 style={{ fontSize: '1.5rem', color: '#0f172a', margin: 0, fontWeight: 800 }}>{autoWorkersCount}</h3>
                  <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600 }}>Active on Site</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '6px' }}>
                  Standard Daily Shift
                </div>
              </div>

            </div>

            {/* Auto-Calculated Work Completed Section */}
            <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckSquare size={16} color="#059669" /> Auto-Compiled Daily Work Summary
                </span>
                <span className="badge badge-emerald" style={{ fontSize: '0.72rem' }}>
                  Ready to Transmit to Admin
                </span>
              </div>
              <div style={{ background: '#ffffff', padding: '12px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', color: '#334155', lineHeight: 1.5, fontWeight: 500 }}>
                {autoWorkDoneSummary}
              </div>

              {/* Task Badges Breakdown */}
              <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {completedStages.map(s => (
                  <span key={s.id} style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <CheckCircle size={12} color="#059669" /> {s.name} (Done)
                  </span>
                ))}
                {ongoingStages.map(s => (
                  <span key={s.id} style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <Clock size={12} color="#2563eb" /> {s.name} (Ongoing)
                  </span>
                ))}
              </div>
            </div>

            {/* Auto-Attached Photo Evidence */}
            <div style={{ marginBottom: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Camera size={16} color="#2563eb" /> Attached Site Photo Evidence ({allAvailablePhotos.length} Photos)
                </span>
                {allAvailablePhotos.length === 0 && (
                  <span style={{ fontSize: '0.75rem', color: '#d97706' }}>
                    Photos uploaded in the Tasks tab will automatically show here.
                  </span>
                )}
              </div>

              {allAvailablePhotos.length > 0 ? (
                <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', padding: '4px' }}>
                  {allAvailablePhotos.map((imgUrl, iIdx) => (
                    <div 
                      key={iIdx} 
                      onClick={() => {
                        setViewPhotoGallery(allAvailablePhotos);
                        setViewPhotoIndex(iIdx);
                        setViewPhotoUrl(imgUrl);
                      }}
                      style={{ width: '130px', height: '95px', borderRadius: '8px', overflow: 'hidden', border: '2px solid #e2e8f0', cursor: 'pointer', flexShrink: 0, position: 'relative', boxShadow: '0 2px 5px rgba(0,0,0,0.08)' }}
                    >
                      <img 
                        src={imgUrl} 
                        alt={`Evidence ${iIdx + 1}`} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="130" height="95" fill="%23f1f5f9"><rect width="100%" height="100%" fill="%23e2e8f0"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="12" fill="%2364748b">Site Photo</text></svg>';
                        }}
                      />
                      <span style={{ position: 'absolute', bottom: '4px', right: '4px', background: 'rgba(0,0,0,0.6)', color: '#ffffff', fontSize: '0.65rem', padding: '1px 5px', borderRadius: '3px', fontWeight: 600 }}>
                        #{iIdx + 1}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1', fontSize: '0.82rem', color: '#64748b', textAlign: 'center' }}>
                  No photos uploaded for site tasks yet. Photos uploaded in the Tasks tab will automatically appear here.
                </div>
              )}
            </div>

            {/* Daily Materials Consumed / Used in Tasks Section (Auto-Compiled & Read-Only) */}
            <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Package size={16} color="#d97706" /> Daily Materials Consumed in Tasks
                  </span>
                  <p style={{ fontSize: '0.74rem', color: '#64748b', margin: '2px 0 0 0' }}>
                    Auto-compiled from completed task stages. Read-only summary for direct submission to Admin.
                  </p>
                </div>
                <span className="badge badge-amber" style={{ fontSize: '0.72rem' }}>
                  Auto-Calculated from Tasks
                </span>
              </div>

              {/* List of auto-compiled materials from tasks */}
              {taskMaterialsConsolidated.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '10px', marginBottom: '14px' }}>
                  {taskMaterialsConsolidated.map((item, idx) => (
                    <div key={idx} style={{ background: '#ffffff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                      <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.name}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', fontSize: '0.78rem' }}>
                        <span style={{ color: '#475569', fontWeight: 600 }}>Quantity: <strong>{item.quantity} {item.unit}</strong></span>
                        <span style={{ color: '#059669', fontWeight: 800 }}>₹{item.totalCost.toLocaleString('en-IN')}</span>
                      </div>
                      {item.taskNames && item.taskNames.length > 0 && (
                        <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          Stage: {item.taskNames.join(' • ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '16px', background: '#ffffff', borderRadius: '8px', border: '1px dashed #cbd5e1', fontSize: '0.82rem', color: '#64748b', textAlign: 'center', marginBottom: '14px' }}>
                  No materials recorded in tasks yet. Materials and photos submitted in the Tasks tab will automatically appear here.
                </div>
              )}

              {/* Auto Expense Summary Bar */}
              <div style={{ background: '#ffffff', padding: '12px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', fontSize: '0.8rem' }}>
                  <span style={{ color: '#b45309', fontWeight: 600 }}>
                    Material Cost: <strong>₹{dprAutoMaterialCost.toLocaleString('en-IN')}</strong>
                  </span>
                  <span style={{ color: '#1d4ed8', fontWeight: 600 }}>
                    Labor Wages: <strong>₹{(dprAutoLaborCost > 0 ? dprAutoLaborCost : (autoWorkersCount * 500)).toLocaleString('en-IN')}</strong> ({dprAutoLaborCount} Workers{taskLaborConsolidated.length > 0 ? `: ${taskLaborConsolidated.map(l => `${l.role}: ${l.count} @ ₹${l.dailyWage}`).join(', ')}` : ''})
                  </span>
                  {dprAutoMachineryCharge > 0 && (
                    <span style={{ color: '#0369a1', fontWeight: 600 }}>
                      Machinery Charge: <strong>₹{dprAutoMachineryCharge.toLocaleString('en-IN')}</strong> ({machineryUsed})
                    </span>
                  )}
                </div>
                <div style={{ background: '#ecfdf5', color: '#059669', padding: '4px 12px', borderRadius: '6px', fontSize: '0.88rem', fontWeight: 800, border: '1px solid #a7f3d0' }}>
                  Total Daily Stage Cost: ₹{dprAutoTotalCost.toLocaleString('en-IN')}
                </div>
              </div>

              <div style={{ fontSize: '0.73rem', color: '#64748b', marginTop: '10px', fontStyle: 'italic' }}>
                Notice: Daily Report is auto-compiled and read-only. To modify materials, quantities, or photos, please click "Edit Details" on the task in the Tasks tab.
              </div>
            </div>

            {/* Machinery & Heavy Equipment Grid-Down Section (Integrated into DPR) */}
            <div style={{ padding: '16px', background: '#f0f9ff', borderRadius: '10px', border: '1px solid #bae6fd', marginBottom: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0369a1', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Briefcase size={16} color="#0284c7" /> Site Machinery & Equipment Deployed Today
                  </span>
                  <p style={{ fontSize: '0.74rem', color: '#64748b', margin: '2px 0 0 0' }}>
                    Select heavy machinery or equipment used on site and record its daily charge / rental cost.
                  </p>
                </div>
                <span className="badge badge-blue" style={{ fontSize: '0.72rem' }}>
                  Machinery & Daily Charge
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: machineryUsed !== 'None' ? '1fr 1fr' : '1fr', gap: '14px', alignItems: 'flex-end' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Select Machinery Deployed (Grid-Down Selection)
                  </label>
                  <select
                    className="input-field"
                    value={machineryUsed}
                    onChange={(e) => {
                      setMachineryUsed(e.target.value);
                      if (e.target.value === 'None') setMachineryCharge('');
                    }}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #94a3b8', background: '#ffffff', fontSize: '0.88rem', fontWeight: 600, color: '#0f172a' }}
                  >
                    {MACHINERY_OPTIONS.map((mOpt, mIdx) => (
                      <option key={mIdx} value={mOpt}>{mOpt}</option>
                    ))}
                  </select>
                </div>

                {machineryUsed !== 'None' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                      Daily Machinery Charge / Rent (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      className="input-field"
                      placeholder="e.g. 8500"
                      value={machineryCharge}
                      onChange={(e) => setMachineryCharge(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #94a3b8', background: '#ffffff', fontSize: '0.88rem', fontWeight: 600, color: '#0f172a' }}
                    />
                  </div>
                )}
              </div>

              {machineryUsed !== 'None' && (
                <div style={{ marginTop: '10px', fontSize: '0.76rem', color: '#0284c7', background: '#e0f2fe', padding: '6px 12px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Machinery selected: <strong>{machineryUsed}</strong></span>
                  <span>Daily Charge added: <strong>₹{Number(machineryCharge || 0).toLocaleString('en-IN')}</strong></span>
                </div>
              )}
            </div>

            {/* Prominent Auto Submit Button */}
            <button 
              type="button" 
              className="btn btn-primary" 
              onClick={handleAutoSubmitDpr}
              disabled={dprSubmitting}
              style={{ 
                width: '100%', 
                padding: '14px 20px', 
                fontSize: '0.95rem', 
                fontWeight: 700, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '10px',
                background: '#d97706',
                borderColor: '#b45309',
                boxShadow: '0 4px 12px rgba(217, 119, 6, 0.25)',
                cursor: dprSubmitting ? 'not-allowed' : 'pointer',
                opacity: dprSubmitting ? 0.8 : 1
              }}
            >
              <Send size={18} /> {dprSubmitting ? 'Submitting DPR...' : "Submit Today's Daily Report (DPR) to Admin"}
            </button>
          </div>
          )}

          {/* DPR History Log */}
          <div className="glass-card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a', fontWeight: 700 }}>
              <FileText size={18} color="#2563eb" /> Daily Progress Reports & History Log
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '500px', overflowY: 'auto' }}>
              {dprs.map(dpr => {
                const reportPhotos = Array.isArray(dpr.photos) && dpr.photos.length > 0
                  ? dpr.photos
                  : (dpr.sitePhoto ? [dpr.sitePhoto] : []);

                return (
                  <div key={dpr.id} style={{ padding: '16px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>
                        {dpr.date} — {dpr.projectName}
                      </div>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <span className="badge badge-blue">{dpr.engineerName || 'Site Engineer'}</span>
                        {dpr.progress !== undefined && dpr.progress !== null && (
                          <span className="badge badge-amber" style={{ fontWeight: 700 }}>Progress: {dpr.progress}%</span>
                        )}
                      </div>
                    </div>

                    <p style={{ fontSize: '0.85rem', color: '#334155', marginTop: '4px', lineHeight: 1.4 }}>
                      <strong>Work Done:</strong> {dpr.workDone}
                    </p>

                    <div style={{ display: 'flex', gap: '16px', fontSize: '0.78rem', color: '#64748b', marginTop: '8px', flexWrap: 'wrap' }}>
                      <span><strong>Workers:</strong> {dpr.laborCount}</span>
                      <span><strong>Materials:</strong> {dpr.materialsUsed}</span>
                    </div>

                    {/* Dedicated Expense Breakdown Field */}
                    {(dpr.totalCost > 0 || dpr.materialCost > 0 || dpr.laborCost > 0 || dpr.machineryCharge > 0) && (
                      <div style={{ marginTop: '10px', background: '#ffffff', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '0.78rem' }}>
                          <span style={{ color: '#b45309', fontWeight: 600 }}>
                            Material Cost: ₹{Number(dpr.materialCost || 0).toLocaleString('en-IN')}
                          </span>
                          <span style={{ color: '#1d4ed8', fontWeight: 600 }}>
                            Labor Wages: ₹{Number(dpr.laborCost || 0).toLocaleString('en-IN')} ({dpr.laborCount || 0} Workers)
                          </span>
                          {Number(dpr.machineryCharge || 0) > 0 && (
                            <span style={{ color: '#0369a1', fontWeight: 600 }}>
                              Machinery Charge: ₹{Number(dpr.machineryCharge).toLocaleString('en-IN')} ({dpr.machineryUsed || 'Equipment'})
                            </span>
                          )}
                        </div>
                        <div style={{ background: '#ecfdf5', color: '#059669', padding: '3px 10px', borderRadius: '6px', fontSize: '0.82rem', fontWeight: 800, border: '1px solid #a7f3d0' }}>
                          Total Daily Site Cost: ₹{Number(dpr.totalCost || ((Number(dpr.materialCost || 0) + Number(dpr.laborCost || 0) + Number(dpr.machineryCharge || 0)))).toLocaleString('en-IN')}
                        </div>
                      </div>
                    )}

                    {dpr.machineryUsed && dpr.machineryUsed !== 'None' && !dpr.machineryCharge && (
                      <div style={{ marginTop: '6px', fontSize: '0.75rem', color: '#0284c7' }}>
                        <strong>Machinery Used:</strong> {dpr.machineryUsed}
                      </div>
                    )}

                    {reportPhotos.length > 0 && (
                      <div style={{ marginTop: '10px', display: 'flex', gap: '8px', overflowX: 'auto', padding: '2px' }}>
                        {reportPhotos.map((ph, pIdx) => (
                          <div 
                            key={pIdx}
                            onClick={() => {
                              setViewPhotoGallery(reportPhotos);
                              setViewPhotoIndex(pIdx);
                              setViewPhotoUrl(ph);
                            }}
                            style={{ width: '100px', height: '70px', borderRadius: '6px', overflow: 'hidden', border: '1px solid #cbd5e1', cursor: 'pointer', flexShrink: 0 }}
                          >
                            <img 
                              src={ph} 
                              alt={`Evidence ${pIdx + 1}`} 
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="70" fill="%23f1f5f9"><rect width="100%" height="100%" fill="%23e2e8f0"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="10" fill="%2364748b">Site Photo</text></svg>';
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {dpr.remarks && dpr.remarks !== 'None' && (
                      <div style={{ marginTop: '8px', padding: '6px 10px', background: '#f1f5f9', borderRadius: '4px', fontSize: '0.75rem', color: '#475569' }}>
                        <strong>Notes:</strong> {dpr.remarks}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* SECTION: Site Expenses & Site Wallet (Petty Cash) */}
      {(activeTab === 'expenses') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Site Wallet Summary Header Card */}
          <div className="glass-card" style={{ padding: '24px', borderLeft: '5px solid #059669', background: '#ffffff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="badge badge-emerald" style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                    <CreditCard size={13} style={{ marginRight: '4px' }} /> Site Engineer Wallet
                  </span>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    Petty Cash & Site Expense Management
                  </span>
                </div>
                <h3 style={{ fontSize: '1.35rem', marginTop: '6px', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a', fontWeight: 800 }}>
                  <DollarSign size={24} color="#059669" /> Site Expenses & Wallet Balance
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
                  Log on-site expenses (fuel, tools, transport, refreshments). When Admin releases payment, funds are instantly credited to your wallet balance.
                </p>
              </div>

              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setShowExpenseModal(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#059669',
                  borderColor: '#047857',
                  padding: '10px 18px',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  boxShadow: '0 2px 8px rgba(5, 150, 105, 0.25)'
                }}
              >
                <Plus size={16} /> Submit New Expense Claim
              </button>
            </div>

            {/* Wallet Metric Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '14px' }}>
              
              {/* Metric 1: Live Site Wallet Balance (Paid by Admin) */}
              <div style={{ padding: '16px', background: '#ecfdf5', borderRadius: '10px', border: '1.5px solid #a7f3d0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: '#047857', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Live Wallet Balance
                  </span>
                  <span className="badge badge-emerald" style={{ fontSize: '0.68rem', padding: '1px 6px' }}>Paid by Admin</span>
                </div>
                <h3 style={{ fontSize: '1.8rem', color: '#065f46', margin: '8px 0 4px 0', fontWeight: 900 }}>
                  ₹{walletPaidTotal.toLocaleString('en-IN')}
                </h3>
                <div style={{ fontSize: '0.74rem', color: '#047857', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle size={13} color="#059669" /> Cash on hand / Reimbursed funds
                </div>
              </div>

              {/* Metric 2: Pending Claims for Admin Payment */}
              <div style={{ padding: '16px', background: '#fffbeb', borderRadius: '10px', border: '1.5px solid #fde68a' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: '#92400e', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Pending Admin Release
                  </span>
                  <span className="badge badge-amber" style={{ fontSize: '0.68rem', padding: '1px 6px' }}>In Review</span>
                </div>
                <h3 style={{ fontSize: '1.8rem', color: '#b45309', margin: '8px 0 4px 0', fontWeight: 900 }}>
                  ₹{walletPendingTotal.toLocaleString('en-IN')}
                </h3>
                <div style={{ fontSize: '0.74rem', color: '#92400e', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={13} color="#d97706" /> Awaiting Admin approval & payment
                </div>
              </div>

              {/* Metric 3: Total Expense Claims */}
              <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Total Expense Claims
                </span>
                <h3 style={{ fontSize: '1.8rem', color: '#0f172a', margin: '8px 0 4px 0', fontWeight: 900 }}>
                  {myExpenses.length}
                </h3>
                <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                  {myExpenses.filter(e => e.status === 'Paid').length} Paid • {myExpenses.filter(e => e.status === 'Pending').length} Pending
                </div>
              </div>

              {/* Metric 4: Assigned Site Project */}
              <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Site In-Charge
                </span>
                <h4 style={{ fontSize: '1.05rem', color: '#0f172a', margin: '8px 0 4px 0', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {proj.name}
                </h4>
                <div style={{ fontSize: '0.74rem', color: '#2563eb', fontWeight: 600 }}>
                  Engineer: {currentUser?.name || 'Site Engineer'}
                </div>
              </div>

            </div>

            <div style={{ padding: '10px 14px', background: '#f1f5f9', borderRadius: '8px', fontSize: '0.76rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle size={15} color="#059669" />
              <span><strong>How it works:</strong> Log local site purchases (with receipt photo). Once Admin clicks <strong>"Pay / Release Funds"</strong>, the payment immediately credits into your Site Wallet Balance.</span>
            </div>
          </div>

          {/* Expense Claims & Wallet Transactions History Log */}
          <div className="glass-card" style={{ padding: '22px', background: '#ffffff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
              <h3 style={{ fontSize: '1.15rem', color: '#0f172a', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={18} color="#2563eb" /> Site Expense Claims & Wallet Transactions
              </h3>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                Showing {myExpenses.length} Records
              </span>
            </div>

            {myExpenses.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', background: '#f8fafc', borderRadius: '10px', border: '1px dashed #cbd5e1', color: '#64748b' }}>
                <DollarSign size={38} color="#cbd5e1" style={{ margin: '0 auto 10px auto', display: 'block' }} />
                <h4 style={{ fontSize: '1.05rem', color: '#0f172a', margin: '0 0 6px 0' }}>No Expenses Logged Yet</h4>
                <p style={{ fontSize: '0.85rem', margin: '0 0 16px 0' }}>
                  Click below to submit your first site petty cash or expense claim for Admin payment.
                </p>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setShowExpenseModal(true)}
                  style={{ background: '#059669', borderColor: '#047857' }}
                >
                  <Plus size={15} /> Submit Site Expense
                </button>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase' }}>
                      <th style={{ padding: '12px 14px' }}>Date</th>
                      <th style={{ padding: '12px 14px' }}>Expense Title & Details</th>
                      <th style={{ padding: '12px 14px' }}>Category</th>
                      <th style={{ padding: '12px 14px' }}>Project</th>
                      <th style={{ padding: '12px 14px' }}>Receipt / Bill</th>
                      <th style={{ padding: '12px 14px' }}>Amount (₹)</th>
                      <th style={{ padding: '12px 14px' }}>Wallet Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myExpenses.map((exp, expIdx) => {
                      const isPaid = exp.status === 'Paid';
                      return (
                        <tr key={exp.id || expIdx} style={{ borderBottom: '1px solid #e2e8f0', background: isPaid ? '#ffffff' : '#fffdfa' }}>
                          <td style={{ padding: '12px 14px', whiteSpace: 'nowrap', color: '#64748b', fontSize: '0.82rem' }}>
                            {exp.date}
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
                            <span style={{ background: '#f1f5f9', color: '#475569', padding: '3px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                              {exp.category}
                            </span>
                          </td>
                          <td style={{ padding: '12px 14px', whiteSpace: 'nowrap', color: '#475569', fontSize: '0.82rem' }}>
                            {exp.projectName || proj.name}
                          </td>
                          <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                            {exp.receiptPhoto ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setViewPhotoGallery([exp.receiptPhoto]);
                                  setViewPhotoIndex(0);
                                  setViewPhotoUrl(exp.receiptPhoto);
                                }}
                                style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 8px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '6px', color: '#2563eb', fontSize: '0.74rem', fontWeight: 600, cursor: 'pointer' }}
                              >
                                <Eye size={13} /> View Bill
                              </button>
                            ) : (
                              <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontStyle: 'italic' }}>No Receipt</span>
                            )}
                          </td>
                          <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                            <strong style={{ fontSize: '0.98rem', color: isPaid ? '#059669' : '#b45309' }}>
                              ₹{Number(exp.amount).toLocaleString('en-IN')}
                            </strong>
                          </td>
                          <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                            {isPaid ? (
                              <span className="badge badge-emerald" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.76rem', fontWeight: 700, padding: '4px 10px' }}>
                                <CheckCircle size={13} /> Paid to Wallet
                              </span>
                            ) : (
                              <span className="badge badge-amber" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.76rem', fontWeight: 700, padding: '4px 10px' }}>
                                <Clock size={13} /> Awaiting Release
                              </span>
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
      )}

      {/* Expense Claim Creation Modal */}
      {showExpenseModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
          <div style={{ background: '#ffffff', width: '100%', maxWidth: '520px', borderRadius: '12px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            
            {/* Modal Header */}
            <div style={{ padding: '18px 22px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#0f172a', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <DollarSign size={20} color="#059669" /> Submit Site Expense Claim
                </h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.76rem', color: '#64748b' }}>
                  Admin will review this claim and release payment to your Site Wallet.
                </p>
              </div>
              <button 
                type="button" 
                onClick={() => setShowExpenseModal(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitExpenseClaim} style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                  Expense Title / Purpose *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Generator Diesel (25 Liters)"
                  value={expenseForm.title}
                  onChange={(e) => setExpenseForm(prev => ({ ...prev, title: e.target.value }))}
                  className="input-field"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                    Amount (₹) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="e.g. 2400"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm(prev => ({ ...prev, amount: e.target.value }))}
                    className="input-field"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                    Expense Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={expenseForm.date}
                    onChange={(e) => setExpenseForm(prev => ({ ...prev, date: e.target.value }))}
                    className="input-field"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                  Category
                </label>
                <select
                  value={expenseForm.category}
                  onChange={(e) => setExpenseForm(prev => ({ ...prev, category: e.target.value }))}
                  className="input-field"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', background: '#ffffff' }}
                >
                  <option value="Fuel / Diesel">Fuel / Diesel (Generator & Vehicles)</option>
                  <option value="Tools & Hardware Supplies">Tools & Hardware Supplies</option>
                  <option value="Local Transport & Delivery">Local Transport & Delivery</option>
                  <option value="Emergency Labor Cash / Overtime">Emergency Labor Cash / Overtime</option>
                  <option value="Refreshments & Drinking Water">Refreshments & Drinking Water</option>
                  <option value="Site Office & Stationary">Site Office & Stationary</option>
                  <option value="Repairs & Maintenance">Repairs & Maintenance</option>
                  <option value="General Site Expense">General Site Expense</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                  Attach Bill / Receipt Photo (Optional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleExpenseReceiptUpload}
                  style={{ fontSize: '0.82rem', color: '#475569' }}
                />
                {expenseForm.receiptPhoto && (
                  <div style={{ marginTop: '8px', width: '90px', height: '65px', borderRadius: '6px', overflow: 'hidden', border: '1px solid #cbd5e1' }}>
                    <img src={expenseForm.receiptPhoto} alt="Receipt preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                  Description / Remarks
                </label>
                <textarea
                  rows="2"
                  placeholder="Additional details regarding this on-site expense..."
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm(prev => ({ ...prev, description: e.target.value }))}
                  className="input-field"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowExpenseModal(false)}
                  style={{ flex: 1, padding: '10px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={expenseSubmitting}
                  className="btn btn-primary"
                  style={{ flex: 1, padding: '10px', background: '#059669', borderColor: '#047857', fontWeight: 700 }}
                >
                  {expenseSubmitting ? 'Submitting...' : 'Submit Claim'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Material Order Modal */}
      {showMatModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="glass-card" style={{ padding: '24px', width: '90%', maxWidth: '480px' }}>
            <h3 style={{ marginBottom: '14px', color: '#0f172a' }}>Request Material Replenishment</h3>
            <form onSubmit={handleMatSubmit}>
              <div className="form-group">
                <label className="form-label">Material Name & Specification *</label>
                <select 
                  className="form-control" 
                  value={matForm.materialName} 
                  onChange={e => {
                    const chosen = e.target.value;
                    let matchedUnit = matForm.unit;
                    let matchedCost = matForm.estimatedCost;
                    Object.values(CONSTRUCTION_MATERIAL_CATALOG).forEach(cat => {
                      const found = cat.items.find(i => i.name === chosen);
                      if (found) {
                        matchedUnit = found.defaultUnit;
                        matchedCost = String(Number(found.defaultCost) * Number(matForm.quantity || 1));
                      }
                    });
                    setMatForm({ ...matForm, materialName: chosen, unit: matchedUnit, estimatedCost: matchedCost });
                  }}
                >
                  {materials.length > 0 && (
                    <optgroup label="Existing Site Stock Materials">
                      {materials.map(m => (
                        <option key={m.id} value={m.name}>{m.name} ({m.stock} {m.unit} in stock)</option>
                      ))}
                    </optgroup>
                  )}
                  {Object.entries(CONSTRUCTION_MATERIAL_CATALOG).map(([catKey, catObj]) => (
                    <optgroup key={catKey} label={catObj.label}>
                      {catObj.items.map(item => (
                        <option key={item.name} value={item.name}>{item.name} ({item.defaultUnit})</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Quantity Needed</label>
                  <input className="form-control" type="number" value={matForm.quantity} onChange={e => setMatForm({ ...matForm, quantity: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Unit</label>
                  <input className="form-control" value={matForm.unit} onChange={e => setMatForm({ ...matForm, unit: e.target.value })} required />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Estimated Cost (₹)</label>
                <input className="form-control" type="number" value={matForm.estimatedCost} onChange={e => setMatForm({ ...matForm, estimatedCost: e.target.value })} required />
              </div>

              <div className="form-group">
                <label className="form-label">Reason for Requirement</label>
                <textarea className="form-control" placeholder="Describe critical stock deficit..." value={matForm.reason} onChange={e => setMatForm({ ...matForm, reason: e.target.value })} required />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowMatModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Submit Request</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Project Details Modal */}
      {selectedProjectDetails && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100
        }}>
          <div className="glass-card" style={{
            width: '90%', maxWidth: '580px', padding: '24px', background: '#ffffff',
            borderRadius: '12px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e2e8f0', paddingBottom: '14px', marginBottom: '16px' }}>
              <div>
                <span className={`badge ${selectedProjectDetails.progress === 100 ? 'badge-emerald' : selectedProjectDetails.status === 'Pending Acceptance' ? 'badge-amber' : 'badge-blue'}`}>
                  {selectedProjectDetails.status || 'In-Progress'}
                </span>
                <h3 style={{ fontSize: '1.25rem', color: '#0f172a', fontWeight: 700, marginTop: '6px' }}>
                  {selectedProjectDetails.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedProjectDetails(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Content Details Grid */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.9rem', color: '#334155' }}>

              {/* Primary Info Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Project Name</div>
                  <div style={{ fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>{selectedProjectDetails.name}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Category / Type</div>
                  <div style={{ fontWeight: 600, color: '#2563eb', marginTop: '2px' }}>{selectedProjectDetails.type || selectedProjectDetails.category || 'Construction Project'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Client Name</div>
                  <div style={{ fontWeight: 600, color: '#0f172a', marginTop: '2px' }}>{selectedProjectDetails.clientName || 'Private Client'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Client Type / Sector</div>
                  <div style={{ fontWeight: 600, color: '#059669', marginTop: '2px' }}>{selectedProjectDetails.clientType || 'Private Client / Builder'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Client Mobile Contact</div>
                  <div style={{ fontWeight: 600, color: '#2563eb', marginTop: '2px' }}>
                    <Phone size={13} style={{ display: 'inline', verticalAlign: '-2px' }} /> {selectedProjectDetails.clientPhone || selectedProjectDetails.contactPhone || '+91 98765 43210'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Total Allocated Budget</div>
                  <div style={{ fontWeight: 700, color: '#059669', marginTop: '2px' }}>{formatCurrency(selectedProjectDetails.budget)}</div>
                </div>
              </div>

              {/* Location & Site Staff Info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: '#ffffff', padding: '12px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, marginBottom: '2px' }}>Site Location / Address</div>
                  <div style={{ fontWeight: 500, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin size={15} color="#d97706" /> {selectedProjectDetails.location || 'Site Location'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, marginBottom: '2px' }}>Lead Site Engineer In-Charge</div>
                  <div style={{ fontWeight: 600, color: '#0f172a' }}>
                    {selectedProjectDetails.acceptedBy || (selectedProjectDetails.engineerInCharge !== 'Unassigned' ? selectedProjectDetails.engineerInCharge : (selectedProjectDetails.acceptedAt ? (currentUser?.name || 'Site Engineer') : 'Unassigned'))}
                  </div>
                </div>
              </div>

              {/* Execution Stage & Progress */}
              <div style={{ background: '#fffbe6', padding: '12px 14px', borderRadius: '8px', border: '1px solid #ffe58f' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '0.75rem', color: '#d97706', fontWeight: 700 }}>Current Execution Stage</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#b45309' }}>{selectedProjectDetails.progress || 0}% Completed</span>
                </div>
                <div style={{ fontWeight: 600, color: '#78350f', fontSize: '0.88rem' }}>
                  {selectedProjectDetails.currentStage || (selectedProjectDetails.progress > 50 ? 'Superstructure & RCC Floor Slab Work' : 'Substructure, Foundation & Plinth Work')}
                </div>
              </div>

              {/* Dynamic Category Specifications Details Block */}
              {(() => {
                const specs = selectedProjectDetails.specifications || {};
                const type = selectedProjectDetails.type || selectedProjectDetails.category || 'Building';

                const buildingsCount = specs.buildingsCount || (type.includes('Building') ? '1 Building Block' : null);
                const floors = specs.floors || (type.includes('Building') ? 'G+7 Standard Building' : null);
                const bhk = specs.bhk || (type.includes('Building') ? '2 BHK Apartments' : type.includes('Row House') ? '3 BHK Row House' : type.includes('Bungalows') ? '4 BHK Luxury Villa' : null);
                const unitsCount = specs.unitsCount || (type.includes('Row House') ? '10 Units Scheme' : null);
                const lanes = specs.lanes || (type.includes('Road') ? '2-Lane Highway' : null);
                const bridgeType = specs.bridgeType || (type.includes('Bridge') ? 'Flyover Overbridge' : null);

                return (
                  <div style={{ background: '#f0f9ff', padding: '14px', borderRadius: '8px', border: '1px solid #bae6fd' }}>
                    <div style={{ fontSize: '0.8rem', color: '#0369a1', fontWeight: 700, marginBottom: '8px' }}>
                      Category Specification Details
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.85rem' }}>
                      {buildingsCount && (
                        <div><span style={{ color: '#64748b' }}>Buildings Count:</span> <strong>{buildingsCount}</strong></div>
                      )}
                      {floors && (
                        <div><span style={{ color: '#64748b' }}>Floors / Storeys:</span> <strong>{floors}</strong></div>
                      )}
                      {bhk && (
                        <div><span style={{ color: '#64748b' }}>BHK / Villa Type:</span> <strong>{bhk}</strong></div>
                      )}
                      {unitsCount && (
                        <div><span style={{ color: '#64748b' }}>Total Units:</span> <strong>{unitsCount}</strong></div>
                      )}
                      {lanes && (
                        <div><span style={{ color: '#64748b' }}>Road Lanes:</span> <strong>{lanes}</strong></div>
                      )}
                      {bridgeType && (
                        <div><span style={{ color: '#64748b' }}>Bridge Type:</span> <strong>{bridgeType}</strong></div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Footer Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
              <button className="btn btn-secondary" onClick={() => setSelectedProjectDetails(null)} style={{ padding: '8px 16px' }}>
                Close
              </button>

              {selectedProjectDetails.status === 'Pending Acceptance' && (
                <button
                  className="btn btn-primary"
                  style={{ background: '#d97706', borderColor: '#b45309', fontWeight: 600, padding: '8px 18px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  onClick={() => {
                    onAcceptProjectStatus && onAcceptProjectStatus(selectedProjectDetails.id, 'In-Progress', currentUser?.name);
                    setSelectedProjectDetails(null);
                  }}
                >
                  <CheckCircle size={16} /> Accept Project & Start Supervision
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add New Material Modal */}
      {newMatModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100
        }}>
          <div className="glass-card" style={{ padding: '24px', width: '90%', maxWidth: '520px', background: '#ffffff', borderRadius: '14px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.2rem', fontWeight: 700 }}>
                <Package size={20} color="#d97706" /> Add Material to Site Stock
              </h3>
              <button 
                onClick={() => setNewMatModalOpen(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateNewMaterial}>
              {/* 1. Category at TOP */}
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label" style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.85rem' }}>
                  1. Material Category *
                </label>
                <select 
                  className="form-control" 
                  value={newMatData.category} 
                  onChange={e => handleCategoryChange(e.target.value)}
                  style={{ fontWeight: 600, color: '#1e293b', padding: '10px 12px', border: '1.5px solid #d97706', borderRadius: '8px', background: '#fffbeb' }}
                >
                  {Object.keys(CONSTRUCTION_MATERIAL_CATALOG).map(catKey => (
                    <option key={catKey} value={catKey}>
                      {CONSTRUCTION_MATERIAL_CATALOG[catKey].label}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Material Name Selection Dropdown */}
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label" style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.85rem' }}>
                  2. Material Name & Specification *
                </label>
                <select
                  className="form-control"
                  value={isCustomMaterial ? '__custom__' : newMatData.name}
                  onChange={e => handleMaterialSelect(e.target.value)}
                  style={{ fontWeight: 600, color: '#0f172a', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1' }}
                >
                  {(CONSTRUCTION_MATERIAL_CATALOG[newMatData.category]?.items || []).map(item => (
                    <option key={item.name} value={item.name}>
                      {item.name} ({item.defaultUnit})
                    </option>
                  ))}
                  <option value="__custom__">+ Other / Custom Material (Type Your Own Specification)</option>
                </select>

                {isCustomMaterial && (
                  <div style={{ marginTop: '10px' }}>
                    <input 
                      className="form-control" 
                      placeholder="Type custom material name (e.g. UltraTech Super Cement 53G, Tata Tiscon)..." 
                      value={newMatData.customName} 
                      onChange={e => setNewMatData({ ...newMatData, customName: e.target.value, name: e.target.value })} 
                      required 
                      autoFocus
                      style={{ border: '1.5px solid #2563eb', padding: '10px 12px', borderRadius: '8px', background: '#eff6ff' }}
                    />
                  </div>
                )}
              </div>

              {/* 3. Initial Inward Stock & Measurement Unit */}
              <div className="grid-2" style={{ marginBottom: '14px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Initial Inward Stock *</label>
                  <input 
                    className="form-control" 
                    type="number" 
                    min="1"
                    placeholder="e.g. 500" 
                    value={newMatData.stock} 
                    onChange={e => setNewMatData({ ...newMatData, stock: e.target.value })} 
                    required 
                    style={{ padding: '10px 12px', borderRadius: '8px' }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Measurement Unit</label>
                  <select 
                    className="form-control" 
                    value={newMatData.unit} 
                    onChange={e => setNewMatData({ ...newMatData, unit: e.target.value })}
                    style={{ padding: '10px 12px', borderRadius: '8px' }}
                  >
                    <option value="Bags">Bags</option>
                    <option value="Tons">Tons</option>
                    <option value="Kg">Kg</option>
                    <option value="Brass">Brass</option>
                    <option value="Cu.M">Cu.M (Cubic Meter)</option>
                    <option value="Nos">Nos (Pieces / Bricks / Blocks)</option>
                    <option value="Liters">Liters</option>
                    <option value="Sheets">Sheets</option>
                    <option value="Boxes">Boxes</option>
                    <option value="Meters">Meters</option>
                    <option value="Sq.Ft">Sq.Ft</option>
                    <option value="Sq.Mtr">Sq.Mtr</option>
                  </select>
                </div>
              </div>

              {/* 4. Approx Unit Cost & Min Threshold */}
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Approx Unit Cost (₹)</label>
                  <input 
                    className="form-control" 
                    type="number" 
                    placeholder="e.g. 380" 
                    value={newMatData.unitCost} 
                    onChange={e => setNewMatData({ ...newMatData, unitCost: e.target.value })} 
                    style={{ padding: '10px 12px', borderRadius: '8px' }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Min Stock Alert</label>
                  <input 
                    className="form-control" 
                    type="number" 
                    placeholder="e.g. 50" 
                    value={newMatData.minThreshold} 
                    onChange={e => setNewMatData({ ...newMatData, minThreshold: e.target.value })} 
                    style={{ padding: '10px 12px', borderRadius: '8px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '22px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setNewMatModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ background: '#d97706', borderColor: '#b45309', fontWeight: 700, padding: '10px 20px', borderRadius: '8px' }}>
                  <Plus size={16} /> Add to Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD WORKER MODAL */}
      {addWorkerModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(3px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1050, padding: '16px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #cbd5e1',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            padding: '24px',
            width: '100%',
            maxWidth: '460px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={20} color="#059669" />
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
                  Register {newWorkerData.trade || 'Site'} Worker
                </h3>
              </div>
              <button 
                type="button" 
                onClick={() => setAddWorkerModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#64748b', fontSize: '1.2rem', cursor: 'pointer', padding: '4px' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveWorker}>
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                  Worker Full Name <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  className="form-control"
                  type="text"
                  placeholder="e.g. Ramesh Bhai Patel"
                  value={newWorkerData.name}
                  onChange={e => setNewWorkerData({ ...newWorkerData, name: e.target.value })}
                  style={{ padding: '9px 12px', borderRadius: '8px' }}
                  required
                  autoFocus
                />
              </div>

              {/* Only show category dropdown if on All Categories page */}
              {(!laborCategoryFilter || laborCategoryFilter === 'all') && (
                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Trade / Skill Category</label>
                  <select
                    className="form-control"
                    value={newWorkerData.trade}
                    onChange={e => {
                      const selectedTrade = e.target.value;
                      const wage = getCategoryDefaultWage(selectedTrade);
                      setNewWorkerData({ ...newWorkerData, trade: selectedTrade, dailyWage: String(wage) });
                    }}
                    style={{ padding: '9px 12px', borderRadius: '8px' }}
                  >
                    {CONSTRUCTION_LABOR_CATEGORIES.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.label}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid-2" style={{ marginBottom: '14px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                    Mobile Number (10 Digits) <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    className="form-control"
                    type="tel"
                    placeholder="Enter 10-digit mobile"
                    value={newWorkerData.phone}
                    maxLength={10}
                    onChange={e => {
                      const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setNewWorkerData({ ...newWorkerData, phone: digits });
                    }}
                    style={{ padding: '9px 12px', borderRadius: '8px' }}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Daily Wage (₹)</label>
                  <input
                    className="form-control"
                    type="number"
                    placeholder="500"
                    value={newWorkerData.dailyWage}
                    onChange={e => setNewWorkerData({ ...newWorkerData, dailyWage: e.target.value })}
                    style={{ padding: '9px 12px', borderRadius: '8px' }}
                    min="0"
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px', borderTop: '1px solid #f1f5f9', paddingTop: '14px' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setAddWorkerModalOpen(false)}
                  style={{ padding: '9px 16px', borderRadius: '8px' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ background: '#059669', borderColor: '#047857', fontWeight: 700, padding: '9px 20px', borderRadius: '8px' }}
                >
                  Save Worker
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BATCH ADD WORKERS MODAL (Register Multiple Workers by Count) */}
      {batchWorkerModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1060, padding: '16px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #cbd5e1',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)',
            padding: '24px',
            width: '100%',
            maxWidth: '620px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={20} color="#2563eb" />
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
                  Add Multiple {batchWorkerCategory} Workers
                </h3>
              </div>
              <button 
                type="button" 
                onClick={() => setBatchWorkerModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#64748b', fontSize: '1.2rem', cursor: 'pointer', padding: '4px' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveBatchWorkers} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {/* Category & Count Selection Row */}
              <div style={{ display: 'grid', gridTemplateColumns: (!laborCategoryFilter || laborCategoryFilter === 'all') ? '1.6fr 1fr' : '1fr', gap: '12px', marginBottom: '16px', background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                {(!laborCategoryFilter || laborCategoryFilter === 'all') && (
                  <div>
                    <label className="form-label" style={{ fontWeight: 700, fontSize: '0.82rem', color: '#0f172a' }}>
                      Select Trade Category *
                    </label>
                    <select
                      className="form-control"
                      value={batchWorkerCategory}
                      onChange={e => handleBatchCategoryChange(e.target.value)}
                      style={{ padding: '8px 10px', borderRadius: '6px', fontWeight: 600, color: '#1e293b' }}
                    >
                      {CONSTRUCTION_LABOR_CATEGORIES.map(cat => (
                        <option key={cat.id} value={cat.id}>
                          {cat.label} (Default ₹{cat.defaultWage}/day)
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="form-label" style={{ fontWeight: 700, fontSize: '0.82rem', color: '#0f172a' }}>
                    How Many {batchWorkerCategory} Workers? *
                  </label>
                  <input
                    className="form-control"
                    type="number"
                    min="1"
                    max="50"
                    placeholder="Enter number of workers..."
                    value={batchWorkerCount}
                    onChange={e => handleBatchCountChange(e.target.value)}
                    onBlur={() => {
                      if (!batchWorkerCount || Number(batchWorkerCount) < 1) {
                        handleBatchCountChange(1);
                      }
                    }}
                    style={{ padding: '8px 12px', borderRadius: '6px', fontWeight: 700, fontSize: '0.95rem' }}
                    required
                  />
                </div>
              </div>

              {/* Scrollable Container for Worker Name Rows */}
              <div style={{ maxHeight: '42vh', overflowY: 'auto', paddingRight: '4px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, marginBottom: '2px' }}>
                  Enter names and 10-digit mobile numbers for each {batchWorkerCategory}:
                </div>

                {batchWorkerRows.map((row, idx) => (
                  <div 
                    key={idx} 
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '32px 1.5fr 1.2fr 1fr',
                      gap: '8px',
                      alignItems: 'center',
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      padding: '8px 10px'
                    }}
                  >
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textAlign: 'center' }}>
                      #{idx + 1}
                    </span>

                    <div>
                      <input
                        className="form-control"
                        type="text"
                        placeholder={`Worker #${idx + 1} Name`}
                        value={row.name}
                        onChange={e => handleBatchRowChange(idx, 'name', e.target.value)}
                        style={{ padding: '7px 10px', borderRadius: '6px', fontSize: '0.82rem' }}
                        required
                      />
                    </div>

                    <div>
                      <input
                        className="form-control"
                        type="tel"
                        placeholder="10-digit mobile"
                        value={row.phone}
                        maxLength={10}
                        onChange={e => handleBatchRowChange(idx, 'phone', e.target.value)}
                        style={{ padding: '7px 10px', borderRadius: '6px', fontSize: '0.82rem' }}
                        required
                      />
                    </div>

                    <div>
                      <input
                        className="form-control"
                        type="number"
                        placeholder="Wage (₹)"
                        value={row.dailyWage}
                        onChange={e => handleBatchRowChange(idx, 'dailyWage', e.target.value)}
                        style={{ padding: '7px 10px', borderRadius: '6px', fontSize: '0.82rem' }}
                        min="0"
                        required
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '18px', borderTop: '1px solid #f1f5f9', paddingTop: '14px' }}>
                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  Adding <strong>{batchWorkerRows.length}</strong> {batchWorkerCategory} worker(s)
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => setBatchWorkerModalOpen(false)}
                    style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '0.85rem' }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary" 
                    style={{ background: '#2563eb', borderColor: '#1d4ed8', fontWeight: 700, padding: '8px 18px', borderRadius: '8px', fontSize: '0.85rem' }}
                  >
                    Save {batchWorkerRows.length} Workers
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

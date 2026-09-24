const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Helper to get fallback engineer name
const getEngineerName = () => {
  const eng = db.users.find(u => u.role === 'site_engineer');
  return eng ? eng.name : 'jay';
};

const categoryTaskTemplates = {
  'Bungalows': [
    '1. Land Survey & Plot Layout Planning',
    '2. Foundation Soil Excavation',
    '3. Footing, Plinth Beam & Concrete Structure',
    '4. RCC Slab Casting & Curing',
    '5. Brickwork Masonry & Internal/External Plastering',
    '6. Electrical Concealed Piping & Wiring',
    '7. Plumbing & Bathroom Wall Tiles Fitting',
    '8. Wooden Doors & Modular Furniture Joinery',
    '9. Interior & Exterior Paint Coating',
    '10. Deep Site Cleaning & Final Handover (100% Progress)'
  ],
  'Building': [
    '1. Soil Testing & Tower Foundation Demarcation',
    '2. Basement Excavation & Retaining Wall RCC',
    '3. Multi-Storey Column Casting & Floor Slabs',
    '4. Exterior AAC Block Masonry & Outer Plaster',
    '5. Concealed Electrical & Plumbing Rough-In',
    '6. Flooring Tiles, Kitchen Platform & Wall Tiles',
    '7. Door Shutters, Aluminum Windows & Hardware',
    '8. Exterior Weatherproof & Interior Emulsion Paint',
    '9. Lift Installation & Fire Safety Infrastructure',
    '10. Final Building Audit & Certificate Handover'
  ],
  'Row House': [
    '1. Demarcation & Boundary Trench Excavation',
    '2. Combined Footing & Plinth Beam Casting',
    '3. Ground & First Floor RCC Frame Work',
    '4. Brick Masonry & Internal/External Plastering',
    '5. Concealed Conduit Wiring & Sanitary Lines',
    '6. Vitrified Flooring & Bathroom Wall Tiles',
    '7. Wooden Doors, Window Frames & Millwork',
    '8. Two-Coat Exterior & Interior Painting',
    '9. Site Deep Cleaning & Final Touchup'
  ],
  'Road Work': [
    '1. Terrain Survey, Leveling & Subgrade Excavation',
    '2. Soil Compaction & Granular Sub-Base (GSB) Layer',
    '3. Wet Mix Macadam (WMM) Base Layer Laying',
    '4. Bituminous Prime Coat & Dense Bituminous Macadam (DBM)',
    '5. Asphalt Bituminous Concrete (BC) Top Surface Roller Laying',
    '6. Curb Stone Fitting & Road Line Thermoplastic Marking'
  ],
  'Bridge': [
    '1. Hydrological Survey & Soil Strata Borehole Audit',
    '2. Riverbed / Deep Foundation Pile Pier Casting',
    '3. Pier Cap & Concrete Abutment Construction',
    '4. Pre-Stressed Concrete Girder Launching',
    '5. Deck Slab Reinforcement & Concrete Casting',
    '6. Bridge Expansion Joints, Crash Barriers & Asphalt Paving'
  ]
};

const generateTasksForProject = (proj) => {
  let rawType = proj.type || 'Building';
  if (proj.name.includes('[Bungalows]')) rawType = 'Bungalows';
  else if (proj.name.includes('[Row House]')) rawType = 'Row House';
  else if (proj.name.includes('[Road Work]')) rawType = 'Road Work';
  else if (proj.name.includes('[Bridge]')) rawType = 'Bridge';
  else if (proj.name.includes('[Building]')) rawType = 'Building';

  const templates = categoryTaskTemplates[rawType] || categoryTaskTemplates['Building'];
  return templates.map((tName, i) => ({
    id: `t_${proj.id}_${i + 1}`,
    name: tName,
    project: proj.name,
    projectId: proj.id,
    dueDate: `Stage ${i + 1}`,
    status: 'Pending',
    photo: '',
    photos: [],
    adminRemark: ''
  }));
};

// GET /api/projects - Get all projects or filtered by client/project ID
router.get('/', (req, res) => {
  // Ensure any accepted projects have an engineer name attached & have tasks and photos initialized
  let changed = false;
  db.projects.forEach(p => {
    if (p.acceptedAt && (!p.engineerInCharge || p.engineerInCharge === 'Unassigned')) {
      p.acceptedBy = p.acceptedBy || getEngineerName();
      p.engineerInCharge = p.acceptedBy;
      changed = true;
    }
    if (!p.engineerEmail) {
      const match = (db.users || []).find(u => 
        (p.acceptedByEmail && u.email?.toLowerCase() === p.acceptedByEmail.toLowerCase()) ||
        (p.acceptedBy && u.name?.toLowerCase() === p.acceptedBy.toLowerCase()) ||
        (p.engineerInCharge && (u.email?.toLowerCase() === p.engineerInCharge.toLowerCase() || u.name?.toLowerCase() === p.engineerInCharge.toLowerCase()))
      );
      if (match) {
        p.engineerEmail = match.email;
        if (!p.acceptedByEmail) p.acceptedByEmail = match.email;
        changed = true;
      } else if (p.engineerInCharge && p.engineerInCharge.includes('@')) {
        p.engineerEmail = p.engineerInCharge;
        changed = true;
      }
    }
    if (!p.photos) {
      p.photos = [];
      changed = true;
    }
    if (!p.tasks || p.tasks.length === 0) {
      p.tasks = generateTasksForProject(p);
      changed = true;
    }
    const actualSpent = (p.tasks || []).reduce((sum, t) => sum + (Number(t.totalCost) || 0), 0);
    if (p.spent !== actualSpent) {
      p.spent = actualSpent;
      changed = true;
    }
  });

  if (changed) {
    db.save();
  }

  const { projectId } = req.query;
  if (projectId) {
    const proj = db.projects.find(p => p.id === projectId);
    return res.json({ success: true, project: proj });
  }
  res.json({ success: true, projects: db.projects });
});

// GET /api/projects/clients - Get all client profiles
router.get('/clients', (req, res) => {
  const clients = (db.projects || []).filter(p => p.clientName).map(p => ({
    name: p.clientName,
    phone: p.clientPhone || '',
    projectId: p.id,
    projectName: p.name
  }));
  res.json({ success: true, clients });
});

// GET /api/projects/:id - Get project by ID
router.get('/:id', (req, res) => {
  const proj = db.projects.find(p => String(p.id) === String(req.params.id));
  if (!proj) return res.status(404).json({ success: false, message: 'Project not found' });
  if (proj.acceptedAt && (!proj.engineerInCharge || proj.engineerInCharge === 'Unassigned')) {
    proj.acceptedBy = proj.acceptedBy || getEngineerName();
    proj.engineerInCharge = proj.acceptedBy;
  }
  if (!proj.photos) proj.photos = [];
  if (!proj.tasks || proj.tasks.length === 0) {
    proj.tasks = generateTasksForProject(proj);
    db.save();
  }
  res.json({ success: true, project: proj });
});

// POST /api/projects - Create new project (Admin) with auto-increment counter ID (1, 2, 3...)
router.post('/', (req, res) => {
  const { name, clientName, clientPhone, location, budget, type, engineerInCharge, engineerEmail, specifications } = req.body;
  const newId = typeof db.getNextProjectId === 'function' ? db.getNextProjectId() : String((db.projects?.length || 0) + 1);

  // Auto-resolve or register Client in 'clients' collection (Relational Foreign Key)
  let resolvedClientId = req.body.clientId || '';
  const finalClientName = (clientName && clientName.trim()) ? clientName.trim() : 'Valued Client';
  
  if (!Array.isArray(db.clients)) db.clients = [];
  let matchedClient = db.clients.find(c => 
    (resolvedClientId && String(c.id) === String(resolvedClientId)) ||
    c.name.toLowerCase() === finalClientName.toLowerCase()
  );

  if (matchedClient) {
    resolvedClientId = matchedClient.id;
    if (clientPhone && !matchedClient.phone) matchedClient.phone = clientPhone;
  } else {
    resolvedClientId = `CLI-${String(db.clients.length + 1).padStart(3, '0')}`;
    matchedClient = {
      id: resolvedClientId,
      name: finalClientName,
      phone: clientPhone || '',
      email: `${finalClientName.toLowerCase().replace(/[^a-z0-9]/g, '')}@client.com`,
      company: finalClientName,
      address: location || 'Gujarat, India',
      createdAt: new Date().toISOString()
    };
    db.clients.push(matchedClient);
  }

  // Resolve engineer email if assigned
  let resolvedEngEmail = engineerEmail || '';
  let resolvedEngName = engineerInCharge || 'Unassigned';
  if (!resolvedEngEmail && engineerInCharge && engineerInCharge !== 'Unassigned') {
    const matchedUser = (db.users || []).find(u => 
      u.name?.toLowerCase() === engineerInCharge.toLowerCase() || 
      u.email?.toLowerCase() === engineerInCharge.toLowerCase()
    );
    if (matchedUser) {
      resolvedEngEmail = matchedUser.email;
      resolvedEngName = matchedUser.name;
    } else if (engineerInCharge.includes('@')) {
      resolvedEngEmail = engineerInCharge;
    }
  }

  const newProj = {
    id: newId,
    name,
    clientId: resolvedClientId, // Foreign Key linking to clients collection
    clientName: matchedClient.name,
    clientPhone: matchedClient.phone || clientPhone || "",
    contactPhone: matchedClient.phone || clientPhone || "",
    location: location || "",
    budget: Number(budget) || 0,
    spent: 0,
    progress: 0,
    startDate: new Date().toISOString().split('T')[0],
    estimatedEndDate: "2027-12-31",
    status: "Pending Acceptance", // Starts in Pending Acceptance state until Site Engineer accepts
    engineerInCharge: resolvedEngName,
    engineerEmail: resolvedEngEmail,
    acceptedBy: resolvedEngName !== 'Unassigned' ? resolvedEngName : "",
    acceptedByEmail: resolvedEngEmail,
    type: type || "Building",
    specifications: specifications || {},
    photos: []
  };

  newProj.tasks = generateTasksForProject(newProj);

  db.projects.push(newProj);
  db.save();
  res.status(201).json({ success: true, message: 'Project created & sent to Site Engineer for acceptance', project: newProj });
});

// PATCH /api/projects/:id/status - Site Engineer accepts/declines project assignment
router.patch('/:id/status', (req, res) => {
  const proj = db.projects.find(p => p.id === req.params.id);
  if (!proj) return res.status(404).json({ success: false, message: 'Project not found' });

  const { status, acceptedBy, engineerName, engineerEmail, engineerPhone } = req.body;
  proj.status = status;
  if (status === 'In-Progress') {
    const finalEngineerName = acceptedBy || engineerName || getEngineerName();
    proj.acceptedBy = finalEngineerName;
    proj.acceptedByEmail = engineerEmail || "";
    proj.engineerInCharge = finalEngineerName;
    if (engineerPhone) proj.contactPhone = engineerPhone;
    proj.acceptedAt = new Date().toISOString().split('T')[0];
  } else if (status === 'Declined') {
    proj.declinedAt = new Date().toISOString().split('T')[0];
  }

  db.save();
  res.json({ success: true, message: `Project status updated to ${status}`, project: proj });
});

// PATCH /api/projects/:id/progress - Update progress and current stage with photo evidence
router.patch('/:id/progress', (req, res) => {
  const proj = db.projects.find(p => p.id === req.params.id);
  if (!proj) return res.status(404).json({ success: false, message: 'Project not found' });

  const { progress, currentStage, workCompleted, workPending, photo } = req.body;

  if (progress !== undefined) {
    proj.progress = Math.min(100, Math.max(0, Number(progress)));
    if (proj.progress === 100) {
      proj.status = 'Completed';
    } else if (proj.status === 'Pending Acceptance') {
      proj.status = 'In-Progress';
    }
  }

  if (currentStage) proj.currentStage = currentStage;
  if (workCompleted) proj.workCompleted = workCompleted;
  if (workPending) proj.workPending = workPending;

  if (photo) {
    if (!proj.photos) proj.photos = [];
    proj.photos.unshift({
      id: `photo_${Date.now()}`,
      url: photo,
      date: new Date().toISOString().split('T')[0],
      progress: proj.progress,
      caption: currentStage || 'Daily Progress Evidence',
      status: 'Pending',
      engineerName: proj.acceptedBy || proj.engineerInCharge || 'Site Engineer',
      engineerPhone: proj.clientPhone || proj.contactPhone || '9876543210'
    });
  }

  db.save();
  res.json({ success: true, message: 'Project progress & photo evidence updated successfully', project: proj });
});

// POST /api/projects/:id/photos - Add one or multiple site photos to project evidence gallery
router.post('/:id/photos', (req, res) => {
  const proj = db.projects.find(p => p.id === req.params.id);
  if (!proj) return res.status(404).json({ success: false, message: 'Project not found' });
  if (!proj.photos) proj.photos = [];

  const { photos, photo, caption, taskId } = req.body;
  const incoming = Array.isArray(photos) ? photos : (photo ? [photo] : []);
  const added = [];

  incoming.forEach((url, idx) => {
    if (!url) return;
    const item = {
      id: `photo_${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 4)}`,
      url,
      date: new Date().toISOString().split('T')[0],
      progress: proj.progress,
      caption: caption || proj.currentStage || 'Site Photo Evidence',
      status: 'Pending',
      taskId: taskId || '',
      engineerName: proj.acceptedBy || proj.engineerInCharge || 'Site Engineer',
      engineerPhone: proj.clientPhone || proj.contactPhone || '9876543210'
    };
    proj.photos.unshift(item);
    added.push(item);
  });

  db.save();
  res.json({ success: true, message: 'Photos added successfully', photos: added, project: proj });
});

// PUT /api/projects/:id/tasks - Update all tasks for a project
router.put('/:id/tasks', (req, res) => {
  const proj = db.projects.find(p => p.id === req.params.id);
  if (!proj) return res.status(404).json({ success: false, message: 'Project not found' });
  const { tasks } = req.body;
  if (Array.isArray(tasks)) {
    proj.tasks = tasks;
    if (!proj.photos) proj.photos = [];

    // Mirror all task photos into proj.photos so Admin sees them everywhere
    tasks.forEach(t => {
      const tPhotos = Array.isArray(t.photos) ? t.photos : (t.photo ? [t.photo] : []);
      tPhotos.forEach((pUrl, pIdx) => {
        if (!pUrl) return;
        const exists = proj.photos.some(ph => ph.url === pUrl);
        if (!exists) {
          proj.photos.unshift({
            id: `photo_${Date.now()}_${pIdx}_${Math.random().toString(36).substr(2, 4)}`,
            url: pUrl,
            date: new Date().toISOString().split('T')[0],
            progress: proj.progress,
            caption: `${t.name} (Evidence)`,
            status: t.status === 'Completed' ? 'Approved' : (t.status === 'Rejected' ? 'Rejected' : 'Pending'),
            taskId: t.id,
            engineerName: proj.acceptedBy || proj.engineerInCharge || 'Site Engineer',
            engineerPhone: proj.clientPhone || proj.contactPhone || '9876543210'
          });
        }
      });
    });

    db.save();
  }
  res.json({ success: true, tasks: proj.tasks, project: proj });
});

// PATCH /api/projects/:id/tasks/:taskId - Update specific task (start, submit photos, append more photos, review)
router.patch('/:id/tasks/:taskId', (req, res) => {
  const proj = db.projects.find(p => p.id === req.params.id);
  if (!proj) return res.status(404).json({ success: false, message: 'Project not found' });
  if (!proj.tasks || proj.tasks.length === 0) proj.tasks = generateTasksForProject(proj);

  const task = proj.tasks.find(t => t.id === req.params.taskId);
  if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

  const {
    status,
    photo,
    photos,
    newPhotos,
    adminRemark,
    materialsUsed,
    materialCost,
    laborCount,
    laborCost,
    laborDetails,
    selectedWorkerIds,
    totalCost,
    materialsSummary
  } = req.body;

  if (status !== undefined) task.status = status;
  if (adminRemark !== undefined) task.adminRemark = adminRemark;

  if (materialsUsed !== undefined) task.materialsUsed = materialsUsed;
  if (materialCost !== undefined) task.materialCost = Number(materialCost) || 0;
  if (laborCount !== undefined) task.laborCount = Number(laborCount) || 0;
  if (laborCost !== undefined) task.laborCost = Number(laborCost) || 0;
  if (laborDetails !== undefined) task.laborDetails = laborDetails;
  if (selectedWorkerIds !== undefined) task.selectedWorkerIds = selectedWorkerIds;
  if (totalCost !== undefined) task.totalCost = Number(totalCost) || ((Number(materialCost) || 0) + (Number(laborCost) || 0));
  if (materialsSummary !== undefined) task.materialsSummary = materialsSummary;

  // Deduct consumed materials from inventory stock in MongoDB
  if (Array.isArray(materialsUsed) && materialsUsed.length > 0) {
    materialsUsed.forEach(item => {
      const qty = Number(item.quantity) || 0;
      if (qty <= 0) return;
      const mat = db.materials.find(m =>
        (item.materialId && m.id === item.materialId) ||
        (item.name && m.name.toLowerCase().includes(item.name.toLowerCase()))
      );
      if (mat) {
        mat.stock = Math.max(0, mat.stock - qty);
        mat.lastUpdated = new Date().toISOString().split('T')[0];
      }
    });
  }

  // Recalculate project spent accurately from all tasks
  proj.spent = (proj.tasks || []).reduce((sum, t) => sum + (Number(t.totalCost) || 0), 0);

  if (Array.isArray(photos)) {
    task.photos = photos;
    task.photo = photos[0] || '';
  } else if (photo) {
    task.photo = photo;
    if (!task.photos) task.photos = [];
    task.photos.push(photo);
  }

  // Appending additional photos if uploaded later (allow same photo multiple times)
  if (Array.isArray(newPhotos) && newPhotos.length > 0) {
    if (!task.photos) task.photos = [];
    newPhotos.forEach(np => {
      if (np) {
        task.photos.push(np);
      }
    });
    task.photo = task.photos[0] || '';
  }

  // Ensure newly added photos from this task are recorded in proj.photos
  if (!proj.photos) proj.photos = [];
  const allTaskPhotos = task.photos || (task.photo ? [task.photo] : []);
  const existingTaskPhotosCount = proj.photos.filter(ph => ph.taskId === task.id).length;
  if (allTaskPhotos.length > existingTaskPhotosCount) {
    const newlyAddedPhotos = allTaskPhotos.slice(existingTaskPhotosCount);
    newlyAddedPhotos.forEach((pUrl, pIdx) => {
      if (!pUrl) return;
      proj.photos.unshift({
        id: `photo_${Date.now()}_${pIdx}_${Math.random().toString(36).substr(2, 4)}`,
        url: pUrl,
        date: new Date().toISOString().split('T')[0],
        progress: proj.progress,
        caption: `${task.name} (Evidence)`,
        status: task.status === 'Completed' ? 'Approved' : (task.status === 'Rejected' ? 'Rejected' : 'Pending'),
        taskId: task.id,
        engineerName: proj.acceptedBy || proj.engineerInCharge || 'Site Engineer',
        engineerPhone: proj.clientPhone || proj.contactPhone || '9876543210'
      });
    });
  }

  // Trigger Admin notification if task has photo evidence or is awaiting review
  if (typeof db.addNotification === 'function' && (task.photos?.length > 0 || task.status === 'Completed' || task.status === 'Awaiting Approval')) {
    db.addNotification({
      title: 'Task Stage Submitted for Review',
      message: `${proj.acceptedBy || 'Site Engineer'} completed "${task.name}" on "${proj.name}". Review & approval required.`,
      type: 'task',
      targetRole: 'admin',
      link: '/admin/projects'
    });
  }

  db.save();
  res.json({ success: true, message: 'Task updated successfully', task, project: proj });
});

// PATCH /api/projects/:id/photos/:photoId/status - Admin Approve or Reject photo evidence
router.patch('/:id/photos/:photoId/status', (req, res) => {
  const proj = db.projects.find(p => p.id === req.params.id);
  if (!proj) return res.status(404).json({ success: false, message: 'Project not found' });

  if (!proj.photos) proj.photos = [];
  const targetPhoto = proj.photos.find(p => p.id === req.params.photoId);
  if (!targetPhoto) return res.status(404).json({ success: false, message: 'Photo evidence not found' });

  const { status, remark } = req.body; // status: 'Approved' | 'Rejected', remark: message
  targetPhoto.status = status;
  targetPhoto.adminRemark = remark || (status === 'Rejected' ? 'Work incomplete, please re-upload clear photo' : 'Approved by Admin');
  targetPhoto.reviewedAt = new Date().toISOString().split('T')[0];

  // Also sync status back to corresponding task if linked
  let matchedTask = null;
  if (targetPhoto.taskId && proj.tasks) {
    matchedTask = proj.tasks.find(t => t.id === targetPhoto.taskId);
    if (matchedTask) {
      if (status === 'Approved') {
        matchedTask.status = 'Completed';
        matchedTask.adminRemark = 'Approved by Admin';
      } else if (status === 'Rejected') {
        matchedTask.status = 'Rejected';
        matchedTask.adminRemark = targetPhoto.adminRemark;
      }
    }
  }

  // Trigger Site Engineer notification
  if (status === 'Approved' && typeof db.addNotification === 'function') {
    db.addNotification({
      title: 'Task Stage Approved by Admin!',
      message: `Admin approved "${matchedTask?.name || 'Task'}" on "${proj.name}". Project progress advanced!`,
      type: 'task',
      targetRole: 'site_engineer',
      targetEmail: proj.acceptedByEmail || proj.engineerEmail || '',
      link: '/site/tasks'
    });
  }

  db.save();
  res.json({ success: true, message: `Photo evidence ${status.toLowerCase()} successfully`, photo: targetPhoto, project: proj });
});

// PUT /api/projects/:id - Update existing project (Admin)
router.put('/:id', (req, res) => {
  const index = db.projects.findIndex(p => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ success: false, message: 'Project not found' });

  const { name, clientName, clientPhone, location, budget, type, engineerInCharge, status, progress, specifications } = req.body;
  const existing = db.projects[index];

  db.projects[index] = {
    ...existing,
    name: name || existing.name,
    clientName: clientName || existing.clientName,
    clientPhone: clientPhone || existing.clientPhone,
    contactPhone: clientPhone || existing.contactPhone,
    location: location || existing.location,
    budget: budget !== undefined ? Number(budget) : existing.budget,
    type: type || existing.type,
    engineerInCharge: engineerInCharge || existing.engineerInCharge,
    status: status || existing.status,
    progress: progress !== undefined ? Number(progress) : existing.progress,
    specifications: specifications !== undefined ? specifications : (existing.specifications || {})
  };

  db.save();
  res.json({ success: true, message: 'Project updated successfully', project: db.projects[index] });
});

// DELETE /api/projects - Clear / delete all projects (Admin)
router.delete('/', (req, res) => {
  db.projects = [];
  db.save();
  res.json({ success: true, message: 'All projects deleted successfully' });
});

// DELETE /api/projects/:id - Delete project (Admin)
router.delete('/:id', (req, res) => {
  const index = db.projects.findIndex(p => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ success: false, message: 'Project not found' });

  const deleted = db.projects.splice(index, 1);
  db.save();
  res.json({ success: true, message: 'Project deleted successfully', project: deleted[0] });
});

module.exports = router;

const express = require('express');
const router = express.Router();
const db = require('../database/db');

// GET /api/reports and /api/reports/dpr - Get Submitted Daily Progress Reports
router.get(['/', '/dpr'], (req, res) => {
  const { projectId, date, limit } = req.query;
  let list = Array.isArray(db.reports) && db.reports.length > 0 
    ? db.reports 
    : (Array.isArray(db.dprs) ? db.dprs : []);

  if (projectId) {
    list = list.filter(d => d.projectId === projectId);
  }
  if (date) {
    list = list.filter(d => d.date === date);
  }
  if (limit && !isNaN(Number(limit))) {
    list = list.slice(0, Math.max(0, parseInt(limit, 10)));
  }

  res.json({ success: true, reports: list, dprs: list, total: list.length });
});

// POST /api/reports and /api/reports/dpr - Create a Daily Progress Report with Photo & Progress % Update
router.post(['/', '/dpr'], (req, res) => {
  const { 
    projectId, projectName, engineerName, engineerPhone, date, weather, 
    laborCount, workDone, materialsUsed, remarks, progress, sitePhoto, photos,
    materialCost, laborCost, machineryUsed, machineryCharge, totalCost, materialsBreakdown, laborBreakdown, laborDetails
  } = req.body;

  const photoList = Array.isArray(photos) && photos.length > 0 
    ? photos 
    : (sitePhoto ? [sitePhoto] : []);

  const calculatedTotalCost = totalCost !== undefined && totalCost !== null 
    ? Number(totalCost) 
    : ((Number(materialCost) || 0) + (Number(laborCost) || 0) + (Number(machineryCharge) || 0));

  // Relational Foreign Key normalization to eliminate duplication
  const rawLabor = Array.isArray(laborBreakdown) ? laborBreakdown : (Array.isArray(laborDetails) ? laborDetails : []);
  const normalizedLabor = rawLabor.map(lb => {
    let matchedWorker = (db.workers || []).find(w => 
      (lb.name && w.name.toLowerCase() === lb.name.toLowerCase()) || 
      (lb.trade && w.trade.toLowerCase() === lb.trade.toLowerCase())
    );
    return {
      workerId: lb.workerId || (matchedWorker ? matchedWorker.id : `WRK-${Math.floor(100 + Math.random() * 900)}`),
      name: lb.name || (matchedWorker ? matchedWorker.name : 'Site Labor'),
      trade: lb.trade || (matchedWorker ? matchedWorker.trade : 'Worker'),
      dailyWage: Number(lb.dailyWage || lb.cost || (matchedWorker ? matchedWorker.dailyWage : 500)),
      count: Number(lb.count || 1)
    };
  });

  const rawMaterials = Array.isArray(materialsBreakdown) ? materialsBreakdown : [];
  const normalizedMaterials = rawMaterials.map(mb => {
    let matchedMat = (db.materials || []).find(m => 
      (mb.name && m.name.toLowerCase().includes(mb.name.toLowerCase())) || 
      (mb.name && mb.name.toLowerCase().includes(m.name.toLowerCase()))
    );
    return {
      materialId: mb.materialId || (matchedMat ? matchedMat.id : `MAT-${Math.floor(100 + Math.random() * 900)}`),
      name: mb.name || (matchedMat ? matchedMat.name : 'Material'),
      quantity: Number(mb.quantity) || 1,
      unit: mb.unit || (matchedMat ? matchedMat.unit : 'Unit'),
      totalCost: Number(mb.totalCost) || 0
    };
  });

  const rawMachinery = Array.isArray(req.body.machineryBreakdown) ? req.body.machineryBreakdown : [];
  const normalizedMachinery = rawMachinery.map(mb => {
    let matchedEq = (db.equipment || []).find(e => 
      (mb.name && e.name.toLowerCase().includes(mb.name.toLowerCase())) || 
      (mb.name && mb.name.toLowerCase().includes(e.name.toLowerCase()))
    );
    return {
      equipmentId: mb.equipmentId || (matchedEq ? matchedEq.id : `EQ-${Math.floor(100 + Math.random() * 900)}`),
      name: mb.name || (matchedEq ? matchedEq.name : 'Equipment'),
      charge: Number(mb.charge) || 0
    };
  });

  const newDpr = {
    id: `dpr_${Date.now()}`,
    projectId: projectId || (db.projects[0] ? db.projects[0].id : ""),
    projectName: projectName || (db.projects[0] ? db.projects[0].name : "General Project"),
    engineerName: engineerName || "Site Engineer",
    engineerPhone: engineerPhone || "",
    date: date || new Date().toISOString().split('T')[0],
    weather: weather || "Clear Weather",
    laborCount: Number(laborCount) || (normalizedLabor.length > 0 ? normalizedLabor.reduce((acc, l) => acc + (l.count || 1), 0) : 20),
    laborCost: Number(laborCost) || 0,
    laborBreakdown: normalizedLabor,
    materialCost: Number(materialCost) || 0,
    machineryUsed: machineryUsed || "None",
    machineryCharge: Number(machineryCharge) || 0,
    machineryExpenses: normalizedMachinery,
    machineryBreakdown: normalizedMachinery,
    totalCost: calculatedTotalCost,
    materialsBreakdown: normalizedMaterials,
    workDone: workDone || "Site Work in Progress",
    materialsUsed: materialsUsed || "Standard Materials",
    remarks: remarks || "Auto-compiled daily site execution report",
    progress: progress !== undefined && progress !== null ? Number(progress) : null,
    sitePhoto: photoList[0] || "",
    photos: photoList
  };

  if (!Array.isArray(db.dprs)) db.dprs = [];
  if (!Array.isArray(db.reports)) db.reports = [];
  db.dprs.unshift(newDpr);
  db.reports.unshift(newDpr);

  // Trigger Admin notification
  if (typeof db.addNotification === 'function') {
    db.addNotification({
      title: 'Daily Report (DPR) Submitted',
      message: `${newDpr.engineerName || 'Site Engineer'} submitted daily report for "${newDpr.projectName}".`,
      type: 'dpr',
      targetRole: 'admin',
      link: '/admin/reports'
    });
  }

  // Update associated project's overall progress & add photo evidence
  const proj = db.projects.find(p => p.id === newDpr.projectId || p.name === newDpr.projectName);
  if (proj) {
    if (progress !== undefined && progress !== null) {
      proj.progress = Math.min(100, Math.max(0, Number(progress)));
      if (proj.progress === 100) proj.status = 'Completed';
    }
    if (workDone) {
      proj.currentStage = workDone;
    }
    if (!newDpr.engineerPhone && (proj.clientPhone || proj.contactPhone)) {
      newDpr.engineerPhone = proj.clientPhone || proj.contactPhone;
    }
    if (photoList.length > 0) {
      if (!proj.photos) proj.photos = [];
      photoList.forEach(ph => {
        if (!proj.photos.some(existing => existing.url === ph)) {
          proj.photos.unshift({
            id: `photo_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            url: ph,
            date: newDpr.date,
            progress: proj.progress,
            caption: workDone || 'Daily Site Progress',
            status: 'Pending',
            engineerName: newDpr.engineerName || proj.acceptedBy || proj.engineerInCharge || 'Site Engineer',
            engineerPhone: newDpr.engineerPhone || proj.clientPhone || proj.contactPhone || '+91 98765 43210'
          });
        }
      });
    }
  }

  // Deduct materials consumed today from inventory
  if (Array.isArray(req.body.materialDeductions)) {
    req.body.materialDeductions.forEach(item => {
      const mat = db.materials.find(m => m.id === item.materialId || (item.name && m.name.toLowerCase().includes(item.name.toLowerCase())));
      if (mat && item.quantity > 0) {
        mat.stock = Math.max(0, mat.stock - Number(item.quantity));
        mat.lastUpdated = new Date().toISOString().split('T')[0];
      }
    });
  }

  if (typeof db.save === 'function') db.save();

  res.status(201).json({ 
    success: true, 
    message: 'Daily Progress Report (DPR) & Site Photo evidence submitted successfully!', 
    dpr: newDpr,
    project: proj 
  });
});

module.exports = router;

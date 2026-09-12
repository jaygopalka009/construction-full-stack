const express = require('express');
const router = express.Router();
const db = require('../database/db');

// GET /api/reports/dpr - Get all Daily Progress Reports
router.get('/dpr', (req, res) => {
  const { projectId } = req.query;
  if (projectId) {
    const list = db.dprs.filter(d => d.projectId === projectId);
    return res.json({ success: true, dprs: list });
  }
  res.json({ success: true, dprs: db.dprs });
});

// POST /api/reports/dpr - Create a Daily Progress Report with Photo & Progress % Update
router.post('/dpr', (req, res) => {
  const { 
    projectId, projectName, engineerName, engineerPhone, date, weather, 
    laborCount, workDone, materialsUsed, remarks, progress, sitePhoto, photos,
    materialCost, laborCost, totalCost, materialsBreakdown, laborBreakdown, laborDetails
  } = req.body;

  const photoList = Array.isArray(photos) && photos.length > 0 
    ? photos 
    : (sitePhoto ? [sitePhoto] : []);

  const calculatedTotalCost = totalCost !== undefined && totalCost !== null 
    ? Number(totalCost) 
    : ((Number(materialCost) || 0) + (Number(laborCost) || 0));

  const newDpr = {
    id: `dpr_${Date.now()}`,
    projectId: projectId || (db.projects[0] ? db.projects[0].id : ""),
    projectName: projectName || (db.projects[0] ? db.projects[0].name : "General Project"),
    engineerName: engineerName || "Site Engineer",
    engineerPhone: engineerPhone || "",
    date: date || new Date().toISOString().split('T')[0],
    weather: weather || "Clear Weather",
    laborCount: Number(laborCount) || 20,
    laborCost: Number(laborCost) || 0,
    laborBreakdown: Array.isArray(laborBreakdown) ? laborBreakdown : (Array.isArray(laborDetails) ? laborDetails : []),
    materialCost: Number(materialCost) || 0,
    totalCost: calculatedTotalCost,
    materialsBreakdown: Array.isArray(materialsBreakdown) ? materialsBreakdown : [],
    workDone: workDone || "Site Work in Progress",
    materialsUsed: materialsUsed || "Standard Materials",
    remarks: remarks || "Auto-compiled daily site execution report",
    progress: progress !== undefined && progress !== null ? Number(progress) : null,
    sitePhoto: photoList[0] || "",
    photos: photoList
  };

  db.dprs.unshift(newDpr);

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

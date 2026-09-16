const express = require('express');
const router = express.Router();
const db = require('../database/db');

// @route   GET /api/equipment
// @desc    Get all construction equipment & heavy machinery
router.get('/', (req, res) => {
  try {
    const list = db.equipment || [];
    res.json({
      success: true,
      count: list.length,
      equipment: list
    });
  } catch (err) {
    console.error('Error fetching equipment:', err.message);
    res.status(500).json({ success: false, message: 'Server error fetching equipment' });
  }
});

// @route   GET /api/equipment/:id
// @desc    Get single equipment details
router.get('/:id', (req, res) => {
  try {
    const item = (db.equipment || []).find(e => e.id === req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Equipment not found' });
    }
    res.json({ success: true, equipment: item });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/equipment
// @desc    Add new equipment to site inventory
router.post('/', async (req, res) => {
  try {
    const { name, type, registrationNo, status, operatorName, operatorPhone, fuelLevel, runningHours, hourlyRate, notes } = req.body;

    if (!name || !type) {
      return res.status(400).json({ success: false, message: 'Machine name and type are required' });
    }

    const newEquipment = {
      id: `eq_${Date.now()}`,
      name,
      type,
      registrationNo: registrationNo || 'N/A',
      status: status || 'Idle', // 'Operating', 'Idle', 'Maintenance'
      operatorName: operatorName || 'Unassigned',
      operatorPhone: operatorPhone || '',
      fuelLevel: fuelLevel || '100%',
      runningHours: Number(runningHours) || 0,
      nextServiceHours: (Number(runningHours) || 0) + 250,
      hourlyRate: Number(hourlyRate) || 0,
      notes: notes || '',
      createdAt: new Date().toISOString()
    };

    if (!Array.isArray(db.equipment)) {
      db.equipment = [];
    }

    db.equipment.unshift(newEquipment);

    if (db.isMongoConnected && db.models && db.models.equipment) {
      await db.models.equipment.updateOne(
        { id: newEquipment.id },
        { $set: newEquipment },
        { upsert: true }
      );
    }

    res.status(201).json({
      success: true,
      message: 'New equipment registered successfully',
      equipment: newEquipment
    });
  } catch (err) {
    console.error('Error adding equipment:', err.message);
    res.status(500).json({ success: false, message: 'Failed to add equipment' });
  }
});

// @route   PUT /api/equipment/:id
// @desc    Update equipment status or details
router.put('/:id', async (req, res) => {
  try {
    const index = (db.equipment || []).findIndex(e => e.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Equipment not found' });
    }

    const updated = {
      ...db.equipment[index],
      ...req.body,
      id: req.params.id,
      updatedAt: new Date().toISOString()
    };

    db.equipment[index] = updated;

    if (db.isMongoConnected && db.models && db.models.equipment) {
      await db.models.equipment.updateOne(
        { id: updated.id },
        { $set: updated },
        { upsert: true }
      );
    }

    res.json({
      success: true,
      message: 'Equipment details updated successfully',
      equipment: updated
    });
  } catch (err) {
    console.error('Error updating equipment:', err.message);
    res.status(500).json({ success: false, message: 'Failed to update equipment' });
  }
});

// @route   DELETE /api/equipment/:id
// @desc    Remove equipment from database
router.delete('/:id', async (req, res) => {
  try {
    const index = (db.equipment || []).findIndex(e => e.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Equipment not found' });
    }

    const removed = db.equipment.splice(index, 1)[0];

    if (db.isMongoConnected && db.models && db.models.equipment) {
      await db.models.equipment.deleteOne({ id: req.params.id });
    }

    res.json({
      success: true,
      message: 'Equipment deleted successfully',
      removed
    });
  } catch (err) {
    console.error('Error deleting equipment:', err.message);
    res.status(500).json({ success: false, message: 'Failed to delete equipment' });
  }
});

// @route   POST /api/equipment/:id/log-shift
// @desc    Log shift meter running hours and fuel reading
router.post('/:id/log-shift', async (req, res) => {
  try {
    const { hoursWorked, fuelLevel, shiftNotes } = req.body;
    const index = (db.equipment || []).findIndex(e => e.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Equipment not found' });
    }

    const currentItem = db.equipment[index];
    const addedHours = Number(hoursWorked) || 0;
    const newTotalHours = (Number(currentItem.runningHours) || 0) + addedHours;

    const shiftEntry = {
      date: new Date().toISOString().split('T')[0],
      hoursWorked: addedHours,
      totalHours: newTotalHours,
      fuelLevel: fuelLevel || currentItem.fuelLevel,
      notes: shiftNotes || 'Regular site shift'
    };

    const updatedLogs = Array.isArray(currentItem.logs) ? [shiftEntry, ...currentItem.logs] : [shiftEntry];

    const updated = {
      ...currentItem,
      runningHours: newTotalHours,
      fuelLevel: fuelLevel || currentItem.fuelLevel,
      logs: updatedLogs,
      lastShiftDate: shiftEntry.date,
      updatedAt: new Date().toISOString()
    };

    db.equipment[index] = updated;

    if (db.isMongoConnected && db.models && db.models.equipment) {
      await db.models.equipment.updateOne(
        { id: updated.id },
        { $set: updated },
        { upsert: true }
      );
    }

    res.json({
      success: true,
      message: `Logged +${addedHours} running hours successfully`,
      equipment: updated
    });
  } catch (err) {
    console.error('Error logging shift hours:', err.message);
    res.status(500).json({ success: false, message: 'Failed to log shift' });
  }
});

module.exports = router;

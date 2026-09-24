const express = require('express');
const router = express.Router();
const machineryController = require('../controllers/machineryController');

// GET /api/machinery - Fetch all machinery
router.get('/', machineryController.getAllMachinery);

// POST /api/machinery - Add new machinery
router.post('/', machineryController.createMachinery);

// DELETE /api/machinery/:id - Delete machinery
router.delete('/:id', machineryController.deleteMachinery);

module.exports = router;

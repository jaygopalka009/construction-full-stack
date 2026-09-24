const Machinery = require('../models/machinery');

exports.getAllMachinery = async (req, res) => {
    try {
        const machinery = await Machinery.find().sort({ createdAt: -1 });
        res.json({ success: true, machinery: machinery });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.createMachinery = async (req, res) => {
    try {
        const { name, description, operatorname } = req.body;
        if (!name || !name.trim()) {
            return res.status(400).json({ success: false, message: 'Name is required' });
        }
        const newMachinery = await Machinery.create({ 
            name: name.trim(),
            description: Number(description) || 5000,
            operatorname: operatorname || 'Site operator'
        });
        res.status(201).json({ success: true, machinery: newMachinery });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }   
};

exports.deleteMachinery = async (req, res) => {
    try {
        const { id } = req.params;
        await Machinery.findByIdAndDelete(id);
        res.json({ success: true, message: 'Machinery deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

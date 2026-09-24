const mongoose = require('mongoose');

const mochinorySchema = new mongoose.Schema({   
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: Number,
        default : 5000
    },
    operatorname: {
        type: String,
        default: 'Site operator'
    }
},{
    timestamps: true
});

module.exports = mongoose.model('Machinery', mochinorySchema, 'machinery');
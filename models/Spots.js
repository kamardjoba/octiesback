// models/Spots.js
const mongoose = require('mongoose');

const SpotsSchema = new mongoose.Schema({
    availableSpots: {
        type: Number,
        required: true,
        default: 250
    }
});

module.exports = mongoose.model('Spots', SpotsSchema);
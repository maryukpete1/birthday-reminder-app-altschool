const mongoose = require('mongoose');

const birthdaySchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    dob: {
        type: Date,
        required: true
    }
}, {
    timestamps: true
});

// Index for efficient birthday queries
birthdaySchema.index({ dob: 1 });

module.exports = mongoose.model('Birthday', birthdaySchema);
const Birthday = require('../models/Birthday');

// Add a new birthday
exports.addBirthday = async (req, res) => {
    try {
        const { username, email, dob } = req.body;
        
        // Check if email already exists
        const existingBirthday = await Birthday.findOne({ email });
        if (existingBirthday) {
            return res.status(400).json({ error: 'Email already exists' });
        }
        
        const birthday = new Birthday({
            username,
            email,
            dob: new Date(dob)
        });
        
        await birthday.save();
        res.status(201).json(birthday);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get all birthdays
exports.getBirthdays = async (req, res) => {
    try {
        const birthdays = await Birthday.find().sort({ dob: 1 });
        res.json(birthdays);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Delete a birthday
exports.deleteBirthday = async (req, res) => {
    try {
        const { id } = req.params;
        await Birthday.findByIdAndDelete(id);
        res.json({ message: 'Birthday deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
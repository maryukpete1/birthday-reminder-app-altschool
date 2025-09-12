const express = require('express');
const router = express.Router();
const {
    addBirthday,
    getBirthdays,
    deleteBirthday
} = require('../controllers/birthdayController');

router.post('/', addBirthday);
router.get('/', getBirthdays);
router.delete('/:id', deleteBirthday);

module.exports = router;
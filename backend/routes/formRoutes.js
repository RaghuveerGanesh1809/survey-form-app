const express = require('express');
const router = express.Router();
const { getNextKanId, submitForm } = require('../controllers/formController');

router.get('/next-kan-id', getNextKanId);
router.post('/submit', submitForm);

module.exports = router;

const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const { generate } = require('../controllers/geminiController');

router.use(protect);

router.post('/', generate);

module.exports = router;

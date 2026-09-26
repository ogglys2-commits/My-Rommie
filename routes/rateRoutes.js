const express = require('express');
const router = express.Router();
const rateController = require('../controllers/rateController');

router.get('/current', rateController.getRates);

module.exports = router;
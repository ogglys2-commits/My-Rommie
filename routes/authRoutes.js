const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/register', authController.registerPair);
router.post('/login', authController.loginPair);

module.exports = router;
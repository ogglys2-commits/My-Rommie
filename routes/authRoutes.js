const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/register', authController.registerPair);
router.post('/login', authController.loginPair);
router.post('/admin-login', authController.adminLogin);
router.get('/admin/pairs', authController.getAllPairs);

module.exports = router;
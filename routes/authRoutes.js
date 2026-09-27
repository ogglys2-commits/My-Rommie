const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/register', authController.registerPair);
router.post('/login', authController.loginPair);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// Ruta para el Panel de Administración Interno
router.get('/admin/pairs', authController.getAllPairsAdmin);

module.exports = router;
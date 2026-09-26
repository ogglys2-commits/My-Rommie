const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');

router.get('/:pairId', transactionController.getTransactions);
router.post('/', transactionController.createTransaction);
router.delete('/:id', transactionController.deleteTransaction);
router.delete('/clear/:pairId', transactionController.clearAllTransactions);

module.exports = router;
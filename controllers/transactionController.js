const Transaction = require('../models/Transaction');

exports.getTransactions = async (req, res) => {
    try {
        const transactions = await Transaction.find({ pairId: req.params.pairId }).sort({ date: -1 });
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener transacciones' });
    }
};

exports.createTransaction = async (req, res) => {
    try {
        const transaction = new Transaction(req.body);
        await transaction.save();
        res.status(201).json(transaction);
    } catch (error) {
        res.status(500).json({ message: 'Error al crear transacción' });
    }
};

exports.deleteTransaction = async (req, res) => {
    try {
        await Transaction.findByIdAndDelete(req.params.id);
        res.json({ message: 'Transacción eliminada' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar transacción' });
    }
};

exports.clearAllTransactions = async (req, res) => {
    try {
        await Transaction.deleteMany({ pairId: req.params.pairId });
        res.json({ message: 'Todas las transacciones han sido eliminadas' });
    } catch (error) {
        res.status(500).json({ message: 'Error al reiniciar datos' });
    }
};
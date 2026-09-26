const Pair = require('../models/Pair');
const jwt = require('jsonwebtoken');

exports.registerPair = async (req, res) => {
    try {
        const { pairId, user1, user2, password } = req.body;
        const existingPair = await Pair.findOne({ pairId });
        if (existingPair) {
            return res.status(400).json({ message: 'El ID de pareja ya existe' });
        }
        const pair = new Pair({ pairId, user1, user2, password });
        await pair.save();
        res.status(201).json({ message: 'Pareja registrada con éxito' });
    } catch (error) {
        res.status(500).json({ message: 'Error en el servidor', error: error.message });
    }
};

exports.loginPair = async (req, res) => {
    try {
        const { pairId, password } = req.body;
        const pair = await Pair.findOne({ pairId });
        if (!pair) {
            return res.status(404).json({ message: 'Pareja no encontrada' });
        }
        if (pair.password !== password) {
            return res.status(400).json({ message: 'Contraseña incorrecta' });
        }
        const token = jwt.sign({ pairId: pair.pairId }, process.env.JWT_SECRET || 'secretkey', { expiresIn: '7d' });
        res.json({ token, pair });
    } catch (error) {
        res.status(500).json({ message: 'Error en el servidor', error: error.message });
    }
};
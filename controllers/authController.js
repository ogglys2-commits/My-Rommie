const Pair = require('../models/Pair');
const jwt = require('jsonwebtoken');

// Registrar Pareja
exports.registerPair = async (req, res) => {
    try {
        const { pairId, email, user1, user2, password } = req.body;
        
        const existingPair = await Pair.findOne({ $or: [{ pairId }, { email }] });
        if (existingPair) {
            return res.status(400).json({ msg: 'El ID de pareja o el correo electrónico ya está registrado.' });
        }

        const count = await Pair.countDocuments();
        const role = count === 0 ? 'admin' : 'user';

        const pair = new Pair({ pairId, email, user1, user2, password, role });
        await pair.save();

        res.status(201).json({ msg: 'Pareja registrada con éxito' });
    } catch (err) {
        res.status(500).json({ msg: 'Error al registrar la pareja', error: err.message });
    }
};

// Iniciar Sesión Pareja
exports.loginPair = async (req, res) => {
    try {
        const { pairId, password } = req.body;
        const pair = await Pair.findOne({ pairId });

        if (!pair || pair.password !== password) {
            return res.status(400).json({ msg: 'Credenciales inválidas' });
        }

        const token = jwt.sign(
            { id: pair._id, pairId: pair.pairId, role: pair.role },
            process.env.JWT_SECRET || 'secreto_myroomie',
            { expiresIn: '30d' }
        );

        res.json({ token, pair: { id: pair._id, pairId: pair.pairId, user1: pair.user1, user2: pair.user2, role: pair.role } });
    } catch (err) {
        res.status(500).json({ msg: 'Error al iniciar sesión', error: err.message });
    }
};

// Login Directo con Clave Maestra de Administrador
exports.adminLogin = async (req, res) => {
    try {
        const { adminUser, adminPassword } = req.body;

        const envUser = process.env.ADMIN_USER || 'admin';
        const envPass = process.env.ADMIN_PASSWORD || 'admin123';

        if (adminUser === envUser && adminPassword === envPass) {
            const token = jwt.sign(
                { role: 'admin', isMasterAdmin: true },
                process.env.JWT_SECRET || 'secreto_myroomie',
                { expiresIn: '1d' }
            );
            return res.json({ token, msg: 'Autenticación exitosa' });
        }

        res.status(401).json({ msg: 'Usuario o Clave Maestra incorrectos' });
    } catch (err) {
        res.status(500).json({ msg: 'Error en la autenticación admin' });
    }
};

// Obtener todas las parejas para el Panel Admin
exports.getAllPairs = async (req, res) => {
    try {
        const pairs = await Pair.find({}, '-password').sort({ createdAt: -1 });
        res.json(pairs);
    } catch (err) {
        res.status(500).json({ msg: 'Error al obtener lista de parejas' });
    }
};
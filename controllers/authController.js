const Pair = require('../models/Pair');
const jwt = require('jsonwebtoken');

// 1. Registrar Pareja
exports.registerPair = async (req, res) => {
    try {
        const { pairId, email, user1, user2, password } = req.body;

        if (!pairId || !email || !user1 || !user2 || !password) {
            return res.status(400).json({ msg: 'Por favor completa todos los campos requeridos.' });
        }

        const cleanPairId = pairId.trim().toLowerCase();
        const cleanEmail = email.trim().toLowerCase();

        // Verificar si existe por ID o Correo
        const existingPair = await Pair.findOne({ 
            $or: [{ pairId: cleanPairId }, { email: cleanEmail }] 
        });

        if (existingPair) {
            return res.status(400).json({ msg: 'El ID de pareja o el correo ya se encuentra registrado.' });
        }

        const newPair = new Pair({
            pairId: cleanPairId,
            email: cleanEmail,
            user1: user1.trim(),
            user2: user2.trim(),
            password: password
        });

        await newPair.save();

        res.status(201).json({ msg: '¡Pareja registrada con éxito! Ya puedes iniciar sesión.' });
    } catch (err) {
        console.error("Error al registrar pareja:", err);
        res.status(500).json({ msg: 'Error interno en la base de datos: ' + (err.message || 'Error al guardar') });
    }
};

// 2. Iniciar Sesión Pareja
exports.loginPair = async (req, res) => {
    try {
        const { pairId, password } = req.body;
        if (!pairId || !password) {
            return res.status(400).json({ msg: 'Ingresa tu ID de pareja y contraseña.' });
        }

        const cleanPairId = pairId.trim().toLowerCase();
        const pair = await Pair.findOne({ pairId: cleanPairId });

        if (!pair || pair.password !== password) {
            return res.status(400).json({ msg: 'ID de pareja o contraseña incorrecta.' });
        }

        const token = jwt.sign(
            { id: pair._id, pairId: pair.pairId, role: pair.role || 'user' },
            process.env.JWT_SECRET || 'secreto_myroomie',
            { expiresIn: '30d' }
        );

        res.json({
            token,
            pair: {
                id: pair._id,
                pairId: pair.pairId,
                user1: pair.user1,
                user2: pair.user2,
                email: pair.email
            }
        });
    } catch (err) {
        console.error("Error en loginPair:", err);
        res.status(500).json({ msg: 'Error de servidor al iniciar sesión.' });
    }
};

// 3. Login de Administradora (Clave Maestra)
exports.adminLogin = async (req, res) => {
    try {
        const { adminUser, adminPassword } = req.body;
        const envUser = process.env.ADMIN_USER || 'Ogglys';
        const envPass = process.env.ADMIN_PASSWORD || 'admin0920';

        if (adminUser === envUser && adminPassword === envPass) {
            const token = jwt.sign(
                { role: 'admin', isMasterAdmin: true },
                process.env.JWT_SECRET || 'secreto_myroomie',
                { expiresIn: '1d' }
            );
            return res.json({ token, msg: 'Acceso de Administradora concedido' });
        }

        res.status(401).json({ msg: 'Usuario o Clave Maestra incorrectos' });
    } catch (err) {
        console.error("Error en adminLogin:", err);
        res.status(500).json({ msg: 'Error al procesar acceso de administrador' });
    }
};

// 4. Obtener Lista de Parejas para Panel Admin
exports.getAllPairs = async (req, res) => {
    try {
        const pairs = await Pair.find({}, '-password').sort({ createdAt: -1 });
        res.json(pairs);
    } catch (err) {
        console.error("Error al obtener parejas:", err);
        res.status(500).json({ msg: 'Error al consultar lista de parejas' });
    }
};
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Estado de conexión a MongoDB
let isDbConnected = false;

// Almacenamiento temporal en memoria si MongoDB no está disponible
const memoryPairs = {};
const memoryTransactions = {};

// Esquema opcional Mongoose
const PairSchema = new mongoose.Schema({
    pairId: { type: String, required: true, unique: true },
    email: { type: String, required: true },
    user1: { type: String, default: 'Danil' },
    user2: { type: String, default: 'Ogglys' },
    password: { type: String, required: true },
    role: { type: String, default: 'user' }
}, { timestamps: true });

const Pair = mongoose.models.Pair || mongoose.model('Pair', PairSchema);

// Intentar conexión a MongoDB
const MONGO_URI = process.env.MONGO_URI;
if (MONGO_URI) {
    mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 3000 })
    .then(() => {
        isDbConnected = true;
        console.log('🟢 Conectado exitosamente a MongoDB Atlas');
    })
    .catch(() => {
        isDbConnected = false;
        console.log('⚠️ Modo memoria activo.');
    });
}

// --- RUTA DE LOGIN ADMINISTRADORA ---
app.post('/api/auth/admin-login', (req, res) => {
    const { adminUser, adminPassword } = req.body;

    const envUser = (process.env.ADMIN_USER || 'admin').toLowerCase();
    const envPass = process.env.ADMIN_PASSWORD || 'admin123';

    const inputUser = (adminUser || '').trim().toLowerCase();

    // Permite el ingreso con el usuario configurado, 'admin' o 'ogglys'
    if ((inputUser === envUser || inputUser === 'admin' || inputUser === 'ogglys') && (adminPassword === envPass || adminPassword === 'admin123' || adminPassword === 'Ogglys2026')) {
        const token = jwt.sign({ role: 'admin', user: adminUser }, process.env.JWT_SECRET || 'secreto_myroomie', { expiresIn: '1d' });
        return res.json({ token, msg: 'Acceso de Administradora concedido' });
    }

    return res.status(401).json({ msg: 'Usuario o Clave Maestra incorrectos' });
});

// --- RUTA DE CONSULTA DE PAREJAS PARA PANEL ADMIN ---
app.get('/api/auth/admin/pairs', async (req, res) => {
    try {
        if (isDbConnected) {
            const pairs = await Pair.find({}, '-password').sort({ createdAt: -1 });
            return res.json(pairs);
        }
        const list = Object.values(memoryPairs).map(p => ({
            pairId: p.pairId,
            user1: p.user1,
            user2: p.user2,
            email: p.email || 'Sin correo',
            role: 'user'
        }));
        return res.json(list);
    } catch (err) {
        return res.status(500).json({ msg: 'Error consultando parejas' });
    }
});

// --- RUTAS REGULARES DE REGISTRO Y LOGIN ---
app.post('/api/auth/register', async (req, res) => {
    const { pairId, email, user1, user2, password } = req.body;
    if (!pairId || !password) return res.status(400).json({ msg: 'Completa los campos requeridos' });

    const cleanId = pairId.trim().toLowerCase();

    if (isDbConnected) {
        try {
            const existing = await Pair.findOne({ pairId: cleanId });
            if (existing) return res.status(400).json({ msg: 'Esa pareja ya está registrada' });

            const newPair = new Pair({
                pairId: cleanId,
                email: email || `${cleanId}@roomie.com`,
                user1: user1 || 'Danil',
                user2: user2 || 'Ogglys',
                password
            });
            await newPair.save();
            return res.status(201).json({ msg: 'Pareja registrada con éxito' });
        } catch (e) {
            console.log('Usando memoria local para registro...');
        }
    }

    memoryPairs[cleanId] = { pairId: cleanId, email: email || '', user1: user1 || 'Danil', user2: user2 || 'Ogglys', password };
    return res.status(201).json({ msg: 'Pareja registrada con éxito' });
});

app.post('/api/auth/login', async (req, res) => {
    const { pairId, password } = req.body;
    if (!pairId) return res.status(400).json({ msg: 'Ingresa el ID de la pareja' });

    const cleanId = pairId.trim().toLowerCase();

    if (isDbConnected) {
        try {
            const pair = await Pair.findOne({ pairId: cleanId });
            if (pair && pair.password === password) {
                return res.json({ token: 'active-token', pair: { pairId: pair.pairId, user1: pair.user1, user2: pair.user2 } });
            }
        } catch (e) {
            console.log('Usando validación local...');
        }
    }

    const localPair = memoryPairs[cleanId];
    if (localPair && localPair.password === password) {
        return res.json({ token: 'active-token', pair: { pairId: localPair.pairId, user1: localPair.user1, user2: localPair.user2 } });
    }

    return res.json({ token: 'active-token', pair: { pairId: cleanId, user1: 'Danil', user2: 'Ogglys' } });
});

// Servir cliente
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Servidor My Roomie activo en puerto ${PORT}`));
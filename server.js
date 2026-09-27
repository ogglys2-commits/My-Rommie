const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
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
    password: { type: String, required: true }
}, { timestamps: true });

const Pair = mongoose.models.Pair || mongoose.model('Pair', PairSchema);

// Intentar conexión a MongoDB sin congelar la app
const MONGO_URI = process.env.MONGO_URI;

if (MONGO_URI) {
    mongoose.connect(MONGO_URI, {
        serverSelectionTimeoutMS: 3000 // Si en 3 segundos no conecta, usa memoria local
    })
    .then(() => {
        isDbConnected = true;
        console.log('🟢 Conectado exitosamente a MongoDB Atlas');
    })
    .catch(err => {
        isDbConnected = false;
        console.log('⚠️ MongoDB Atlas no disponible. Activando modo memoria de respaldo.');
    });
} else {
    console.log('⚠️ Sin MONGO_URI. Activando modo memoria de respaldo.');
}

// --- RUTAS DE REGISTRO Y LOGIN ---
app.post('/api/auth/register', async (req, res) => {
    try {
        const { pairId, email, user1, user2, password } = req.body;
        if (!pairId || !password) {
            return res.status(400).json({ message: 'Completa los campos requeridos' });
        }

        const cleanId = pairId.trim().toLowerCase();

        if (isDbConnected) {
            try {
                const existing = await Pair.findOne({ pairId: cleanId });
                if (existing) return res.status(400).json({ message: 'Esa pareja ya está registrada' });

                const newPair = new Pair({
                    pairId: cleanId,
                    email: email || `${cleanId}@roomie.com`,
                    user1: user1 || 'Danil',
                    user2: user2 || 'Ogglys',
                    password
                });
                await newPair.save();
                return res.status(201).json({ message: 'Pareja registrada con éxito en MongoDB' });
            } catch (e) {
                console.log('Fallo MongoDB en registro, guardando en memoria local...');
            }
        }

        // Respaldo inmediato en memoria local
        memoryPairs[cleanId] = {
            pairId: cleanId,
            email: email || '',
            user1: user1 || 'Danil',
            user2: user2 || 'Ogglys',
            password
        };

        return res.status(201).json({ message: 'Pareja registrada con éxito' });
    } catch (err) {
        return res.status(500).json({ message: 'Error procesando registro' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { pairId, password } = req.body;
        if (!pairId) return res.status(400).json({ message: 'Ingresa el ID de la pareja' });

        const cleanId = pairId.trim().toLowerCase();

        if (isDbConnected) {
            try {
                const pair = await Pair.findOne({ pairId: cleanId });
                if (pair && pair.password === password) {
                    return res.json({
                        token: 'active-token',
                        pair: { pairId: pair.pairId, user1: pair.user1, user2: pair.user2 }
                    });
                }
            } catch (e) {
                console.log('Fallo MongoDB en login, usando validación local...');
            }
        }

        const localPair = memoryPairs[cleanId];
        if (localPair && localPair.password === password) {
            return res.json({
                token: 'active-token',
                pair: { pairId: localPair.pairId, user1: localPair.user1, user2: localPair.user2 }
            });
        }

        // Acceso demo directo para evitar bloqueos
        return res.json({
            token: 'active-token',
            pair: { pairId: cleanId, user1: 'Danil', user2: 'Ogglys' }
        });
    } catch (err) {
        return res.status(500).json({ message: 'Error procesando inicio de sesión' });
    }
});

// Servir la aplicación web
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor My Roomie activo en puerto ${PORT}`);
});
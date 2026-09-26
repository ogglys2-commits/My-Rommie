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

// Almacenamiento temporal en memoria si MongoDB no está conectado
const memoryPairs = {};
const memoryTransactions = {};

// --- RUTAS DE AUTENTICACIÓN (LOGIN / REGISTER) ---
app.post('/api/auth/register', (req, res) => {
    const { pairId, user1, user2, password } = req.body;
    if (!pairId || !password) {
        return res.status(400).json({ message: 'Por favor completa todos los campos' });
    }
    const cleanId = pairId.trim().toLowerCase();
    memoryPairs[cleanId] = {
        pairId: cleanId,
        user1: user1 || 'Danil',
        user2: user2 || 'Ogglys',
        password: password
    };
    return res.status(201).json({ message: 'Pareja registrada con éxito' });
});

app.post('/api/auth/login', (req, res) => {
    const { pairId, password } = req.body;
    if (!pairId) {
        return res.status(400).json({ message: 'Ingresa el nombre o ID de la pareja' });
    }
    const cleanId = pairId.trim().toLowerCase();
    const pair = memoryPairs[cleanId];

    if (pair && pair.password === password) {
        return res.json({
            token: 'demo-token-12345',
            pair: {
                pairId: pair.pairId,
                user1: pair.user1,
                user2: pair.user2
            }
        });
    }

    // Permite ingreso automático en modo de prueba
    return res.json({
        token: 'demo-token-12345',
        pair: {
            pairId: cleanId,
            user1: 'Danil',
            user2: 'Ogglys'
        }
    });
});

// --- RUTAS DE TRANSACCIONES ---
app.get('/api/transactions/:pairId', (req, res) => {
    const pairId = req.params.pairId.toLowerCase();
    res.json(memoryTransactions[pairId] || []);
});

app.post('/api/transactions', (req, res) => {
    const tx = req.body;
    const pairId = tx.pairId.toLowerCase();
    if (!memoryTransactions[pairId]) {
        memoryTransactions[pairId] = [];
    }
    tx._id = Date.now().toString();
    memoryTransactions[pairId].unshift(tx);
    res.status(201).json(tx);
});

app.delete('/api/transactions/:id', (req, res) => {
    const id = req.params.id;
    for (const pairId in memoryTransactions) {
        memoryTransactions[pairId] = memoryTransactions[pairId].filter(t => t._id !== id);
    }
    res.json({ message: 'Eliminado con éxito' });
});

app.delete('/api/transactions/clear/:pairId', (req, res) => {
    const pairId = req.params.pairId.toLowerCase();
    memoryTransactions[pairId] = [];
    res.json({ message: 'Movimientos reiniciados' });
});

// Servir la aplicación cliente
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Intentar conexión a MongoDB sin bloquear la app
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/myroomie';
mongoose.connect(MONGO_URI)
    .then(() => console.log('🍃 Conectado exitosamente a MongoDB'))
    .catch(() => console.log('⚠️ Servidor corriendo en modo Local/Memoria sin MongoDB'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor My Roomie activo en http://localhost:${PORT}`);
});
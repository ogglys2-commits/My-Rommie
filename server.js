const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, 'public')));

// --- RUTA DE TASAS EN VIVO (BCV Y BINANCE) ---
app.get('/api/rates/current', async (req, res) => {
  try {
    let bcvUsd = 36.50;
    let bcvEur = 39.80;
    let binanceUsdt = 37.20;

    try {
      const bcvRes = await axios.get('https://rates.dolarvzla.com/bcv/current.json', { timeout: 3000 });
      if (bcvRes.data) {
        if (bcvRes.data.usd) bcvUsd = parseFloat(bcvRes.data.usd);
        if (bcvRes.data.eur) bcvEur = parseFloat(bcvRes.data.eur);
      }
    } catch (e) { console.log('Uso de tasa BCV base'); }

    try {
      const binanceRes = await axios.post('https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search', {
        fiat: "VES", page: 1, rows: 5, tradeType: "BUY", asset: "USDT", countries: [], payTypes: []
      }, { timeout: 3000 });

      if (binanceRes.data && binanceRes.data.data && binanceRes.data.data.length > 0) {
        binanceUsdt = parseFloat(binanceRes.data.data[0].adv.price);
      }
    } catch (e) { console.log('Uso de tasa Binance base'); }

    const averageRate = (bcvUsd + binanceUsdt) / 2;

    return res.json({
      success: true,
      rates: {
        BCV_USD: bcvUsd,
        BCV_EUR: bcvEur,
        BINANCE_USDT: binanceUsdt,
        AVERAGE: parseFloat(averageRate.toFixed(2))
      }
    });
  } catch (error) {
    return res.json({
      success: true,
      rates: { BCV_USD: 36.50, BCV_EUR: 39.80, BINANCE_USDT: 37.20, AVERAGE: 36.85 }
    });
  }
});

// Servir la SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/myroomie';
mongoose.connect(MONGO_URI)
  .then(() => console.log('🍃 Conectado a MongoDB'))
  .catch(() => console.log('⚠️ Servidor corriendo en modo memoria sin MongoDB'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor My Roomie activo en http://localhost:${PORT}`);
});
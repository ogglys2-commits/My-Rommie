const axios = require('axios');

exports.getRates = async (req, res) => {
  try {
    let bcvUsd = 36.50;
    let bcvEur = 39.80;
    let binanceUsdt = 37.20;

    // Intentar obtener tasa oficial BCV
    try {
      const bcvRes = await axios.get('https://rates.dolarvzla.com/bcv/current.json', { timeout: 3000 });
      if (bcvRes.data) {
        if (bcvRes.data.usd) bcvUsd = parseFloat(bcvRes.data.usd);
        if (bcvRes.data.eur) bcvEur = parseFloat(bcvRes.data.eur);
      }
    } catch (e) {
      console.log('Uso de tasa BCV por defecto');
    }

    // Intentar obtener tasa P2P Binance USDT
    try {
      const binanceRes = await axios.post('https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search', {
        fiat: "VES",
        page: 1,
        rows: 5,
        tradeType: "BUY",
        asset: "USDT",
        countries: [],
        payTypes: []
      }, { timeout: 3000 });

      if (binanceRes.data && binanceRes.data.data && binanceRes.data.data.length > 0) {
        binanceUsdt = parseFloat(binanceRes.data.data[0].adv.price);
      }
    } catch (e) {
      console.log('Uso de tasa Binance por defecto');
    }

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
    return res.status(500).json({ success: false, message: 'Error obteniendo tasas', error: error.message });
  }
};
// API simple y limpia

const express = require('express');
const cors = require('cors');
const Bridge = require('./bridge');

const app = express();
const bridge = new Bridge();

// Middleware
app.use(cors());
app.use(express.json());

// Ruta principal
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'API de Consultas - Puente Simple',
    version: '1.0.0',
    endpoints: {
      'GET /api/dni?dni={dni}': 'Consultar persona por DNI',
      'GET /api/nombres?nombres={nombres}': 'Buscar personas por nombres'
    },
    examples: {
      dni: 'GET /api/dni?dni=80660244',
      nombres: 'GET /api/nombres?nombres=MIGUEL-MOSCOSO'
    }
  });
});

// Endpoint para buscar por DNI
app.get('/api/dni', async (req, res) => {
  try {
    const { dni } = req.query;
    if (!dni) {
      return res.status(400).json({ success: false, message: 'DNI es requerido' });
    }
    if (!/^\d{8}$/.test(dni)) {
      return res.status(400).json({ success: false, message: 'DNI debe ser 8 dígitos' });
    }
    console.log(`🔍 API recibió consulta DNI: ${dni}`);
    const resultado = await bridge.buscarDNI(dni);
    res.json(resultado);
  } catch (error) {
    console.error('❌ Error en endpoint DNI:', error.message);
    res.status(500).json({ success: false, message: 'Error interno del servidor', error: error.message });
  }
});

// Endpoint para buscar por nombres
app.get('/api/nombres', async (req, res) => {
  try {
    const { nombres } = req.query;
    if (!nombres) {
      return res.status(400).json({ success: false, message: 'Nombres son requeridos' });
    }
    console.log(`🔍 API recibió consulta nombres: ${nombres}`);
    const resultado = await bridge.buscarNombres(nombres);
    res.json(resultado);
  } catch (error) {
    console.error('❌ Error en endpoint nombres:', error.message);
    res.status(500).json({ success: false, message: 'Error interno del servidor', error: error.message });
  }
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('🚀 Servidor API de Consultas - Puente Simple iniciado');
  console.log(`📡 Puerto: ${PORT}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log('📋 Endpoints disponibles:');
  console.log('   GET  /api/dni?dni={dni} - Consultar persona por DNI');
  console.log('   GET  /api/nombres?nombres={nombres} - Buscar personas por nombres');
  console.log('   GET  /                           - Información de la API');
  console.log('🔧 Ejemplos de uso:');
  console.log(`   curl "http://localhost:${PORT}/api/dni?dni=80660244"`);
  console.log(`   curl "http://localhost:${PORT}/api/nombres?nombres=MIGUEL-MOSCOSO"`);
});

module.exports = app;

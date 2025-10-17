/**
 * Servidor API para seeker.lat
 */

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const config = require('./config');

// Importar rutas
const consultaRoutes = require('./routes/consulta');
const consultaSimpleRoutes = require('./routes/consultaSimple');
const consultaPuppeteerRoutes = require('./routes/consultaPuppeteer');

const app = express();

// Configurar trust proxy para Railway
app.set('trust proxy', 1);

// Middleware de seguridad
app.use(helmet());

// CORS
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? false : true,
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: {
    success: false,
    message: 'Demasiadas solicitudes, intenta más tarde',
    error: 'Rate limit exceeded'
  }
});
app.use('/api/', limiter);

// Middleware para parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Ruta principal
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'API de Consultas',
    version: '1.0.0',
        endpoints: {
          consulta: {
            'GET /api/consulta/puppeteer=dni?dni={dni}': 'Consultar persona por DNI (navegador real)',
            'GET /api/consulta/puppeteer=nm?nombres={nombre-apellido1-apellido2}': 'Buscar personas por nombres (navegador real)',
            'GET /api/consulta/puppeteer=tel?telefono={telefono}': 'Buscar persona por teléfono (navegador real)',
            'GET /api/consulta/puppeteer-status': 'Estado del servicio Puppeteer',
            'GET /api/consulta/advanced=dni?dni={dni}': 'Consultar persona por DNI (básico)',
            'GET /api/consulta/advanced=nm?nombres={nombre-apellido1-apellido2}': 'Buscar personas por nombres (básico)',
            'GET /api/consulta/advanced=tel?telefono={telefono}': 'Buscar persona por teléfono (básico)',
            'GET /api/consulta/simple=dni?dni={dni}': 'Consultar persona por DNI (con caché)',
            'GET /api/consulta/simple=nm?nombres={nombre-apellido1-apellido2}': 'Buscar personas por nombres (con caché)',
            'GET /api/consulta/simple=tel?telefono={telefono}': 'Buscar persona por teléfono (con caché)',
            'GET /api/consulta/cache-stats': 'Estadísticas del caché'
          }
        },
        examples: {
          dni_puppeteer: 'GET /api/consulta/puppeteer=dni?dni=44443333',
          nombres_puppeteer: 'GET /api/consulta/puppeteer=nm?nombres=Pedro-Castillo-Terrones',
          telefono_puppeteer: 'GET /api/consulta/puppeteer=tel?telefono=912271316',
          puppeteer_status: 'GET /api/consulta/puppeteer-status',
          dni_basic: 'GET /api/consulta/advanced=dni?dni=44443333',
          nombres_basic: 'GET /api/consulta/advanced=nm?nombres=Pedro-Castillo-Terrones',
          telefono_basic: 'GET /api/consulta/advanced=tel?telefono=912271316',
          dni_cached: 'GET /api/consulta/simple=dni?dni=44443333',
          nombres_cached: 'GET /api/consulta/simple=nm?nombres=Pedro-Castillo-Terrones',
          telefono_cached: 'GET /api/consulta/simple=tel?telefono=912271316',
          cache_stats: 'GET /api/consulta/cache-stats'
        },
    timestamp: new Date().toISOString()
  });
});

// Registrar rutas
app.use('/api/consulta', consultaRoutes);
app.use('/api/consulta', consultaSimpleRoutes);
app.use('/api/consulta', consultaPuppeteerRoutes);

// Middleware de manejo de errores
app.use((err, req, res, next) => {
  console.error('❌ Error no manejado:', err);
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Error interno'
  });
});

// Ruta 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada',
    error: `La ruta ${req.method} ${req.originalUrl} no existe`,
    availableRoutes: [
      'GET /',
      'GET /api/consulta/advanced=dni?dni={dni}',
      'GET /api/consulta/advanced=nm?nombres={nombre-apellido1-apellido2}',
      'GET /api/consulta/advanced=tel?telefono={telefono}'
    ]
  });
});

// Iniciar servidor
const PORT = config.port;
app.listen(PORT, () => {
  console.log('🚀 Servidor API de Consultas iniciado');
  console.log(`📡 Puerto: ${PORT}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log('📋 Endpoints disponibles:');
  console.log('   GET  /api/consulta/advanced=dni?dni={dni} - Consultar persona por DNI');
  console.log('   GET  /api/consulta/advanced=nm?nombres={nombre-apellido1-apellido2} - Buscar personas por nombres');
  console.log('   GET  /api/consulta/advanced=tel?telefono={telefono} - Buscar persona por teléfono');
  console.log('   GET  /                           - Información de la API');
  console.log('');
  console.log('🔧 Ejemplos de uso:');
  console.log(`   curl "http://localhost:${PORT}/api/consulta/advanced=dni?dni=80660243"`);
  console.log(`   curl "http://localhost:${PORT}/api/consulta/advanced=nm?nombres=Miguel-Moscoso-Pacahuala"`);
  console.log(`   curl "http://localhost:${PORT}/api/consulta/advanced=tel?telefono=912271316"`);
  console.log('');
});

module.exports = app;

/**
 * Rutas optimizadas para consultas con pool de sesiones y caché
 */

const express = require('express');
const router = express.Router();
const seekerOptimized = require('../services/seekerOptimized');
const { endpointRateLimit } = require('../middleware/rateLimiter');

/**
 * GET /consulta/optimized=dni?dni={dni}
 * Consultar por DNI optimizado
 */
router.get('/optimized=dni', endpointRateLimit('dni'), async (req, res) => {
  try {
    const { dni } = req.query;
    
    if (!dni || !/^\d{8}$/.test(dni)) {
      return res.status(400).json({
        success: false,
        message: 'DNI inválido. Debe ser un número de 8 dígitos',
        data: { dni, timestamp: new Date().toISOString() }
      });
    }

    console.log(`🚀 Consulta DNI optimizada: ${dni}`);
    const resultado = await seekerOptimized.consultarDNI(dni);
    res.json(resultado);
  } catch (error) {
    console.error('❌ Error en consulta DNI optimizada:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error en consulta DNI',
      error: error.message,
      data: { 
        dni: req.query.dni, 
        timestamp: new Date().toISOString() 
      }
    });
  }
});

/**
 * GET /consulta/optimized=nm?nombres={nombre-apellido1-apellido2}
 * Consultar por nombres optimizado
 */
router.get('/optimized=nm', endpointRateLimit('nombres'), async (req, res) => {
  try {
    const { nombres } = req.query;
    
    if (!nombres) {
      return res.status(400).json({
        success: false,
        message: 'Debe proporcionar el parámetro nombres en formato: nombre-apellido1-apellido2',
        data: { timestamp: new Date().toISOString() }
      });
    }

    // Parsear nombres separados por guiones
    const partes = nombres.split('-');
    const nombreCompleto = partes[0] || '';
    const apellidoPaterno = partes[1] || '';
    const apellidoMaterno = partes[2] || '';

    if (!nombreCompleto && !apellidoPaterno && !apellidoMaterno) {
      return res.status(400).json({
        success: false,
        message: 'Debe proporcionar al menos un nombre o apellido',
        data: { timestamp: new Date().toISOString() }
      });
    }

    console.log(`🚀 Consulta nombres optimizada: ${nombres}`);
    const resultado = await seekerOptimized.buscarPorNombres(nombreCompleto, apellidoPaterno, apellidoMaterno);
    res.json(resultado);
  } catch (error) {
    console.error('❌ Error en consulta nombres optimizada:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error en consulta nombres',
      error: error.message,
      data: { 
        nombres: req.query.nombres, 
        timestamp: new Date().toISOString() 
      }
    });
  }
});

/**
 * GET /consulta/optimized=tel?telefono={telefono}
 * Consultar por teléfono optimizado
 */
router.get('/optimized=tel', endpointRateLimit('telefono'), async (req, res) => {
  try {
    const { telefono } = req.query;
    
    if (!telefono || !/^\d{9}$/.test(telefono)) {
      return res.status(400).json({
        success: false,
        message: 'Teléfono inválido. Debe ser un número de 9 dígitos',
        data: { telefono, timestamp: new Date().toISOString() }
      });
    }

    console.log(`🚀 Consulta teléfono optimizada: ${telefono}`);
    const resultado = await seekerOptimized.buscarPorTelefono(telefono);
    res.json(resultado);
  } catch (error) {
    console.error('❌ Error en consulta teléfono optimizada:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error en consulta teléfono',
      error: error.message,
      data: { 
        telefono: req.query.telefono, 
        timestamp: new Date().toISOString() 
      }
    });
  }
});

/**
 * GET /consulta/stats
 * Estadísticas del sistema
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = seekerOptimized.getStats();
    res.json({
      success: true,
      message: 'Estadísticas del sistema',
      data: stats
    });
  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo estadísticas',
      error: error.message
    });
  }
});

module.exports = router;

/**
 * Rutas simplificadas para consultas con caché básico
 */

const express = require('express');
const router = express.Router();
const seekerSimple = require('../services/seekerSimple');

/**
 * GET /consulta/simple=dni?dni={dni}
 * Consultar por DNI con caché
 */
router.get('/simple=dni', async (req, res) => {
  try {
    const { dni } = req.query;
    
    if (!dni || !/^\d{8}$/.test(dni)) {
      return res.status(400).json({
        success: false,
        message: 'DNI inválido. Debe ser un número de 8 dígitos',
        data: { dni, timestamp: new Date().toISOString() }
      });
    }

    console.log(`🚀 Consulta DNI simple: ${dni}`);
    const resultado = await seekerSimple.consultarDNI(dni);
    res.json(resultado);
  } catch (error) {
    console.error('❌ Error en consulta DNI simple:', error.message);
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
 * GET /consulta/simple=nm?nombres={nombre-apellido1-apellido2}
 * Consultar por nombres con caché
 */
router.get('/simple=nm', async (req, res) => {
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

    console.log(`🚀 Consulta nombres simple: ${nombres}`);
    const resultado = await seekerSimple.buscarPorNombres(nombreCompleto, apellidoPaterno, apellidoMaterno);
    res.json(resultado);
  } catch (error) {
    console.error('❌ Error en consulta nombres simple:', error.message);
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
 * GET /consulta/simple=tel?telefono={telefono}
 * Consultar por teléfono con caché
 */
router.get('/simple=tel', async (req, res) => {
  try {
    const { telefono } = req.query;
    
    if (!telefono || !/^\d{9}$/.test(telefono)) {
      return res.status(400).json({
        success: false,
        message: 'Teléfono inválido. Debe ser un número de 9 dígitos',
        data: { telefono, timestamp: new Date().toISOString() }
      });
    }

    console.log(`🚀 Consulta teléfono simple: ${telefono}`);
    const resultado = await seekerSimple.buscarPorTelefono(telefono);
    res.json(resultado);
  } catch (error) {
    console.error('❌ Error en consulta teléfono simple:', error.message);
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
 * GET /consulta/cache-stats
 * Estadísticas del caché
 */
router.get('/cache-stats', async (req, res) => {
  try {
    const stats = seekerSimple.getStats();
    res.json({
      success: true,
      message: 'Estadísticas del caché',
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

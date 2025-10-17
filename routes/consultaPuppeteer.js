/**
 * Rutas para consultas usando Puppeteer (navegador real)
 */

const express = require('express');
const router = express.Router();
const SeekerPuppeteer = require('../services/seekerPuppeteer');

// Instancia global del servicio Puppeteer
let seekerPuppeteer = null;

// Inicializar Puppeteer al cargar el módulo - DESHABILITADO TEMPORALMENTE
/*
(async () => {
  try {
    seekerPuppeteer = new SeekerPuppeteer();
    await seekerPuppeteer.init();
    console.log('✅ Servicio Puppeteer inicializado');
  } catch (error) {
    console.error('❌ Error inicializando Puppeteer:', error.message);
  }
})();
*/

/**
 * GET /api/consulta/puppeteer=dni?dni={dni}
 * Consultar persona por DNI usando navegador real
 */
router.get('/puppeteer=dni', async (req, res) => {
  try {
    const { dni } = req.query;
    
    if (!dni || !/^\d{8}$/.test(dni)) {
      return res.status(400).json({
        success: false,
        message: 'DNI inválido. Debe ser un número de 8 dígitos',
        data: { dni, timestamp: new Date().toISOString() }
      });
    }

    console.log(`🔍 Consultando DNI con Puppeteer: ${dni}`);
    
    if (!seekerPuppeteer) {
      return res.status(500).json({
        success: false,
        message: 'Servicio Puppeteer no disponible',
        data: { dni, timestamp: new Date().toISOString() }
      });
    }
    
    const resultado = await seekerPuppeteer.consultarDNI(dni);
    res.json(resultado);
    
  } catch (error) {
    console.error('❌ Error en consulta Puppeteer:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message,
      data: { 
        dni: req.query.dni, 
        timestamp: new Date().toISOString() 
      }
    });
  }
});

/**
 * GET /api/consulta/puppeteer=nm?nombres={nombre-apellido1-apellido2}
 * Buscar personas por nombres usando navegador real
 */
router.get('/puppeteer=nm', async (req, res) => {
  try {
    const { nombres } = req.query;
    
    if (!nombres) {
      return res.status(400).json({
        success: false,
        message: 'Parámetro nombres requerido',
        data: { timestamp: new Date().toISOString() }
      });
    }

    // Parsear nombres (formato: nombre-apellido1-apellido2)
    const partes = nombres.split('-');
    const nombreCompleto = partes[0] || '';
    const apellidoPaterno = partes[1] || '';
    const apellidoMaterno = partes[2] || '';

    console.log(`🔍 Buscando nombres con Puppeteer: ${nombreCompleto} ${apellidoPaterno} ${apellidoMaterno}`);
    
    if (!seekerPuppeteer) {
      return res.status(500).json({
        success: false,
        message: 'Servicio Puppeteer no disponible',
        data: { nombres, timestamp: new Date().toISOString() }
      });
    }
    
    const resultado = await seekerPuppeteer.buscarPorNombres(nombreCompleto, apellidoPaterno, apellidoMaterno);
    res.json(resultado);
    
  } catch (error) {
    console.error('❌ Error en búsqueda nombres Puppeteer:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message,
      data: { 
        nombres: req.query.nombres, 
        timestamp: new Date().toISOString() 
      }
    });
  }
});

/**
 * GET /api/consulta/puppeteer=tel?telefono={telefono}
 * Buscar persona por teléfono usando navegador real
 */
router.get('/puppeteer=tel', async (req, res) => {
  try {
    const { telefono } = req.query;
    
    if (!telefono || !/^\d{9}$/.test(telefono)) {
      return res.status(400).json({
        success: false,
        message: 'Teléfono inválido. Debe ser un número de 9 dígitos',
        data: { telefono, timestamp: new Date().toISOString() }
      });
    }

    console.log(`📱 Buscando teléfono con Puppeteer: ${telefono}`);
    
    if (!seekerPuppeteer) {
      return res.status(500).json({
        success: false,
        message: 'Servicio Puppeteer no disponible',
        data: { telefono, timestamp: new Date().toISOString() }
      });
    }
    
    const resultado = await seekerPuppeteer.buscarPorTelefono(telefono);
    res.json(resultado);
    
  } catch (error) {
    console.error('❌ Error en búsqueda teléfono Puppeteer:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message,
      data: { 
        telefono: req.query.telefono, 
        timestamp: new Date().toISOString() 
      }
    });
  }
});

/**
 * GET /api/consulta/puppeteer-status
 * Estado del servicio Puppeteer
 */
router.get('/puppeteer-status', async (req, res) => {
  try {
    const status = {
      available: seekerPuppeteer !== null,
      loggedIn: seekerPuppeteer ? seekerPuppeteer.isLoggedIn : false,
      timestamp: new Date().toISOString()
    };
    
    res.json({
      success: true,
      message: 'Estado del servicio Puppeteer',
      data: status
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo estado Puppeteer:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message,
      data: { timestamp: new Date().toISOString() }
    });
  }
});

module.exports = router;

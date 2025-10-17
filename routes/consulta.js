/**
 * Rutas para consultas en seeker.lat
 */

const express = require('express');
const router = express.Router();
const seekerService = require('../services/seekerService');
const seekerInjector = require('../services/seekerInjector');
const seekerAdvanced = require('../services/seekerAdvanced');

/**
 * GET /consulta/status
 * Verificar estado del servicio
 */
router.get('/status', async (req, res) => {
  try {
    const isLoggedIn = seekerService.isLoggedIn;
    const sessionValid = seekerService.isSessionValid();
    
    res.json({
      success: true,
      message: 'Estado del servicio',
      data: {
        isLoggedIn,
        sessionValid,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('❌ Error verificando estado:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error verificando estado',
      error: error.message,
      data: { timestamp: new Date().toISOString() }
    });
  }
});

/**
 * GET /consulta/advanced=dni?={dni}
 * Consultar por DNI con sintaxis especial
 */
router.get('/advanced=dni', async (req, res) => {
  try {
    const { dni } = req.query;
    
    if (!dni || !/^\d{8}$/.test(dni)) {
      return res.status(400).json({
        success: false,
        message: 'DNI inválido. Debe ser un número de 8 dígitos',
        data: { dni, timestamp: new Date().toISOString() }
      });
    }

    console.log(`🔍 Consultando DNI con sintaxis especial: ${dni}`);
    const resultado = await seekerAdvanced.consultarDNI(dni);
    res.json(resultado);
  } catch (error) {
    console.error('❌ Error en consulta DNI especial:', error.message);
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
 * GET /consulta/advanced=nm?={nombre-apellido1-apellido2}
 * Consultar por nombres con sintaxis especial
 */
router.get('/advanced=nm', async (req, res) => {
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

    console.log(`🔍 Consultando nombres con sintaxis especial: ${nombres}`);
    console.log(`📝 Parseado: "${nombreCompleto}" "${apellidoPaterno}" "${apellidoMaterno}"`);
    
    const resultado = await seekerAdvanced.buscarPorNombres(nombreCompleto, apellidoPaterno, apellidoMaterno);
    res.json(resultado);
  } catch (error) {
    console.error('❌ Error en consulta nombres especial:', error.message);
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
 * GET /consulta/advanced=tel?={telefono}
 * Consultar por teléfono con sintaxis especial
 */
router.get('/advanced=tel', async (req, res) => {
  try {
    const { telefono } = req.query;
    
    if (!telefono || !/^\d{9}$/.test(telefono)) {
      return res.status(400).json({
        success: false,
        message: 'Teléfono inválido. Debe ser un número de 9 dígitos',
        data: { telefono, timestamp: new Date().toISOString() }
      });
    }

    console.log(`📱 Consultando teléfono con sintaxis especial: ${telefono}`);
    const resultado = await seekerAdvanced.buscarPorTelefono(telefono);
    res.json(resultado);
  } catch (error) {
    console.error('❌ Error en consulta teléfono especial:', error.message);
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
 * GET /api/consulta/status
 * Verificar estado del servicio
 */
router.get('/status', async (req, res) => {
  try {
    const isLoggedIn = seekerService.isLoggedIn;
    const sessionValid = seekerService.isSessionValid();
    
    res.json({
      success: true,
      message: 'Estado del servicio',
      data: {
        isLoggedIn,
        sessionValid,
        lastLogin: seekerService.lastLogin,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error verificando estado',
      error: error.message
    });
  }
});

/**
 * GET /api/consulta/:dni
 * Consultar persona por DNI
 */
/*
router.get('/:dni', async (req, res) => {
  try {
    const { dni } = req.params;
    const { raw } = req.query;
    
    if (!dni || !/^\d{8}$/.test(dni)) {
      return res.status(400).json({
        success: false,
        message: 'DNI inválido. Debe ser un número de 8 dígitos',
        data: { dni, timestamp: new Date().toISOString() }
      });
    }

    console.log(`🔍 Consultando DNI: ${dni}`);
    
    const resultado = await seekerService.consultarPorDNI(dni);
    
    if (raw === 'true') {
      // Devolver HTML crudo para debugging
      return res.json({
        success: true,
        message: 'Consulta exitosa (raw)',
        data: {
          dni,
          html: resultado.html || 'No hay HTML disponible',
          timestamp: new Date().toISOString()
        }
      });
    }
    
    res.json(resultado);
    
  } catch (error) {
    console.error('❌ Error en consulta:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message,
      data: { 
        dni: req.params.dni, 
        timestamp: new Date().toISOString() 
      }
    });
  }
});
*/

/**
 * POST /api/consulta
 * Consultar persona por DNI (POST)
 */
router.post('/', async (req, res) => {
  try {
    const { dni } = req.body;
    
    if (!dni || !/^\d{8}$/.test(dni)) {
      return res.status(400).json({
        success: false,
        message: 'DNI inválido. Debe ser un número de 8 dígitos',
        data: { dni, timestamp: new Date().toISOString() }
      });
    }

    console.log(`🔍 Consultando DNI (POST): ${dni}`);
    
    const resultado = await seekerService.consultarPorDNI(dni);
    res.json(resultado);
    
  } catch (error) {
    console.error('❌ Error en consulta POST:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message,
      data: { 
        dni: req.body.dni, 
        timestamp: new Date().toISOString() 
      }
    });
  }
});

/**
 * POST /api/consulta/login
 * Forzar login manual
 */
router.post('/login', async (req, res) => {
  try {
    console.log('🔐 Forzando login...');
    
    const loginSuccess = await seekerService.login();
    
    if (loginSuccess) {
      res.json({
        success: true,
        message: 'Login exitoso',
        data: {
          isLoggedIn: seekerService.isLoggedIn,
          lastLogin: seekerService.lastLogin,
          timestamp: new Date().toISOString()
        }
      });
    } else {
      res.status(401).json({
        success: false,
        message: 'Login fallido',
        data: { timestamp: new Date().toISOString() }
      });
    }
    
  } catch (error) {
    console.error('❌ Error en login forzado:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error en login',
      error: error.message,
      data: { timestamp: new Date().toISOString() }
    });
  }
});

/**
 * GET /api/consulta/buscar/:dni
 * Solo buscar (sin datos detallados)
 */
router.get('/buscar/:dni', async (req, res) => {
  try {
    const { dni } = req.params;
    
    if (!dni || !/^\d{8}$/.test(dni)) {
      return res.status(400).json({
        success: false,
        message: 'DNI inválido. Debe ser un número de 8 dígitos',
        data: { dni, timestamp: new Date().toISOString() }
      });
    }

    console.log(`🔍 Buscando DNI: ${dni}`);
    
    const resultado = await seekerService.buscarPorDNI(dni);
    res.json({
      success: true,
      message: 'Búsqueda completada',
      data: resultado
    });
    
  } catch (error) {
    console.error('❌ Error en búsqueda:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error en búsqueda',
      error: error.message,
      data: { 
        dni: req.params.dni, 
        timestamp: new Date().toISOString() 
      }
    });
  }
});

/**
 * GET /api/consulta/detalle/:codigo
 * Obtener datos detallados por código
 */
router.get('/detalle/:codigo', async (req, res) => {
  try {
    const { codigo } = req.params;
    
    if (!codigo || !/^\d+$/.test(codigo)) {
      return res.status(400).json({
        success: false,
        message: 'Código inválido',
        data: { codigo, timestamp: new Date().toISOString() }
      });
    }

    console.log(`📋 Obteniendo datos detallados para código: ${codigo}`);
    
    const resultado = await seekerService.obtenerDatosDetallados(codigo);
    res.json({
      success: true,
      message: 'Datos detallados obtenidos',
      data: resultado
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo datos detallados:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo datos detallados',
      error: error.message,
      data: { 
        codigo: req.params.codigo, 
        timestamp: new Date().toISOString() 
      }
    });
  }
});

/**
 * GET /api/consulta/inject/:dni
 * Consultar usando inyector (método avanzado)
 */
router.get('/inject/:dni', async (req, res) => {
  try {
    const { dni } = req.params;
    
    if (!dni || !/^\d{8}$/.test(dni)) {
      return res.status(400).json({
        success: false,
        message: 'DNI inválido. Debe ser un número de 8 dígitos',
        data: { dni, timestamp: new Date().toISOString() }
      });
    }

    console.log(`🔍 Consultando con inyector DNI: ${dni}`);
    
    const resultado = await seekerInjector.consultarPorDNI(dni);
    res.json(resultado);
    
  } catch (error) {
    console.error('❌ Error en consulta con inyector:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error en consulta con inyector',
      error: error.message,
      data: { 
        dni: req.params.dni, 
        timestamp: new Date().toISOString() 
      }
    });
  }
});

/**
 * POST /api/consulta/inject
 * Consultar usando inyector (POST)
 */
router.post('/inject', async (req, res) => {
  try {
    const { dni } = req.body;
    
    if (!dni || !/^\d{8}$/.test(dni)) {
      return res.status(400).json({
        success: false,
        message: 'DNI inválido. Debe ser un número de 8 dígitos',
        data: { dni, timestamp: new Date().toISOString() }
      });
    }

    console.log(`🔍 Consultando con inyector (POST) DNI: ${dni}`);
    
    const resultado = await seekerInjector.consultarPorDNI(dni);
    res.json(resultado);
    
  } catch (error) {
    console.error('❌ Error en consulta con inyector (POST):', error.message);
    res.status(500).json({
      success: false,
      message: 'Error en consulta con inyector',
      error: error.message,
      data: { 
        dni: req.body.dni, 
        timestamp: new Date().toISOString() 
      }
    });
  }
});

/**
 * GET /api/consulta/advanced/:dni
 * Consultar usando servicio avanzado (extracción completa)
 */
router.get('/advanced/:dni', async (req, res) => {
  try {
    const { dni } = req.params;
    if (!dni || !/^\d{8}$/.test(dni)) {
      return res.status(400).json({
        success: false,
        message: 'DNI inválido. Debe ser un número de 8 dígitos',
        data: { dni, timestamp: new Date().toISOString() }
      });
    }
    console.log(`🚀 Consultando con servicio avanzado DNI: ${dni}`);
    const resultado = await seekerAdvanced.consultarDNI(dni);
    res.json(resultado);
  } catch (error) {
    console.error('❌ Error en consulta avanzada:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error en consulta avanzada',
      error: error.message,
      data: { 
        dni: req.params.dni, 
        timestamp: new Date().toISOString() 
      }
    });
  }
});

/**
 * POST /api/consulta/advanced
 * Consultar usando servicio avanzado (POST)
 */
router.post('/advanced', async (req, res) => {
  try {
    const { dni } = req.body;
    if (!dni || !/^\d{8}$/.test(dni)) {
      return res.status(400).json({
        success: false,
        message: 'DNI inválido. Debe ser un número de 8 dígitos',
        data: { dni, timestamp: new Date().toISOString() }
      });
    }
    console.log(`🚀 Consultando con servicio avanzado (POST) DNI: ${dni}`);
    const resultado = await seekerAdvanced.consultarDNI(dni);
    res.json(resultado);
  } catch (error) {
    console.error('❌ Error en consulta avanzada (POST):', error.message);
    res.status(500).json({
      success: false,
      message: 'Error en consulta avanzada',
      error: error.message,
      data: { 
        dni: req.body.dni, 
        timestamp: new Date().toISOString() 
      }
    });
  }
});

/**
 * POST /api/consulta/advanced/nombres
 * Buscar por nombres (POST)
 */
router.post('/advanced/nombres', async (req, res) => {
  try {
    const { nombreCompleto, apellidoPaterno, apellidoMaterno } = req.body;
    
    // Validar que al menos un campo esté presente
    if (!nombreCompleto && !apellidoPaterno && !apellidoMaterno) {
      return res.status(400).json({
        success: false,
        message: 'Debe proporcionar al menos un campo: nombreCompleto, apellidoPaterno o apellidoMaterno',
        data: { timestamp: new Date().toISOString() }
      });
    }

    console.log(`🔍 Buscando por nombres: ${nombreCompleto || ''} ${apellidoPaterno || ''} ${apellidoMaterno || ''}`);
    const resultado = await seekerAdvanced.buscarPorNombres(nombreCompleto, apellidoPaterno, apellidoMaterno);
    res.json(resultado);
  } catch (error) {
    console.error('❌ Error en búsqueda por nombres:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error en búsqueda por nombres',
      error: error.message,
      data: { 
        timestamp: new Date().toISOString() 
      }
    });
  }
});

/**
 * POST /api/consulta/advanced/telefono
 * Buscar por teléfono (POST)
 */
router.post('/advanced/telefono', async (req, res) => {
  try {
    const { telefono } = req.body;
    
    if (!telefono || !/^\d{9}$/.test(telefono)) {
      return res.status(400).json({
        success: false,
        message: 'Teléfono inválido. Debe ser un número de 9 dígitos',
        data: { telefono, timestamp: new Date().toISOString() }
      });
    }

    console.log(`📱 Buscando por teléfono: ${telefono}`);
    const resultado = await seekerAdvanced.buscarPorTelefono(telefono);
    res.json(resultado);
  } catch (error) {
    console.error('❌ Error en búsqueda por teléfono:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error en búsqueda por teléfono',
      error: error.message,
      data: { 
        telefono: req.body.telefono, 
        timestamp: new Date().toISOString() 
      }
    });
  }
});

module.exports = router;

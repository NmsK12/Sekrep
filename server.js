// API simple y limpia

const express = require('express');
const path = require('path');
const cors = require('cors');
const Bridge = require('./bridge');

const app = express();
const bridge = new Bridge();

// Middleware
app.use(cors());
app.use(express.json());

// Servir imagen placeholder para foto faltante
app.get('/ft_no_disponible.jpg', (req, res) => {
  res.sendFile(path.join(__dirname, 'ft_no_disponible.jpg'));
});

// Ruta principal
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'API de Consultas - Puente Simple con Caché Inteligente',
    version: '2.0.0',
    features: [
      'Sistema de caché inteligente',
      'Nombres y apellidos separados',
      'Endpoints específicos por tipo de dato',
      'Búsqueda rápida por teléfono',
      'Gestión automática de caché'
    ],
    endpoints: {
      // Consultas principales - Formato corto
      'GET /dni?dni={dni}': 'Consultar persona completa por DNI (con caché)',
      'GET /nom?nom={nombres}': 'Buscar personas por nombres (con caché)',
      'GET /telp?tel={telefono}': 'Buscar por teléfono (solo caché)',
      'GET /telp?tel={dni}': 'Obtener teléfonos por DNI (8 dígitos)',
      
      // Endpoints específicos - Formato corto
      'GET /arg?dni={dni}': 'Obtener árbol genealógico por DNI',
      'GET /corr?dni={dni}': 'Obtener correos por DNI',
      'GET /risk?dni={dni}': 'Obtener datos de riesgo por DNI',
      'GET /foto?dni={dni}': 'Obtener foto por DNI',
      
      // Gestión de caché - Formato corto
      'GET /stats': 'Obtener estadísticas del caché',
      
      // Endpoint META - TODO
      'GET /meta?dni={dni}': 'Obtener TODOS los datos (META)'
    },
    examples: {
      dni_completo: 'GET /dni?dni=80660244',
      nombres: 'GET /nom?nom=MIGUEL-MOSCOSO',
      telefono: 'GET /telp?tel=904684131',
      telefonos_dni: 'GET /telp?tel=80660244',
      arbol_dni: 'GET /arg?dni=80660244',
      correos_dni: 'GET /corr?dni=80660244',
      riesgo_dni: 'GET /risk?dni=80660244',
      foto_dni: 'GET /foto?dni=80660244',
      meta_completo: 'GET /meta?dni=80660244'
    },
  });
});

// Endpoint para buscar por DNI - Formato corto
app.get('/dni', async (req, res) => {
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

// Endpoint para buscar por nombres - Formato corto
app.get('/nom', async (req, res) => {
  try {
    const { nom } = req.query;
    if (!nom) {
      return res.status(400).json({ success: false, message: 'Nombres son requeridos' });
    }
    console.log(`🔍 API recibió consulta nombres: ${nom}`);
    const resultado = await bridge.buscarPorNombre(nom);
    res.json(resultado);
  } catch (error) {
    console.error('❌ Error en endpoint nom:', error.message);
    res.status(500).json({ success: false, message: 'Error interno del servidor', error: error.message });
  }
});

// Endpoint para buscar por teléfono - Formato corto
app.get('/telp', async (req, res) => {
  try {
    const { tel } = req.query;
    if (!tel) {
      return res.status(400).json({ success: false, message: 'Teléfono es requerido' });
    }
    
    // Verificar si es un DNI (8 dígitos) o teléfono (9 dígitos)
    if (/^\d{8}$/.test(tel)) {
      // Es un DNI, buscar por DNI y retornar solo teléfonos
      console.log(`📱 API recibió consulta teléfonos por DNI: ${tel}`);
      const resultado = await bridge.buscarDNI(tel);
      
      if (resultado.success && resultado.data) {
        // Agregar DNI a cada teléfono
        const telefonosConDni = (resultado.data.telefonos || []).map(telefono => ({
          ...telefono,
          dni: resultado.data.dni
        }));

        res.json({
          success: true,
          message: 'Teléfonos obtenidos exitosamente',
          data: {
            dni: resultado.data.dni,
            nombres: resultado.data.nombres,
            apellidos: resultado.data.apellidos,
            telefonos: telefonosConDni
          },
          from_cache: resultado.from_cache || false
        });
      } else {
        res.json(resultado);
      }
    } else if (/^\d{9}$/.test(tel)) {
      // Es un teléfono, buscar por teléfono
      console.log(`📱 API recibió consulta por teléfono: ${tel}`);
      const resultado = await bridge.buscarPorTelefono(tel);
      res.json(resultado);
    } else {
      return res.status(400).json({ success: false, message: 'Debe ser DNI (8 dígitos) o teléfono (9 dígitos)' });
    }
  } catch (error) {
    console.error('❌ Error en endpoint telp:', error.message);
    res.status(500).json({ success: false, message: 'Error interno del servidor', error: error.message });
  }
});


// Endpoint para obtener árbol genealógico - Formato corto
app.get('/arg', async (req, res) => {
  try {
    const { dni } = req.query;
    if (!dni) {
      return res.status(400).json({ success: false, message: 'DNI es requerido' });
    }
    if (!/^\d{8}$/.test(dni)) {
      return res.status(400).json({ success: false, message: 'DNI debe ser 8 dígitos' });
    }
    console.log(`🌳 API recibió consulta árbol genealógico para DNI: ${dni}`);
    const resultado = await bridge.buscarDNI(dni);
    
    if (resultado.success && resultado.data) {
      res.json({
        success: true,
        message: 'Árbol genealógico obtenido exitosamente',
        data: {
          dni: resultado.data.dni,
          nombres: resultado.data.nombres,
          apellidos: resultado.data.apellidos,
          arbol: resultado.data.arbol || []
        },
        from_cache: resultado.from_cache || false
      });
    } else {
      res.json(resultado);
    }
  } catch (error) {
    console.error('❌ Error en endpoint arg:', error.message);
    res.status(500).json({ success: false, message: 'Error interno del servidor', error: error.message });
  }
});

// Endpoint para obtener correos - Formato corto
app.get('/corr', async (req, res) => {
  try {
    const { dni } = req.query;
    if (!dni) {
      return res.status(400).json({ success: false, message: 'DNI es requerido' });
    }
    if (!/^\d{8}$/.test(dni)) {
      return res.status(400).json({ success: false, message: 'DNI debe ser 8 dígitos' });
    }
    console.log(`📧 API recibió consulta correos para DNI: ${dni}`);
    const resultado = await bridge.buscarDNI(dni);
    
    if (resultado.success && resultado.data) {
      res.json({
        success: true,
        message: 'Correos obtenidos exitosamente',
        data: {
          dni: resultado.data.dni,
          nombres: resultado.data.nombres,
          apellidos: resultado.data.apellidos,
          correos: resultado.data.correos || []
        },
        from_cache: resultado.from_cache || false
      });
    } else {
      res.json(resultado);
    }
  } catch (error) {
    console.error('❌ Error en endpoint corr:', error.message);
    res.status(500).json({ success: false, message: 'Error interno del servidor', error: error.message });
  }
});

// Endpoint para obtener datos de riesgo - Formato corto
app.get('/risk', async (req, res) => {
  try {
    const { dni } = req.query;
    if (!dni) {
      return res.status(400).json({ success: false, message: 'DNI es requerido' });
    }
    if (!/^\d{8}$/.test(dni)) {
      return res.status(400).json({ success: false, message: 'DNI debe ser 8 dígitos' });
    }
    console.log(`⚠️ API recibió consulta riesgo para DNI: ${dni}`);
    const resultado = await bridge.buscarDNI(dni);
    
    if (resultado.success && resultado.data) {
      res.json({
        success: true,
        message: 'Datos de riesgo obtenidos exitosamente',
        data: {
          dni: resultado.data.dni,
          nombres: resultado.data.nombres,
          apellidos: resultado.data.apellidos,
          riesgo: resultado.data.riesgo || []
        },
        from_cache: resultado.from_cache || false
      });
    } else {
      res.json(resultado);
    }
  } catch (error) {
    console.error('❌ Error en endpoint risk:', error.message);
    res.status(500).json({ success: false, message: 'Error interno del servidor', error: error.message });
  }
});

// Endpoint para obtener foto - Formato corto
app.get('/foto', async (req, res) => {
  try {
    const { dni } = req.query;
    if (!dni) {
      return res.status(400).json({ success: false, message: 'DNI es requerido' });
    }
    if (!/^\d{8}$/.test(dni)) {
      return res.status(400).json({ success: false, message: 'DNI debe ser 8 dígitos' });
    }
    console.log(`📸 API recibió consulta foto para DNI: ${dni}`);
    const resultado = await bridge.buscarDNI(dni);
    
    if (resultado.success && resultado.data) {
      res.json({
        success: true,
        message: 'Foto obtenida exitosamente',
        data: {
          dni: resultado.data.dni,
          nombres: resultado.data.nombres,
          apellidos: resultado.data.apellidos,
          foto: resultado.data.foto
        },
        from_cache: resultado.from_cache || false
      });
    } else {
      res.json(resultado);
    }
  } catch (error) {
    console.error('❌ Error en endpoint foto:', error.message);
    res.status(500).json({ success: false, message: 'Error interno del servidor', error: error.message });
  }
});

// Endpoint para obtener estadísticas del caché - Formato corto
app.get('/stats', (req, res) => {
  try {
    const stats = bridge.getCacheStats();
    res.json({
      success: true,
      message: 'Estadísticas del caché obtenidas',
      data: stats
    });
  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error.message);
    res.status(500).json({ success: false, message: 'Error interno del servidor', error: error.message });
  }
});

// Endpoint META - Entrega TODO absolutamente todo
app.get('/meta', async (req, res) => {
  try {
    const { dni } = req.query;
    if (!dni) {
      return res.status(400).json({ success: false, message: 'DNI es requerido' });
    }
    if (!/^\d{8}$/.test(dni)) {
      return res.status(400).json({ success: false, message: 'DNI debe ser 8 dígitos' });
    }
    console.log(`🔍 META API recibió consulta completa para DNI: ${dni}`);
    const resultado = await bridge.buscarDNI(dni);
    
    if (resultado.success && resultado.data) {
      // Crear respuesta META con TODO absolutamente todo
      const metaData = {
        // Información básica
        dni: resultado.data.dni,
        nombre: resultado.data.nombre,
        nombres: resultado.data.nombres,
        apellidos: resultado.data.apellidos,
        
        // Datos personales completos
        datos_personales: resultado.data.datos || {},
        
        // Foto
        foto: resultado.data.foto,
        
        // Teléfonos con DNI incluido
        telefonos: (resultado.data.telefonos || []).map(telefono => ({
          ...telefono,
          dni: resultado.data.dni
        })),
        
        // Árbol familiar completo
        arbol_familiar: resultado.data.arbol || [],
        
        // Correos (con mensaje personalizado si está vacío)
        correos: resultado.data.correos || [],
        
        // Datos de riesgo (con mensaje personalizado si está vacío)
        riesgo_crediticio: resultado.data.riesgo || [],
        
        // Información del sistema
        metadata: {
          consultado_en: new Date().toISOString(),
          desde_cache: resultado.from_cache || false,
          version_api: "2.0.0",
          endpoint_usado: "META",
          total_telefonos: (resultado.data.telefonos || []).length,
          total_familiares: (resultado.data.arbol || []).length,
          total_correos: (resultado.data.correos || []).length,
          total_riesgos: (resultado.data.riesgo || []).length
        }
      };

      res.json({
        success: true,
        message: 'Consulta META exitosa - Todos los datos obtenidos',
        data: metaData,
        from_cache: resultado.from_cache || false
      });
    } else {
      res.json(resultado);
    }
  } catch (error) {
    console.error('❌ Error en endpoint META:', error.message);
    res.status(500).json({ success: false, message: 'Error interno del servidor', error: error.message });
  }
});


// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('🚀 Servidor API de Consultas - Puente Simple con Caché Inteligente iniciado');
  console.log(`📡 Puerto: ${PORT}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log('📋 Endpoints principales (formato corto):');
  console.log('   GET  /dni?dni={dni} - Consultar persona completa por DNI (con caché)');
  console.log('   GET  /nom?nom={nombres} - Buscar personas por nombres (con caché)');
  console.log('   GET  /telp?tel={telefono} - Buscar por teléfono (solo caché)');
  console.log('   GET  /telp?tel={dni} - Obtener teléfonos por DNI (8 dígitos)');
  console.log('   GET  /arg?dni={dni} - Obtener árbol genealógico');
  console.log('   GET  /corr?dni={dni} - Obtener correos');
  console.log('   GET  /risk?dni={dni} - Obtener datos de riesgo');
  console.log('   GET  /foto?dni={dni} - Obtener foto');
  console.log('   GET  /stats - Estadísticas del caché');
  console.log('   GET  /meta?dni={dni} - Obtener TODOS los datos (META)');
  console.log('   GET  /                           - Información completa de la API');
  console.log('🔧 Ejemplos de uso:');
  console.log(`   curl "http://localhost:${PORT}/dni?dni=80660244"`);
  console.log(`   curl "http://localhost:${PORT}/telp?tel=904684131"`);
  console.log(`   curl "http://localhost:${PORT}/telp?tel=80660244"`);
  console.log(`   curl "http://localhost:${PORT}/arg?dni=80660244"`);
  console.log(`   curl "http://localhost:${PORT}/meta?dni=80660244"`);
  console.log('💾 Sistema de caché permanente - Los datos se guardan para siempre');
});

module.exports = app;

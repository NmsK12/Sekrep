// API simple y limpia - v1.0.1 (fix email@protected)

const express = require('express');
const path = require('path');
const cors = require('cors');
const Bridge = require('./bridge');
const { validateKey } = require('./middleware/keyValidator');

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
    banner: `
   ██████╗ ██╗    ██╗ ██████╗
  ██╔════╝ ██║    ██║██╔════╝
  ██║  ███╗██║ █╗ ██║██║     
  ██║   ██║██║███╗██║██║     
  ╚██████╔╝╚███╔███╔╝╚██████╗
   ╚═════╝  ╚══╝╚══╝  ╚═════╝
    `,
    endpoints: {
      'GET /dni?dni={dni}': 'Consultar persona completa por DNI',
      'GET /nom?nom={nombres}': 'Buscar personas por nombres',
      'GET /telp?tel={telefono}': 'Buscar por teléfono',
      'GET /arg?dni={dni}': 'Obtener árbol genealógico por DNI',
      'GET /risk?dni={dni}': 'Obtener datos de riesgo por DNI',
      'GET /foto?dni={dni}': 'Obtener foto por DNI',
      'GET /sunat?dni={dni}': 'Obtener trabajos SUNAT por DNI',
      'GET /meta?dni={dni}': 'Obtener todos los datos disponibles',
      'GET /reniec?dni={dni}': 'Consultar RENIEC (API externa)',
      'GET /sentinel/:documento': 'Consultar Sentinel por documento',
      'GET /denplaca/:placa': 'Consultar denuncias por placa vehicular',
      'GET /den/:dni': 'Consultar denuncias por DNI'
    },
    examples: {
      dni_completo: 'GET /dni?dni=80660244&key=TU_API_KEY',
      nombres: 'GET /nom?nom=MIGUEL-MOSCOSO&key=TU_API_KEY',
      telefono: 'GET /telp?tel=904684131&key=TU_API_KEY',
      arbol_dni: 'GET /arg?dni=80660244&key=TU_API_KEY',
      riesgo_dni: 'GET /risk?dni=80660244&key=TU_API_KEY',
      foto_dni: 'GET /foto?dni=80660244&key=TU_API_KEY',
      sunat_dni: 'GET /sunat?dni=80660244&key=TU_API_KEY',
      meta_completo: 'GET /meta?dni=80660244&key=TU_API_KEY',
      reniec: 'GET /reniec?dni=44443333&key=TU_API_KEY',
      sentinel: 'GET /sentinel/44443333?key=TU_API_KEY',
      denplaca: 'GET /denplaca/ABC123&key=TU_API_KEY',
      den: 'GET /den/10000006&key=TU_API_KEY'
    },
    nota: '🔐 Todos los endpoints requieren una API Key válida. Contacta a @zGatoO, @choco_tete o @WinniePoohOFC para obtener acceso.'
  });
});

// Endpoint para buscar por DNI - Formato corto (solo datos básicos)
app.get('/dni', validateKey('dni'), async (req, res) => {
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
    
    if (resultado.success && resultado.data) {
      // Solo retornar datos básicos: DNI, nombre, datos personales y foto
      res.json({
        success: true,
        message: resultado.from_cache ? 'Consulta exitosa (desde caché)' : 'Consulta exitosa',
        data: {
          dni: resultado.data.dni,
          nombre: resultado.data.nombre,
          datos: resultado.data.datos || {},
          foto: resultado.data.foto
        },
        from_cache: resultado.from_cache || false
      });
    } else {
    res.json(resultado);
    }
  } catch (error) {
    console.error('❌ Error en endpoint DNI:', error.message);
    res.status(500).json({ success: false, message: 'Error interno del servidor', error: error.message });
  }
});

// Endpoint para buscar por nombres - Formato corto
app.get('/nom', validateKey('nom'), async (req, res) => {
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
app.get('/telp', validateKey('telp'), async (req, res) => {
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
      // Es un teléfono, consultar a ambas fuentes (Seeker + Osiptel)
      console.log(`📱 API recibió consulta dual para teléfono: ${tel}`);
      
      const axios = require('axios');
      const results = {
        success: true,
        message: 'Consulta dual completada',
        data: {
          telefono: tel,
          fuentes: {}
        }
      };
      
      // Consultar fuente 1: Seeker (bridge)
      try {
        const seekerResult = await bridge.buscarPorTelefono(tel);
        if (seekerResult.success && seekerResult.data) {
          let telefonosEncontrados = [];
          
          if (!Array.isArray(seekerResult.data)) {
            if (seekerResult.data.telefonos) {
              telefonosEncontrados = seekerResult.data.telefonos;
            }
          } else {
            seekerResult.data.forEach(persona => {
              if (persona.telefonos) {
                telefonosEncontrados = [...telefonosEncontrados, ...persona.telefonos];
              }
            });
          }
          
          results.data.fuentes.seeker = {
            success: true,
            data: {
              telefonos: telefonosEncontrados,
              total: telefonosEncontrados.length
            },
            from_cache: seekerResult.from_cache || false
          };
        } else {
          results.data.fuentes.seeker = {
            success: false,
            message: 'No se encontraron datos'
          };
        }
      } catch (error) {
        results.data.fuentes.seeker = {
          success: false,
          error: error.message
        };
      }
      
      // Consultar fuente 2: Osiptel DB
      try {
        const osiptelResponse = await axios.get(`http://161.132.51.34:1520/api/osipteldb?tel=${tel}`, {
          timeout: 5000
        });
        results.data.fuentes.osiptel = {
          success: true,
          data: osiptelResponse.data
        };
      } catch (error) {
        results.data.fuentes.osiptel = {
          success: false,
          error: error.message
        };
      }
      
      res.json(results);
    } else {
      return res.status(400).json({ success: false, message: 'Debe ser DNI (8 dígitos) o teléfono (9 dígitos)' });
    }
  } catch (error) {
    console.error('❌ Error en endpoint telp:', error.message);
    res.status(500).json({ success: false, message: 'Error interno del servidor', error: error.message });
  }
});


// Endpoint para obtener árbol genealógico - Formato corto
app.get('/arg', validateKey('arg'), async (req, res) => {
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

// Endpoint para obtener datos de riesgo - Formato corto
app.get('/risk', validateKey('risk'), async (req, res) => {
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
app.get('/foto', validateKey('foto'), async (req, res) => {
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

// Endpoint para obtener trabajos SUNAT - Formato corto
app.get('/sunat', validateKey('sunat'), async (req, res) => {
  try {
    const { dni } = req.query;
    if (!dni) {
      return res.status(400).json({ success: false, message: 'DNI es requerido' });
    }
    if (!/^\d{8}$/.test(dni)) {
      return res.status(400).json({ success: false, message: 'DNI debe ser 8 dígitos' });
    }
    console.log(`🏢 API recibió consulta trabajos SUNAT para DNI: ${dni}`);
    const resultado = await bridge.buscarDNI(dni);
    
    if (resultado.success && resultado.data) {
      res.json({
        success: true,
        message: 'Trabajos SUNAT obtenidos exitosamente',
        data: {
          dni: resultado.data.dni,
          nombres: resultado.data.nombres,
          apellidos: resultado.data.apellidos,
          trabajos: resultado.data.trabajos || []
        },
        from_cache: resultado.from_cache || false
      });
    } else {
      res.json(resultado);
    }
  } catch (error) {
    console.error('❌ Error en endpoint sunat:', error.message);
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

// Endpoint para limpiar caché de un DNI específico
// Limpiar caché de un DNI específico (GET para facilidad de uso)
app.get('/cache/:dni', (req, res) => {
  try {
    const { dni } = req.params;
    const { action } = req.query;
    
    if (!/^\d{8}$/.test(dni)) {
      return res.status(400).json({ success: false, message: 'DNI debe ser 8 dígitos' });
    }
    
    const fs = require('fs');
    const path = require('path');
    const cacheDir = process.env.NODE_ENV === 'production' ? '/app/cache' : path.join(__dirname, 'cache');
    const cacheFile = path.join(cacheDir, `dni_${dni}.json`);
    
    // Si action=delete o action=clear, eliminar caché
    if (action === 'delete' || action === 'clear') {
      if (fs.existsSync(cacheFile)) {
        fs.unlinkSync(cacheFile);
        console.log(`🗑️ Caché eliminado para DNI: ${dni}`);
        res.json({
          success: true,
          message: `✅ Caché del DNI ${dni} eliminado exitosamente.\n\n🔄 La próxima consulta obtendrá datos actualizados sin [email protected]`,
          dni: dni,
          instrucciones: `Ahora vuelve a consultar: /corr?dni=${dni}&key=TU_KEY`
        });
      } else {
        res.json({
          success: false,
          message: `❌ No existe caché para el DNI ${dni}`,
          dni: dni
        });
      }
    } else {
      // Sin action, mostrar info del caché
      if (fs.existsSync(cacheFile)) {
        const stats = fs.statSync(cacheFile);
        const cacheData = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
        res.json({
          success: true,
          message: `ℹ️ Información del caché para DNI ${dni}`,
          cache_exists: true,
          cached_at: cacheData.timestamp || 'N/A',
          file_size: `${(stats.size / 1024).toFixed(2)} KB`,
          last_modified: stats.mtime,
          para_eliminar: `Agrega ?action=delete a esta URL: /cache/${dni}?action=delete`
        });
      } else {
        res.json({
          success: false,
          message: `❌ No existe caché para el DNI ${dni}`,
          dni: dni
        });
      }
    }
  } catch (error) {
    console.error('❌ Error con caché:', error.message);
    res.status(500).json({ success: false, message: 'Error interno del servidor', error: error.message });
  }
});

// También mantener DELETE para compatibilidad
app.delete('/cache/:dni', (req, res) => {
  try {
    const { dni } = req.params;
    if (!/^\d{8}$/.test(dni)) {
      return res.status(400).json({ success: false, message: 'DNI debe ser 8 dígitos' });
    }
    
    const fs = require('fs');
    const path = require('path');
    const cacheDir = process.env.NODE_ENV === 'production' ? '/app/cache' : path.join(__dirname, 'cache');
    const cacheFile = path.join(cacheDir, `dni_${dni}.json`);
    
    if (fs.existsSync(cacheFile)) {
      fs.unlinkSync(cacheFile);
      console.log(`🗑️ Caché eliminado para DNI: ${dni}`);
      res.json({
        success: true,
        message: `✅ Caché del DNI ${dni} eliminado exitosamente.\n\n🔄 La próxima consulta obtendrá datos actualizados.`,
        dni: dni
      });
    } else {
      res.json({
        success: false,
        message: `❌ No existe caché para el DNI ${dni}`,
        dni: dni
      });
    }
  } catch (error) {
    console.error('❌ Error eliminando caché:', error.message);
    res.status(500).json({ success: false, message: 'Error interno del servidor', error: error.message });
  }
});

// Endpoint META - Entrega TODO absolutamente todo
app.get('/meta', validateKey('meta'), async (req, res) => {
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


// ===== ENDPOINTS PROXY CON VALIDACIÓN DE KEY =====
// Estos endpoints actúan como proxy para APIs externas, validando la key antes de hacer la petición

// 1. RENIEC API - Consulta por DNI
app.get('/reniec', validateKey('reniec'), async (req, res) => {
  try {
    const { dni } = req.query;
    
    if (!dni) {
      return res.status(400).json({
        success: false,
        message: 'El parámetro DNI es requerido'
      });
    }

    // Hacer petición a la API externa
    const axios = require('axios');
    const response = await axios.get(`http://161.132.4.52:6322/reniec?dni=${dni}`, {
      timeout: 10000
    });

    res.json({
      success: true,
      message: 'Consulta RENIEC exitosa',
      data: response.data,
      from_cache: false
    });
  } catch (error) {
    console.error('❌ Error en RENIEC proxy:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error consultando RENIEC',
      error: error.message
    });
  }
});

// 2. SENTINEL API - Consulta por documento
app.get('/sentinel/:documento', validateKey('sentinel'), async (req, res) => {
  try {
    const { documento } = req.params;
    const TOKEN_SENTINEL = '719a4d6d-048d-445f-8ff5-6ab3e85a4d30';

    // Hacer petición a la API externa
    const axios = require('axios');
    const response = await axios.get(
      `http://161.132.45.149:3001/api/sentinel/${documento}?token=${TOKEN_SENTINEL}`,
      { timeout: 10000 }
    );

    res.json({
      success: true,
      message: 'Consulta Sentinel exitosa',
      data: response.data,
      from_cache: false
    });
  } catch (error) {
    console.error('❌ Error en Sentinel proxy:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error consultando Sentinel',
      error: error.message
    });
  }
});

// 3. DENUNCIAS PLACA API - Consulta por placa vehicular
app.get('/denplaca/:placa', validateKey('denplaca'), async (req, res) => {
  try {
    const { placa } = req.params;
    const TOKEN_DENUNCIAS = '8e9c272d-9a62-4d81-b3e4-2872ec777990';

    // Hacer petición a la API externa
    const axios = require('axios');
    const response = await axios.get(
      `http://161.132.45.149:3001/api/denuncias-placa-json/${placa}?token=${TOKEN_DENUNCIAS}`,
      { timeout: 10000 }
    );

    res.json({
      success: true,
      message: 'Consulta de denuncias por placa exitosa',
      data: response.data,
      from_cache: false
    });
  } catch (error) {
    console.error('❌ Error en Denuncias Placa proxy:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error consultando denuncias por placa',
      error: error.message
    });
  }
});

// 4. DENUNCIAS DNI API - Consulta denuncias por DNI
app.get('/den/:dni', validateKey('den'), async (req, res) => {
  try {
    const { dni } = req.params;
    const TOKEN_DENUNCIAS_DNI = 'f0c156bb-b90b-48d7-8aa4-66265c4c45d0';

    // Hacer petición a la API externa
    const axios = require('axios');
    const response = await axios.get(
      `http://161.132.45.149:3001/api/denuncias-json/${dni}?token=${TOKEN_DENUNCIAS_DNI}`,
      { timeout: 10000 }
    );

    res.json({
      success: true,
      message: 'Consulta de denuncias por DNI exitosa',
      data: response.data,
      from_cache: false
    });
  } catch (error) {
    console.error('❌ Error en Denuncias DNI proxy:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error consultando denuncias por DNI',
      error: error.message
    });
  }
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('🚀 Servidor API de Consultas - Puente Simple con Caché Inteligente iniciado');
  console.log(`📡 Puerto: ${PORT}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log('📋 Endpoints principales (formato corto):');
  console.log('   GET  /dni?dni={dni} - Consultar datos básicos por DNI (DNI, nombre, datos, foto)');
  console.log('   GET  /nom?nom={nombres} - Buscar personas por nombres (con caché)');
  console.log('   GET  /telp?tel={telefono} - Buscar por teléfono (solo caché)');
  console.log('   GET  /telp?tel={dni} - Obtener teléfonos por DNI (8 dígitos)');
  console.log('   GET  /arg?dni={dni} - Obtener árbol genealógico');
  console.log('   GET  /corr?dni={dni} - Obtener correos');
  console.log('   GET  /risk?dni={dni} - Obtener datos de riesgo');
  console.log('   GET  /foto?dni={dni} - Obtener foto');
  console.log('   GET  /sunat?dni={dni} - Obtener trabajos SUNAT');
  console.log('   GET  /stats - Estadísticas del caché');
  console.log('   GET  /meta?dni={dni} - Obtener TODOS los datos (META)');
  console.log('   GET  /                           - Información completa de la API');
  console.log('🔧 Ejemplos de uso:');
  console.log(`   curl "http://localhost:${PORT}/dni?dni=80660244&key=TU_API_KEY"`);
  console.log(`   curl "http://localhost:${PORT}/telp?tel=904684131&key=TU_API_KEY"`);
  console.log(`   curl "http://localhost:${PORT}/arg?dni=80660244&key=TU_API_KEY"`);
  console.log(`   curl "http://localhost:${PORT}/meta?dni=80660244&key=TU_API_KEY"`);
  console.log('💾 Sistema de caché permanente - Los datos se guardan para siempre');
  console.log('🔐 API protegida con sistema de keys - Se requiere key válida para acceder');
  console.log('📱 Panel de administración para gestionar keys en puerto 3001');
});

module.exports = app;

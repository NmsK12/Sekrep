/**
 * Script de prueba para el servicio avanzado
 */

const seekerAdvanced = require('./services/seekerAdvanced');

// Colores para console
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testAdvanced() {
  try {
    log('🚀 Probando servicio avanzado de seeker.lat', 'blue');
    
    const dni = '80660243';
    log(`🔍 Consultando DNI: ${dni}`, 'yellow');
    
    const startTime = Date.now();
    const resultado = await seekerAdvanced.consultarDNI(dni);
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    log(`⏱️ Tiempo de consulta: ${duration}ms`, 'cyan');
    
    log('📊 Resultado:', 'blue');
    console.log(JSON.stringify(resultado, null, 2));
    
    if (resultado.success) {
      log('✅ ¡Consulta exitosa!', 'green');
      
      if (resultado.data.foto) {
        log(`📸 Foto encontrada: ${resultado.data.foto.length} caracteres en base64`, 'green');
      } else {
        log('📸 No se encontró foto', 'yellow');
      }
      
      log(`📱 Teléfonos encontrados: ${resultado.data.telefonos.length}`, 'green');
      log(`📧 Emails encontrados: ${resultado.data.emails.length}`, 'green');
      
    } else {
      log('❌ Consulta fallida', 'red');
    }
    
  } catch (error) {
    log(`❌ Error: ${error.message}`, 'red');
  }
}

// Ejecutar
testAdvanced();

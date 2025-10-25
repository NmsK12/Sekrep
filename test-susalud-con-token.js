/**
 * Script de prueba de SUSalud con token manual
 * 
 * USO:
 * 1. Haz login en el navegador en https://app8.susalud.gob.pe:8380/login
 * 2. Abre DevTools (F12) -> Network tab
 * 3. Captura el token JWT de la respuesta del login
 * 4. Pégalo abajo en la variable TOKEN_MANUAL
 * 5. Ejecuta: node test-susalud-con-token.js
 */

const SusaludService = require('./services/susaludService');

// ⬇️ PEGA TU TOKEN AQUÍ (el que captures del navegador)
const TOKEN_MANUAL = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ejemplo.token';

async function probarConToken() {
  console.log('🧪 ===== PRUEBA CON TOKEN MANUAL =====\n');
  
  // Crear servicio con token manual
  const service = new SusaludService(TOKEN_MANUAL);
  
  console.log(`🔑 Token configurado: ${TOKEN_MANUAL.substring(0, 50)}...`);
  console.log(`📊 Sesión válida: ${service.isSessionValid() ? 'Sí' : 'No'}\n`);
  
  // Probar consulta directamente (sin login)
  console.log('📋 Consultando seguros para DNI 44443333...');
  const resultado = await service.consultarSeguros('44443333', '1');
  
  if (resultado.success) {
    console.log('✅ ¡Consulta exitosa con token manual!');
    const formatted = service.formatearRespuesta(resultado);
    if (formatted) {
      console.log(`\n   Nombre: ${formatted.nombreCompleto}`);
      console.log(`   DNI: ${formatted.dni}`);
      console.log(`   Total seguros: ${formatted.totalSeguros}`);
      console.log(`   Seguros activos: ${formatted.segurosActivos}`);
    }
  } else {
    console.log('❌ Consulta fallida');
    console.log(`   Mensaje: ${resultado.message}`);
    console.log('\n💡 Asegúrate de:');
    console.log('   1. Capturar el token correcto del navegador');
    console.log('   2. Que el token no haya expirado');
    console.log('   3. Copiar el token completo (incluyendo "Bearer " si aplica)');
  }
}

probarConToken();


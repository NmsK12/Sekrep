/**
 * Script de prueba para el servicio de SUSalud
 */

const SusaludService = require('./services/susaludService');

async function probarSusalud() {
  const service = new SusaludService();
  
  console.log('🧪 ===== PRUEBA DE SUSALUD =====\n');
  
  // Test 1: Login
  console.log('📋 Test 1: Login');
  const loginOk = await service.login();
  console.log(`Resultado: ${loginOk ? '✅ Exitoso' : '❌ Fallido'}\n`);
  
  if (!loginOk) {
    console.log('❌ No se pudo hacer login, abortando pruebas');
    process.exit(1);
  }
  
  // Test 2: Consulta de seguros
  console.log('📋 Test 2: Consulta de seguros para DNI 44443333');
  const resultado = await service.consultarSeguros('44443333', '1');
  
  if (resultado.success) {
    console.log('✅ Consulta exitosa!');
    console.log('\n📊 Resumen:');
    const formatted = service.formatearRespuesta(resultado);
    if (formatted) {
      console.log(`   Nombre: ${formatted.nombreCompleto}`);
      console.log(`   DNI: ${formatted.dni}`);
      console.log(`   Total seguros: ${formatted.totalSeguros}`);
      console.log(`   Seguros activos: ${formatted.segurosActivos}`);
      console.log('\n   Seguros:');
      formatted.seguros.slice(0, 3).forEach((seguro, i) => {
        console.log(`   ${i + 1}. ${seguro.iafas} - ${seguro.estado} (${seguro.regimen})`);
      });
    }
  } else {
    console.log('❌ Consulta fallida');
    console.log(`   Error: ${resultado.message}`);
  }
  
  console.log('\n🧪 ===== FIN DE PRUEBAS =====');
}

// Ejecutar pruebas
probarSusalud().catch(error => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});


/**
 * PRUEBA REAL con los tokens capturados del navegador
 */

const SusaludService = require('./services/susaludService');

// Tokens capturados del navegador (Sábado 25 Oct 2025, 23:23:15 GMT)
const ACCESS_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJjYXJnbyI6IkFVWElMSUFSIERFIEVTVEFEw41TVElDQSIsInRpcG8iOiIyIiwiY29kaWdvQXJlYSI6MTEwMCwiY29kaWdvUGVyc29uYSI6MTI0MTYwLCJub21icmVzUGVyc29uYSI6IktSSVNTIEdJTiIsImFwUGF0ZXJub1BlcnNvbmEiOiJOVcORRVoiLCJhcE1hdGVybm9QZXJzb25hIjoiQ0FSQVpBUyIsImNvcnJlb1BlcnNvbmEiOiJrZ25jYXJhemFzQGdtYWlsLmNvbSIsInRlbGVmb25vUGVyc29uYSI6IjkzOTcxNzA4MCIsImRuaVBlcnNvbmEiOiI0MjMxNjk5OSIsInVzdWFyaW8iOiI0MjMxNjk5OSIsInVzdUV4dGVybm8iOnRydWUsImNvZEFyZWEiOjExMDAsImNvZFVzdWFyaW8iOjE0MDc0MiwiZWNvZGlnbyI6MSwiaWF0IjoxNzYxNDM0NTk1LCJleHAiOjE3NjE0MzUxOTV9.RAx3rJwCMqXzrSUaYLeHIHDCAgqfyXAz_YhSvXzkm1k';

const REFRESH_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJjYXJnbyI6IkFVWElMSUFSIERFIEVTVEFEw41TVElDQSIsInRpcG8iOiIyIiwiY29kaWdvQXJlYSI6MTEwMCwiY29kaWdvUGVyc29uYSI6MTI0MTYwLCJub21icmVzUGVyc29uYSI6IktSSVNTIEdJTiIsImFwUGF0ZXJub1BlcnNvbmEiOiJOVcORRVoiLCJhcE1hdGVybm9QZXJzb25hIjoiQ0FSQVpBUyIsImNvcnJlb1BlcnNvbmEiOiJrZ25jYXJhemFzQGdtYWlsLmNvbSIsInRlbGVmb25vUGVyc29uYSI6IjkzOTcxNzA4MCIsImRuaVBlcnNvbmEiOiI0MjMxNjk5OSIsInVzdWFyaW8iOiI0MjMxNjk5OSIsInVzdUV4dGVybm8iOnRydWUsImNvZEFyZWEiOjExMDAsImNvZFVzdWFyaW8iOjE0MDc0MiwiZWNvZGlnbyI6MSwiaWF0IjoxNzYxNDM0NTk1LCJleHAiOjE3NjE1MjA5OTV9.DtfW--sY_QX5UTguorpDURcOtLc-4lSrQ5jyvxG5EiM';

async function probar() {
  console.log('🧪 ===== PRUEBA REAL CON TOKENS CAPTURADOS =====\n');
  
  // Crear servicio con tokens reales
  const service = new SusaludService(ACCESS_TOKEN, REFRESH_TOKEN);
  
  console.log(`🔑 AccessToken configurado: ${ACCESS_TOKEN.substring(0, 50)}...`);
  console.log(`🔄 RefreshToken configurado: ${REFRESH_TOKEN.substring(0, 50)}...`);
  console.log(`✅ Sesión válida: ${service.isSessionValid()}\n`);
  
  // Test: Consultar seguros
  console.log('📋 Consultando seguros para DNI 44443333...\n');
  const resultado = await service.consultarSeguros('44443333', '1');
  
  if (resultado.success) {
    console.log('✅ ¡ÉXITO! Consulta realizada correctamente\n');
    
    const formatted = service.formatearRespuesta(resultado);
    if (formatted) {
      console.log('👤 DATOS PERSONALES:');
      console.log(`   Nombre completo: ${formatted.nombreCompleto}`);
      console.log(`   DNI: ${formatted.dni}`);
      console.log(`   Fecha nacimiento: ${formatted.fechaNacimiento}`);
      console.log(`   Género: ${formatted.genero}`);
      console.log(`   Ubigeo: ${formatted.ubigeo}`);
      
      console.log(`\n🏥 SEGUROS:`);
      console.log(`   Total seguros: ${formatted.totalSeguros}`);
      console.log(`   Seguros activos: ${formatted.segurosActivos}\n`);
      
      formatted.seguros.slice(0, 5).forEach((seguro, i) => {
        console.log(`   ${i + 1}. ${seguro.iafas} - ${seguro.estado}`);
        console.log(`      Régimen: ${seguro.regimen}`);
        console.log(`      Cobertura: ${seguro.cobertura || 'N/A'}`);
        console.log(`      Fechas: ${seguro.fechaInicio} al ${seguro.fechaFin || 'Actual'}`);
        console.log(`      Plan: ${seguro.planSalud}`);
        console.log('');
      });
    }
    
    console.log('\n✅ El inyector funciona correctamente!');
    console.log('🎉 Puedes usar el endpoint /salud/:dni en tu API');
    
  } else {
    console.log('❌ Consulta fallida');
    console.log(`   Mensaje: ${resultado.message}`);
    console.log(`   Error: ${resultado.error || 'N/A'}`);
    
    if (resultado.error === 'TOKEN_EXPIRED') {
      console.log('\n💡 El token expiró. Necesitas:');
      console.log('   1. Hacer login nuevamente en el navegador');
      console.log('   2. Capturar los nuevos tokens');
      console.log('   3. Actualizar las variables de entorno');
    }
  }
  
  console.log('\n🧪 ===== FIN DE PRUEBA =====');
}

probar().catch(error => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});


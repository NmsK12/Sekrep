/**
 * Script de prueba para SUSalud con los tokens actualizados
 */

require('dotenv').config();
const SusaludService = require('./services/susaludService');

async function probarSusalud() {
  console.log('🧪 ========================================');
  console.log('🧪 TEST DE SUSALUD CON TOKENS ACTUALES');
  console.log('🧪 ========================================\n');
  
  // Obtener tokens de .env
  const accessToken = process.env.SUSALUD_ACCESS_TOKEN;
  const refreshToken = process.env.SUSALUD_REFRESH_TOKEN;
  
  console.log(`🔑 Access Token desde .env: ${accessToken ? accessToken.substring(0, 30) + '...' : 'NO CONFIGURADO'}`);
  console.log(`🔑 Refresh Token desde .env: ${refreshToken ? refreshToken.substring(0, 30) + '...' : 'NO CONFIGURADO'}`);
  console.log('');
  
  if (!accessToken) {
    console.error('❌ No hay accessToken configurado en .env');
    process.exit(1);
  }
  
  // Crear servicio con los tokens
  const susaludService = new SusaludService(accessToken, refreshToken);
  
  console.log('🔧 Servicio SUSalud creado\n');
  
  // Probar consulta
  const dni = '44443333';
  console.log(`🔍 Probando consulta para DNI: ${dni}\n`);
  
  try {
    const resultado = await susaludService.consultarSeguros(dni, '1');
    
    console.log('\n📊 ========================================');
    console.log('📊 RESULTADO DE LA CONSULTA');
    console.log('📊 ========================================\n');
    
    if (resultado.success) {
      console.log('✅ Consulta EXITOSA!\n');
      
      // Mostrar datos básicos
      const data = resultado.data.data;
      console.log('👤 DATOS PERSONALES:');
      console.log(`   Nombres: ${data.v_nombres_per}`);
      console.log(`   Apellidos: ${data.v_apepat_per} ${data.v_apemat_per}`);
      console.log(`   DNI: ${data.v_NroDoc}`);
      console.log(`   Fecha Nac: ${data.v_FecNac}`);
      console.log(`   Género: ${data.v_genero}`);
      console.log(`   Ubigeo: ${data.v_ubigeo}`);
      console.log('');
      
      // Mostrar seguros
      const seguros = data.seguros || [];
      console.log(`🏥 SEGUROS (${seguros.length} total):`);
      
      const activos = seguros.filter(s => s.estado === 'ACTIVO');
      console.log(`   ✅ Activos: ${activos.length}`);
      console.log(`   ❌ Cancelados: ${seguros.length - activos.length}`);
      console.log('');
      
      if (activos.length > 0) {
        console.log('   📋 SEGUROS ACTIVOS:');
        activos.forEach((s, i) => {
          console.log(`   ${i + 1}. ${s.nom_iafas} - ${s.tplansalud} (${s.regimen})`);
          console.log(`      Desde: ${s.fec_ini}`);
          console.log(`      Contratante: ${s.contratante}`);
        });
      }
      
      console.log('\n✅ TODO FUNCIONANDO CORRECTAMENTE! 🎉\n');
      
    } else {
      console.log('❌ Consulta FALLÓ\n');
      console.log(`   Mensaje: ${resultado.message}`);
      console.log(`   Error: ${resultado.error || 'N/A'}`);
      
      if (resultado.data) {
        console.log('\n   Datos de respuesta:');
        console.log(JSON.stringify(resultado.data, null, 2));
      }
    }
    
  } catch (error) {
    console.error('\n❌ ERROR FATAL:');
    console.error(error);
  }
}

// Ejecutar
probarSusalud();


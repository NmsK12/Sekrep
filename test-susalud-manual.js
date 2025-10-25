/**
 * Prueba manual para entender cómo funciona la autenticación de SUSalud
 */

const axios = require('axios');
const https = require('https');

const client = axios.create({
  timeout: 30000,
  httpsAgent: new https.Agent({
    rejectUnauthorized: false
  }),
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  }
});

async function probarAutenticacion() {
  console.log('🔍 Explorando SUSalud...\n');
  
  // Test 1: GET a la página principal
  console.log('📋 Test 1: GET a https://app8.susalud.gob.pe:8380/');
  try {
    const resp1 = await client.get('https://app8.susalud.gob.pe:8380/', {
      maxRedirects: 5,
      validateStatus: () => true
    });
    console.log(`   Status: ${resp1.status}`);
    console.log(`   Cookies: ${resp1.headers['set-cookie'] ? 'Sí' : 'No'}`);
    if (resp1.headers['set-cookie']) {
      console.log(`   Cookies recibidas:`, resp1.headers['set-cookie']);
    }
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }
  
  // Test 2: GET a /login
  console.log('\n📋 Test 2: GET a https://app8.susalud.gob.pe:8380/login');
  try {
    const resp2 = await client.get('https://app8.susalud.gob.pe:8380/login', {
      maxRedirects: 5,
      validateStatus: () => true
    });
    console.log(`   Status: ${resp2.status}`);
    console.log(`   Cookies: ${resp2.headers['set-cookie'] ? 'Sí' : 'No'}`);
    console.log(`   Body (primeros 300 chars):`, resp2.data.toString().substring(0, 300));
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }
  
  // Test 3: Probar la API directamente CON las cookies (simulando que ya hiciste login en el navegador)
  console.log('\n📋 Test 3: GET directo a la API de seguros (sin login previo)');
  try {
    const resp3 = await client.get('https://app30.susalud.gob.pe:8087/api/siteds-raaus/afiliado/seguros/44443333?tipoDoc=1', {
      validateStatus: () => true
    });
    console.log(`   Status: ${resp3.status}`);
    console.log(`   Respuesta:`, JSON.stringify(resp3.data).substring(0, 200));
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }
  
  console.log('\n💡 Sugerencia: Necesitas usar las herramientas de desarrollador');
  console.log('   del navegador para capturar las cookies/tokens exactos después');
  console.log('   de hacer login manualmente.');
}

probarAutenticacion();


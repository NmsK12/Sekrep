const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testBusquedaNombres() {
  console.log('🔍 Probando búsqueda por nombres...\n');
  
  try {
    // Test 1: Búsqueda con nombre completo y apellido paterno
    console.log('📝 Test 1: Búsqueda con "Miguel" y "Moscoso"');
    const response1 = await axios.post(`${BASE_URL}/api/consulta/advanced/nombres`, {
      nombreCompleto: 'Miguel',
      apellidoPaterno: 'Moscoso'
    });
    
    console.log(`✅ Resultados encontrados: ${response1.data.data.total}`);
    if (response1.data.data.resultados && response1.data.data.resultados.length > 0) {
      console.log('📋 Primeros 3 resultados:');
      response1.data.data.resultados.slice(0, 3).forEach((resultado, i) => {
        console.log(`  ${i + 1}. ${resultado.nombres} ${resultado.apellidoPaterno} ${resultado.apellidoMaterno} - DNI: ${resultado.dni}`);
      });
    }
    console.log('');

    // Test 2: Búsqueda solo con apellido paterno
    console.log('📝 Test 2: Búsqueda solo con apellido "Vargas"');
    const response2 = await axios.post(`${BASE_URL}/api/consulta/advanced/nombres`, {
      apellidoPaterno: 'Vargas'
    });
    
    console.log(`✅ Resultados encontrados: ${response2.data.data.total}`);
    if (response2.data.data.resultados && response2.data.data.resultados.length > 0) {
      console.log('📋 Primeros 3 resultados:');
      response2.data.data.resultados.slice(0, 3).forEach((resultado, i) => {
        console.log(`  ${i + 1}. ${resultado.nombres} ${resultado.apellidoPaterno} ${resultado.apellidoMaterno} - DNI: ${resultado.dni}`);
      });
    }
    console.log('');

    // Test 3: Búsqueda con todos los campos
    console.log('📝 Test 3: Búsqueda completa "Carlos", "García", "López"');
    const response3 = await axios.post(`${BASE_URL}/api/consulta/advanced/nombres`, {
      nombreCompleto: 'Carlos',
      apellidoPaterno: 'García',
      apellidoMaterno: 'López'
    });
    
    console.log(`✅ Resultados encontrados: ${response3.data.data.total}`);
    if (response3.data.data.resultados && response3.data.data.resultados.length > 0) {
      console.log('📋 Todos los resultados:');
      response3.data.data.resultados.forEach((resultado, i) => {
        console.log(`  ${i + 1}. ${resultado.nombres} ${resultado.apellidoPaterno} ${resultado.apellidoMaterno} - DNI: ${resultado.dni}`);
      });
    }

  } catch (error) {
    console.error('❌ Error en test de nombres:', error.response?.data || error.message);
  }
}

async function testBusquedaTelefono() {
  console.log('\n📱 Probando búsqueda por teléfono...\n');
  
  try {
    // Test con un teléfono que sabemos que existe
    console.log('📝 Test: Búsqueda por teléfono "924336263"');
    const response = await axios.post(`${BASE_URL}/api/consulta/advanced/telefono`, {
      telefono: '924336263'
    });
    
    console.log(`✅ Resultados encontrados: ${response.data.data.total}`);
    if (response.data.data.resultados && response.data.data.resultados.length > 0) {
      const resultado = response.data.data.resultados[0];
      console.log('📋 Resultado:');
      console.log(`  Nombre: ${resultado.nombre}`);
      console.log(`  DNI: ${resultado.dni}`);
      console.log(`  Fecha de Nacimiento: ${resultado.datosPersonales.fechaNacimiento}`);
      console.log(`  Edad: ${resultado.datosPersonales.edad}`);
      console.log(`  Sexo: ${resultado.datosPersonales.sexo}`);
    }

  } catch (error) {
    console.error('❌ Error en test de teléfono:', error.response?.data || error.message);
  }
}

async function main() {
  console.log('🚀 Iniciando pruebas de búsqueda por nombres y teléfono\n');
  
  await testBusquedaNombres();
  await testBusquedaTelefono();
  
  console.log('\n✅ Pruebas completadas');
}

main().catch(console.error);

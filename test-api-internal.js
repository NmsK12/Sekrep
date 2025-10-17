/**
 * Script para encontrar la API interna de seeker.lat
 */

const axios = require('axios');
const cheerio = require('cheerio');
const config = require('./config');

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

async function findInternalAPI() {
  try {
    const session = axios.create({
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'X-Requested-With': 'XMLHttpRequest'
      },
      withCredentials: true,
      maxRedirects: 5
    });

    // Paso 1: Login
    log('🔐 Haciendo login...', 'yellow');
    const loginPageResponse = await session.get(config.seekerLoginUrl);
    const $ = cheerio.load(loginPageResponse.data);
    
    const form = $('form').first();
    const action = form.attr('action') || '';
    const actionUrl = action.startsWith('http') ? action : config.seekerBaseUrl + '/' + action.replace(/^\//, '');
    
    const formData = {};
    form.find('input').each((i, input) => {
      const $input = $(input);
      const name = $input.attr('name');
      const value = $input.attr('value') || '';
      if (name) {
        formData[name] = value;
      }
    });

    formData['usuario'] = config.seekerUser;
    formData['contrasena'] = config.seekerPassword;
    
    const loginResponse = await session.post(actionUrl, formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Referer': config.seekerLoginUrl
      }
    });

    log('✅ Login exitoso', 'green');

    // Paso 2: Probar diferentes endpoints de API
    const apiEndpoints = [
      'https://seeker.lat/api/search',
      'https://seeker.lat/api/buscar',
      'https://seeker.lat/api/consulta',
      'https://seeker.lat/api/dni',
      'https://seeker.lat/api/persona',
      'https://seeker.lat/ajax/search.php',
      'https://seeker.lat/ajax/buscar.php',
      'https://seeker.lat/ajax/consulta.php',
      'https://seeker.lat/ajax/dni.php',
      'https://seeker.lat/inc/search.php',
      'https://seeker.lat/inc/buscar.php',
      'https://seeker.lat/inc/consulta.php',
      'https://seeker.lat/inc/dni.php',
      'https://seeker.lat/process/search.php',
      'https://seeker.lat/process/buscar.php',
      'https://seeker.lat/process/consulta.php',
      'https://seeker.lat/process/dni.php',
      'https://seeker.lat/index.php?action=search',
      'https://seeker.lat/index.php?action=buscar',
      'https://seeker.lat/index.php?action=consulta',
      'https://seeker.lat/index.php?action=dni',
      'https://seeker.lat/index.php?view=search',
      'https://seeker.lat/index.php?view=buscar',
      'https://seeker.lat/index.php?view=consulta',
      'https://seeker.lat/index.php?view=dni'
    ];

    for (const endpoint of apiEndpoints) {
      try {
        log(`\n🧪 Probando endpoint: ${endpoint}`, 'cyan');
        
        // Probar con GET
        const getResponse = await session.get(endpoint, {
          params: { dni: '80660243' }
        });
        
        log(`   GET Status: ${getResponse.status}`, 'reset');
        log(`   GET Tamaño: ${getResponse.data.length} caracteres`, 'reset');
        
        if (getResponse.data.length < 1000 && !getResponse.data.includes('<!DOCTYPE')) {
          log(`   ✅ Posible API encontrada (GET)`, 'green');
          console.log(`   Respuesta: ${getResponse.data.substring(0, 200)}...`);
        }
        
        // Probar con POST
        const postResponse = await session.post(endpoint, {
          dni: '80660243',
          documento: '80660243',
          search: '80660243'
        }, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        });
        
        log(`   POST Status: ${postResponse.status}`, 'reset');
        log(`   POST Tamaño: ${postResponse.data.length} caracteres`, 'reset');
        
        if (postResponse.data.length < 1000 && !postResponse.data.includes('<!DOCTYPE')) {
          log(`   ✅ Posible API encontrada (POST)`, 'green');
          console.log(`   Respuesta: ${postResponse.data.substring(0, 200)}...`);
        }
        
      } catch (error) {
        if (error.response && error.response.status !== 404) {
          log(`   ⚠️ Error ${error.response.status}: ${error.response.statusText}`, 'yellow');
        }
      }
    }

    // Paso 3: Probar con diferentes parámetros
    log('\n🔍 Probando con diferentes parámetros...', 'blue');
    
    const baseUrls = [
      'https://seeker.lat/index.php',
      'https://seeker.lat/search.php',
      'https://seeker.lat/buscar.php',
      'https://seeker.lat/consulta.php'
    ];

    const paramSets = [
      { dni: '80660243' },
      { documento: '80660243' },
      { search: '80660243' },
      { query: '80660243' },
      { term: '80660243' },
      { id: '80660243' },
      { cod: '80660243' },
      { codigo: '80660243' }
    ];

    for (const baseUrl of baseUrls) {
      for (const params of paramSets) {
        try {
          const response = await session.get(baseUrl, { params });
          
          if (response.data.length < 1000 && !response.data.includes('<!DOCTYPE')) {
            log(`\n✅ Posible API encontrada: ${baseUrl}`, 'green');
            log(`   Parámetros: ${JSON.stringify(params)}`, 'reset');
            console.log(`   Respuesta: ${response.data.substring(0, 200)}...`);
          }
          
        } catch (error) {
          // Ignorar errores 404
        }
      }
    }

  } catch (error) {
    log(`❌ Error fatal: ${error.message}`, 'red');
  }
}

// Ejecutar
findInternalAPI();

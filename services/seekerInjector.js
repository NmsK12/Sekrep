/**
 * Inyector para seeker.lat - Simula comportamiento del navegador
 */

const axios = require('axios');
const cheerio = require('cheerio');
const config = require('../config');

class SeekerInjector {
  constructor() {
    this.session = null;
    this.isLoggedIn = false;
    this.lastLogin = null;
    this.cookies = {};
  }

  /**
   * Crear sesión con headers de navegador real
   */
  createSession() {
    this.session = axios.create({
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Cache-Control': 'max-age=0'
      },
      withCredentials: true,
      maxRedirects: 5
    });

    // Interceptor para capturar cookies
    this.session.interceptors.response.use(
      (response) => {
        const setCookie = response.headers['set-cookie'];
        if (setCookie) {
          setCookie.forEach(cookie => {
            const [nameValue] = cookie.split(';');
            const [name, value] = nameValue.split('=');
            if (name && value) {
              this.cookies[name.trim()] = value.trim();
            }
          });
        }
        return response;
      },
      (error) => Promise.reject(error)
    );

    // Interceptor para enviar cookies
    this.session.interceptors.request.use(
      (config) => {
        if (Object.keys(this.cookies).length > 0) {
          const cookieString = Object.entries(this.cookies)
            .map(([name, value]) => `${name}=${value}`)
            .join('; ');
          config.headers['Cookie'] = cookieString;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
  }

  /**
   * Verificar si la sesión es válida
   */
  isSessionValid() {
    if (!this.lastLogin) return false;
    const now = new Date();
    const timeDiff = now - this.lastLogin;
    return timeDiff < config.sessionTimeout;
  }

  /**
   * Login completo con simulación de navegador
   */
  async login() {
    try {
      if (this.isSessionValid() && this.isLoggedIn) {
        console.log('✅ Sesión válida, no es necesario hacer login');
        return true;
      }

      console.log('🔐 Iniciando login con inyector...');
      
      if (!this.session) {
        this.createSession();
      }

      // Paso 1: Obtener página de login
      const loginPageResponse = await this.session.get(config.seekerLoginUrl);
      const $ = cheerio.load(loginPageResponse.data);
      
      // Extraer formulario
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

      // Configurar credenciales
      formData['usuario'] = config.seekerUser;
      formData['contrasena'] = config.seekerPassword;
      
      console.log('🔍 Campos del formulario:', formData);
      
      // Paso 2: Enviar login
      const loginResponse = await this.session.post(actionUrl, formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Referer': config.seekerLoginUrl,
          'Origin': config.seekerBaseUrl
        }
      });

      // Verificar login exitoso
      const loginHtml = loginResponse.data;
      console.log(`📊 Tamaño de respuesta: ${loginHtml.length} caracteres`);
      console.log(`📊 Contiene 'error': ${loginHtml.includes('error')}`);
      console.log(`📊 Contiene 'invalid': ${loginHtml.includes('invalid')}`);
      console.log(`📊 Contiene 'incorrect': ${loginHtml.includes('incorrect')}`);
      console.log(`📊 Primeros 200 caracteres: ${loginHtml.substring(0, 200)}...`);
      
      const isLoggedIn = !loginHtml.includes('error') && 
                        !loginHtml.includes('invalid') &&
                        !loginHtml.includes('incorrect') &&
                        !loginHtml.includes('Login') &&
                        loginHtml.length > 2000;

      if (isLoggedIn) {
        this.isLoggedIn = true;
        this.lastLogin = new Date();
        console.log('✅ Login exitoso con inyector');
        console.log('🍪 Cookies capturadas:', this.cookies);
        
        // Paso 3: Simular carga de recursos del navegador
        await this.simulateBrowserResources();
        
        return true;
      } else {
        throw new Error('Login fallido');
      }

    } catch (error) {
      console.error('❌ Error en login con inyector:', error.message);
      this.isLoggedIn = false;
      throw error;
    }
  }

  /**
   * Simular carga de recursos del navegador
   */
  async simulateBrowserResources() {
    try {
      console.log('🌐 Simulando carga de recursos del navegador...');
      
      const resources = [
        'https://seeker.lat/js/jquery-1.10.2.js',
        'https://seeker.lat/js/bootstrap.min.js',
        'https://seeker.lat/js/main.js',
        'https://seeker.lat/js/script.js',
        'https://seeker.lat/js/jquery.dataTables.js',
        'https://seeker.lat/css/estilos.css',
        'https://seeker.lat/css/main.css'
      ];

      for (const resource of resources) {
        try {
          await this.session.get(resource, {
            headers: {
              'Referer': config.seekerHomeUrl,
              'Accept': resource.includes('.js') ? 'application/javascript' : 'text/css'
            }
          });
        } catch (error) {
          // Ignorar errores de recursos
        }
      }

      console.log('✅ Recursos del navegador simulados');
    } catch (error) {
      console.log('⚠️ Error simulando recursos:', error.message);
    }
  }

  /**
   * Inyectar búsqueda usando AJAX
   */
  async injectSearch(dni) {
    try {
      if (!this.isSessionValid() || !this.isLoggedIn) {
        await this.login();
      }

      console.log(`🔍 Inyectando búsqueda para DNI: ${dni}`);
      
      // Paso 1: Ir a la página home
      const homeResponse = await this.session.get(config.seekerHomeUrl, {
        headers: {
          'Referer': config.seekerLoginUrl
        }
      });

      // Paso 2: Simular la petición AJAX exacta
      console.log('🔍 Simulando petición AJAX exacta...');
      
      // La función JavaScript hace una petición POST a ./index.php?action=validate
      const ajaxUrl = `${config.seekerBaseUrl}/index.php?action=validate`;
      
      // Preparar datos como lo hace el JavaScript
      const formData = {
        tipo_bus: '1', // Documento
        valor_buscado: dni
      };
      
      console.log('🔍 Datos AJAX:', formData);
      console.log('🔍 URL AJAX:', ajaxUrl);
      
      // Enviar petición AJAX
      try {
        const ajaxResponse = await this.session.post(ajaxUrl, formData, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-Requested-With': 'XMLHttpRequest',
            'Referer': config.seekerHomeUrl,
            'Origin': config.seekerBaseUrl
          }
        });
        
        console.log(`📊 Respuesta AJAX: ${ajaxResponse.status}, ${ajaxResponse.data.length} caracteres`);
        console.log(`📊 Contenido AJAX: "${ajaxResponse.data}"`);
        
        if (ajaxResponse.data.includes('GUILLERMO') || ajaxResponse.data.includes('MOSCOSO')) {
          console.log('✅ ¡Datos encontrados en respuesta AJAX!');
          return this.parseAjaxResponse(ajaxResponse.data, dni);
        } else if (ajaxResponse.data.length > 100 && !ajaxResponse.data.includes('<!DOCTYPE')) {
          console.log('✅ Respuesta AJAX recibida (posible HTML de resultados)');
          return this.parseAjaxResponse(ajaxResponse.data, dni);
        } else if (ajaxResponse.data.includes('session-expired-alert')) {
          console.log('⚠️ Sesión expirada en respuesta AJAX');
        } else if (ajaxResponse.data.length === 0) {
          console.log('⚠️ Respuesta AJAX vacía - posible que no se encontraron datos');
        } else {
          console.log('⚠️ Respuesta AJAX inesperada');
        }
        
      } catch (error) {
        console.log('⚠️ Error en petición AJAX:', error.message);
      }

      // Paso 3: Si no hay AJAX, intentar con GET directo
      console.log('🔄 Intentando con GET directo...');
      const directUrl = `${config.seekerResultUrl}&cod=${dni}`;
      const directResponse = await this.session.get(directUrl, {
        headers: {
          'Referer': config.seekerHomeUrl
        }
      });

      return this.parseDirectResponse(directResponse.data, dni);

    } catch (error) {
      console.error('❌ Error en inyección de búsqueda:', error.message);
      throw error;
    }
  }

  /**
   * Parsear respuesta AJAX
   */
  parseAjaxResponse(data, dni) {
    try {
      // Intentar parsear como JSON
      if (data.startsWith('{') || data.startsWith('[')) {
        const jsonData = JSON.parse(data);
        return {
          success: true,
          message: 'Datos obtenidos vía AJAX',
          data: {
            dni,
            source: 'ajax',
            rawData: jsonData,
            timestamp: new Date().toISOString()
          }
        };
      }

      // Parsear como HTML
      const $ = cheerio.load(data);
      const hasPersonData = data.includes('GUILLERMO') || 
                           data.includes('MOSCOSO') || 
                           data.includes('VARGAS') ||
                           data.includes('Fecha de Nacimiento') ||
                           data.includes('TELEFONIA');

      if (hasPersonData) {
        const datosDetallados = this.parseDetailResults(data, dni);
        return {
          success: true,
          message: 'Datos obtenidos vía AJAX',
          data: {
            dni,
            source: 'ajax',
            ...datosDetallados,
            timestamp: new Date().toISOString()
          }
        };
      }

      return {
        success: false,
        message: 'No se encontraron datos en respuesta AJAX',
        data: { dni, source: 'ajax', timestamp: new Date().toISOString() }
      };

    } catch (error) {
      console.error('Error parseando respuesta AJAX:', error.message);
      return {
        success: false,
        message: 'Error parseando respuesta AJAX',
        error: error.message,
        data: { dni, source: 'ajax', timestamp: new Date().toISOString() }
      };
    }
  }

  /**
   * Parsear respuesta directa
   */
  parseDirectResponse(html, dni) {
    try {
      const $ = cheerio.load(html);
      
      // Verificar si es una página de resultados
      const hasPersonData = html.includes('GUILLERMO') || 
                           html.includes('MOSCOSO') || 
                           html.includes('VARGAS') ||
                           html.includes('Fecha de Nacimiento') ||
                           html.includes('TELEFONIA');

      if (hasPersonData) {
        const datosDetallados = this.parseDetailResults(html, dni);
        return {
          success: true,
          message: 'Datos obtenidos vía GET directo',
          data: {
            dni,
            source: 'direct',
            ...datosDetallados,
            timestamp: new Date().toISOString()
          }
        };
      }

      return {
        success: false,
        message: 'No se encontraron datos en respuesta directa',
        data: { dni, source: 'direct', timestamp: new Date().toISOString() }
      };

    } catch (error) {
      console.error('Error parseando respuesta directa:', error.message);
      return {
        success: false,
        message: 'Error parseando respuesta directa',
        error: error.message,
        data: { dni, source: 'direct', timestamp: new Date().toISOString() }
      };
    }
  }

  /**
   * Parsear datos detallados (reutilizar del servicio original)
   */
  parseDetailResults(html, codigo) {
    try {
      const $ = cheerio.load(html);
      
      const datos = {
        codigo,
        nombre: '',
        datosPersonales: {},
        datosUbicacion: {},
        telefonos: []
      };

      // Extraer nombre principal
      $('h1, h2, h3, .nombre, .title, .header').each((i, element) => {
        const $el = $(element);
        const text = $el.text().trim();
        if (text && text.length > 5 && text.length < 100 && !text.includes('seeker')) {
          datos.nombre = text;
          return false;
        }
      });

      // Si no se encontró nombre en headers, buscar en el texto
      if (!datos.nombre) {
        const textContent = $('body').text();
        const nameMatch = textContent.match(/([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s]+(?:[A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s]+){2,})/);
        if (nameMatch && nameMatch[1].length > 10 && nameMatch[1].length < 100) {
          datos.nombre = nameMatch[1].trim();
        }
      }

      // Extraer datos personales
      $('div, p, span').each((i, element) => {
        const $el = $(element);
        const text = $el.text().trim();
        
        if (text.includes('Fecha de Nacimiento:')) {
          const fecha = text.replace('Fecha de Nacimiento:', '').trim();
          datos.datosPersonales.fechaNacimiento = fecha;
        }
        
        if (text.includes('Edad:')) {
          const edad = text.replace('Edad:', '').trim();
          datos.datosPersonales.edad = edad;
        }
        
        if (text.includes('Sexo:')) {
          const sexo = text.replace('Sexo:', '').trim();
          datos.datosPersonales.sexo = sexo;
        }
        
        if (text.includes('Estado:')) {
          const estado = text.replace('Estado:', '').trim();
          datos.datosPersonales.estadoCivil = estado;
        }
        
        if (text.includes('Padre:')) {
          const padre = text.replace('Padre:', '').trim();
          datos.datosPersonales.padre = padre;
        }
        
        if (text.includes('Madre:')) {
          const madre = text.replace('Madre:', '').trim();
          datos.datosPersonales.madre = madre;
        }
        
        if (text.includes('Ubicación:')) {
          const ubicacion = text.replace('Ubicación:', '').trim();
          datos.datosUbicacion.ubicacion = ubicacion;
        }
        
        if (text.includes('Dirección:')) {
          const direccion = text.replace('Dirección:', '').trim();
          datos.datosUbicacion.direccion = direccion;
        }
        
        if (text.includes('Ubigeo Nacimiento:')) {
          const ubigeo = text.replace('Ubigeo Nacimiento:', '').trim();
          datos.datosUbicacion.ubigeoNacimiento = ubigeo;
        }
        
        if (text.includes('Fecha de Fallecimiento:')) {
          const fallecimiento = text.replace('Fecha de Fallecimiento:', '').trim();
          datos.datosPersonales.fechaFallecimiento = fallecimiento;
        }
      });

      // Extraer teléfonos de la tabla
      $('table tr').each((i, row) => {
        const $row = $(row);
        const cells = $row.find('td');
        
        if (cells.length >= 4) {
          const telefono = $(cells[0]).text().trim();
          const operador = $(cells[1]).text().trim();
          const periodo = $(cells[2]).text().trim();
          const email = $(cells[3]).text().trim();
          
          if (telefono && telefono.match(/^\d+$/)) {
            datos.telefonos.push({
              telefono,
              operador,
              periodo,
              email: email || null
            });
          }
        }
      });

      return datos;

    } catch (error) {
      console.error('Error parseando datos detallados:', error.message);
      return {
        codigo,
        error: 'Error parseando datos detallados',
        html: html.substring(0, 1000)
      };
    }
  }

  /**
   * Consulta completa usando inyector
   */
  async consultarPorDNI(dni) {
    try {
      console.log(`🚀 Iniciando consulta con inyector para DNI: ${dni}`);
      
      const resultado = await this.injectSearch(dni);
      return resultado;

    } catch (error) {
      console.error('❌ Error en consulta con inyector:', error.message);
      return {
        success: false,
        message: 'Error en consulta con inyector',
        error: error.message,
        data: { dni, timestamp: new Date().toISOString() }
      };
    }
  }
}

module.exports = new SeekerInjector();

/**
 * Servicio para interactuar con seeker.lat
 */

const axios = require('axios');
const cheerio = require('cheerio');
const config = require('../config');

class SeekerService {
  constructor() {
    this.session = null;
    this.lastLogin = null;
    this.isLoggedIn = false;
  }

  /**
   * Crear sesión con manejo de cookies
   */
  createSession() {
    this.session = axios.create({
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      },
      withCredentials: true,
      maxRedirects: 5
    });
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
   * Obtener formulario de login
   */
  async getLoginForm() {
    try {
      if (!this.session) {
        this.createSession();
      }

      const response = await this.session.get(config.seekerLoginUrl);
      const $ = cheerio.load(response.data);
      
      const form = $('form').first();
      if (form.length === 0) {
        throw new Error('No se encontró formulario de login');
      }

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

      return { actionUrl, formData };
    } catch (error) {
      console.error('Error obteniendo formulario de login:', error.message);
      throw error;
    }
  }

  /**
   * Realizar login
   */
  async login() {
    try {
      if (this.isSessionValid() && this.isLoggedIn) {
        console.log('✅ Sesión válida, no es necesario hacer login');
        return true;
      }

      console.log('🔐 Iniciando login en seeker.lat...');
      
      const { actionUrl, formData } = await this.getLoginForm();
      
      // Buscar campos de usuario y contraseña
      const userField = Object.keys(formData).find(key => 
        key.toLowerCase().includes('user') || 
        key.toLowerCase().includes('usuario') ||
        key.toLowerCase().includes('email') ||
        key.toLowerCase().includes('login')
      );
      
      const passField = Object.keys(formData).find(key => 
        key.toLowerCase().includes('pass') || 
        key.toLowerCase().includes('password') ||
        key.toLowerCase().includes('clave')
      );

      if (!userField || !passField) {
        // Intentar con nombres comunes
        formData['username'] = config.seekerUser;
        formData['password'] = config.seekerPassword;
      } else {
        formData[userField] = config.seekerUser;
        formData[passField] = config.seekerPassword;
      }

      const loginResponse = await this.session.post(actionUrl, formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Referer': config.seekerLoginUrl
        }
      });

      // Verificar si el login fue exitoso
      const loginHtml = loginResponse.data;
      const isLoggedIn = !loginHtml.includes('error') && 
                        !loginHtml.includes('invalid') &&
                        !loginHtml.includes('incorrect') &&
                        (loginHtml.includes('dashboard') || 
                         loginHtml.includes('buscar') ||
                         loginHtml.includes('mostrar') ||
                         loginHtml.includes('Generar Consulta') ||
                         loginHtml.length > 5000);

      if (isLoggedIn) {
        this.isLoggedIn = true;
        this.lastLogin = new Date();
        console.log('✅ Login exitoso en seeker.lat');
        return true;
      } else {
        throw new Error('Login fallido - credenciales incorrectas o error en el sistema');
      }

    } catch (error) {
      console.error('❌ Error en login:', error.message);
      this.isLoggedIn = false;
      throw error;
    }
  }

  /**
   * Buscar persona por DNI
   */
  async buscarPorDNI(dni) {
    try {
      if (!this.isSessionValid() || !this.isLoggedIn) {
        await this.login();
      }

      console.log(`🔍 Buscando DNI: ${dni}`);
      
      // Ir directamente a la página de resultados usando el DNI como código
      const resultUrl = `${config.seekerResultUrl}&cod=${dni}`;
      const resultResponse = await this.session.get(resultUrl);
      
      return this.parseSearchResults(resultResponse.data, dni);

    } catch (error) {
      console.error('❌ Error en búsqueda:', error.message);
      throw error;
    }
  }

  /**
   * Obtener datos detallados de una persona
   */
  async obtenerDatosDetallados(codigo) {
    try {
      if (!this.isSessionValid() || !this.isLoggedIn) {
        await this.login();
      }

      console.log(`📋 Obteniendo datos detallados para código: ${codigo}`);
      
      const detailUrl = `${config.seekerBaseUrl}/index.php?view=mostrar&cod=${codigo}`;
      const detailResponse = await this.session.get(detailUrl);
      
      return this.parseDetailResults(detailResponse.data, codigo);

    } catch (error) {
      console.error('❌ Error obteniendo datos detallados:', error.message);
      throw error;
    }
  }

  /**
   * Parsear resultados de búsqueda
   */
  parseSearchResults(html, dni) {
    try {
      const $ = cheerio.load(html);
      
      // Verificar si es una página de resultados de persona
      const hasPersonData = html.includes('GUILLERMO') || 
                           html.includes('MOSCOSO') || 
                           html.includes('VARGAS') ||
                           html.includes('Fecha de Nacimiento') ||
                           html.includes('TELEFONIA');
      
      if (hasPersonData) {
        // Es una página de resultados, parsear datos directamente
        const datosDetallados = this.parseDetailResults(html, dni);
        return {
          dni,
          resultados: [{
            nombre: datosDetallados.nombre || 'Nombre no encontrado',
            codigo: dni,
            dni: dni
          }],
          total: 1,
          datosDetallados: datosDetallados
        };
      }

      // Si no es una página de resultados, buscar tabla de resultados
      const results = [];
      $('table tr').each((i, row) => {
        const $row = $(row);
        const cells = $row.find('td');
        
        if (cells.length >= 3) {
          const nombre = $(cells[0]).text().trim();
          const codigo = $(cells[1]).text().trim();
          const dniResultado = $(cells[2]).text().trim();
          
          if (nombre && codigo && dniResultado === dni) {
            results.push({
              nombre,
              codigo,
              dni: dniResultado
            });
          }
        }
      });

      // Si no hay tabla, buscar enlaces directos
      if (results.length === 0) {
        $('a[href*="mostrar"]').each((i, link) => {
          const $link = $(link);
          const href = $link.attr('href');
          const text = $link.text().trim();
          
          if (href && text) {
            const codigoMatch = href.match(/cod=(\d+)/);
            if (codigoMatch) {
              results.push({
                nombre: text,
                codigo: codigoMatch[1],
                dni: dni
              });
            }
          }
        });
      }

      return {
        dni,
        resultados: results,
        total: results.length
      };

    } catch (error) {
      console.error('Error parseando resultados de búsqueda:', error.message);
      return {
        dni,
        resultados: [],
        total: 0,
        error: 'Error parseando resultados'
      };
    }
  }

  /**
   * Parsear datos detallados
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
          return false; // Salir del loop
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
        
        // Fecha de nacimiento
        if (text.includes('Fecha de Nacimiento:')) {
          const fecha = text.replace('Fecha de Nacimiento:', '').trim();
          datos.datosPersonales.fechaNacimiento = fecha;
        }
        
        // Edad
        if (text.includes('Edad:')) {
          const edad = text.replace('Edad:', '').trim();
          datos.datosPersonales.edad = edad;
        }
        
        // Sexo
        if (text.includes('Sexo:')) {
          const sexo = text.replace('Sexo:', '').trim();
          datos.datosPersonales.sexo = sexo;
        }
        
        // Estado civil
        if (text.includes('Estado:')) {
          const estado = text.replace('Estado:', '').trim();
          datos.datosPersonales.estadoCivil = estado;
        }
        
        // Padre
        if (text.includes('Padre:')) {
          const padre = text.replace('Padre:', '').trim();
          datos.datosPersonales.padre = padre;
        }
        
        // Madre
        if (text.includes('Madre:')) {
          const madre = text.replace('Madre:', '').trim();
          datos.datosPersonales.madre = madre;
        }
        
        // Ubicación
        if (text.includes('Ubicación:')) {
          const ubicacion = text.replace('Ubicación:', '').trim();
          datos.datosUbicacion.ubicacion = ubicacion;
        }
        
        // Dirección
        if (text.includes('Dirección:')) {
          const direccion = text.replace('Dirección:', '').trim();
          datos.datosUbicacion.direccion = direccion;
        }
        
        // Ubigeo
        if (text.includes('Ubigeo Nacimiento:')) {
          const ubigeo = text.replace('Ubigeo Nacimiento:', '').trim();
          datos.datosUbicacion.ubigeoNacimiento = ubigeo;
        }
        
        // Fecha de fallecimiento
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
        html: html.substring(0, 1000) // Primeros 1000 caracteres para debug
      };
    }
  }

  /**
   * Consulta completa por DNI
   */
  async consultarPorDNI(dni) {
    try {
      console.log(`🚀 Iniciando consulta completa para DNI: ${dni}`);
      
      // Paso 1: Buscar
      const busqueda = await this.buscarPorDNI(dni);
      
      if (busqueda.total === 0) {
        return {
          success: false,
          message: 'No se encontraron resultados',
          data: { dni, timestamp: new Date().toISOString() }
        };
      }

      // Paso 2: Obtener datos detallados del primer resultado
      const primerResultado = busqueda.resultados[0];
      const datosDetallados = await this.obtenerDatosDetallados(primerResultado.codigo);

      return {
        success: true,
        message: 'Consulta exitosa',
        data: {
          dni,
          nombre: primerResultado.nombre,
          codigo: primerResultado.codigo,
          datosPersonales: datosDetallados.datosPersonales,
          datosUbicacion: datosDetallados.datosUbicacion,
          telefonos: datosDetallados.telefonos,
          timestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('❌ Error en consulta completa:', error.message);
      return {
        success: false,
        message: 'Error en la consulta',
        error: error.message,
        data: { dni, timestamp: new Date().toISOString() }
      };
    }
  }
}

module.exports = new SeekerService();

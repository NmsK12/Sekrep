/**
 * Servicio avanzado de Seeker.lat - Extracción completa de datos
 */

const axios = require('axios');
const cheerio = require('cheerio');
const config = require('../config');

class SeekerAdvanced {
  constructor() {
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

    this.cookies = {};
    this.isLoggedIn = false;
    this.lastLogin = null;

    // Interceptor para manejar cookies
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
   * Login rápido y eficiente
   */
  async login() {
    try {
      console.log('🔐 Login rápido...');
      
      // 1. Obtener página de login
      const loginPageResponse = await this.session.get(config.seekerLoginUrl);
      const $ = cheerio.load(loginPageResponse.data);
      
      // 2. Buscar formulario de login
      const form = $('form').first();
      const action = form.attr('action') || '';
      const actionUrl = action.startsWith('http') ? action : config.seekerBaseUrl + '/' + action.replace(/^\//, '');
      
      console.log('🔍 Formulario encontrado, action:', actionUrl);
      
      // 3. Preparar datos del formulario
      const formData = {};
      form.find('input').each((i, input) => {
        const $input = $(input);
        const name = $input.attr('name');
        const value = $input.attr('value') || '';
        if (name) {
          formData[name] = value;
        }
      });

      // 4. Agregar credenciales (usar los nombres correctos del formulario)
      formData['usuario'] = config.seekerUser;
      formData['password'] = config.seekerPassword; // Cambiar de 'contrasena' a 'password'
      
      console.log('📤 Enviando credenciales...', { usuario: formData['usuario'], password: '***' });
      
      // 5. Enviar login
      const loginResponse = await this.session.post(actionUrl, formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Referer': config.seekerLoginUrl,
          'Origin': config.seekerBaseUrl
        }
      });

      const loginHtml = loginResponse.data;
      
      // 6. Verificar si el login fue exitoso
      const isLoggedIn = !loginHtml.includes('error') && 
                        !loginHtml.includes('invalid') &&
                        !loginHtml.includes('incorrect') &&
                        !loginHtml.includes('Login') &&
                        (loginHtml.includes('Usuario de búsqueda básica') || 
                         loginHtml.includes('NMSK12') ||
                         loginHtml.includes('home') ||
                         loginHtml.length > 2000);

      if (isLoggedIn) {
        this.isLoggedIn = true;
        this.lastLogin = new Date();
        console.log('✅ Login exitoso');
        return true;
      } else {
        console.log('❌ Login fallido - HTML recibido:', loginHtml.substring(0, 300));
        throw new Error('Login fallido');
      }

    } catch (error) {
      console.error('❌ Error en login:', error.message);
      throw error;
    }
  }

  /**
   * Consultar DNI con extracción completa
   */
  async consultarDNI(dni) {
    try {
      console.log(`🚀 Consulta completa para DNI: ${dni}`);
      
      if (!this.isLoggedIn) {
        await this.login();
      }

      // Paso 1: Petición AJAX
      const ajaxUrl = `${config.seekerBaseUrl}/index.php?action=validate`;
      const formData = {
        tipo_bus: '1',
        valor_buscado: dni
      };
      
      console.log('🔍 Enviando petición AJAX...');
      console.log('🍪 Cookies antes de AJAX:', this.cookies);
      
      const ajaxResponse = await this.session.post(ajaxUrl, formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Requested-With': 'XMLHttpRequest',
          'Referer': config.seekerHomeUrl,
          'Origin': config.seekerBaseUrl
        }
      });
      
      console.log('📥 Respuesta AJAX:', ajaxResponse.data.substring(0, 200));

      // Paso 2: Ir directamente a la página de resultados
      const resultUrl = `${config.seekerResultUrl}&cod=${dni}`;
      console.log('📄 Obteniendo página de resultados...');
      const resultResponse = await this.session.get(resultUrl);

      // Paso 3: Extraer TODOS los datos
      const datosCompletos = await this.extraerDatosCompletos(resultResponse.data, dni);
      
      return {
        success: true,
        message: 'Datos extraídos completamente',
        data: datosCompletos
      };

    } catch (error) {
      console.error('❌ Error en consulta:', error.message);
      return {
        success: false,
        message: 'Error en consulta',
        error: error.message,
        data: { dni, timestamp: new Date().toISOString() }
      };
    }
  }

  /**
   * Extraer TODOS los datos de la página
   */
  async extraerDatosCompletos(html, dni) {
    try {
      const $ = cheerio.load(html);
      const datos = {
        dni,
        codigo: dni,
        nombre: '',
        foto: null,
        datosPersonales: {},
        datosUbicacion: {},
        datosFamiliares: {},
        telefonos: [],
        emails: [],
        redesSociales: [],
        datosAdicionales: {},
        timestamp: new Date().toISOString()
      };

      // 1. Extraer nombre principal
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

      // 2. Extraer foto - buscar en la estructura específica
      const fotoImg = $('.fotoperfil img').first();
      if (fotoImg.length > 0) {
        const fotoSrc = fotoImg.attr('src');
        console.log(`📸 SRC de foto encontrado: ${fotoSrc ? fotoSrc.substring(0, 100) + '...' : 'null'}`);
        
        if (fotoSrc) {
          // Si ya viene en base64, usarlo directamente
          if (fotoSrc.startsWith('data:image/')) {
            console.log('📸 Foto encontrada en base64');
            datos.foto = fotoSrc;
          }
          // Si es la imagen por defecto, usar la imagen local
          else if (fotoSrc.includes('ft_no_disponible.png')) {
            console.log('📸 Usando imagen por defecto local');
            datos.foto = await this.getDefaultImageBase64();
          }
          // Si es una URL normal, descargarla
          else if (!fotoSrc.includes('icon-perfil')) {
            console.log('📸 Descargando foto desde URL...');
            datos.foto = await this.getImageBase64(fotoSrc);
          }
        }
      } else {
        console.log('📸 No se encontró elemento de foto');
      }

      // 3. Extraer datos personales
      this.extraerDatosPersonales($, datos);
      
      // 4. Extraer datos de ubicación
      this.extraerDatosUbicacion($, datos);
      
      // 5. Extraer datos familiares
      this.extraerDatosFamiliares($, datos);
      
      // 6. Extraer teléfonos
      this.extraerTelefonos($, datos);
      
      // 7. Extraer emails
      this.extraerEmails($, datos);
      
      // 8. Extraer datos adicionales
      this.extraerDatosAdicionales($, datos);

      return datos;

    } catch (error) {
      console.error('Error extrayendo datos completos:', error.message);
      return { dni, error: 'Error extrayendo datos completos' };
    }
  }

  /**
   * Extraer datos personales
   */
  extraerDatosPersonales($, datos) {
    // Extraer datos de la estructura específica
    $('.txtinfo p').each((i, element) => {
      const $el = $(element);
      const text = $el.text().trim();
      
      if (text.includes('Fecha de Nacimiento:')) {
        datos.datosPersonales.fechaNacimiento = text.replace('Fecha de Nacimiento:', '').trim();
      }
      if (text.includes('Edad :')) {
        datos.datosPersonales.edad = text.replace('Edad :', '').trim();
      }
      if (text.includes('Sexo :')) {
        datos.datosPersonales.sexo = text.replace('Sexo :', '').trim();
      }
      if (text.includes('Estado :')) {
        datos.datosPersonales.estadoCivil = text.replace('Estado :', '').trim();
      }
      if (text.includes('Fecha de Fallecimiento:')) {
        const fecha = text.replace('Fecha de Fallecimiento:', '').trim();
        if (fecha !== 'N/A') {
          datos.datosPersonales.fechaFallecimiento = fecha;
        }
      }
    });
  }

  /**
   * Extraer datos de ubicación
   */
  extraerDatosUbicacion($, datos) {
    $('.txtinfo p').each((i, element) => {
      const $el = $(element);
      const text = $el.text().trim();
      
      if (text.includes('Ubicación:')) {
        datos.datosUbicacion.ubicacion = text.replace('Ubicación:', '').trim();
      }
      if (text.includes('Dirección:')) {
        datos.datosUbicacion.direccion = text.replace('Dirección:', '').trim();
      }
      if (text.includes('Ubigeo Nacimiento:')) {
        datos.datosUbicacion.ubigeoNacimiento = text.replace('Ubigeo Nacimiento:', '').trim();
      }
    });
  }

  /**
   * Extraer datos familiares
   */
  extraerDatosFamiliares($, datos) {
    $('.txtinfo p').each((i, element) => {
      const $el = $(element);
      const text = $el.text().trim();
      
      if (text.includes('Padre :')) {
        datos.datosFamiliares.padre = text.replace('Padre :', '').trim();
      }
      if (text.includes('Madre :')) {
        datos.datosFamiliares.madre = text.replace('Madre :', '').trim();
      }
    });
  }

  /**
   * Extraer teléfonos
   */
  extraerTelefonos($, datos) {
    // Buscar en la tabla de teléfonos específica
    $('#telefonos table tbody tr').each((i, row) => {
      const $row = $(row);
      const cells = $row.find('td');
      
      if (cells.length >= 4) {
        const telefono = $(cells[0]).text().trim();
        const operador = $(cells[1]).text().trim();
        const periodo = $(cells[2]).text().trim();
        const email = $(cells[3]).text().trim();
        
        if (telefono && telefono.match(/^\d{9,10}$/)) {
          datos.telefonos.push({
            telefono,
            operador,
            periodo,
            email: email && email !== 'N/A' && email !== '' ? email : null
          });
        }
      }
    });
  }

  /**
   * Extraer emails
   */
  extraerEmails($, datos) {
    // Extraer emails de la tabla de correos
    $('#correos table tbody tr').each((i, row) => {
      const $row = $(row);
      const cells = $row.find('td');
      
      if (cells.length >= 1) {
        const email = $(cells[0]).text().trim();
        if (email && email.includes('@')) {
          datos.emails.push({
            email,
            fecha: cells.length > 1 ? $(cells[1]).text().trim() : null,
            fuente: cells.length > 2 ? $(cells[2]).text().trim() : null
          });
        }
      }
    });

    // También buscar emails en teléfonos
    datos.telefonos.forEach(tel => {
      if (tel.email && tel.email.includes('@')) {
        const emailExists = datos.emails.some(e => e.email === tel.email);
        if (!emailExists) {
          datos.emails.push({
            email: tel.email,
            fecha: null,
            fuente: 'Teléfono'
          });
        }
      }
    });
  }

  /**
   * Extraer datos adicionales
   */
  extraerDatosAdicionales($, datos) {
    // Extraer datos de riesgo/creditos
    const datosRiesgo = [];
    $('#creditos table tbody tr').each((i, row) => {
      const $row = $(row);
      const cells = $row.find('td');
      
      if (cells.length >= 5) {
        datosRiesgo.push({
          entidad: $(cells[0]).text().trim(),
          descripcion: $(cells[1]).text().trim(),
          moneda: $(cells[2]).text().trim(),
          saldo: $(cells[3]).text().trim(),
          clasificacion: $(cells[4]).text().trim()
        });
      }
    });
    
    if (datosRiesgo.length > 0) {
      datos.datosAdicionales.riesgo = datosRiesgo;
    }

    // Extraer árbol genealógico
    const arbolGenealogico = [];
    $('#arbol table tbody tr').each((i, row) => {
      const $row = $(row);
      const cells = $row.find('td');
      
      if (cells.length >= 8) {
        arbolGenealogico.push({
          dni: $(cells[0]).text().trim(),
          apellidoPaterno: $(cells[1]).text().trim(),
          apellidoMaterno: $(cells[2]).text().trim(),
          nombres: $(cells[3]).text().trim(),
          edad: $(cells[4]).text().trim(),
          sexo: $(cells[5]).text().trim(),
          tipo: $(cells[6]).text().trim(),
          ubigeo: $(cells[7]).text().trim()
        });
      }
    });
    
    if (arbolGenealogico.length > 0) {
      datos.datosAdicionales.arbolGenealogico = arbolGenealogico;
    }
  }

  /**
   * Obtener imagen en base64
   */
  async getImageBase64(imageUrl) {
    try {
      if (!imageUrl || imageUrl.includes('No hay foto disponible')) {
        return null;
      }

      // Si es una URL relativa, convertir a absoluta
      if (imageUrl.startsWith('/')) {
        imageUrl = config.seekerBaseUrl + imageUrl;
      } else if (!imageUrl.startsWith('http')) {
        imageUrl = config.seekerBaseUrl + '/' + imageUrl;
      }

      console.log(`📸 Descargando imagen: ${imageUrl}`);
      
      const response = await this.session.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 10000
      });

      if (response.status === 200 && response.data.length > 0) {
        const base64 = Buffer.from(response.data).toString('base64');
        const mimeType = response.headers['content-type'] || 'image/jpeg';
        return `data:${mimeType};base64,${base64}`;
      }

      return null;
    } catch (error) {
      console.log(`⚠️ Error descargando imagen: ${error.message}`);
      return null;
    }
  }

  /**
   * Obtener imagen por defecto en base64
   */
  async getDefaultImageBase64() {
    try {
      const fs = require('fs');
      const path = require('path');
      
      // Buscar la imagen por defecto en diferentes ubicaciones
      const possiblePaths = [
        path.join(__dirname, '../ft_no_disponible.jpg'),
        path.join(__dirname, '../ft_no_disponible.png'),
        path.join(__dirname, '../imgs/ft_no_disponible.jpg'),
        path.join(__dirname, '../imgs/ft_no_disponible.png')
      ];
      
      for (const imagePath of possiblePaths) {
        if (fs.existsSync(imagePath)) {
          console.log(`📸 Cargando imagen por defecto: ${imagePath}`);
          const imageBuffer = fs.readFileSync(imagePath);
          const base64 = imageBuffer.toString('base64');
          const ext = path.extname(imagePath).toLowerCase();
          const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg';
          return `data:${mimeType};base64,${base64}`;
        }
      }
      
      console.log('⚠️ No se encontró imagen por defecto');
      return null;
    } catch (error) {
      console.log(`⚠️ Error cargando imagen por defecto: ${error.message}`);
      return null;
    }
  }

  /**
   * Buscar por nombres
   */
  async buscarPorNombres(nombreCompleto, apellidoPaterno, apellidoMaterno) {
    try {
      console.log(`🔍 Iniciando búsqueda por nombres...`);
      
      // 1. Login con timeout específico
      try {
        await Promise.race([
          this.login(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Login timeout')), 20000)
          )
        ]);
      } catch (error) {
        console.error('❌ Error en login para búsqueda por nombres:', error.message);
        throw new Error(`Login fallido: ${error.message}`);
      }
      
      // 2. Realizar búsqueda AJAX por nombres
      const searchData = {
        tipo_bus: '2', // Tipo 2 = Nombres
        nombre_busqueda: nombreCompleto || '',
        paterno_busqueda: apellidoPaterno || '',
        materno_busqueda: apellidoMaterno || ''
      };

      console.log(`📤 Enviando datos de búsqueda:`, searchData);
      
      // Verificar que tenemos cookies antes de hacer la búsqueda
      console.log('🍪 Cookies actuales:', this.cookies);
      
      const searchResponse = await this.session.post(`${config.seekerBaseUrl}/index.php?action=validate`, searchData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Requested-With': 'XMLHttpRequest',
          'Referer': config.seekerHomeUrl
        }
      });

      console.log(`📥 Respuesta de búsqueda recibida (${searchResponse.data.length} caracteres)`);
      console.log(`📄 Contenido de respuesta:`, searchResponse.data);
      
      // 3. Parsear resultados
      const resultados = this.parsearResultadosNombres(searchResponse.data);
      
      return {
        success: true,
        message: 'Búsqueda por nombres completada',
        data: {
          busqueda: {
            nombreCompleto: nombreCompleto || '',
            apellidoPaterno: apellidoPaterno || '',
            apellidoMaterno: apellidoMaterno || ''
          },
          resultados: resultados,
          total: resultados.length,
          timestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('❌ Error en búsqueda por nombres:', error.message);
      return {
        success: false,
        message: 'Error en búsqueda por nombres',
        error: error.message,
        data: {
          busqueda: {
            nombreCompleto: nombreCompleto || '',
            apellidoPaterno: apellidoPaterno || '',
            apellidoMaterno: apellidoMaterno || ''
          },
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  /**
   * Buscar por teléfono
   */
  async buscarPorTelefono(telefono) {
    try {
      console.log(`📱 Iniciando búsqueda por teléfono: ${telefono}`);
      
      // 1. Login
      await this.login();
      
      // 2. Realizar búsqueda AJAX por teléfono
      const searchData = {
        tipo_bus: '3', // Tipo 3 = Teléfono
        valor_numero: telefono
      };

      console.log(`📤 Enviando datos de búsqueda:`, searchData);
      
      const searchResponse = await this.session.post(`${config.seekerBaseUrl}/index.php?action=validate`, searchData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Requested-With': 'XMLHttpRequest'
        }
      });

      console.log(`📥 Respuesta de búsqueda recibida (${searchResponse.data.length} caracteres)`);
      
      // 3. Verificar si hay redirección
      let htmlToParse = searchResponse.data;
      let codigoDNI = null;
      if (searchResponse.data.includes('window.location=')) {
        // Extraer el código de la redirección
        const match = searchResponse.data.match(/cod=(\d+)/);
        if (match) {
          codigoDNI = match[1];
          console.log(`🔄 Siguiendo redirección al código: ${codigoDNI}`);
          
          // Hacer GET a la página de mostrar
          const mostrarResponse = await this.session.get(`${config.seekerBaseUrl}/index.php?view=mostrar&cod=${codigoDNI}`);
          htmlToParse = mostrarResponse.data;
          console.log(`📄 HTML de mostrar recibido (${htmlToParse.length} caracteres)`);
        }
      }
      
      // 4. Parsear resultados
      const resultados = this.parsearResultadosTelefono(htmlToParse, codigoDNI);
      
      return {
        success: true,
        message: 'Búsqueda por teléfono completada',
        data: {
          busqueda: {
            telefono: telefono
          },
          resultados: resultados,
          total: resultados.length,
          timestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('❌ Error en búsqueda por teléfono:', error.message);
      return {
        success: false,
        message: 'Error en búsqueda por teléfono',
        error: error.message,
        data: {
          busqueda: {
            telefono: telefono
          },
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  /**
   * Parsear resultados de búsqueda por nombres
   */
  parsearResultadosNombres(html) {
    try {
      const $ = cheerio.load(html);
      const resultados = [];

      // Buscar tabla de resultados (la tabla tiene clase tablabox)
      $('.tablabox tbody tr, table tbody tr').each((i, row) => {
        const $row = $(row);
        const cells = $row.find('td');
        
        if (cells.length >= 6) {
          // La primera celda es la imagen, así que los datos empiezan desde la segunda
          const dni = $(cells[1]).text().trim();
          const nombres = $(cells[2]).text().trim();
          const apellidoMaterno = $(cells[3]).text().trim();
          const apellidoPaterno = $(cells[4]).text().trim();
          const fechaNacimiento = $(cells[5]).text().trim();
          
          if (dni && nombres && dni.length === 8) {
            resultados.push({
              dni: dni,
              nombres: nombres,
              apellidoPaterno: apellidoPaterno,
              apellidoMaterno: apellidoMaterno,
              fechaNacimiento: fechaNacimiento
            });
          }
        }
      });

      console.log(`📊 Encontrados ${resultados.length} resultados por nombres`);
      return resultados;

    } catch (error) {
      console.error('❌ Error parseando resultados de nombres:', error.message);
      return [];
    }
  }

  /**
   * Parsear resultados de búsqueda por teléfono
   */
  parsearResultadosTelefono(html, codigoDNI = null) {
    try {
      const $ = cheerio.load(html);
      const resultados = [];

      // Usar la misma lógica que parseFullResults para extraer datos básicos
      const datos = {
        dni: '',
        nombre: '',
        datosPersonales: {}
      };

      // 1. Extraer nombre y DNI básicos - buscar en múltiples lugares
      const nombreElement = $('.txtinfo h2, h1, h2, .nombre, .title').first();
      if (nombreElement.length > 0) {
        datos.nombre = nombreElement.text().trim();
      }

      // Buscar DNI en los párrafos y otros elementos
      $('.txtinfo p, .txtinfo span, .txtinfo div').each((i, el) => {
        const text = $(el).text().trim();
        if (text.includes('DNI:') || text.includes('Documento:')) {
          datos.dni = text.replace(/DNI:|Documento:/g, '').trim();
        }
      });

      // Si no encontramos el DNI, usar el código pasado como parámetro
      if (!datos.dni && codigoDNI) {
        datos.dni = codigoDNI;
      }

      // 2. Extraer datos personales básicos
      $('.txtinfo p').each((i, el) => {
        const text = $(el).text().trim();
        if (text.includes('Fecha de Nacimiento')) {
          datos.datosPersonales.fechaNacimiento = text.replace('Fecha de Nacimiento:', '').trim();
        } else if (text.includes('Edad')) {
          datos.datosPersonales.edad = text.replace('Edad:', '').trim();
        } else if (text.includes('Sexo')) {
          datos.datosPersonales.sexo = text.replace('Sexo:', '').trim();
        }
      });


      if (datos.nombre && datos.dni) {
        resultados.push({
          dni: datos.dni,
          nombre: datos.nombre,
          datosPersonales: datos.datosPersonales
        });
      }

      console.log(`📊 Encontrados ${resultados.length} resultados por teléfono`);
      return resultados;

    } catch (error) {
      console.error('❌ Error parseando resultados de teléfono:', error.message);
      return [];
    }
  }
}

module.exports = new SeekerAdvanced();

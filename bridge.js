/**
 * PUENTE SIMPLE - Login -> Buscar -> Extraer datos
 */

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const CacheService = require('./services/cacheService');
const NameService = require('./services/nameService');

// Configuración por variables de entorno
const BASE_URL = process.env.BASE_URL || 'https://seeker.lat';
const SEEKER_USER = process.env.SEEKER_USER || 'NmsK12';
const SEEKER_PASS = process.env.SEEKER_PASS || '6PEWxyISpy';
const REQUEST_TIMEOUT_MS = Number.parseInt(process.env.REQUEST_TIMEOUT_MS || '30000', 10);

class Bridge {
  constructor() {
    this.session = axios.create({
      timeout: REQUEST_TIMEOUT_MS,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    this.cookie = null;
    this.baseUrl = BASE_URL;
    this._cachedDefaultPhotoDataUrl = null;
    this.cacheService = new CacheService();
  }

  getDefaultPhotoDataUrl() {
    if (this._cachedDefaultPhotoDataUrl) {
      return this._cachedDefaultPhotoDataUrl;
    }
    try {
      const imgPath = path.join(__dirname, 'ft_no_disponible.jpg');
      const file = fs.readFileSync(imgPath);
      const b64 = file.toString('base64');
      this._cachedDefaultPhotoDataUrl = `data:image/jpeg;base64,${b64}`;
      return this._cachedDefaultPhotoDataUrl;
    } catch (e) {
      console.error('⚠️ No se pudo leer ft_no_disponible.jpg:', e.message);
      return null;
    }
  }

  /**
   * Procesa los datos separando el nombre en nombres y apellidos
   * @param {object} datos - Los datos originales
   * @returns {object} - Los datos procesados con nombres separados
   */
  procesarDatosConNombresSeparados(datos) {
    if (!datos || !datos.nombre) {
      return datos;
    }

    const { nombres, apellidos } = NameService.separarNombre(datos.nombre);
    
    // Procesar correos - mensaje personalizado si está vacío o es email@protected
    let correosProcesados = datos.correos || [];
    
    // Filtrar correos no válidos
    correosProcesados = correosProcesados.filter(correo => 
      correo.correo && 
      correo.correo !== '[email protected]' && 
      correo.correo !== 'email@protected'
    );
    
    // Si no hay correos válidos, mostrar mensaje personalizado
    if (correosProcesados.length === 0) {
      correosProcesados = [{
        correo: "No se encontró email para este DNI",
        fecha: "N/A",
        fuente: "Sistema"
      }];
    }
    
    // Procesar riesgo - mensaje personalizado si está vacío
    let riesgoProcesado = datos.riesgo || [];
    if (riesgoProcesado.length === 0) {
      riesgoProcesado = [{
        entidad: "No cuenta con ningún riesgo este DNI",
        descripcion: "Sin registros de riesgo crediticio",
        moneda: "N/A",
        saldo: "N/A",
        clasificacion: "Sin riesgo"
      }];
    }
    
    return {
      ...datos,
      nombres: nombres,
      apellidos: apellidos,
      correos: correosProcesados,
      riesgo: riesgoProcesado
    };
  }

  async login() {
    try {
      console.log('🔐 Iniciando sesión...');
      
      // 1. Obtener página de login
      const loginPage = await this.session.get(`${this.baseUrl}/index.php?view=login`);
      const $ = cheerio.load(loginPage.data);
      
      // 2. Encontrar el formulario
      const form = $('form').first();
      const action = form.attr('action') || '';
      const actionUrl = action.startsWith('http') ? action : `${this.baseUrl}/` + action.replace(/^\//, '');
      
      // 3. Preparar datos del formulario
      const formData = {
        usuario: SEEKER_USER,
        contrasena: SEEKER_PASS
      };
      
      console.log('📤 Enviando credenciales...');
      
      // 4. Hacer login
      const loginResponse = await this.session.post(actionUrl, formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Referer': `${this.baseUrl}/index.php?view=login`,
          'Origin': this.baseUrl
        }
      });
      
      // 5. Extraer cookie
      const setCookie = loginResponse.headers['set-cookie'];
      if (setCookie) {
        setCookie.forEach(cookie => {
          const [nameValue] = cookie.split(';');
          const [name, value] = nameValue.split('=');
          if (name && value && name.trim() === 'PHPSESSID') {
            this.cookie = `PHPSESSID=${value.trim()}`;
            console.log(`🍪 Cookie obtenida: ${this.cookie}`);
          }
        });
      }
      
      // 6. Verificar login
      const homeResponse = await this.session.get(`${this.baseUrl}/index.php?view=home`, {
        headers: {
          'Cookie': this.cookie,
          'Referer': `${this.baseUrl}/index.php?view=login`
        }
      });
      
      const homeHtml = homeResponse.data;
      console.log('📄 Página home (primeros 1000 chars):', homeHtml.substring(0, 1000));
      
      if (homeHtml.includes('Usuario de búsqueda básica') || homeHtml.includes('NMSK12')) {
        console.log('✅ Login exitoso');
        return true;
      } else {
        console.log('❌ Login fallido');
        return false;
      }
      
    } catch (error) {
      console.error('❌ Error en login:', error.message);
      return false;
    }
  }

  async buscarDNI(dni) {
    try {
      console.log(`🔍 Buscando DNI: ${dni}`);
      
      // 1. Verificar caché primero
      const cacheKey = this.cacheService.getCacheKey(dni);
      const cachedData = this.cacheService.getFromCache(cacheKey);
      
      if (cachedData) {
        console.log(`⚡ Datos obtenidos del caché para DNI: ${dni}`);
        return {
          success: true,
          message: 'Consulta exitosa (desde caché)',
          data: this.procesarDatosConNombresSeparados(cachedData.data),
          from_cache: true
        };
      }
      
      // 2. Hacer login si no hay cookie
      if (!this.cookie) {
        const loginOk = await this.login();
        if (!loginOk) {
          return { success: false, message: 'No se pudo hacer login' };
        }
      }
      
      // 2. Ir a la página de home
      const homeResponse = await this.session.get(`${this.baseUrl}/index.php?view=home`, {
        headers: {
          'Cookie': this.cookie,
          'Referer': `${this.baseUrl}/index.php?view=home`
        }
      });
      
      console.log('📄 Página home obtenida');
      
      // 3. Hacer búsqueda por DNI usando el formulario
      const searchData = {
        tipo_bus: '1', // DNI
        valor_buscado: dni
      };
      
      console.log('📤 Datos de búsqueda:', searchData);
      
      // 4. Hacer búsqueda AJAX
      const searchResponse = await this.session.post(`${this.baseUrl}/index.php?action=validate`, searchData, {
        headers: {
          'Cookie': this.cookie,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Referer': `${this.baseUrl}/index.php?view=home`,
          'Origin': this.baseUrl,
          'X-Requested-With': 'XMLHttpRequest'
        }
      });
      
      console.log('📥 Respuesta de búsqueda recibida');
      const html = searchResponse.data;
      
      // Debug: mostrar respuesta AJAX
      console.log('📄 Respuesta AJAX (primeros 1000 chars):', html.substring(0, 1000));
      
      // 5. Verificar si hay resultados
      if (html.includes('No se encontró ningun resultado')) {
        return { success: false, message: 'No se encontraron resultados' };
      }
      
      // Verificar si hay redirección
      if (html.includes('window.location.href')) {
        console.log('🔄 Redirección detectada en respuesta AJAX');
        // Extraer URL de redirección
        const match = html.match(/window\.location\.href\s*=\s*["']([^"']+)["']/);
        if (match) {
          let redirectUrl = match[1];
          console.log('🔗 URL de redirección:', redirectUrl);
          
          // Asegurar que la URL sea absoluta
          if (redirectUrl.startsWith('./')) {
            redirectUrl = `${this.baseUrl}/` + redirectUrl.substring(2);
          } else if (redirectUrl.startsWith('/')) {
            redirectUrl = this.baseUrl + redirectUrl;
          } else if (!redirectUrl.startsWith('http')) {
            redirectUrl = `${this.baseUrl}/` + redirectUrl;
          }
          
          // Si redirige a login, la sesión expiró - hacer re-login
          if (redirectUrl.includes('view=login')) {
            console.log('⚠️ Sesión expirada, haciendo re-login...');
            this.cookie = null; // Limpiar cookie expirada
            await this.login();
            
            // Reintentar la búsqueda después del re-login
            console.log('🔄 Reintentando búsqueda después del re-login...');
            return await this.buscarDNI(dni);
          }
          
          console.log('🔗 URL corregida:', redirectUrl);
          
          // Ir a la página de resultados
          const resultResponse = await this.session.get(redirectUrl, {
            headers: {
              'Cookie': this.cookie,
              'Referer': `${this.baseUrl}/index.php?view=home`
            }
          });
          
          console.log('📥 Página de resultados obtenida');
          const resultHtml = resultResponse.data;
          
          // Extraer datos de la página de resultados
          const $ = cheerio.load(resultHtml);
          const nombre = $('h2.name').text().trim();
          const dniEncontrado = $('p.dni').text().trim();
          
          console.log('👤 Nombre:', nombre);
          console.log('🆔 DNI:', dniEncontrado);
          
          if (!nombre || nombre === '') {
            return { success: false, message: 'No se encontraron resultados' };
          }
          
          // Extraer datos personales
          const datos = {};
          $('.txtinfo p').each((i, element) => {
            const $p = $(element);
            const texto = $p.text().trim();
            const partes = texto.split(':');
            if (partes.length >= 2) {
              const clave = partes[0].trim();
              const valor = partes[1].trim();
              datos[clave] = valor;
            }
          });
          
          // Extraer foto
          let foto = null;
          const $img = $('.fotoperfil img');
          if ($img.length > 0) {
            const src = $img.attr('src');
            if (src && src.startsWith('data:image/')) {
              foto = src;
            }
          }
          if (!foto) {
            foto = this.getDefaultPhotoDataUrl();
          }
          
          // Extraer tablas adicionales
          const telefonos = [];
          $('#telefonos table tbody tr').each((i, row) => {
            const c = $(row).find('td');
            if (c.length >= 4) {
              telefonos.push({
                telefono: $(c[0]).text().trim(),
                operador: $(c[1]).text().trim(),
                periodo: $(c[2]).text().trim(),
                email: $(c[3]).text().trim()
              });
            }
          });
          
          const riesgo = [];
          $('#creditos table tbody tr').each((i, row) => {
            const c = $(row).find('td');
            if (c.length >= 5) {
              riesgo.push({
                entidad: $(c[0]).text().trim(),
                descripcion: $(c[1]).text().trim(),
                moneda: $(c[2]).text().trim(),
                saldo: $(c[3]).text().trim(),
                clasificacion: $(c[4]).text().trim()
              });
            }
          });
          
          const arbol = [];
          $('#arbol table tbody tr').each((i, row) => {
            const c = $(row).find('td');
            if (c.length >= 8) {
              arbol.push({
                dni: $(c[0]).text().trim(),
                apellidoPaterno: $(c[1]).text().trim(),
                apellidoMaterno: $(c[2]).text().trim(),
                nombres: $(c[3]).text().trim(),
                edad: $(c[4]).text().trim(),
                sexo: $(c[5]).text().trim(),
                tipo: $(c[6]).text().trim(),
                ubigeo: $(c[7]).text().trim()
              });
            }
          });
          
          const correos = [];
          $('#correos table tbody tr').each((i, row) => {
            const c = $(row).find('td');
            if (c.length >= 3) {
              correos.push({
                correo: $(c[0]).text().trim(),
                fecha: $(c[1]).text().trim(),
                fuente: $(c[2]).text().trim()
              });
            }
          });
          
          const datosCompletos = {
            dni: dniEncontrado || dni,
            nombre: nombre,
            datos: datos,
            foto: foto,
            telefonos: telefonos,
            riesgo: riesgo,
            arbol: arbol,
            correos: correos
          };

          // Guardar en caché
          this.cacheService.saveToCache(cacheKey, { data: datosCompletos });

          return {
            success: true,
            message: 'Consulta exitosa',
            data: this.procesarDatosConNombresSeparados(datosCompletos),
            from_cache: false
          };
        }
      }
      
      // 6. Extraer datos
      const $ = cheerio.load(html);
      
      // Buscar nombre
      const nombre = $('h2.name').text().trim();
      const dniEncontrado = $('p.dni').text().trim();
      
      console.log('👤 Nombre:', nombre);
      console.log('🆔 DNI:', dniEncontrado);
      
      if (!nombre || nombre === '') {
        return { success: false, message: 'No se encontraron resultados' };
      }
      
      // Extraer datos personales
      const datos = {};
      $('.txtinfo p').each((i, element) => {
        const $p = $(element);
        const texto = $p.text().trim();
        const partes = texto.split(':');
        if (partes.length >= 2) {
          const clave = partes[0].trim();
          const valor = partes[1].trim();
          datos[clave] = valor;
        }
      });
      
      // Extraer foto
      let foto = null;
      const $img = $('.fotoperfil img');
      if ($img.length > 0) {
        const src = $img.attr('src');
        if (src && src.startsWith('data:image/')) {
          foto = src;
        }
      }
      if (!foto) {
        foto = this.getDefaultPhotoDataUrl();
      }
      
      // Extraer tablas adicionales
      const telefonos = [];
      $('#telefonos table tbody tr').each((i, row) => {
        const c = $(row).find('td');
        if (c.length >= 4) {
          telefonos.push({
            telefono: $(c[0]).text().trim(),
            operador: $(c[1]).text().trim(),
            periodo: $(c[2]).text().trim(),
            email: $(c[3]).text().trim()
          });
        }
      });
      
      const riesgo = [];
      $('#creditos table tbody tr').each((i, row) => {
        const c = $(row).find('td');
        if (c.length >= 5) {
          riesgo.push({
            entidad: $(c[0]).text().trim(),
            descripcion: $(c[1]).text().trim(),
            moneda: $(c[2]).text().trim(),
            saldo: $(c[3]).text().trim(),
            clasificacion: $(c[4]).text().trim()
          });
        }
      });
      
      const arbol = [];
      $('#arbol table tbody tr').each((i, row) => {
        const c = $(row).find('td');
        if (c.length >= 8) {
          arbol.push({
            dni: $(c[0]).text().trim(),
            apellidoPaterno: $(c[1]).text().trim(),
            apellidoMaterno: $(c[2]).text().trim(),
            nombres: $(c[3]).text().trim(),
            edad: $(c[4]).text().trim(),
            sexo: $(c[5]).text().trim(),
            tipo: $(c[6]).text().trim(),
            ubigeo: $(c[7]).text().trim()
          });
        }
      });
      
      const correos = [];
      $('#correos table tbody tr').each((i, row) => {
        const c = $(row).find('td');
        if (c.length >= 3) {
          correos.push({
            correo: $(c[0]).text().trim(),
            fecha: $(c[1]).text().trim(),
            fuente: $(c[2]).text().trim()
          });
        }
      });
      
      const datosCompletos = {
        dni: dniEncontrado || dni,
        nombre: nombre,
        datos: datos,
        foto: foto,
        telefonos: telefonos,
        riesgo: riesgo,
        arbol: arbol,
        correos: correos
      };

      // Guardar en caché
      this.cacheService.saveToCache(cacheKey, { data: datosCompletos });

      return {
        success: true,
        message: 'Consulta exitosa',
        data: this.procesarDatosConNombresSeparados(datosCompletos),
        from_cache: false
      };
      
    } catch (error) {
      console.error('❌ Error buscando DNI:', error.message);
      console.error('❌ Error completo:', error);
      return { success: false, message: 'Error en búsqueda', error: error.message };
    }
  }

  async buscarNombres(nombres) {
    try {
      console.log(`🔍 Buscando nombres: ${nombres}`);
      
      // 1. Hacer login si no hay cookie
      if (!this.cookie) {
        const loginOk = await this.login();
        if (!loginOk) {
          return { success: false, message: 'No se pudo hacer login' };
        }
      }
      
      // 2. Ir a la página de home
      const homeResponse = await this.session.get('https://seeker.lat/index.php?view=home', {
        headers: {
          'Cookie': this.cookie,
          'Referer': 'https://seeker.lat/index.php?view=home'
        }
      });
      
      console.log('📄 Página home obtenida');
      
      // 3. Dividir nombres
      const partes = nombres.split('-');
      const searchData = {
        tipo_bus: '2',
        nombre_busqueda: partes[0] || '',
        paterno_busqueda: partes[1] || '',
        materno_busqueda: partes[2] || ''
      };
      
      console.log('📤 Datos de búsqueda:', searchData);
      
      // 4. Hacer búsqueda AJAX
      const searchResponse = await this.session.post('https://seeker.lat/index.php?action=validate', searchData, {
        headers: {
          'Cookie': this.cookie,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Referer': 'https://seeker.lat/index.php?view=home',
          'Origin': 'https://seeker.lat',
          'X-Requested-With': 'XMLHttpRequest'
        }
      });
      
      console.log('📥 Respuesta de búsqueda recibida');
      const html = searchResponse.data;
      
      // 5. Extraer resultados
      const $ = cheerio.load(html);
      const resultados = [];
      
      $('table.tablabox tbody tr').each((i, row) => {
        const $row = $(row);
        const cells = $row.find('td');
        
        if (cells.length >= 6) {
          const foto = $(cells[0]).find('img').attr('src') || '';
          const dni = $(cells[1]).text().trim();
          const nombresCompletos = $(cells[2]).text().trim();
          const apellidoMaterno = $(cells[3]).text().trim();
          const apellidoPaterno = $(cells[4]).text().trim();
          const fechaNacimiento = $(cells[5]).text().trim();
          
          if (dni && nombresCompletos) {
            resultados.push({
              dni: dni,
              nombres: nombresCompletos,
              apellidoMaterno: apellidoMaterno,
              apellidoPaterno: apellidoPaterno,
              fechaNacimiento: fechaNacimiento,
              foto: foto
            });
          }
        }
      });
      
      console.log(`📋 ${resultados.length} resultados encontrados`);
      
      return {
        success: true,
        message: 'Búsqueda exitosa',
        data: {
          nombres: nombres,
          resultados: resultados,
          total: resultados.length
        }
      };
      
    } catch (error) {
      console.error('❌ Error buscando nombres:', error.message);
      return { success: false, message: 'Error en búsqueda', error: error.message };
    }
  }

  /**
   * Buscar por teléfono usando caché inteligente
   * @param {string} telefono - El teléfono a buscar
   * @returns {object} - Resultado de la búsqueda
   */
  async buscarPorTelefono(telefono) {
    try {
      console.log(`📱 Buscando por teléfono: ${telefono}`);
      
      // 1. Buscar en caché primero
      const resultadosTelefono = this.cacheService.searchByPhoneMultiple(telefono);
      
      if (resultadosTelefono.length > 0) {
        console.log(`⚡ Teléfono encontrado en caché: ${telefono} - ${resultadosTelefono.length} resultados`);
        
        const datosProcesados = resultadosTelefono.map(resultado => {
          const datos = this.procesarDatosConNombresSeparados(resultado.data);
          // Agregar DNI a cada teléfono
          if (datos.telefonos && datos.telefonos.length > 0) {
            datos.telefonos = datos.telefonos.map(tel => ({
              ...tel,
              dni: datos.dni
            }));
          }
          return datos;
        });

        return {
          success: true,
          message: 'Consulta exitosa (desde caché)',
          data: datosProcesados.length === 1 ? datosProcesados[0] : datosProcesados,
          from_cache: true,
          search_type: 'telefono',
          search_value: telefono,
          total_results: datosProcesados.length
        };
      }
      
      // 2. Si no está en caché, buscar por nombres relacionados
      const resultadosRelacionados = this.cacheService.searchByName(telefono);
      
      if (resultadosRelacionados.length > 0) {
        console.log(`🔍 ${resultadosRelacionados.length} resultados relacionados encontrados en caché`);
        return {
          success: true,
          message: 'Resultados relacionados encontrados en caché',
          data: resultadosRelacionados.map(resultado => 
            this.procesarDatosConNombresSeparados(resultado.data)
          ),
          from_cache: true,
          search_type: 'telefono',
          search_value: telefono,
          related_results: true
        };
      }
      
      return {
        success: false,
        message: 'Teléfono no encontrado en caché. Use búsqueda por DNI para obtener datos completos.',
        search_type: 'telefono',
        search_value: telefono
      };
      
    } catch (error) {
      console.error('❌ Error buscando por teléfono:', error.message);
      return { success: false, message: 'Error en búsqueda por teléfono', error: error.message };
    }
  }

  /**
   * Buscar por nombre usando caché inteligente
   * @param {string} nombres - Los nombres a buscar
   * @returns {object} - Resultado de la búsqueda
   */
  async buscarPorNombre(nombres) {
    try {
      console.log(`👤 Buscando por nombre: ${nombres}`);
      
      // 1. Buscar en caché primero
      const resultadosCaché = this.cacheService.searchByName(nombres);
      
      if (resultadosCaché.length > 0) {
        console.log(`⚡ ${resultadosCaché.length} resultados encontrados en caché`);
        return {
          success: true,
          message: 'Consulta exitosa (desde caché)',
          data: resultadosCaché.map(resultado => 
            this.procesarDatosConNombresSeparados(resultado.data)
          ),
          from_cache: true,
          search_type: 'nombre',
          search_value: nombres,
          total: resultadosCaché.length
        };
      }
      
      // 2. Si no está en caché, hacer búsqueda normal
      return await this.buscarNombres(nombres);
      
    } catch (error) {
      console.error('❌ Error buscando por nombre:', error.message);
      return { success: false, message: 'Error en búsqueda por nombre', error: error.message };
    }
  }

  /**
   * Obtener estadísticas del caché
   * @returns {object} - Estadísticas del caché
   */
  getCacheStats() {
    return this.cacheService.getCacheStats();
  }

}

module.exports = Bridge;

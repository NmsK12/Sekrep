/**
 * PUENTE SIMPLE - Login -> Buscar -> Extraer datos
 */

const axios = require('axios');
const cheerio = require('cheerio');

class Bridge {
  constructor() {
    this.session = axios.create({
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    this.cookie = null;
  }

  async login() {
    try {
      console.log('🔐 Iniciando sesión...');
      
      // 1. Obtener página de login
      const loginPage = await this.session.get('https://seeker.lat/index.php?view=login');
      const $ = cheerio.load(loginPage.data);
      
      // 2. Encontrar el formulario
      const form = $('form').first();
      const action = form.attr('action') || '';
      const actionUrl = action.startsWith('http') ? action : 'https://seeker.lat/' + action.replace(/^\//, '');
      
      // 3. Preparar datos del formulario
      const formData = {
        usuario: 'NmsK12',
        contrasena: '6PEWxyISpy'
      };
      
      console.log('📤 Enviando credenciales...');
      
      // 4. Hacer login
      const loginResponse = await this.session.post(actionUrl, formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Referer': 'https://seeker.lat/index.php?view=login',
          'Origin': 'https://seeker.lat'
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
      const homeResponse = await this.session.get('https://seeker.lat/index.php?view=home', {
        headers: {
          'Cookie': this.cookie,
          'Referer': 'https://seeker.lat/index.php?view=login'
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
      
      // 3. Hacer búsqueda por DNI usando el formulario
      const searchData = {
        tipo_bus: '1', // DNI
        valor_buscado: dni
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
            redirectUrl = 'https://seeker.lat/' + redirectUrl.substring(2);
          } else if (redirectUrl.startsWith('/')) {
            redirectUrl = 'https://seeker.lat' + redirectUrl;
          } else if (!redirectUrl.startsWith('http')) {
            redirectUrl = 'https://seeker.lat/' + redirectUrl;
          }
          
          console.log('🔗 URL corregida:', redirectUrl);
          
          // Ir a la página de resultados
          const resultResponse = await this.session.get(redirectUrl, {
            headers: {
              'Cookie': this.cookie,
              'Referer': 'https://seeker.lat/index.php?view=home'
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
          
          return {
            success: true,
            message: 'Consulta exitosa',
            data: {
              dni: dniEncontrado || dni,
              nombre: nombre,
              datos: datos,
              foto: foto,
              telefonos: telefonos,
              riesgo: riesgo,
              arbol: arbol,
              correos: correos
            }
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
      
      return {
        success: true,
        message: 'Consulta exitosa',
        data: {
          dni: dniEncontrado || dni,
          nombre: nombre,
          datos: datos,
          foto: foto,
          telefonos: telefonos,
          riesgo: riesgo,
          arbol: arbol,
          correos: correos
        }
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
}

module.exports = Bridge;

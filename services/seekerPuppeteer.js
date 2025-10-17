/**
 * Servicio de búsqueda usando Puppeteer (navegador real)
 * Imposible de detectar como bot
 */

const puppeteer = require('puppeteer');
const config = require('../config');

class SeekerPuppeteer {
  constructor() {
    this.browser = null;
    this.page = null;
    this.isLoggedIn = false;
  }

  async init() {
    try {
      console.log('🚀 Iniciando navegador...');
      this.browser = await puppeteer.launch({
        headless: true, // Cambiar a false para debug
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      });

      this.page = await this.browser.newPage();
      
      // Configurar User-Agent realista
      await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      // Configurar viewport
      await this.page.setViewport({ width: 1366, height: 768 });
      
      console.log('✅ Navegador iniciado correctamente');
      return true;
    } catch (error) {
      console.error('❌ Error iniciando navegador:', error.message);
      throw error;
    }
  }

  async login() {
    try {
      console.log('🔐 Login con navegador real...');
      
      // Ir a la página de login
      await this.page.goto(config.seekerLoginUrl, { waitUntil: 'networkidle2' });
      
      // Esperar a que cargue el formulario
      await this.page.waitForSelector('form', { timeout: 10000 });
      
      // Llenar el formulario - probar diferentes selectores
      await this.page.type('input[name="usuario"]', config.seekerUser);
      
      // Probar diferentes selectores para el campo de contraseña
      const passwordSelectors = [
        'input[name="password"]',
        'input[name="contrasena"]',
        'input[type="password"]',
        'input[name="pass"]'
      ];
      
      let passwordField = null;
      for (const selector of passwordSelectors) {
        try {
          passwordField = await this.page.$(selector);
          if (passwordField) {
            console.log(`🔍 Campo de contraseña encontrado con selector: ${selector}`);
            break;
          }
        } catch (e) {
          // Continuar con el siguiente selector
        }
      }
      
      if (!passwordField) {
        // Si no encontramos el campo, listar todos los inputs disponibles
        const inputs = await this.page.$$eval('input', inputs => 
          inputs.map(input => ({
            name: input.name,
            type: input.type,
            id: input.id,
            placeholder: input.placeholder
          }))
        );
        console.log('📋 Inputs disponibles:', inputs);
        throw new Error('No se encontró el campo de contraseña');
      }
      
      await this.page.type('input[type="password"]', config.seekerPassword);
      
      // Hacer clic en el botón de login - probar diferentes selectores
      const submitSelectors = [
        'input[type="submit"]',
        'button[type="submit"]',
        'button:contains("Login")',
        'button:contains("Entrar")',
        'input[value*="Login"]',
        'input[value*="Entrar"]',
        'button',
        'input[type="button"]'
      ];
      
      let submitButton = null;
      for (const selector of submitSelectors) {
        try {
          submitButton = await this.page.$(selector);
          if (submitButton) {
            console.log(`🔍 Botón de submit encontrado con selector: ${selector}`);
            break;
          }
        } catch (e) {
          // Continuar con el siguiente selector
        }
      }
      
      if (!submitButton) {
        // Si no encontramos el botón, listar todos los botones disponibles
        const buttons = await this.page.$$eval('button, input[type="submit"], input[type="button"]', buttons => 
          buttons.map(button => ({
            type: button.type,
            value: button.value,
            text: button.textContent,
            id: button.id,
            className: button.className
          }))
        );
        console.log('📋 Botones disponibles:', buttons);
        throw new Error('No se encontró el botón de submit');
      }
      
      await this.page.click('input[type="submit"], button[type="submit"], button');
      
      // Esperar a que navegue
      await this.page.waitForNavigation({ waitUntil: 'networkidle2' });
      
      // Verificar si el login fue exitoso
      const currentUrl = this.page.url();
      const pageContent = await this.page.content();
      
      if (pageContent.includes('Usuario de búsqueda básica') || 
          pageContent.includes('NMSK12') ||
          currentUrl.includes('home')) {
        this.isLoggedIn = true;
        console.log('✅ Login exitoso con navegador');
        return true;
      } else {
        console.log('❌ Login fallido');
        throw new Error('Login fallido');
      }
      
    } catch (error) {
      console.error('❌ Error en login:', error.message);
      throw error;
    }
  }

  async consultarDNI(dni) {
    try {
      console.log(`🔍 Consultando DNI con navegador: ${dni}`);
      
      if (!this.isLoggedIn) {
        await this.login();
      }
      
      // Ir a la página de home
      await this.page.goto(config.seekerHomeUrl, { waitUntil: 'networkidle2' });
      
      // Llenar el campo DNI
      await this.page.type('input[name="valor_buscado"]', dni);
      
      // Hacer clic en buscar
      await this.page.click('input[type="submit"], button[type="submit"]');
      
      // Esperar a que cargue la respuesta
      await this.page.waitForTimeout(2000);
      
      // Obtener el contenido de la página
      const pageContent = await this.page.content();
      
      // Verificar si hay resultados
      if (pageContent.includes('No se encontró') || pageContent.includes('error')) {
        return {
          success: false,
          message: 'No se encontraron resultados',
          data: { dni, timestamp: new Date().toISOString() }
        };
      }
      
      // Extraer datos usando cheerio
      const cheerio = require('cheerio');
      const $ = cheerio.load(pageContent);
      
      // Extraer datos básicos
      const nombre = $('p:contains("Nombre:")').next().text().trim() || 
                    $('span:contains("Nombre:")').next().text().trim() ||
                    $('td:contains("Nombre:")').next().text().trim();
      
      const apellidos = $('p:contains("Apellidos:")').next().text().trim() || 
                       $('span:contains("Apellidos:")').next().text().trim() ||
                       $('td:contains("Apellidos:")').next().text().trim();
      
      // Extraer foto si existe
      let foto = null;
      const fotoElement = $('img[src*="data:image"], img[src*="foto"]').first();
      if (fotoElement.length) {
        foto = fotoElement.attr('src');
      }
      
      return {
        success: true,
        message: 'Consulta exitosa con navegador',
        data: {
          dni: dni,
          nombre: nombre,
          apellidos: apellidos,
          foto: foto,
          timestamp: new Date().toISOString()
        }
      };
      
    } catch (error) {
      console.error('❌ Error en consulta DNI:', error.message);
      return {
        success: false,
        message: 'Error en consulta',
        error: error.message,
        data: { dni, timestamp: new Date().toISOString() }
      };
    }
  }

  async buscarPorNombres(nombreCompleto, apellidoPaterno, apellidoMaterno) {
    try {
      console.log(`🔍 Buscando por nombres con navegador: ${nombreCompleto} ${apellidoPaterno} ${apellidoMaterno}`);
      
      if (!this.isLoggedIn) {
        await this.login();
      }
      
      // Ir a la página de home
      await this.page.goto(config.seekerHomeUrl, { waitUntil: 'networkidle2' });
      
      // Cambiar a búsqueda por nombres
      await this.page.select('select[name="tipo_bus"]', '2');
      
      // Esperar a que aparezcan los campos de nombres
      await this.page.waitForTimeout(1000);
      
      // Llenar los campos
      if (nombreCompleto) {
        await this.page.type('input[name="nombre_busqueda"]', nombreCompleto);
      }
      if (apellidoPaterno) {
        await this.page.type('input[name="paterno_busqueda"]', apellidoPaterno);
      }
      if (apellidoMaterno) {
        await this.page.type('input[name="materno_busqueda"]', apellidoMaterno);
      }
      
      // Hacer clic en buscar
      await this.page.click('input[type="submit"], button[type="submit"]');
      
      // Esperar a que cargue la respuesta
      await this.page.waitForTimeout(2000);
      
      // Obtener el contenido de la página
      const pageContent = await this.page.content();
      
      // Verificar si hay resultados
      if (pageContent.includes('No se encontró') || pageContent.includes('error')) {
        return {
          success: false,
          message: 'No se encontraron resultados',
          data: { 
            busqueda: { nombreCompleto, apellidoPaterno, apellidoMaterno },
            resultados: [],
            total: 0,
            timestamp: new Date().toISOString() 
          }
        };
      }
      
      // Extraer resultados de la tabla
      const cheerio = require('cheerio');
      const $ = cheerio.load(pageContent);
      const resultados = [];
      
      $('.tablabox tbody tr, table tbody tr').each((i, row) => {
        const $row = $(row);
        const cells = $row.find('td');
        
        if (cells.length >= 6) {
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
      
      return {
        success: true,
        message: 'Búsqueda por nombres exitosa con navegador',
        data: {
          busqueda: { nombreCompleto, apellidoPaterno, apellidoMaterno },
          resultados: resultados,
          total: resultados.length,
          timestamp: new Date().toISOString()
        }
      };
      
    } catch (error) {
      console.error('❌ Error en búsqueda por nombres:', error.message);
      return {
        success: false,
        message: 'Error en búsqueda',
        error: error.message,
        data: { 
          busqueda: { nombreCompleto, apellidoPaterno, apellidoMaterno },
          timestamp: new Date().toISOString() 
        }
      };
    }
  }

  async buscarPorTelefono(telefono) {
    try {
      console.log(`📱 Buscando por teléfono con navegador: ${telefono}`);
      
      if (!this.isLoggedIn) {
        await this.login();
      }
      
      // Ir a la página de home
      await this.page.goto(config.seekerHomeUrl, { waitUntil: 'networkidle2' });
      
      // Cambiar a búsqueda por teléfono
      await this.page.select('select[name="tipo_bus"]', '3');
      
      // Esperar a que aparezca el campo de teléfono
      await this.page.waitForTimeout(1000);
      
      // Llenar el campo de teléfono
      await this.page.type('input[name="valor_numero"]', telefono);
      
      // Hacer clic en buscar
      await this.page.click('input[type="submit"], button[type="submit"]');
      
      // Esperar a que cargue la respuesta
      await this.page.waitForTimeout(2000);
      
      // Obtener el contenido de la página
      const pageContent = await this.page.content();
      
      // Verificar si hay resultados
      if (pageContent.includes('No se encontró') || pageContent.includes('error')) {
        return {
          success: false,
          message: 'No se encontraron resultados',
          data: { telefono, timestamp: new Date().toISOString() }
        };
      }
      
      // Extraer datos básicos
      const cheerio = require('cheerio');
      const $ = cheerio.load(pageContent);
      
      const nombre = $('p:contains("Nombre:")').next().text().trim() || 
                    $('span:contains("Nombre:")').next().text().trim() ||
                    $('td:contains("Nombre:")').next().text().trim();
      
      const dni = $('p:contains("DNI:")').next().text().trim() || 
                 $('span:contains("DNI:")').next().text().trim() ||
                 $('td:contains("DNI:")').next().text().trim();
      
      return {
        success: true,
        message: 'Búsqueda por teléfono exitosa con navegador',
        data: {
          telefono: telefono,
          nombre: nombre,
          dni: dni,
          timestamp: new Date().toISOString()
        }
      };
      
    } catch (error) {
      console.error('❌ Error en búsqueda por teléfono:', error.message);
      return {
        success: false,
        message: 'Error en búsqueda',
        error: error.message,
        data: { telefono, timestamp: new Date().toISOString() }
      };
    }
  }

  async close() {
    try {
      if (this.browser) {
        await this.browser.close();
        console.log('🔒 Navegador cerrado');
      }
    } catch (error) {
      console.error('❌ Error cerrando navegador:', error.message);
    }
  }
}

module.exports = SeekerPuppeteer;

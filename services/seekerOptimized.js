/**
 * Servicio optimizado de Seeker con pool de sesiones y caché
 */

const cheerio = require('cheerio');
const config = require('../config');
const sessionPool = require('./sessionPool');
const cacheService = require('./cacheService');

class SeekerOptimized {
  constructor() {
    this.requestQueue = [];
    this.isProcessing = false;
  }

  /**
   * Consultar DNI con optimizaciones
   */
  async consultarDNI(dni) {
    try {
      // 1. Verificar caché primero
      const cached = cacheService.get('dni', { dni });
      if (cached) {
        return {
          ...cached,
          cached: true,
          timestamp: new Date().toISOString()
        };
      }

      // 2. Obtener sesión del pool
      const sessionData = sessionPool.getAvailableSession();
      if (!sessionData) {
        throw new Error('No hay sesiones disponibles en el pool');
      }

      console.log(`🔍 Usando sesión ${sessionData.index + 1} para DNI: ${dni}`);

      // 3. Realizar consulta
      const resultado = await this.performDNIQuery(dni, sessionData);
      
      // 4. Guardar en caché
      cacheService.set('dni', { dni }, resultado, cacheService.getTTL('dni'));
      
      return resultado;

    } catch (error) {
      console.error('❌ Error en consulta DNI optimizada:', error.message);
      throw error;
    }
  }

  /**
   * Buscar por nombres con optimizaciones
   */
  async buscarPorNombres(nombreCompleto, apellidoPaterno, apellidoMaterno) {
    try {
      const params = { nombreCompleto, apellidoPaterno, apellidoMaterno };
      
      // 1. Verificar caché
      const cached = cacheService.get('nombres', params);
      if (cached) {
        return {
          ...cached,
          cached: true,
          timestamp: new Date().toISOString()
        };
      }

      // 2. Obtener sesión del pool
      const sessionData = sessionPool.getAvailableSession();
      if (!sessionData) {
        throw new Error('No hay sesiones disponibles en el pool');
      }

      console.log(`🔍 Usando sesión ${sessionData.index + 1} para nombres: ${nombreCompleto} ${apellidoPaterno}`);

      // 3. Realizar búsqueda
      const resultado = await this.performNamesQuery(nombreCompleto, apellidoPaterno, apellidoMaterno, sessionData);
      
      // 4. Guardar en caché
      cacheService.set('nombres', params, resultado, cacheService.getTTL('nombres'));
      
      return resultado;

    } catch (error) {
      console.error('❌ Error en búsqueda nombres optimizada:', error.message);
      throw error;
    }
  }

  /**
   * Buscar por teléfono con optimizaciones
   */
  async buscarPorTelefono(telefono) {
    try {
      // 1. Verificar caché
      const cached = cacheService.get('telefono', { telefono });
      if (cached) {
        return {
          ...cached,
          cached: true,
          timestamp: new Date().toISOString()
        };
      }

      // 2. Obtener sesión del pool
      const sessionData = sessionPool.getAvailableSession();
      if (!sessionData) {
        throw new Error('No hay sesiones disponibles en el pool');
      }

      console.log(`📱 Usando sesión ${sessionData.index + 1} para teléfono: ${telefono}`);

      // 3. Realizar búsqueda
      const resultado = await this.performPhoneQuery(telefono, sessionData);
      
      // 4. Guardar en caché
      cacheService.set('telefono', { telefono }, resultado, cacheService.getTTL('telefono'));
      
      return resultado;

    } catch (error) {
      console.error('❌ Error en búsqueda teléfono optimizada:', error.message);
      throw error;
    }
  }

  /**
   * Realizar consulta DNI
   */
  async performDNIQuery(dni, sessionData) {
    try {
      // 1. AJAX search
      const searchData = {
        tipo_bus: '1',
        valor_buscado: dni
      };

      const searchResponse = await sessionData.session.post(`${config.seekerBaseUrl}/index.php?action=validate`, searchData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Requested-With': 'XMLHttpRequest'
        }
      });

      // 2. GET results page
      const resultsResponse = await sessionData.session.get(`${config.seekerBaseUrl}/index.php?view=mostrar&cod=${dni}`);
      
      // 3. Parse results
      return this.parseFullResults(resultsResponse.data, dni);

    } catch (error) {
      // Marcar sesión como problemática
      sessionPool.markSessionInactive(sessionData.index);
      throw error;
    }
  }

  /**
   * Realizar búsqueda por nombres
   */
  async performNamesQuery(nombreCompleto, apellidoPaterno, apellidoMaterno, sessionData) {
    try {
      const searchData = {
        tipo_bus: '2',
        nombre_busqueda: nombreCompleto || '',
        paterno_busqueda: apellidoPaterno || '',
        materno_busqueda: apellidoMaterno || ''
      };

      const searchResponse = await sessionData.session.post(`${config.seekerBaseUrl}/index.php?action=validate`, searchData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Requested-With': 'XMLHttpRequest'
        }
      });

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
      sessionPool.markSessionInactive(sessionData.index);
      throw error;
    }
  }

  /**
   * Realizar búsqueda por teléfono
   */
  async performPhoneQuery(telefono, sessionData) {
    try {
      const searchData = {
        tipo_bus: '3',
        valor_numero: telefono
      };

      const searchResponse = await sessionData.session.post(`${config.seekerBaseUrl}/index.php?action=validate`, searchData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Requested-With': 'XMLHttpRequest'
        }
      });

      // Verificar si hay redirección
      let htmlToParse = searchResponse.data;
      let codigoDNI = null;
      if (searchResponse.data.includes('window.location=')) {
        const match = searchResponse.data.match(/cod=(\d+)/);
        if (match) {
          codigoDNI = match[1];
          const mostrarResponse = await sessionData.session.get(`${config.seekerBaseUrl}/index.php?view=mostrar&cod=${codigoDNI}`);
          htmlToParse = mostrarResponse.data;
        }
      }

      const resultados = this.parsearResultadosTelefono(htmlToParse, codigoDNI);
      
      return {
        success: true,
        message: 'Búsqueda por teléfono completada',
        data: {
          busqueda: { telefono },
          resultados: resultados,
          total: resultados.length,
          timestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      sessionPool.markSessionInactive(sessionData.index);
      throw error;
    }
  }

  /**
   * Parsear resultados completos (reutilizar lógica existente)
   */
  parseFullResults(html, dni) {
    // Reutilizar la lógica de seekerAdvanced.js
    const seekerAdvanced = require('./seekerAdvanced');
    return seekerAdvanced.parseFullResults(html, dni);
  }

  /**
   * Parsear resultados de nombres
   */
  parsearResultadosNombres(html) {
    const seekerAdvanced = require('./seekerAdvanced');
    return seekerAdvanced.parsearResultadosNombres(html);
  }

  /**
   * Parsear resultados de teléfono
   */
  parsearResultadosTelefono(html, codigoDNI) {
    const seekerAdvanced = require('./seekerAdvanced');
    return seekerAdvanced.parsearResultadosTelefono(html, codigoDNI);
  }

  /**
   * Obtener estadísticas del sistema
   */
  getStats() {
    return {
      sessionPool: sessionPool.getStats(),
      cache: cacheService.getStats(),
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = new SeekerOptimized();

/**
 * Servicio simplificado de Seeker con caché básico
 */

const cheerio = require('cheerio');
const config = require('../config');
const seekerAdvanced = require('./seekerAdvanced');

class SeekerSimple {
  constructor() {
    this.cache = new Map();
    this.maxCacheSize = 500;
    this.cacheTTL = 5 * 60 * 1000; // 5 minutos
    
    // Limpiar caché cada minuto
    setInterval(() => this.cleanupCache(), 60000);
  }

  /**
   * Generar clave de caché
   */
  generateCacheKey(type, params) {
    switch (type) {
      case 'dni':
        return `dni:${params.dni}`;
      case 'nombres':
        return `nombres:${params.nombreCompleto || ''}-${params.apellidoPaterno || ''}-${params.apellidoMaterno || ''}`;
      case 'telefono':
        return `telefono:${params.telefono}`;
      default:
        return `${type}:${JSON.stringify(params)}`;
    }
  }

  /**
   * Obtener del caché
   */
  getFromCache(type, params) {
    const key = this.generateCacheKey(type, params);
    const entry = this.cache.get(key);
    
    if (entry && Date.now() < entry.expires) {
      console.log(`📦 Cache HIT para ${key}`);
      return entry.data;
    }
    
    if (entry) {
      this.cache.delete(key);
    }
    
    return null;
  }

  /**
   * Guardar en caché
   */
  setCache(type, params, data, ttl = this.cacheTTL) {
    const key = this.generateCacheKey(type, params);
    
    // Si el caché está lleno, remover la entrada más antigua
    if (this.cache.size >= this.maxCacheSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      data,
      expires: Date.now() + ttl
    });
    
    console.log(`💾 Cache SET para ${key}`);
  }

  /**
   * Limpiar caché expirado
   */
  cleanupCache() {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now >= entry.expires) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`🧹 Cache cleanup: ${cleaned} entradas expiradas`);
    }
  }

  /**
   * Consultar DNI con caché
   */
  async consultarDNI(dni) {
    try {
      // Verificar caché
      const cached = this.getFromCache('dni', { dni });
      if (cached) {
        return {
          ...cached,
          cached: true,
          timestamp: new Date().toISOString()
        };
      }

      console.log(`🔍 Consulta DNI: ${dni}`);
      const resultado = await seekerAdvanced.consultarDNI(dni);
      
      // Guardar en caché por 10 minutos
      this.setCache('dni', { dni }, resultado, 10 * 60 * 1000);
      
      return resultado;

    } catch (error) {
      console.error('❌ Error en consulta DNI:', error.message);
      throw error;
    }
  }

  /**
   * Buscar por nombres con caché
   */
  async buscarPorNombres(nombreCompleto, apellidoPaterno, apellidoMaterno) {
    try {
      const params = { nombreCompleto, apellidoPaterno, apellidoMaterno };
      
      // Verificar caché
      const cached = this.getFromCache('nombres', params);
      if (cached) {
        return {
          ...cached,
          cached: true,
          timestamp: new Date().toISOString()
        };
      }

      console.log(`🔍 Búsqueda nombres: ${nombreCompleto} ${apellidoPaterno}`);
      const resultado = await seekerAdvanced.buscarPorNombres(nombreCompleto, apellidoPaterno, apellidoMaterno);
      
      // Guardar en caché por 5 minutos
      this.setCache('nombres', params, resultado, 5 * 60 * 1000);
      
      return resultado;

    } catch (error) {
      console.error('❌ Error en búsqueda nombres:', error.message);
      throw error;
    }
  }

  /**
   * Buscar por teléfono con caché
   */
  async buscarPorTelefono(telefono) {
    try {
      // Verificar caché
      const cached = this.getFromCache('telefono', { telefono });
      if (cached) {
        return {
          ...cached,
          cached: true,
          timestamp: new Date().toISOString()
        };
      }

      console.log(`📱 Búsqueda teléfono: ${telefono}`);
      const resultado = await seekerAdvanced.buscarPorTelefono(telefono);
      
      // Guardar en caché por 15 minutos
      this.setCache('telefono', { telefono }, resultado, 15 * 60 * 1000);
      
      return resultado;

    } catch (error) {
      console.error('❌ Error en búsqueda teléfono:', error.message);
      throw error;
    }
  }

  /**
   * Obtener estadísticas
   */
  getStats() {
    const now = Date.now();
    let valid = 0;
    let expired = 0;
    
    for (const entry of this.cache.values()) {
      if (now < entry.expires) {
        valid++;
      } else {
        expired++;
      }
    }

    return {
      cache: {
        total: this.cache.size,
        valid,
        expired,
        memoryUsage: `${(JSON.stringify([...this.cache.values()]).length / 1024).toFixed(2)} KB`
      },
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = new SeekerSimple();

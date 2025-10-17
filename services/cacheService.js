/**
 * Sistema de caché para consultas repetidas
 */

class CacheService {
  constructor() {
    this.cache = new Map();
    this.maxSize = 1000; // Máximo 1000 entradas en caché
    this.defaultTTL = 5 * 60 * 1000; // 5 minutos por defecto
    this.cleanupInterval = 60 * 1000; // Limpiar cada minuto
    
    // Iniciar limpieza automática
    setInterval(() => this.cleanup(), this.cleanupInterval);
  }

  /**
   * Generar clave de caché
   */
  generateKey(type, params) {
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
  get(type, params) {
    const key = this.generateKey(type, params);
    const entry = this.cache.get(key);
    
    if (entry) {
      if (Date.now() < entry.expires) {
        console.log(`📦 Cache HIT para ${key}`);
        return entry.data;
      } else {
        console.log(`⏰ Cache EXPIRED para ${key}`);
        this.cache.delete(key);
      }
    }
    
    console.log(`❌ Cache MISS para ${key}`);
    return null;
  }

  /**
   * Guardar en caché
   */
  set(type, params, data, ttl = this.defaultTTL) {
    const key = this.generateKey(type, params);
    
    // Si el caché está lleno, remover la entrada más antigua
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    const entry = {
      data,
      expires: Date.now() + ttl,
      created: Date.now()
    };

    this.cache.set(key, entry);
    console.log(`💾 Cache SET para ${key} (TTL: ${ttl/1000}s)`);
  }

  /**
   * Limpiar entradas expiradas
   */
  cleanup() {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now >= entry.expires) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`🧹 Cache cleanup: ${cleaned} entradas expiradas removidas`);
    }
  }

  /**
   * Limpiar todo el caché
   */
  clear() {
    this.cache.clear();
    console.log('🗑️ Cache completamente limpiado');
  }

  /**
   * Obtener estadísticas del caché
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
      total: this.cache.size,
      valid,
      expired,
      hitRate: 'N/A', // Se puede implementar tracking de hits/misses
      memoryUsage: `${(JSON.stringify([...this.cache.values()]).length / 1024).toFixed(2)} KB`
    };
  }

  /**
   * Obtener TTL personalizado según el tipo
   */
  getTTL(type) {
    switch (type) {
      case 'dni':
        return 10 * 60 * 1000; // 10 minutos para DNI
      case 'nombres':
        return 5 * 60 * 1000;  // 5 minutos para nombres
      case 'telefono':
        return 15 * 60 * 1000; // 15 minutos para teléfonos
      default:
        return this.defaultTTL;
    }
  }
}

module.exports = new CacheService();

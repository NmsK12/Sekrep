/**
 * Servicio de caché para almacenar datos de consultas
 */

const fs = require('fs');
const path = require('path');

class CacheService {
  constructor() {
    this.cacheDir = path.join(__dirname, '..', 'cache');
    this.ensureCacheDir();
  }

  ensureCacheDir() {
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
      console.log('📁 Directorio de caché creado:', this.cacheDir);
    }
  }

  // Generar clave única para el caché basada en DNI
  getCacheKey(dni) {
    return `dni_${dni}.json`;
  }

  // Generar clave para búsqueda por teléfono
  getPhoneCacheKey(telefono) {
    return `phone_${telefono}.json`;
  }

  // Generar clave para búsqueda por nombre
  getNameCacheKey(nombres) {
    const cleanName = nombres.toLowerCase().replace(/[^a-z0-9]/g, '_');
    return `name_${cleanName}.json`;
  }

  // Guardar datos en caché
  saveToCache(key, data) {
    try {
      const cacheFile = path.join(this.cacheDir, key);
      const cacheData = {
        ...data,
        cached_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 horas
      };
      
      fs.writeFileSync(cacheFile, JSON.stringify(cacheData, null, 2));
      console.log(`💾 Datos guardados en caché: ${key}`);
      return true;
    } catch (error) {
      console.error('❌ Error guardando en caché:', error.message);
      return false;
    }
  }

  // Leer datos del caché
  getFromCache(key) {
    try {
      const cacheFile = path.join(this.cacheDir, key);
      
      if (!fs.existsSync(cacheFile)) {
        return null;
      }

      const cacheData = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
      
      // NO verificar expiración - el caché nunca expira
      console.log(`📖 Datos obtenidos del caché: ${key}`);
      return cacheData;
    } catch (error) {
      console.error('❌ Error leyendo caché:', error.message);
      return null;
    }
  }

  // Eliminar del caché
  deleteFromCache(key) {
    try {
      const cacheFile = path.join(this.cacheDir, key);
      if (fs.existsSync(cacheFile)) {
        fs.unlinkSync(cacheFile);
        console.log(`🗑️ Caché eliminado: ${key}`);
      }
    } catch (error) {
      console.error('❌ Error eliminando caché:', error.message);
    }
  }

  // Buscar en caché por teléfono
  searchByPhone(telefono) {
    try {
      const files = fs.readdirSync(this.cacheDir);
      
      for (const file of files) {
        if (file.startsWith('dni_') && file.endsWith('.json')) {
          const cacheFile = path.join(this.cacheDir, file);
          const cacheData = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
          
          // NO verificar expiración - el caché nunca expira

          // Buscar el teléfono en los datos
          if (cacheData.data && cacheData.data.telefonos) {
            const foundPhone = cacheData.data.telefonos.find(t => 
              t.telefono === telefono || t.telefono.includes(telefono)
            );
            
            if (foundPhone) {
              console.log(`📱 Teléfono encontrado en caché: ${telefono} -> DNI: ${cacheData.data.dni}`);
              return cacheData;
            }
          }
        }
      }
      
      return null;
    } catch (error) {
      console.error('❌ Error buscando por teléfono:', error.message);
      return null;
    }
  }

  // Buscar en caché por teléfono (múltiples resultados)
  searchByPhoneMultiple(telefono) {
    try {
      const files = fs.readdirSync(this.cacheDir);
      const resultados = [];
      
      for (const file of files) {
        if (file.startsWith('dni_') && file.endsWith('.json')) {
          const cacheFile = path.join(this.cacheDir, file);
          const cacheData = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
          
          // NO verificar expiración - el caché nunca expira

          // Buscar el teléfono en los datos
          if (cacheData.data && cacheData.data.telefonos) {
            const foundPhone = cacheData.data.telefonos.find(t => 
              t.telefono === telefono || t.telefono.includes(telefono)
            );
            
            if (foundPhone) {
              console.log(`📱 Teléfono encontrado en caché: ${telefono} -> DNI: ${cacheData.data.dni}`);
              resultados.push(cacheData);
            }
          }
        }
      }
      
      return resultados;
    } catch (error) {
      console.error('❌ Error buscando por teléfono múltiple:', error.message);
      return [];
    }
  }

  // Buscar en caché por nombre
  searchByName(nombres) {
    try {
      const files = fs.readdirSync(this.cacheDir);
      const results = [];
      
      for (const file of files) {
        if (file.startsWith('dni_') && file.endsWith('.json')) {
          const cacheFile = path.join(this.cacheDir, file);
          const cacheData = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
          
          // NO verificar expiración - el caché nunca expira

          // Buscar coincidencias en el nombre
          if (cacheData.data && cacheData.data.nombre) {
            const nombreCompleto = cacheData.data.nombre.toLowerCase();
            const nombresBusqueda = nombres.toLowerCase();
            
            // Buscar coincidencias parciales
            if (nombreCompleto.includes(nombresBusqueda) || 
                nombresBusqueda.split(' ').some(nombre => nombreCompleto.includes(nombre))) {
              results.push(cacheData);
            }
          }
        }
      }
      
      if (results.length > 0) {
        console.log(`👤 ${results.length} resultados encontrados en caché para: ${nombres}`);
      }
      
      return results;
    } catch (error) {
      console.error('❌ Error buscando por nombre:', error.message);
      return [];
    }
  }


  // Obtener estadísticas del caché
  getCacheStats() {
    try {
      const files = fs.readdirSync(this.cacheDir);
      let total = 0;
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          total++;
        }
      }
      
      return {
        total,
        valid: total, // Todos son válidos porque nunca expiran
        expired: 0,   // Nunca hay expirados
        cacheDir: this.cacheDir,
        note: "El caché nunca expira - todos los datos se mantienen permanentemente"
      };
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas:', error.message);
      return { total: 0, valid: 0, expired: 0, cacheDir: this.cacheDir };
    }
  }
}

module.exports = CacheService;

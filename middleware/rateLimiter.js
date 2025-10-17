/**
 * Rate limiting avanzado por usuario/IP
 */

const rateLimit = require('express-rate-limit');

// Rate limiter simple en memoria
class SimpleRateLimiter {
  constructor(options = {}) {
    this.points = options.points || 100;
    this.duration = options.duration || 60; // segundos
    this.blockDuration = options.blockDuration || 60; // segundos
    this.keyPrefix = options.keyPrefix || 'default';
    this.store = new Map();
    
    // Limpiar entradas expiradas cada minuto
    setInterval(() => this.cleanup(), 60000);
  }

  async consume(key) {
    const now = Date.now();
    const fullKey = `${this.keyPrefix}:${key}`;
    const windowStart = now - (this.duration * 1000);
    
    // Obtener o crear entrada
    let entry = this.store.get(fullKey);
    if (!entry) {
      entry = { requests: [], blocked: false, blockUntil: 0 };
      this.store.set(fullKey, entry);
    }

    // Verificar si está bloqueado
    if (entry.blocked && now < entry.blockUntil) {
      const msBeforeNext = entry.blockUntil - now;
      throw { msBeforeNext };
    }

    // Limpiar requests antiguos
    entry.requests = entry.requests.filter(time => time > windowStart);

    // Verificar límite
    if (entry.requests.length >= this.points) {
      entry.blocked = true;
      entry.blockUntil = now + (this.blockDuration * 1000);
      const msBeforeNext = this.blockDuration * 1000;
      throw { msBeforeNext };
    }

    // Agregar request actual
    entry.requests.push(now);
    entry.blocked = false;
    
    return { totalHits: entry.requests.length };
  }

  cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.blocked && now >= entry.blockUntil) {
        entry.blocked = false;
        entry.blockUntil = 0;
      }
    }
  }
}

// Crear instancias de rate limiters
const ipLimiter = new SimpleRateLimiter({
  keyPrefix: 'ip',
  points: 100,
  duration: 60,
  blockDuration: 60,
});

const endpointLimiters = {
  dni: new SimpleRateLimiter({
    keyPrefix: 'dni',
    points: 50,
    duration: 60,
    blockDuration: 120,
  }),
  nombres: new SimpleRateLimiter({
    keyPrefix: 'nombres',
    points: 30,
    duration: 60,
    blockDuration: 120,
  }),
  telefono: new SimpleRateLimiter({
    keyPrefix: 'telefono',
    points: 20,
    duration: 60,
    blockDuration: 120,
  })
};


/**
 * Middleware de rate limiting por IP
 */
const ipRateLimit = async (req, res, next) => {
  try {
    const ip = req.ip || req.connection.remoteAddress;
    await ipLimiter.consume(ip);
    next();
  } catch (rejRes) {
    const secs = Math.round(rejRes.msBeforeNext / 1000) || 1;
    res.set('Retry-After', String(secs));
    res.status(429).json({
      success: false,
      message: 'Demasiadas solicitudes desde tu IP',
      error: 'Rate limit exceeded',
      retryAfter: secs,
      data: { timestamp: new Date().toISOString() }
    });
  }
};

/**
 * Middleware de rate limiting por endpoint
 */
const endpointRateLimit = (endpointType) => {
  return async (req, res, next) => {
    try {
      const ip = req.ip || req.connection.remoteAddress;
      const key = `${ip}:${endpointType}`;
      
      await endpointLimiters[endpointType].consume(key);
      next();
    } catch (rejRes) {
      const secs = Math.round(rejRes.msBeforeNext / 1000) || 1;
      res.set('Retry-After', String(secs));
      res.status(429).json({
        success: false,
        message: `Demasiadas consultas de ${endpointType}`,
        error: 'Endpoint rate limit exceeded',
        retryAfter: secs,
        data: { 
          endpoint: endpointType,
          timestamp: new Date().toISOString() 
        }
      });
    }
  };
};

/**
 * Rate limiter básico de Express
 */
const basicRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 200, // 200 requests por minuto por IP
  message: {
    success: false,
    message: 'Demasiadas solicitudes, intenta más tarde',
    error: 'Rate limit exceeded'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter estricto para consultas
 */
const strictRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 50, // 50 consultas por minuto por IP
  message: {
    success: false,
    message: 'Límite de consultas excedido',
    error: 'Query rate limit exceeded'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  ipRateLimit,
  endpointRateLimit,
  basicRateLimit,
  strictRateLimit,
  endpointLimiters
};

/**
 * Configuración para la API de consultas
 */

require('dotenv').config();

module.exports = {
  // Credenciales del sistema
  seekerUser: process.env.SEEKER_USER || 'NmsK12',
  seekerPassword: process.env.SEEKER_PASSWORD || '6PEWxyISpy',
  
  // URLs base
  seekerBaseUrl: 'https://seeker.lat',
  seekerLoginUrl: 'https://seeker.lat/index.php?view=login',
  seekerHomeUrl: 'https://seeker.lat/index.php?view=home',
  seekerResultUrl: 'https://seeker.lat/index.php?view=mostrar',
  
  // Configuración de sesión
  sessionTimeout: 30 * 60 * 1000, // 30 minutos
  maxRetries: 3,
  retryDelay: 2000, // 2 segundos
  
  // Configuración del servidor
  port: process.env.PORT || 3000,
  
  // Rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100 // máximo 100 requests por ventana
  }
};

// Middleware para validar API Keys
// Integración con panel de administración

const axios = require('axios');

const PANEL_URL = process.env.PANEL_URL || 'http://localhost:3001';

/**
 * Middleware para validar API Keys en los endpoints
 * Uso: app.get('/dni', validateKey('dni'), async (req, res) => { ... })
 */
function validateKey(endpoint) {
  return async (req, res, next) => {
    try {
      // Obtener key desde query params o headers
      const key = req.query.key || req.headers['x-api-key'];

      if (!key) {
        return res.status(401).json({
          success: false,
          message: '❌ API Key requerida. Compra acceso contactando a: @zGatoO, @choco_tete o @WinniePoohOFC',
          error: 'NO_API_KEY',
          contacts: ['@zGatoO', '@choco_tete', '@WinniePoohOFC']
        });
      }

      // Validar key con el panel
      const validation = await axios.post(`${PANEL_URL}/api/keys/validate`, {
        key,
        endpoint
      }, {
        timeout: 5000
      });

      if (!validation.data.valid) {
        return res.status(401).json({
          success: false,
          message: '❌ API Key inválida o expirada. Contacta a: @zGatoO, @choco_tete o @WinniePoohOFC',
          error: 'INVALID_KEY',
          contacts: ['@zGatoO', '@choco_tete', '@WinniePoohOFC']
        });
      }

      // Key válida, continuar
      req.apiKey = validation.data.data;
      next();

    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        // Si el panel no está disponible, permitir acceso (modo desarrollo)
        console.warn('⚠️ Panel de keys no disponible, permitiendo acceso');
        return next();
      }

      console.error('Error validando key:', error.message);
      return res.status(401).json({
        success: false,
        message: '❌ Error validando API Key. Contacta a: @zGatoO, @choco_tete o @WinniePoohOFC',
        error: 'VALIDATION_ERROR',
        contacts: ['@zGatoO', '@choco_tete', '@WinniePoohOFC']
      });
    }
  };
}

module.exports = { validateKey };


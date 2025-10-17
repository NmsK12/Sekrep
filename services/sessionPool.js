/**
 * Pool de sesiones para manejar múltiples usuarios simultáneos
 */

const axios = require('axios');
const { CookieJar } = require('tough-cookie');
const axiosCookieJarSupport = require('axios-cookiejar-support').default;
const config = require('../config');

// Habilitar soporte de cookies
axiosCookieJarSupport(axios);

class SessionPool {
  constructor() {
    this.sessions = [];
    this.maxSessions = 10; // Máximo 10 sesiones simultáneas
    this.sessionTimeout = 30 * 60 * 1000; // 30 minutos
    this.initializeSessions();
  }

  /**
   * Inicializar pool de sesiones
   */
  async initializeSessions() {
    console.log('🔄 Inicializando pool de sesiones...');
    
    // Crear múltiples sesiones con diferentes credenciales si están disponibles
    const credentials = [
      { user: config.seekerUser, password: config.seekerPassword },
      // Agregar más credenciales aquí si tienes
    ];

    for (let i = 0; i < this.maxSessions; i++) {
      const credential = credentials[i % credentials.length];
      const session = await this.createSession(credential, i);
      if (session) {
        this.sessions.push(session);
      }
    }

    console.log(`✅ Pool inicializado con ${this.sessions.length} sesiones`);
  }

  /**
   * Crear una nueva sesión
   */
  async createSession(credential, index) {
    try {
      const jar = new CookieJar();
      const session = axios.create({
        jar,
        timeout: 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        }
      });

      // Login
      const loginResponse = await session.post(config.seekerLoginUrl, {
        usuario: credential.user,
        password: credential.password
      });

      if (loginResponse.data.includes('Usuario de búsqueda básica') || 
          loginResponse.data.includes('NMSK12')) {
        console.log(`✅ Sesión ${index + 1} creada exitosamente`);
        return {
          session,
          credential,
          index,
          lastUsed: Date.now(),
          isActive: true
        };
      } else {
        console.log(`❌ Fallo al crear sesión ${index + 1}`);
        return null;
      }
    } catch (error) {
      console.error(`❌ Error creando sesión ${index + 1}:`, error.message);
      return null;
    }
  }

  /**
   * Obtener una sesión disponible
   */
  getAvailableSession() {
    // Buscar sesión activa
    const activeSession = this.sessions.find(s => s.isActive);
    if (activeSession) {
      activeSession.lastUsed = Date.now();
      return activeSession;
    }

    // Si no hay sesiones activas, usar la más antigua
    const oldestSession = this.sessions.reduce((oldest, current) => 
      current.lastUsed < oldest.lastUsed ? current : oldest
    );

    if (oldestSession) {
      oldestSession.lastUsed = Date.now();
      return oldestSession;
    }

    return null;
  }

  /**
   * Marcar sesión como inactiva
   */
  markSessionInactive(sessionIndex) {
    const session = this.sessions.find(s => s.index === sessionIndex);
    if (session) {
      session.isActive = false;
    }
  }

  /**
   * Renovar sesión expirada
   */
  async renewSession(sessionIndex) {
    const session = this.sessions.find(s => s.index === sessionIndex);
    if (session) {
      console.log(`🔄 Renovando sesión ${sessionIndex + 1}...`);
      const newSession = await this.createSession(session.credential, sessionIndex);
      if (newSession) {
        this.sessions[sessionIndex] = newSession;
        return newSession;
      }
    }
    return null;
  }

  /**
   * Verificar y limpiar sesiones expiradas
   */
  async cleanupExpiredSessions() {
    const now = Date.now();
    for (let i = 0; i < this.sessions.length; i++) {
      const session = this.sessions[i];
      if (now - session.lastUsed > this.sessionTimeout) {
        console.log(`🧹 Limpiando sesión expirada ${i + 1}`);
        const renewedSession = await this.renewSession(i);
        if (!renewedSession) {
          this.sessions[i] = null;
        }
      }
    }
    
    // Remover sesiones nulas
    this.sessions = this.sessions.filter(s => s !== null);
  }

  /**
   * Obtener estadísticas del pool
   */
  getStats() {
    const active = this.sessions.filter(s => s.isActive).length;
    const total = this.sessions.length;
    return {
      total,
      active,
      inactive: total - active,
      utilization: total > 0 ? (active / total * 100).toFixed(1) + '%' : '0%'
    };
  }
}

module.exports = new SessionPool();

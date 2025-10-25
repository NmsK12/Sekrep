/**
 * Servicio para consultar datos de SUSalud
 * Requiere autenticación previa para obtener token/cookies
 */

const axios = require('axios');
const https = require('https');

class SusaludService {
  constructor(manualToken = null) {
    // Configuración
    this.loginUrl = 'https://app8.susalud.gob.pe:8380/api/auth/login'; // Ajustar según lo que captures
    this.apiBaseUrl = 'https://app30.susalud.gob.pe:8087/api/siteds-raaus';
    
    // Credenciales
    this.username = '42316999';
    this.password = 'k574774g';
    
    // Sesión
    this.cookies = null;
    this.token = manualToken; // Permitir token manual
    this.sessionExpiry = manualToken ? Date.now() + (30 * 60 * 1000) : null;
    
    // Cliente HTTP con configuración para ignorar certificados SSL si es necesario
    this.client = axios.create({
      timeout: 30000,
      httpsAgent: new https.Agent({
        rejectUnauthorized: false // Para servidores con SSL autofirmado
      }),
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'es-ES,es;q=0.9',
        'Origin': 'https://app8.susalud.gob.pe:8380',
        'Referer': 'https://app8.susalud.gob.pe:8380/'
      }
    });
  }

  /**
   * Hacer login y obtener token/cookies de sesión
   */
  async login() {
    try {
      console.log('🔐 [SUSalud] Iniciando sesión...');
      console.log(`🔐 [SUSalud] URL: ${this.loginUrl}`);
      console.log(`🔐 [SUSalud] Usuario: ${this.username}`);
      
      // Preparar datos de login - probar diferentes formatos
      const loginData = {
        username: this.username,
        password: this.password
      };
      
      console.log('📤 [SUSalud] Enviando credenciales...');
      
      // Probar primero con form-urlencoded (más común en sistemas web)
      const FormData = require('form-data');
      const querystring = require('querystring');
      
      const formData = querystring.stringify({
        username: this.username,
        password: this.password,
        // Posibles campos adicionales que algunos sistemas requieren
        login: 'Login',
        submit: 'Ingresar'
      });
      
      // Intentar login
      const response = await this.client.post(this.loginUrl, formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
        },
        maxRedirects: 5,
        validateStatus: function (status) {
          return status >= 200 && status < 500; // Aceptar redirects y errores para debug
        }
      });
      
      console.log('📊 [SUSalud] Respuesta de login:', response.status);
      console.log('📊 [SUSalud] Headers de respuesta:', JSON.stringify(response.headers, null, 2).substring(0, 500));
      console.log('📊 [SUSalud] Body de respuesta:', JSON.stringify(response.data).substring(0, 500));
      
      // Si el login falló
      if (response.status !== 200 && response.status !== 201) {
        console.error('❌ [SUSalud] Login falló con status:', response.status);
        console.error('📄 [SUSalud] Respuesta:', response.data);
        return false;
      }
      
      // Extraer cookies de la respuesta
      const setCookieHeaders = response.headers['set-cookie'];
      if (setCookieHeaders) {
        this.cookies = setCookieHeaders.map(cookie => cookie.split(';')[0]).join('; ');
        console.log('🍪 [SUSalud] Cookies obtenidas:', this.cookies.substring(0, 100) + '...');
      }
      
      // Extraer token si viene en el body
      if (response.data && response.data.token) {
        this.token = response.data.token;
        console.log('🔑 [SUSalud] Token obtenido:', this.token.substring(0, 20) + '...');
      }
      
      // Si viene authorization header
      if (response.headers['authorization']) {
        this.token = response.headers['authorization'];
        console.log('🔑 [SUSalud] Token en header Authorization');
      }
      
      // Verificar que obtuvimos algo
      if (!this.cookies && !this.token) {
        console.error('⚠️ [SUSalud] No se obtuvieron cookies ni token');
        return false;
      }
      
      // Marcar sesión como válida por 30 minutos
      this.sessionExpiry = Date.now() + (30 * 60 * 1000);
      
      console.log('✅ [SUSalud] Login exitoso');
      return true;
      
    } catch (error) {
      console.error('❌ [SUSalud] Error en login:', error.message);
      
      if (error.response) {
        console.error('📄 [SUSalud] Status:', error.response.status);
        console.error('📄 [SUSalud] Data:', JSON.stringify(error.response.data).substring(0, 500));
      }
      
      return false;
    }
  }

  /**
   * Verificar si la sesión es válida
   */
  isSessionValid() {
    if (!this.cookies && !this.token) {
      return false;
    }
    
    if (this.sessionExpiry && Date.now() > this.sessionExpiry) {
      console.log('⏰ [SUSalud] Sesión expirada');
      return false;
    }
    
    return true;
  }

  /**
   * Consultar seguros de salud por DNI
   * @param {string} dni - DNI a consultar
   * @param {string} tipoDoc - Tipo de documento (1 = DNI, 2 = CE, etc.)
   */
  async consultarSeguros(dni, tipoDoc = '1') {
    try {
      // Verificar sesión
      if (!this.isSessionValid()) {
        console.log('🔄 [SUSalud] Sesión no válida, haciendo login...');
        const loginOk = await this.login();
        if (!loginOk) {
          return {
            success: false,
            message: 'No se pudo iniciar sesión en SUSalud'
          };
        }
      }
      
      console.log(`🔍 [SUSalud] Consultando seguros para DNI: ${dni}`);
      
      // Construir URL
      const url = `${this.apiBaseUrl}/afiliado/seguros/${dni}?tipoDoc=${tipoDoc}`;
      
      // Preparar headers con autenticación
      const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      };
      
      if (this.cookies) {
        headers['Cookie'] = this.cookies;
      }
      
      if (this.token) {
        headers['Authorization'] = this.token.startsWith('Bearer ') ? this.token : `Bearer ${this.token}`;
      }
      
      // Hacer petición
      const response = await this.client.get(url, { headers });
      
      console.log('✅ [SUSalud] Consulta exitosa');
      
      // Verificar respuesta
      if (response.data && response.data.success === false) {
        return {
          success: false,
          message: response.data.message || 'Error en la consulta',
          data: response.data
        };
      }
      
      return {
        success: true,
        message: 'Consulta exitosa',
        data: response.data
      };
      
    } catch (error) {
      console.error('❌ [SUSalud] Error en consulta:', error.message);
      
      // Si es error de autenticación, reintentar con nuevo login
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        console.log('🔄 [SUSalud] Error de autenticación, reintentando login...');
        this.cookies = null;
        this.token = null;
        this.sessionExpiry = null;
        
        // Reintentar una vez
        const loginOk = await this.login();
        if (loginOk) {
          console.log('🔄 [SUSalud] Reintentando consulta...');
          return await this.consultarSeguros(dni, tipoDoc);
        }
      }
      
      return {
        success: false,
        message: 'Error al consultar SUSalud',
        error: error.message,
        status: error.response?.status
      };
    }
  }

  /**
   * Formatear datos de seguros para respuesta
   */
  formatearRespuesta(data) {
    if (!data || !data.data) {
      return null;
    }
    
    const info = data.data;
    
    return {
      dni: info.v_NroDoc,
      nombres: info.v_nombres_per,
      apellidoPaterno: info.v_apepat_per,
      apellidoMaterno: info.v_apemat_per,
      nombreCompleto: `${info.v_apepat_per} ${info.v_apemat_per}, ${info.v_nombres_per}`,
      fechaNacimiento: info.v_FecNac,
      genero: info.v_genero,
      ubigeo: info.v_ubigeo,
      seguros: (info.seguros || []).map(seguro => ({
        iafas: seguro.nom_iafas,
        regimen: seguro.regimen,
        estado: seguro.estado,
        cobertura: seguro.cobertura,
        fechaInicio: seguro.fec_ini,
        fechaFin: seguro.fec_fin,
        producto: seguro.producto,
        planSalud: seguro.tplansalud,
        parentesco: seguro.parentesco,
        titular: seguro.titular,
        contratante: seguro.contratante,
        ipress: seguro.no_ipress,
        ipressComercial: seguro.no_comercial
      })),
      totalSeguros: (info.seguros || []).length,
      segurosActivos: (info.seguros || []).filter(s => s.estado === 'ACTIVO').length
    };
  }
}

module.exports = SusaludService;


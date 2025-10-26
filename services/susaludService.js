/**
 * Servicio para consultar datos de SUSalud
 * Requiere autenticación previa para obtener token/cookies
 */

const axios = require('axios');
const https = require('https');

class SusaludService {
  constructor(manualToken = null, manualRefreshToken = null) {
    // Configuración
    this.loginUrl = 'https://app30.susalud.gob.pe:8083/api/siteds-seguridad/auth/login/autenticar';
    this.refreshUrl = 'https://app30.susalud.gob.pe:8083/api/siteds-seguridad/auth/login/refreshtoken';
    this.apiBaseUrl = 'https://app30.susalud.gob.pe:8087/api/siteds-raaus';
    
    // Credenciales
    this.username = '42316999';
    this.password = 'k574774g';
    
    // Sesión
    this.accessToken = manualToken; // Token de acceso
    this.refreshToken = manualRefreshToken; // Token para renovar
    this.tokenExpiry = manualToken ? Date.now() + (10 * 60 * 1000) : null; // 10 minutos
    
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
    if (!this.accessToken) {
      return false;
    }
    
    if (this.tokenExpiry && Date.now() > this.tokenExpiry) {
      console.log('⏰ [SUSalud] Token expirado');
      return false;
    }
    
    return true;
  }

  /**
   * Renovar el token de acceso usando el refreshToken
   */
  async refreshAccessToken() {
    try {
      console.log('🔄 [SUSalud] Renovando token de acceso...');
      console.log(`🔑 [SUSalud] RefreshToken: ${this.refreshToken ? this.refreshToken.substring(0, 30) + '...' : 'NO DISPONIBLE'}`);
      
      if (!this.refreshToken) {
        console.error('❌ [SUSalud] No hay refreshToken disponible');
        return false;
      }
      
      // Hacer petición para refrescar el token
      console.log(`🌐 [SUSalud] URL refresh: ${this.refreshUrl}`);
      
      const response = await this.client.post(this.refreshUrl, {
        refreshToken: this.refreshToken
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.refreshToken}`, // Algunos sistemas requieren esto
          'cache-control': 'no-cache, no-store, must-revalidate',
          'pragma': 'no-cache',
          'expires': '0'
        },
        validateStatus: function (status) {
          return status >= 200 && status < 500; // Para debug
        }
      });
      
      console.log(`📊 [SUSalud] Respuesta de refresh: ${response.status}`);
      
      if (response.status === 401 || response.status === 403) {
        console.error('❌ [SUSalud] RefreshToken también expiró o es inválido');
        console.error('📄 [SUSalud] Respuesta:', JSON.stringify(response.data).substring(0, 200));
        return false;
      }
      
      if (response.status === 200 && response.data && response.data.data) {
        const tokenData = response.data.data;
        
        this.accessToken = tokenData.accessToken;
        this.refreshToken = tokenData.refreshToken; // Nuevo refreshToken
        this.tokenExpiry = Date.now() + (10 * 60 * 1000); // 10 minutos
        
        console.log('✅ [SUSalud] Token renovado exitosamente');
        console.log(`🔑 [SUSalud] Nuevo AccessToken: ${this.accessToken.substring(0, 30)}...`);
        return true;
      }
      
      console.error('❌ [SUSalud] Respuesta inesperada del servidor');
      console.error('📄 [SUSalud] Data:', JSON.stringify(response.data).substring(0, 300));
      return false;
      
    } catch (error) {
      console.error('❌ [SUSalud] Error renovando token:', error.message);
      if (error.response) {
        console.error(`📄 [SUSalud] Status: ${error.response.status}`);
        console.error(`📄 [SUSalud] Data:`, JSON.stringify(error.response.data).substring(0, 300));
      }
      return false;
    }
  }

  /**
   * Consultar seguros de salud por DNI
   * @param {string} dni - DNI a consultar
   * @param {string} tipoDoc - Tipo de documento (1 = DNI, 2 = CE, etc.)
   */
  async consultarSeguros(dni, tipoDoc = '1') {
    try {
      console.log(`🔍 [SUSalud] Consultando seguros para DNI: ${dni}`);
      console.log(`🔑 [SUSalud] Token disponible: ${this.accessToken ? 'SÍ' : 'NO'}`);
      console.log(`🔑 [SUSalud] RefreshToken disponible: ${this.refreshToken ? 'SÍ' : 'NO'}`);
      
      // Verificar sesión
      if (!this.isSessionValid()) {
        console.log('🔄 [SUSalud] Token no válido o expirado');
        
        // Intentar renovar con refreshToken
        if (this.refreshToken) {
          console.log('🔄 [SUSalud] Intentando renovar con refreshToken...');
          const refreshOk = await this.refreshAccessToken();
          if (!refreshOk) {
            return {
              success: false,
              message: 'No se pudo renovar el token. Por favor proporciona un nuevo token de acceso.'
            };
          }
        } else {
          return {
            success: false,
            message: 'No hay token de acceso. Por favor proporciona un accessToken y refreshToken válidos.'
          };
        }
      }
      
      console.log(`✅ [SUSalud] Token válido, realizando consulta`);
      
      // Construir URL
      const url = `${this.apiBaseUrl}/afiliado/seguros/${dni}?tipoDoc=${tipoDoc}`;
      console.log(`🌐 [SUSalud] URL: ${url}`);
      
      // Preparar headers con autenticación
      const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.accessToken}`
      };
      
      console.log(`📤 [SUSalud] Enviando petición con token: ${this.accessToken.substring(0, 30)}...`);
      
      // Hacer petición
      const response = await this.client.get(url, { headers });
      
      console.log(`✅ [SUSalud] Consulta exitosa (status: ${response.status})`);
      console.log('📊 [SUSalud] Respuesta:', JSON.stringify(response.data).substring(0, 500));
      
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
      
      if (error.response) {
        console.error(`📄 [SUSalud] Status: ${error.response.status}`);
        console.error(`📄 [SUSalud] Data:`, JSON.stringify(error.response.data).substring(0, 500));
      }
      
      // Si es error de autenticación, intentar renovar token
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        console.log('🔄 [SUSalud] Error de autenticación detectado (401/403)');
        
        if (this.refreshToken) {
          console.log('🔄 [SUSalud] Intentando renovar token con refreshToken...');
          const refreshOk = await this.refreshAccessToken();
          if (refreshOk) {
            console.log('🔄 [SUSalud] Reintentando consulta con nuevo token...');
            return await this.consultarSeguros(dni, tipoDoc);
          }
        }
        
        return {
          success: false,
          message: 'Token expirado. Por favor proporciona un nuevo accessToken y refreshToken.',
          error: 'TOKEN_EXPIRED'
        };
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
  formatearRespuesta(resultado) {
    if (!resultado || !resultado.data) {
      return null;
    }
    
    // La respuesta viene en resultado.data (que es la respuesta completa de la API)
    // Y los datos están en resultado.data.data
    const apiResponse = resultado.data;
    const info = apiResponse.data || apiResponse;
    
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


# 🏥 GUÍA COMPLETA - Inyector de Sesión para SUSalud

## ✅ Estado: **FUNCIONANDO COMPLETAMENTE**

El inyector de sesión para la API de SUSalud está **100% operativo** y probado exitosamente.

---

## 🎯 ¿Qué hace?

Permite consultar **seguros de salud** (EsSalud, SIS, etc.) por DNI usando la API privada de SUSalud, **sin necesidad de CAPTCHA** después de la configuración inicial.

---

## 🔐 Cómo Funciona el Inyector

### 1. Login Inicial (Manual - una sola vez)
```
Usuario → Navegador → Login en SUSalud → Captura de Tokens
```

### 2. Uso Continuo (Automático)
```
API → Inyecta accessToken → Consulta → Auto-renovación con refreshToken
```

**Ventajas:**
- ✅ **No requiere CAPTCHA** después del login inicial
- ✅ **Auto-renovación** de tokens cada 10 minutos
- ✅ **Sesión persistente** con refreshToken (dura 24 horas)
- ✅ **Transparente** para el usuario final

---

## 📋 Configuración Paso a Paso

### Paso 1: Capturar Tokens (Una Sola Vez)

1. **Abre el navegador** (Chrome/Firefox/Brave)
2. **Presiona F12** (DevTools)
3. **Ve a la pestaña "Network"**
4. **Marca "Preserve log"**
5. **Ve a** `https://app8.susalud.gob.pe:8380/login`
6. **Ingresa credenciales**:
   - Usuario: `42316999`
   - Password: `k574774g`
   - Resuelve el CAPTCHA
7. **Busca en Network** la petición:
   - URL: `https://app30.susalud.gob.pe:8083/api/siteds-seguridad/auth/login/autenticar`
   - Método: POST
   - Status: 200
8. **Click en esa petición → Response tab**
9. **Copia estos valores**:
   ```json
   {
     "data": {
       "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
       "refreshToken": "eyJhbGciOiJIUzI1NiJ9...",
       "expiresIn": "10"
     }
   }
   ```

### Paso 2: Configurar Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto (o configura en Railway/Render):

```env
# SUSalud Tokens
SUSALUD_ACCESS_TOKEN=eyJhbGciOiJIUzI1NiJ9.tu_access_token_completo_aqui
SUSALUD_REFRESH_TOKEN=eyJhbGciOiJIUzI1NiJ9.tu_refresh_token_completo_aqui
```

### Paso 3: Reiniciar el Servidor

```bash
# Local
npm start

# Railway/Render
# Push al repositorio y se reiniciará automáticamente
```

---

## 🚀 Uso de la API

### Endpoint

```
GET /salud/:dni?key=TU_API_KEY
```

### Parámetros

- **dni** (path, requerido): DNI de 8 dígitos
- **tipoDoc** (query, opcional): Tipo de documento (default: '1' = DNI)
- **key** (query, requerido): Tu API key válida

### Ejemplo

```bash
curl "http://localhost:3000/salud/44443333?key=TU_API_KEY"
```

### Respuesta Exitosa

```json
{
  "success": true,
  "message": "Consulta de seguros de salud exitosa",
  "data": {
    "dni": "44443333",
    "nombres": "LISMELI",
    "apellidoPaterno": "ROMAINA",
    "apellidoMaterno": "SILVA",
    "nombreCompleto": "ROMAINA SILVA, LISMELI",
    "fechaNacimiento": "20/07/1987",
    "genero": "FEMENINO",
    "ubigeo": "LIMA - LIMA - SAN MARTIN DE PORRES",
    "seguros": [
      {
        "iafas": "EsSalud",
        "regimen": "CONTRIBUTIVO",
        "estado": "ACTIVO",
        "cobertura": "COBERTURA TOTAL",
        "fechaInicio": "28/06/2023",
        "fechaFin": null,
        "producto": "5",
        "planSalud": "SCTR",
        "parentesco": "TITULAR",
        "titular": "DNI: 44443333 -  ROMAINA SILVA, LISMELI",
        "contratante": "RUC: 20198261476"
      }
    ],
    "totalSeguros": 11,
    "segurosActivos": 3
  },
  "raw_data": { /* Respuesta original completa */ },
  "from_cache": false
}
```

---

## 🔄 Renovación Automática de Tokens

El servicio maneja automáticamente:

1. **Detección de expiración** (cada 10 minutos)
2. **Renovación con refreshToken**
3. **Reintento automático** si falla una petición por token expirado

### Duración de Tokens

- **accessToken**: 10 minutos
- **refreshToken**: 24 horas

### Cuando el refreshToken Expira

Después de 24 horas, necesitas:
1. Hacer login nuevamente en el navegador
2. Capturar los nuevos tokens
3. Actualizar las variables de entorno
4. Reiniciar el servidor

---

## 🧪 Probar Localmente

### Test Completo
```bash
node test-susalud-REAL.js
```

### Salida Esperada
```
🧪 ===== PRUEBA REAL CON TOKENS CAPTURADOS =====

✅ Sesión válida: true
📋 Consultando seguros para DNI 44443333...
✅ ¡ÉXITO! Consulta realizada correctamente

👤 DATOS PERSONALES:
   Nombre completo: ROMAINA SILVA, LISMELI
   DNI: 44443333
   Total seguros: 11
   Seguros activos: 3

✅ El inyector funciona correctamente!
```

---

## 📊 Datos Disponibles

### Información Personal
- DNI
- Nombres y apellidos completos
- Fecha de nacimiento
- Género
- Ubigeo (distrito, provincia, departamento)

### Seguros de Salud
- **IAFAS**: EsSalud, SIS, seguros privados
- **Estado**: ACTIVO / CANCELADO
- **Régimen**: CONTRIBUTIVO / SUBSIDIADO
- **Cobertura**: TOTAL / LATENCIA / etc.
- **Fechas**: inicio y fin de cobertura
- **Plan de salud**: SCTR, PEAS, etc.
- **Titular y contratante**
- **IPRESS**: establecimiento de salud asignado

---

## ⚠️ Solución de Problemas

### Error: "No hay token de acceso"
**Solución**: Configura las variables de entorno `SUSALUD_ACCESS_TOKEN` y `SUSALUD_REFRESH_TOKEN`

### Error: "Token expirado"
**Solución**: 
1. Haz login nuevamente en el navegador
2. Captura nuevos tokens
3. Actualiza variables de entorno

### Error: "Access denied"
**Posibles causas**:
- Token inválido o mal copiado
- Token expirado (más de 24 horas)
- Credenciales de SUSalud cambiadas

---

## 🔒 Seguridad

### Buenas Prácticas

1. **Nunca publiques los tokens** en repositorios públicos
2. **Usa variables de entorno** en producción
3. **Rota los tokens regularmente** (cada 24 horas idealmente)
4. **Protege tu API** con keys válidas

### En Producción (Railway/Render)

```bash
# Configurar variables de entorno en el dashboard
SUSALUD_ACCESS_TOKEN=tu_token_aqui
SUSALUD_REFRESH_TOKEN=tu_refresh_token_aqui
```

---

## 📝 Estructura Técnica

### Archivos Principales

- `services/susaludService.js` - Inyector de sesión
- `server.js` - Endpoint `/salud/:dni`
- `test-susalud-REAL.js` - Script de prueba

### Flujo de Autenticación

```javascript
// 1. Inicialización con tokens
const service = new SusaludService(accessToken, refreshToken);

// 2. Verificación de sesión
if (!service.isSessionValid()) {
  await service.refreshAccessToken(); // Auto-renovación
}

// 3. Consulta con token inyectado
const response = await axios.get(url, {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});
```

---

## 🎉 Resultado Final

**✅ FUNCIONANDO AL 100%**

- ✅ Login automático (con tokens configurados)
- ✅ Auto-renovación de tokens
- ✅ Consultas sin CAPTCHA
- ✅ Formato de respuesta limpio
- ✅ Manejo de errores robusto
- ✅ Listo para producción

---

## 📞 Soporte

Si los tokens expiran o tienes problemas:
1. Repite el proceso de captura de tokens
2. Verifica que las credenciales sean correctas
3. Asegúrate de copiar los tokens completos (son largos)

---

**¡El inyector está listo para usar!** 🚀


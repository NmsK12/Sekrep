# API de Consultas

API REST para consultar datos de personas de forma automatizada.

## 🚀 Características

- ✅ **Login automático** - Manejo de sesiones
- ✅ **Búsqueda por DNI** - Consulta completa de datos
- ✅ **Búsqueda por nombres** - Encuentra personas por nombre y apellidos
- ✅ **Búsqueda por teléfono** - Encuentra persona por número telefónico
- ✅ **Datos personales** - Información básica de la persona
- ✅ **Datos de ubicación** - Dirección y ubicación geográfica
- ✅ **Teléfonos** - Lista de números telefónicos asociados
- ✅ **Foto en base64** - Imagen de la persona incluida
- ✅ **API REST** - Endpoints estándar
- ✅ **Rate limiting** - Protección contra abuso
- ✅ **Manejo de errores** - Respuestas consistentes

## 📋 Endpoints Disponibles

### 🚀 Consulta Avanzada (RECOMENDADO)
```http
GET /api/consulta/advanced/:dni
POST /api/consulta/advanced
```
**Consulta completa con foto en base64 y todos los datos disponibles.**

**Ejemplo:**
```bash
curl "http://localhost:3000/api/consulta/advanced/80660243"
```

### 🔧 Consulta con Inyector
```http
GET /api/consulta/inject/:dni
POST /api/consulta/inject
```
Consulta usando simulación de navegador (método avanzado).

**Ejemplo:**
```bash
curl "http://localhost:3000/api/consulta/inject/80660243"
```

### 👥 Búsqueda por Nombres
```http
POST /api/consulta/advanced/nombres
```
Buscar personas por nombre completo, apellido paterno y/o apellido materno.

**Ejemplo:**
```bash
curl -X POST "http://localhost:3000/api/consulta/advanced/nombres" \
  -H "Content-Type: application/json" \
  -d '{
    "nombreCompleto": "Miguel",
    "apellidoPaterno": "Moscoso"
  }'
```

### 📱 Búsqueda por Teléfono
```http
POST /api/consulta/advanced/telefono
```
Buscar persona por número de teléfono (9 dígitos).

**Ejemplo:**
```bash
curl -X POST "http://localhost:3000/api/consulta/advanced/telefono" \
  -H "Content-Type: application/json" \
  -d '{"telefono": "924336263"}'
```

### 📊 Consulta Principal
```http
GET /api/consulta/:dni
POST /api/consulta
```
Consulta básica de una persona por DNI.

**Ejemplo:**
```bash
curl "http://localhost:3000/api/consulta/80660243"
```

### 🔍 Búsqueda Simple
```http
GET /api/consulta/buscar/:dni
```
Solo busca la persona sin obtener datos detallados.

**Ejemplo:**
```bash
curl "http://localhost:3000/api/consulta/buscar/80660243"
```

### 📋 Datos Detallados
```http
GET /api/consulta/detalle/:codigo
```
Obtiene datos detallados usando el código interno.

**Ejemplo:**
```bash
curl "http://localhost:3000/api/consulta/detalle/80660243"
```

### ✅ Estado del Servicio
```http
GET /api/consulta/status
```
Verifica el estado de la sesión y login.

**Ejemplo:**
```bash
curl "http://localhost:3000/api/consulta/status"
```

### 🔐 Login Manual
```http
POST /api/consulta/login
```
Fuerza un nuevo login manual.

**Ejemplo:**
```bash
curl -X POST "http://localhost:3000/api/consulta/login"
```

## 📊 Formato de Respuesta

### Consulta Exitosa
```json
{
  "success": true,
  "message": "Consulta exitosa",
  "data": {
    "dni": "80660243",
    "nombre": "GUILLERMO MOSCOSO VARGAS",
    "codigo": "80660243",
    "datosPersonales": {
      "fechaNacimiento": "19/05/1978",
      "edad": "47",
      "sexo": "Hombre",
      "estadoCivil": "SOLTERO",
      "padre": "ELEODORO",
      "madre": "MERCEDES",
      "fechaFallecimiento": "N/A"
    },
    "datosUbicacion": {
      "ubicacion": "PASCO-PASCO-YANACANCHA",
      "direccion": "AV.LOS PROCERES S/N",
      "ubigeoNacimiento": "180114"
    },
    "telefonos": [
      {
        "telefono": "924336263",
        "operador": "entel",
        "periodo": "202303",
        "email": null
      },
      {
        "telefono": "912271316",
        "operador": "entel",
        "periodo": "202303",
        "email": null
      }
    ],
    "timestamp": "2025-10-17T01:01:34.000Z"
  }
}
```

### Error
```json
{
  "success": false,
  "message": "No se encontraron resultados",
  "data": {
    "dni": "12345678",
    "timestamp": "2025-10-17T01:01:34.000Z"
  }
}
```

## 🛠️ Instalación

1. **Clonar el repositorio:**
```bash
git clone <tu-repo>
cd seeker-lat-api
```

2. **Instalar dependencias:**
```bash
npm install
```

3. **Configurar credenciales:**
Editar `config.js` con tus credenciales de seeker.lat:
```javascript
module.exports = {
  seekerUser: 'TU_USUARIO',
  seekerPassword: 'TU_PASSWORD',
  // ... resto de configuración
};
```

4. **Iniciar servidor:**
```bash
npm start
```

## 🧪 Pruebas

### Ejecutar todas las pruebas:
```bash
npm test
```

### Probar DNI específico:
```bash
node test-api.js dni 80660243
```

### Probar código específico:
```bash
node test-api.js codigo 80660243
```

## 📝 Ejemplos de Uso

### JavaScript/Node.js
```javascript
const axios = require('axios');

// Consulta por DNI
async function consultarDNI(dni) {
  try {
    const response = await axios.get(`http://localhost:3000/api/consulta/advanced/${dni}`);
    console.log(response.data);
  } catch (error) {
    console.error('Error:', error.response.data);
  }
}

// Búsqueda por nombres
async function buscarPorNombres(nombre, apellidoPaterno, apellidoMaterno) {
  try {
    const response = await axios.post('http://localhost:3000/api/consulta/advanced/nombres', {
      nombreCompleto: nombre,
      apellidoPaterno: apellidoPaterno,
      apellidoMaterno: apellidoMaterno
    });
    console.log(response.data);
  } catch (error) {
    console.error('Error:', error.response.data);
  }
}

// Búsqueda por teléfono
async function buscarPorTelefono(telefono) {
  try {
    const response = await axios.post('http://localhost:3000/api/consulta/advanced/telefono', {
      telefono: telefono
    });
    console.log(response.data);
  } catch (error) {
    console.error('Error:', error.response.data);
  }
}

// Ejemplos de uso
consultarDNI('80660243');
buscarPorNombres('Miguel', 'Moscoso', '');
buscarPorTelefono('924336263');
```

### Python
```python
import requests

def consultar_dni(dni):
    try:
        response = requests.get(f'http://localhost:3000/api/consulta/{dni}')
        return response.json()
    except Exception as e:
        print(f'Error: {e}')

resultado = consultar_dni('80660243')
print(resultado)
```

### cURL
```bash
# Consulta avanzada por DNI (RECOMENDADO)
curl "http://localhost:3000/api/consulta/advanced/80660243"

# Búsqueda por nombres
curl -X POST "http://localhost:3000/api/consulta/advanced/nombres" \
  -H "Content-Type: application/json" \
  -d '{
    "nombreCompleto": "Miguel",
    "apellidoPaterno": "Moscoso"
  }'

# Búsqueda por teléfono
curl -X POST "http://localhost:3000/api/consulta/advanced/telefono" \
  -H "Content-Type: application/json" \
  -d '{"telefono": "924336263"}'

# Consulta básica
curl "http://localhost:3000/api/consulta/80660243"

# Estado del servicio
curl "http://localhost:3000/api/consulta/status"
```

## ⚙️ Configuración

### Variables de Entorno
```bash
PORT=3000                    # Puerto del servidor
NODE_ENV=development         # Entorno (development/production)
```

### Rate Limiting
- **Ventana:** 15 minutos
- **Límite:** 100 requests por ventana
- **Mensaje:** "Demasiadas solicitudes, intenta más tarde"

## 🔒 Seguridad

- ✅ **Helmet** - Headers de seguridad
- ✅ **CORS** - Control de acceso
- ✅ **Rate Limiting** - Protección contra abuso
- ✅ **Validación de entrada** - DNI debe ser de 8 dígitos
- ✅ **Manejo de errores** - No exposición de información sensible

## 📚 Estructura del Proyecto

```
seeker-lat-api/
├── config.js              # Configuración
├── server.js              # Servidor principal
├── services/
│   └── seekerService.js   # Lógica de negocio
├── routes/
│   └── consulta.js        # Rutas de API
├── test-api.js            # Script de pruebas
├── package.json           # Dependencias
└── README.md              # Documentación
```

## 🚀 Despliegue en Railway

### 1. Preparar el Proyecto
El proyecto ya está configurado con:
- ✅ `railway.json` - Configuración de Railway
- ✅ `package.json` - Scripts de producción
- ✅ `env.example` - Variables de entorno de ejemplo

### 2. Desplegar en Railway

#### Opción A: Desde GitHub
1. **Subir a GitHub:**
   ```bash
   git add .
   git commit -m "Preparado para Railway"
   git push origin main
   ```

2. **Conectar en Railway:**
   - Ir a [railway.app](https://railway.app)
   - Crear cuenta o iniciar sesión
   - Click "New Project" → "Deploy from GitHub repo"
   - Seleccionar tu repositorio
   - Railway detectará automáticamente que es un proyecto Node.js

#### Opción B: Desde CLI
```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login
railway login

# Inicializar proyecto
railway init

# Desplegar
railway up
```

### 3. Configurar Variables de Entorno
En el dashboard de Railway, ir a Variables y agregar:
```bash
PORT=3000
NODE_ENV=production
SEEKER_USER=NmsK12
SEEKER_PASSWORD=6PEWxyISpy
```

### 4. Verificar Despliegue
Railway te dará una URL como: `https://tu-proyecto.railway.app`

**Probar la API:**
```bash
curl "https://tu-proyecto.railway.app/api/consulta/status"
curl "https://tu-proyecto.railway.app/api/consulta/advanced/80660243"
```

### 5. Configuración Avanzada
- **Dominio personalizado:** Configurar en Railway dashboard
- **Monitoreo:** Railway incluye logs y métricas automáticas
- **Escalado:** Configurar en railway.json si es necesario

### 🎯 URLs de Producción
Una vez desplegado, tus endpoints serán:
```bash
# Estado
GET https://tu-proyecto.railway.app/api/consulta/status

# Consulta avanzada (RECOMENDADO)
GET https://tu-proyecto.railway.app/api/consulta/advanced/80660243

# Consulta con inyector
GET https://tu-proyecto.railway.app/api/consulta/inject/80660243

# Consulta básica
GET https://tu-proyecto.railway.app/api/consulta/80660243
```

## 🚀 **DESPLIEGUE EN RAILWAY (RECOMENDADO)**

### 1. **Conectar Repositorio**
1. Ve a [Railway.app](https://railway.app)
2. Conecta tu cuenta de GitHub
3. Crea un nuevo proyecto
4. Selecciona el repositorio `NmsK12/Sekrep`

### 2. **Variables de Entorno**
En Railway, ve a la pestaña "Variables" y agrega:

```env
PORT=3000
SEEKER_USER=NmsK12
SEEKER_PASSWORD=6PEWxyISpy
SEEKER_BASE_URL=https://seeker.lat
SEEKER_LOGIN_URL=https://seeker.lat/index.php?view=login
SEEKER_HOME_URL=https://seeker.lat/index.php?view=home
SEEKER_RESULT_URL=https://seeker.lat/index.php?view=mostrar
SESSION_TIMEOUT=1800000
MAX_RETRIES=3
RETRY_DELAY=2000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

### 3. **Endpoints de Producción**
Una vez desplegado, tus endpoints serán:

```bash
# Información de la API
GET https://tu-proyecto.railway.app/

# Consulta DNI básica
GET https://tu-proyecto.railway.app/api/consulta/advanced=dni?dni=80660243

# Consulta DNI con caché (RECOMENDADO)
GET https://tu-proyecto.railway.app/api/consulta/simple=dni?dni=80660243

# Búsqueda por nombres
GET https://tu-proyecto.railway.app/api/consulta/simple=nm?nombres=Miguel-Moscoso

# Búsqueda por teléfono
GET https://tu-proyecto.railway.app/api/consulta/simple=tel?telefono=912271316

# Estadísticas del caché
GET https://tu-proyecto.railway.app/api/consulta/cache-stats
```

### 4. **Monitoreo y Escalado**
- **Logs en tiempo real** en Railway dashboard
- **Métricas automáticas** de CPU y memoria
- **Escalado automático** según la demanda
- **Health checks** automáticos

### 🔧 **Otros Proveedores**

#### Render
1. Conectar repositorio
2. Configurar variables de entorno
3. Deploy automático

#### VPS
```bash
# Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clonar y configurar
git clone https://github.com/NmsK12/Sekrep
cd Sekrep
npm install
npm start
```

## 📞 Soporte

Para problemas o preguntas:
1. Revisar logs del servidor
2. Verificar estado con `/api/consulta/status`
3. Probar login manual con `/api/consulta/login`

## ⚠️ Notas Importantes

- **Credenciales:** Mantén tus credenciales seguras
- **Rate Limiting:** Respeta los límites de la API
- **Uso Responsable:** Usa la API solo para fines legítimos
- **Sesiones:** Las sesiones expiran automáticamente
- **Errores:** Revisa los mensajes de error para debugging

## 📄 Licencia

MIT License - Ver archivo LICENSE para más detalles.

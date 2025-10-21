# Ejemplos de Uso - SISFOH API v2.0

## 🚀 Flujo de Trabajo Optimizado

### 1. Primera Consulta (Lenta - Se guarda en caché)
```bash
curl "http://localhost:3000/api/dni?dni=80660244"
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Consulta exitosa",
  "data": {
    "dni": "80660244",
    "nombres": "MARIA ELENA",
    "apellidos": "PACAHUALA PONCE",
    "datos": {
      "Fecha de Nacimiento": "31/08/1970",
      "Edad": "55",
      "Sexo": "Mujer",
      "Estado": "CASADO",
      "Padre": "TOMAS",
      "Madre": "DAMIANA",
      "Ubicación": "PASCO-PASCO-TICLACAYAN",
      "Dirección": "CARR. CENTRAL S/N QUIPAPUQUIUN",
      "Ubigeo Nacimiento": "180203",
      "Fecha de Fallecimiento": "N/A"
    },
    "foto": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...",
    "telefonos": [
      {
        "telefono": "904684131",
        "operador": "entel",
        "periodo": "202303",
        "email": ""
      },
      {
        "telefono": "981057787",
        "operador": "entel",
        "periodo": "202303",
        "email": ""
      },
      {
        "telefono": "969239124",
        "operador": "movistar",
        "periodo": "202306",
        "email": ""
      }
    ],
    "riesgo": [],
    "arbol": [
      {
        "dni": "04073213",
        "apellidoPaterno": "PACAHUALA",
        "apellidoMaterno": "PONCE",
        "nombres": "LUZ",
        "edad": "52",
        "sexo": "Mujer",
        "tipo": "HERMANO",
        "ubigeo": "LIMA-LIMA-VILLA MARIA DEL TRIUNFO"
      }
    ],
    "correos": [
      {
        "correo": "[email protected]",
        "fecha": "N/A",
        "fuente": "N/A"
      }
    ]
  },
  "from_cache": false
}
```

### 2. Segunda Consulta (Ultra-rápida - Desde caché)
```bash
curl "http://localhost:3000/api/dni?dni=80660244"
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Consulta exitosa (desde caché)",
  "data": {
    // ... mismos datos ...
  },
  "from_cache": true
}
```

### 3. Búsqueda por Teléfono (Instantánea)
```bash
curl "http://localhost:3000/api/telefono?telefono=904684131"
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Consulta exitosa (desde caché)",
  "data": {
    "dni": "80660244",
    "nombres": "MARIA ELENA",
    "apellidos": "PACAHUALA PONCE",
    // ... todos los datos de la persona ...
  },
  "from_cache": true,
  "search_type": "telefono",
  "search_value": "904684131"
}
```

### 4. Endpoints Específicos (Solo los datos que necesitas)

#### Solo Teléfonos
```bash
curl "http://localhost:3000/api/dni/80660244/telefonos"
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Teléfonos obtenidos exitosamente",
  "data": {
    "dni": "80660244",
    "nombres": "MARIA ELENA",
    "apellidos": "PACAHUALA PONCE",
    "telefonos": [
      {
        "telefono": "904684131",
        "operador": "entel",
        "periodo": "202303",
        "email": ""
      },
      {
        "telefono": "981057787",
        "operador": "entel",
        "periodo": "202303",
        "email": ""
      },
      {
        "telefono": "969239124",
        "operador": "movistar",
        "periodo": "202306",
        "email": ""
      }
    ]
  },
  "from_cache": true
}
```

#### Solo Árbol Familiar
```bash
curl "http://localhost:3000/api/dni/80660244/arbol"
```

#### Solo Correos
```bash
curl "http://localhost:3000/api/dni/80660244/correos"
```

#### Solo Foto
```bash
curl "http://localhost:3000/api/dni/80660244/foto"
```

### 5. Gestión del Caché

#### Ver Estadísticas
```bash
curl "http://localhost:3000/api/cache/stats"
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Estadísticas del caché obtenidas",
  "data": {
    "total": 5,
    "valid": 4,
    "expired": 1,
    "cacheDir": "./cache"
  }
}
```

#### Limpiar Caché Expirado
```bash
curl -X POST "http://localhost:3000/api/cache/clean"
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Caché limpiado exitosamente",
  "data": {
    "archivos_eliminados": 1
  }
}
```

## 🔍 Búsqueda Inteligente

### Búsqueda por Nombre (Encuentra coincidencias parciales)
```bash
curl "http://localhost:3000/api/nombres?nombres=MARIA"
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Consulta exitosa (desde caché)",
  "data": [
    {
      "dni": "80660244",
      "nombres": "MARIA ELENA",
      "apellidos": "PACAHUALA PONCE",
      // ... todos los datos ...
    }
  ],
  "from_cache": true,
  "search_type": "nombre",
  "search_value": "MARIA",
  "total": 1
}
```

## 📈 Comparación de Rendimiento

| Tipo de Consulta | Primera Vez | Desde Caché | Mejora |
|------------------|-------------|-------------|---------|
| DNI Completo | ~3-5 segundos | ~50ms | 60-100x más rápido |
| Búsqueda por Teléfono | N/A (solo caché) | ~20ms | Instantáneo |
| Endpoint Específico | ~3-5 segundos | ~30ms | 100-150x más rápido |
| Búsqueda por Nombre | ~3-5 segundos | ~100ms | 30-50x más rápido |

## 🎯 Casos de Uso Reales

### 1. Sistema de Verificación de Identidad
```bash
# Verificar identidad por DNI
curl "http://localhost:3000/api/dni?dni=12345678"

# Si ya consultaste antes, es instantáneo
curl "http://localhost:3000/api/dni?dni=12345678"
```

### 2. Búsqueda de Contactos
```bash
# Buscar por teléfono
curl "http://localhost:3000/api/telefono?telefono=987654321"

# Obtener solo teléfonos de una persona
curl "http://localhost:3000/api/dni/12345678/telefonos"
```

### 3. Análisis Familiar
```bash
# Obtener solo árbol familiar
curl "http://localhost:3000/api/dni/12345678/arbol"
```

### 4. Verificación de Contactos
```bash
# Obtener solo correos
curl "http://localhost:3000/api/dni/12345678/correos"
```

## 🔧 Integración en Aplicaciones

### JavaScript/Node.js
```javascript
const axios = require('axios');

// Consulta con caché automático
async function consultarPersona(dni) {
  try {
    const response = await axios.get(`http://localhost:3000/api/dni?dni=${dni}`);
    return response.data;
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Búsqueda rápida por teléfono
async function buscarPorTelefono(telefono) {
  try {
    const response = await axios.get(`http://localhost:3000/api/telefono?telefono=${telefono}`);
    return response.data;
  } catch (error) {
    console.error('Error:', error.message);
  }
}
```

### Python
```python
import requests

def consultar_persona(dni):
    response = requests.get(f'http://localhost:3000/api/dni?dni={dni}')
    return response.json()

def buscar_por_telefono(telefono):
    response = requests.get(f'http://localhost:3000/api/telefono?telefono={telefono}')
    return response.json()
```

## 💡 Consejos de Optimización

1. **Primera consulta**: Haz la consulta completa por DNI para poblar el caché
2. **Consultas posteriores**: Usa endpoints específicos para datos particulares
3. **Búsquedas frecuentes**: Usa búsqueda por teléfono para verificación rápida
4. **Mantenimiento**: Limpia el caché periódicamente con `/api/cache/clean`
5. **Monitoreo**: Revisa estadísticas con `/api/cache/stats`

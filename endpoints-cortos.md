# Endpoints Cortos - SISFOH API v2.0

## 🚀 Endpoints Simplificados

### Consultas Principales

#### 1. Consulta Completa por DNI
```bash
GET /dni?dni=80660244
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
    "datos": { ... },
    "foto": "data:image/jpeg;base64,...",
    "telefonos": [ ... ],
    "arbol": [ ... ],
    "correos": [ ... ]
  },
  "from_cache": false
}
```

#### 2. Búsqueda por Nombres
```bash
GET /nom?nom=MIGUEL-MOSCOSO
```

#### 3. Búsqueda por Teléfono
```bash
GET /telp?tel=904684131
```

#### 4. Obtener Teléfonos por DNI
```bash
GET /telp?tel=80660244
```
*Nota: Si pasas 8 dígitos (DNI), obtienes solo teléfonos. Si pasas 9 dígitos (teléfono), busca por teléfono.*

### Endpoints Específicos

#### 5. Árbol Genealógico
```bash
GET /arg?dni=80660244
```
**Respuesta:**
```json
{
  "success": true,
  "message": "Árbol genealógico obtenido exitosamente",
  "data": {
    "dni": "80660244",
    "nombres": "MARIA ELENA",
    "apellidos": "PACAHUALA PONCE",
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
    ]
  },
  "from_cache": true
}
```

#### 6. Correos
```bash
GET /corr?dni=80660244
```

#### 7. Datos de Riesgo
```bash
GET /risk?dni=80660244
```

#### 8. Foto
```bash
GET /foto?dni=80660244
```

### Gestión de Caché

#### 9. Estadísticas del Caché
```bash
GET /stats
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


## 🎯 Casos de Uso Comunes

### Verificación de Identidad
```bash
# Consulta completa (primera vez - lenta)
curl "http://localhost:3000/dni?dni=80660244"

# Consultas posteriores (ultra-rápidas desde caché)
curl "http://localhost:3000/dni?dni=80660244"
```

### Búsqueda de Contactos
```bash
# Buscar por teléfono
curl "http://localhost:3000/telp?tel=904684131"

# Obtener teléfonos de una persona
curl "http://localhost:3000/telp?tel=80660244"
```

### Análisis Familiar
```bash
# Obtener árbol genealógico
curl "http://localhost:3000/arg?dni=80660244"
```

### Verificación de Contactos
```bash
# Obtener correos
curl "http://localhost:3000/corr?dni=80660244"

# Obtener foto
curl "http://localhost:3000/foto?dni=80660244"
```

## 📊 Comparación de Endpoints

| Función | Endpoint Largo (Antes) | Endpoint Corto (Ahora) |
|---------|------------------------|------------------------|
| DNI Completo | `/api/dni?dni=` | `/dni?dni=` |
| Nombres | `/api/nombres?nombres=` | `/nom?nom=` |
| Teléfono | `/api/telefono?telefono=` | `/telp?tel=` |
| Teléfonos por DNI | `/api/dni/{dni}/telefonos` | `/telp?tel=` |
| Árbol Familiar | `/api/dni/{dni}/arbol` | `/arg?dni=` |
| Correos | `/api/dni/{dni}/correos` | `/corr?dni=` |
| Riesgo | `/api/dni/{dni}/riesgo` | `/risk?dni=` |
| Foto | `/api/dni/{dni}/foto` | `/foto?dni=` |
| Estadísticas | `/api/cache/stats` | `/stats` |

## 🔧 Integración en Código

### JavaScript/Node.js
```javascript
const axios = require('axios');

// Endpoints cortos
const consultarDNI = (dni) => axios.get(`http://localhost:3000/dni?dni=${dni}`);
const buscarTelefono = (tel) => axios.get(`http://localhost:3000/telp?tel=${tel}`);
const obtenerArbol = (dni) => axios.get(`http://localhost:3000/arg?dni=${dni}`);
const obtenerCorreos = (dni) => axios.get(`http://localhost:3000/corr?dni=${dni}`);
const obtenerFoto = (dni) => axios.get(`http://localhost:3000/foto?dni=${dni}`);
```

### Python
```python
import requests

# Endpoints cortos
def consultar_dni(dni):
    return requests.get(f'http://localhost:3000/dni?dni={dni}')

def buscar_telefono(tel):
    return requests.get(f'http://localhost:3000/telp?tel={tel}')

def obtener_arbol(dni):
    return requests.get(f'http://localhost:3000/arg?dni={dni}')

def obtener_correos(dni):
    return requests.get(f'http://localhost:3000/corr?dni={dni}')

def obtener_foto(dni):
    return requests.get(f'http://localhost:3000/foto?dni={dni}')
```

## 💡 Ventajas de los Endpoints Cortos

1. **Más fáciles de recordar**: `/dni`, `/telp`, `/arg`
2. **Menos caracteres**: URLs más cortas
3. **Más rápidos de escribir**: Menos tecleo
4. **Consistentes**: Todos usan query parameters
5. **Flexibles**: `/telp` funciona tanto para teléfonos como DNIs

## 🚀 Flujo de Trabajo Optimizado

1. **Primera consulta**: `GET /dni?dni=80660244` (guarda en caché permanente)
2. **Consultas rápidas**: `GET /telp?tel=80660244` (desde caché permanente)
3. **Búsquedas específicas**: `GET /arg?dni=80660244` (solo árbol)
4. **Monitoreo**: `GET /stats` (estadísticas del caché)
5. **Persistencia**: Los datos se mantienen para siempre

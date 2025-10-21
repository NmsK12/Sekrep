# SISFOH API v2.0 - Con Caché Inteligente

API avanzada para consultar datos de personas mediante un puente a Seeker.lat con sistema de caché inteligente.

## 🚀 Nuevas Características v2.0

- **Sistema de caché inteligente** - Los datos se guardan por 24 horas para consultas ultra-rápidas
- **Nombres y apellidos separados** - El campo nombre se divide automáticamente
- **Endpoints específicos** - Consulta solo los datos que necesitas
- **Búsqueda por teléfono** - Encuentra personas por número de teléfono
- **Gestión automática de caché** - Datos permanentes que nunca se eliminan

## 📋 Endpoints Disponibles

### Consultas Principales
- `GET /api/dni?dni={dni}` - Consultar persona completa por DNI (con caché)
- `GET /api/nombres?nombres={nombres}` - Buscar personas por nombres (con caché)
- `GET /api/telefono?telefono={telefono}` - Buscar por teléfono (solo caché)

### Endpoints Específicos por DNI
- `GET /api/dni/{dni}/telefonos` - Obtener solo teléfonos
- `GET /api/dni/{dni}/arbol` - Obtener solo árbol familiar
- `GET /api/dni/{dni}/correos` - Obtener solo correos
- `GET /api/dni/{dni}/riesgo` - Obtener solo datos de riesgo
- `GET /api/dni/{dni}/foto` - Obtener solo foto

### Gestión de Caché
- `GET /api/cache/stats` - Obtener estadísticas del caché
- `POST /api/cache/clean` - Limpiar caché expirado

## 🔧 Instalación

```bash
npm install
```

## 🚀 Uso

```bash
npm start
```

## 📖 Ejemplos de Uso

### Consulta Completa por DNI
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
      "Sexo": "Mujer"
    },
    "foto": "data:image/jpeg;base64,...",
    "telefonos": [...],
    "arbol": [...],
    "correos": [...]
  },
  "from_cache": false
}
```

### Búsqueda por Teléfono
```bash
curl "http://localhost:3000/api/telefono?telefono=904684131"
```

### Obtener Solo Teléfonos
```bash
curl "http://localhost:3000/api/dni/80660244/telefonos"
```

### Obtener Solo Árbol Familiar
```bash
curl "http://localhost:3000/api/dni/80660244/arbol"
```

### Estadísticas del Caché
```bash
curl "http://localhost:3000/api/cache/stats"
```

## 💾 Sistema de Caché

- **Duración**: Permanente (nunca expira)
- **Ubicación**: `./cache/` (se crea automáticamente)
- **Formato**: Archivos JSON individuales por DNI
- **Limpieza**: No - los datos se mantienen para siempre

## 🔍 Búsqueda Inteligente

El sistema detecta automáticamente datos relacionados:
- Si buscas por teléfono y no está en caché, busca por nombres similares
- Si buscas por nombre, encuentra coincidencias parciales
- Los datos se reutilizan entre diferentes tipos de búsqueda

## 📊 Estructura de Respuesta

Todas las respuestas incluyen:
- `success`: Boolean indicando si la operación fue exitosa
- `message`: Mensaje descriptivo
- `data`: Los datos solicitados
- `from_cache`: Boolean indicando si los datos vienen del caché
- `search_type`: Tipo de búsqueda realizada (opcional)
- `search_value`: Valor buscado (opcional)

## 🛠️ Configuración

Variables de entorno disponibles:
- `BASE_URL`: URL base de Seeker (default: https://seeker.lat)
- `SEEKER_USER`: Usuario de Seeker
- `SEEKER_PASS`: Contraseña de Seeker
- `REQUEST_TIMEOUT_MS`: Timeout de requests (default: 30000)
- `PORT`: Puerto del servidor (default: 3000)

## 📈 Rendimiento

- **Primera consulta**: Tiempo normal (login + búsqueda)
- **Consultas posteriores**: Ultra-rápidas (desde caché permanente)
- **Búsqueda por teléfono**: Instantánea si está en caché
- **Endpoints específicos**: Solo cargan los datos necesarios
- **Persistencia**: Los datos se mantienen para siempre

## 🔒 Seguridad

- Validación de formato de DNI (8 dígitos)
- Validación de formato de teléfono (9 dígitos)
- Manejo seguro de sesiones
- Datos permanentes que nunca se eliminan

## 🚀 Despliegue en Railway

1. Variables/Secrets requeridos:
   - `SEEKER_USER`
   - `SEEKER_PASS`
   - Opcionales: `BASE_URL=https://seeker.lat`, `REQUEST_TIMEOUT_MS=30000`, `NODE_ENV=production`
2. Archivos de despliegue:
   - `Procfile` → `web: npm start`
   - `railway.json` con `startCommand: npm start` y `healthcheckPath: /`
3. Puerto
   - La app escucha `process.env.PORT || 3000`

## Ejecutar local

```bash
npm ci
npm start
# http://localhost:3000/
```
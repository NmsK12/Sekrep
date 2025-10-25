# 🏥 API de SUSalud - Consulta de Seguros de Salud

## 📋 Descripción

Nueva integración con la API de SUSalud que permite consultar información de seguros de salud (EsSalud, SIS, etc.) por DNI.

## 🔐 Autenticación

El servicio utiliza autenticación automática con credenciales configuradas:
- **URL de Login**: `app8.susalud.gob.pe:8380/login`
- **Usuario**: `42316999`
- **Password**: `k574774g`

La sesión se mantiene activa automáticamente y se renueva cuando expira.

## 🚀 Endpoint

```
GET /salud/:dni
```

### Parámetros

- **dni** (path, requerido): DNI de 8 dígitos a consultar
- **tipoDoc** (query, opcional): Tipo de documento (default: '1')
  - `1` = DNI
  - `2` = Carnet de Extranjería
  - etc.
- **key** (query, requerido): Tu API key válida

### Ejemplo de Uso

```bash
# Consultar seguros para el DNI 44443333
curl "http://localhost:3000/salud/44443333?key=TU_API_KEY"
```

## 📊 Respuesta

La API devuelve dos formatos de datos:

### 1. Datos Formateados (`data`)
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
        "contratante": "RUC: 20198261476",
        "ipress": null,
        "ipressComercial": null
      },
      {
        "iafas": "SIS",
        "regimen": "SUBSIDIADO",
        "estado": "CANCELADO",
        "cobertura": null,
        "fechaInicio": "23/11/2020",
        "fechaFin": "01/04/2022",
        "producto": "05",
        "planSalud": "PEAS Y COMPLEMENTARIO",
        "parentesco": "TITULAR",
        "titular": "DNI: 44443333 -  ROMAINA SILVA, LISMELI",
        "contratante": null,
        "ipress": "DIRECCION DE REDES INTEGRADAS DE SALUD LIMA NORTE",
        "ipressComercial": "VIRGEN DEL PILAR DE NARANJAL"
      }
    ],
    "totalSeguros": 11,
    "segurosActivos": 3
  },
  "raw_data": { ... },
  "from_cache": false
}
```

### 2. Datos Originales (`raw_data`)
Incluye la respuesta completa de la API de SUSalud con todos los campos originales.

## 🔑 Estados de Seguro

- **ACTIVO**: Seguro activo y válido
- **CANCELADO**: Seguro cancelado o vencido

## 📝 Tipos de IAFAS (Instituciones)

- **EsSalud**: Seguro Social de Salud
- **SIS**: Seguro Integral de Salud
- Otros seguros privados

## 🛡️ Regímenes

- **CONTRIBUTIVO**: Trabajadores formales
- **SUBSIDIADO**: Población vulnerable

## ⚠️ Manejo de Errores

### Error de Autenticación
```json
{
  "success": false,
  "message": "No se pudo iniciar sesión en SUSalud"
}
```

### Error de Consulta
```json
{
  "success": false,
  "message": "Error al consultar SUSalud",
  "error": "mensaje de error",
  "status": 401
}
```

## 🔧 Características Técnicas

- ✅ **Autenticación automática**: Login automático al iniciar y renovación de sesión
- ✅ **Reintentos inteligentes**: Si falla por sesión expirada, reintenta con nuevo login
- ✅ **Timeout de 30 segundos**: Evita consultas que se cuelguen
- ✅ **SSL flexible**: Funciona con certificados autofirmados
- ✅ **Formato dual**: Datos formateados + datos originales

## 📌 Notas Importantes

1. La sesión se mantiene activa por 30 minutos
2. El servicio hace re-login automático cuando detecta sesión expirada
3. Los datos se devuelven tanto formateados como en formato original
4. Requiere API key válida como todos los demás endpoints

## 🚀 Uso en Producción

En Railway/Render, el endpoint estará disponible en:
```
https://tu-dominio.up.railway.app/salud/44443333?key=TU_KEY
```

## 🔒 Seguridad

- Las credenciales están hardcodeadas en el servicio (considera moverlas a variables de entorno)
- La API requiere key válida para acceder
- La sesión se maneja de forma segura con cookies/tokens


# ⚙️ Configurar Límites de Resultados

## 🎯 Límite Actual: **200 resultados**

Este límite evita timeouts en búsquedas muy genéricas (ej: "PEDRO-CASTILLO").

---

## 🔧 Cómo Cambiar el Límite

### **Opción A: Variables de Entorno (Railway/Producción)**

1. **Railway** → Tu proyecto → **Variables**
2. **Agregar nueva variable:**
   ```
   Nombre: MAX_NAME_RESULTS
   Valor: 300    (o el número que prefieras)
   ```
3. **Railway reiniciará automáticamente**

### **Opción B: Código (Local)**

Edita `bridge.js`, línea 19:
```javascript
const MAX_NAME_RESULTS = Number.parseInt(process.env.MAX_NAME_RESULTS || '200', 10);
                                                                        ↑ Cambia este número
```

---

## 📊 Límites Recomendados

| Límite | Velocidad | Casos de Uso |
|--------|-----------|--------------|
| **100** | ⚡⚡⚡ Muy rápido | Búsquedas exploratorias |
| **200** ✅ | ⚡⚡ Rápido | Balance óptimo (recomendado) |
| **300** | ⚡ Normal | Búsquedas más completas |
| **500** | 🐌 Lento | Máxima cobertura |
| **Sin límite** | ❌ Timeout | No recomendado |

---

## 📝 Ejemplo de Respuesta con Límite

### Cuando hay MÁS resultados que el límite:
```json
{
  "success": true,
  "message": "Búsqueda exitosa (mostrando primeros 200 resultados)",
  "warning": "Se encontraron muchos resultados. Mostrando los primeros 200. Para mejores resultados, agrega el apellido materno a tu búsqueda.",
  "data": {
    "nombres": "PEDRO-CASTILLO",
    "resultados": [ /* 200 resultados */ ],
    "total": 200,
    "hasMore": true,
    "limit": 200
  }
}
```

### Cuando hay MENOS resultados que el límite:
```json
{
  "success": true,
  "message": "Búsqueda exitosa",
  "data": {
    "nombres": "PEDRO-CASTILLO-TERRONES",
    "resultados": [ /* 3 resultados */ ],
    "total": 3,
    "hasMore": false,
    "limit": 200
  }
}
```

---

## 🎯 Mejores Prácticas

### ✅ Búsquedas Eficientes:
- `PEDRO-CASTILLO-TERRONES` → Específica, resultados exactos
- `MARIA-GARCIA-R` → Al menos inicial del apellido materno
- `JOSE-PEREZ-LOPEZ` → Completa

### ❌ Búsquedas Lentas:
- `PEDRO-CASTILLO` → Muy genérica, miles de resultados
- `MARIA-GARCIA` → Muy común
- `JOSE` → Sin apellidos

---

## 🔍 Campos de Respuesta

- **`total`**: Cantidad de resultados devueltos
- **`hasMore`**: `true` si hay más resultados disponibles
- **`limit`**: Límite máximo configurado
- **`warning`**: Mensaje cuando se alcanza el límite

---

## 💡 Consejos

1. **Si `hasMore: true`**: Refina tu búsqueda agregando el apellido materno
2. **Si obtienes pocos resultados**: Intenta con solo 1 apellido
3. **Si necesitas más de 200**: Aumenta `MAX_NAME_RESULTS` en Railway
4. **Si buscas UNA persona específica**: Usa los 3 campos (nombre + 2 apellidos)

---

## 🚀 Cambiar Límite en Railway

```bash
# 1. Ve a Railway → Variables
# 2. Agregar:
MAX_NAME_RESULTS=300

# 3. Railway reinicia automáticamente
# 4. Verifica en los logs:
📋 300 resultados procesados (límite de 300 alcanzado)
```

---

**Límite actual recomendado:** ✅ **200 resultados** (balance entre velocidad y cobertura)


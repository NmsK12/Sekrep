# 🔧 CONFIGURACIÓN API ↔ PANEL

## ✅ PANEL DESPLEGADO EN RAILWAY

**URL del Panel:** `https://web-production-a57a5.up.railway.app`

---

## 📝 CONFIGURAR LA API PRINCIPAL

### 1. **En Local (.env)**

Crea o edita el archivo `.env` en la **raíz** del proyecto `sisfoh-api`:

```env
# API Principal - Variables de Entorno

# Credenciales de Seeker.lat
SEEKER_USER=tu_usuario_seeker
SEEKER_PASS=tu_password_seeker

# ⭐ URL del Panel de Administración (Railway)
PANEL_URL=https://web-production-a57a5.up.railway.app

# Configuración de la API
NODE_ENV=development
PORT=8080

# Timeout para requests externos (en milisegundos)
REQUEST_TIMEOUT_MS=60000
```

### 2. **En Railway (Producción)**

Si tu API principal también está en Railway:

1. Ve a tu proyecto de la API en Railway
2. Click en "Variables"
3. Agrega una nueva variable:
   ```
   Nombre: PANEL_URL
   Valor: https://web-production-a57a5.up.railway.app
   ```
4. Click "Add"
5. Railway redeployará automáticamente

---

## 🔗 CÓMO FUNCIONA

```
┌─────────────────┐
│   CLIENTE       │
│   (Usuario)     │
└────────┬────────┘
         │ 1. Request con key
         ▼
┌─────────────────────────┐
│   API PRINCIPAL         │
│   (sisfoh-api)          │
│   Port: 8080            │
└────────┬────────────────┘
         │ 2. Valida key
         ▼
┌─────────────────────────┐
│   PANEL ADMIN           │
│   (Railway)             │
│   https://web-...       │
│                         │
│   Endpoint:             │
│   /api/keys/validate    │
└────────┬────────────────┘
         │ 3. Responde si es válida
         ▼
┌─────────────────────────┐
│   API PRINCIPAL         │
│   Devuelve datos o      │
│   error según validación│
└─────────────────────────┘
```

---

## ✅ VERIFICAR QUE FUNCIONA

### 1. Inicia la API local:
```bash
npm start
```

### 2. Deberías ver en los logs:
```
🚀 Servidor API iniciado
📡 Puerto: 8080
🔐 Panel URL: https://web-production-a57a5.up.railway.app
✅ Sistema de validación de keys activo
```

### 3. Prueba un endpoint:
```bash
curl "http://localhost:8080/dni?dni=80660244&key=TU_KEY"
```

**Sin key:**
```json
{
  "success": false,
  "message": "API Key requerida. Contacta a @zGatoO, @choco_tete o @WinniePoohOFC"
}
```

**Con key válida:**
```json
{
  "success": true,
  "data": { ... }
}
```

---

## 🚨 IMPORTANTE

### Si `PANEL_URL` NO está configurada:

El middleware `keyValidator.js` tiene un fallback:

```javascript
if (!PANEL_URL) {
  console.warn('⚠️ PANEL_URL no configurada - Permitiendo acceso sin key (desarrollo)');
  return next(); // Permite acceso
}
```

**Esto es SOLO para desarrollo.** En producción, **DEBES** configurar `PANEL_URL`.

---

## 📊 VARIABLES DE ENTORNO COMPLETAS

### API Principal (.env):
```env
SEEKER_USER=tu_usuario
SEEKER_PASS=tu_password
PANEL_URL=https://web-production-a57a5.up.railway.app
NODE_ENV=development
PORT=8080
REQUEST_TIMEOUT_MS=60000
```

### Panel Admin (.env):
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://usuario:pass@cluster.mongodb.net/apiPanel
JWT_SECRET=tu_secreto_super_seguro
PORT=3001
API_URL=https://tu-api-principal.railway.app
```

---

## 🎯 CHECKLIST

- [ ] Crear `.env` en la API principal
- [ ] Agregar `PANEL_URL=https://web-production-a57a5.up.railway.app`
- [ ] Reiniciar la API (`npm start`)
- [ ] Verificar en logs que aparezca el Panel URL
- [ ] Probar endpoint sin key (debe fallar)
- [ ] Crear key en el panel
- [ ] Probar endpoint con key (debe funcionar)
- [ ] ✅ ¡Listo!

---

## 💡 NOTA

**NO** incluyas la barra final `/` en la URL:

✅ **CORRECTO:**
```env
PANEL_URL=https://web-production-a57a5.up.railway.app
```

❌ **INCORRECTO:**
```env
PANEL_URL=https://web-production-a57a5.up.railway.app/
```

El código ya agrega las rutas automáticamente.

---

¿Necesitas ayuda configurándolo? 🚀


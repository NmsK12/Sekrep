# ⚡ Configuración Rápida - SUSalud

## 🎯 Paso a Paso (5 minutos)

### 1️⃣ Capturar Tokens del Navegador

1. **Abre Chrome/Firefox** en modo incógnito (recomendado)
2. **Presiona F12** (DevTools)
3. **Ve a pestaña "Network"** o "Red"
4. **Marca "Preserve log"** (preservar registro)
5. **Ve a**: `https://app8.susalud.gob.pe:8380/login`
6. **Ingresa**:
   - Usuario: `42316999`
   - Password: `k574774g`
   - **Resuelve el CAPTCHA** ✅
7. **En Network, busca**: `autenticar` (método POST)
8. **Click en esa petición** → Pestaña **"Response"**
9. **Copia estos valores**:

```json
{
  "data": {
    "accessToken": "eyJhbGci... (MUY LARGO)",
    "refreshToken": "eyJhbGci... (MUY LARGO)"
  }
}
```

---

### 2️⃣ Configurar en Local

#### Opción A: Archivo `.env` (Desarrollo Local)

Crea o edita el archivo `.env` en la raíz del proyecto:

```env
# SUSalud Tokens
SUSALUD_ACCESS_TOKEN=eyJhbGciOiJIUzI1NiJ9.eyJjYXJnb... (PEGA EL TOKEN COMPLETO AQUÍ)
SUSALUD_REFRESH_TOKEN=eyJhbGciOiJIUzI1NiJ9.eyJjYXJnb... (PEGA EL REFRESH TOKEN AQUÍ)
```

**⚠️ IMPORTANTE**: Los tokens son **MUY LARGOS** (400+ caracteres). Cópialos completos.

#### Opción B: PowerShell (Windows - Sesión Actual)

```powershell
$env:SUSALUD_ACCESS_TOKEN="eyJhbGci... (token completo)"
$env:SUSALUD_REFRESH_TOKEN="eyJhbGci... (refresh token completo)"
```

#### Opción C: Bash (Linux/Mac - Sesión Actual)

```bash
export SUSALUD_ACCESS_TOKEN="eyJhbGci... (token completo)"
export SUSALUD_REFRESH_TOKEN="eyJhbGci... (refresh token completo)"
```

---

### 3️⃣ Reiniciar el Servidor

```bash
# Detén el servidor (Ctrl + C)
# Reinicia
npm start
# o
node server.js
```

**Deberías ver**:
```
✅ Servicio SUSalud inicializado con tokens configurados
   Access Token: eyJhbGciOiJIUzI1NiJ9.eyJjYXJ...
```

---

### 4️⃣ Probar el Endpoint

```bash
# Con una API key válida
curl "http://localhost:3000/salud/44443333?key=TU_API_KEY"
```

**Respuesta esperada**:
```json
{
  "success": true,
  "message": "Consulta de seguros de salud exitosa",
  "data": {
    "dni": "44443333",
    "nombreCompleto": "ROMAINA SILVA, LISMELI",
    "seguros": [...],
    "totalSeguros": 11
  }
}
```

---

## 🔄 ¿Cuándo Renovar los Tokens?

- **accessToken**: Expira cada **10 minutos** (se renueva automático)
- **refreshToken**: Expira cada **24 horas**

### Después de 24 Horas:

1. Repite el **Paso 1** (capturar nuevos tokens)
2. Actualiza las variables de entorno
3. Reinicia el servidor

---

## ⚠️ Problemas Comunes

### Error: "Token expirado"
**Solución**: El refreshToken expiró (24 horas). Captura nuevos tokens.

### Error: "Timeout"
**Solución**: No tienes tokens configurados o están mal copiados. Verifica que sean completos.

### Error: "Access denied"
**Solución**: Token inválido. Asegúrate de copiar el token **completo** (sin espacios).

---

## 🚀 En Producción (Railway/Render)

1. **Ve al Dashboard** de tu servicio
2. **Variables de Entorno** → **Add Variable**
3. **Agrega**:
   ```
   SUSALUD_ACCESS_TOKEN = eyJhbGci... (token completo)
   SUSALUD_REFRESH_TOKEN = eyJhbGci... (refresh token completo)
   ```
4. **Guarda y redeploy**

---

## 📋 Checklist

- [ ] Capturé los tokens del navegador
- [ ] Los tokens están completos (400+ caracteres cada uno)
- [ ] Configuré las variables de entorno
- [ ] Reinicié el servidor
- [ ] Vi el mensaje "✅ Servicio SUSalud inicializado"
- [ ] Probé el endpoint y funciona

---

## 💡 Tips

1. **Usa modo incógnito** para evitar conflictos de sesión
2. **Copia el token completo** - son muy largos
3. **Los tokens NO llevan comillas** en el archivo .env
4. **Guarda los tokens** en un lugar seguro (no los pierdas)
5. **Configura un recordatorio** para renovar cada 24 horas

---

**¿Necesitas ayuda?** Lee `SUSALUD_GUIA_COMPLETA.md` para más detalles.


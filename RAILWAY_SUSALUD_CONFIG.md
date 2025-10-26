# 🚂 Configuración de SUSalud en Railway

## 🔧 Variables de Entorno a Configurar

Ve a tu proyecto en Railway → **Variables** → Agrega estas 2 variables:

### 1️⃣ SUSALUD_ACCESS_TOKEN
```
eyJhbGciOiJIUzI1NiJ9.eyJjYXJnbyI6IkFVWElMSUFSIERFIEVTVEFEw41TVElDQSIsInRpcG8iOiIyIiwiY29kaWdvQXJlYSI6MTEwMCwiY29kaWdvUGVyc29uYSI6MTI0MTYwLCJub21icmVzUGVyc29uYSI6IktSSVNTIEdJTiIsImFwUGF0ZXJub1BlcnNvbmEiOiJOVcORRVoiLCJhcE1hdGVybm9QZXJzb25hIjoiQ0FSQVpBUyIsImNvcnJlb1BlcnNvbmEiOiJrZ25jYXJhemFzQGdtYWlsLmNvbSIsInRlbGVmb25vUGVyc29uYSI6IjkzOTcxNzA4MCIsImRuaVBlcnNvbmEiOiI0MjMxNjk5OSIsInVzdWFyaW8iOiI0MjMxNjk5OSIsInVzdUV4dGVybm8iOnRydWUsImNvZEFyZWEiOjExMDAsImNvZFVzdWFyaW8iOjE0MDc0MiwiZWNvZGlnbyI6MSwiaWF0IjoxNzYxNDM5OTI2LCJleHAiOjE3NjE0NDA1MjZ9.9wlc56Ou-CPJq4FPOeZle5VqhVvw9rqxLOqFW9GAuZc
```

### 2️⃣ SUSALUD_REFRESH_TOKEN
```
eyJhbGciOiJIUzI1NiJ9.eyJjYXJnbyI6IkFVWElMSUFSIERFIEVTVEFEw41TVElDQSIsInRpcG8iOiIyIiwiY29kaWdvQXJlYSI6MTEwMCwiY29kaWdvUGVyc29uYSI6MTI0MTYwLCJub21icmVzUGVyc29uYSI6IktSSVNTIEdJTiIsImFwUGF0ZXJub1BlcnNvbmEiOiJOVcORRVoiLCJhcE1hdGVybm9QZXJzb25hIjoiQ0FSQVpBUyIsImNvcnJlb1BlcnNvbmEiOiJrZ25jYXJhemFzQGdtYWlsLmNvbSIsInRlbGVmb25vUGVyc29uYSI6IjkzOTcxNzA4MCIsImRuaVBlcnNvbmEiOiI0MjMxNjk5OSIsInVzdWFyaW8iOiI0MjMxNjk5OSIsInVzdUV4dGVybm8iOnRydWUsImNvZEFyZWEiOjExMDAsImNvZFVzdWFyaW8iOjE0MDc0MiwiZWNvZGlnbyI6MSwiaWF0IjoxNzYxNDM5OTI2LCJleHAiOjE3NjE1MjYzMjZ9.oSbN3LYMpo7QkJToHAPwEzJBR_P7GZXIewS-AaiM8Ik
```

---

## 📋 Pasos Rápidos:

1. **Entra a Railway**: https://railway.app
2. **Tu proyecto** → pestaña **Variables**
3. **Click en "New Variable"**
4. Copia y pega cada variable:
   - Nombre: `SUSALUD_ACCESS_TOKEN`
   - Valor: (el token largo de arriba)
5. Repite para `SUSALUD_REFRESH_TOKEN`
6. **Railway reiniciará automáticamente** el servicio

---

## ✅ Verificar que Funciona

Una vez configurado, ve a:
```
https://TU-DOMINIO-RAILWAY.up.railway.app/salud/44443333?key=TU_API_KEY
```

Deberías ver:
```json
{
  "success": true,
  "message": "Consulta de seguros de salud exitosa",
  "data": {
    "dni": "44443333",
    "nombres": "LISMELI",
    "apellidoPaterno": "ROMAINA",
    ...
  }
}
```

---

## ⚠️ Importante: Renovación de Tokens

### Opción A: Renovación Automática (24 horas) ✅
- El `refreshToken` dura **24 horas**
- El sistema renueva el `accessToken` automáticamente
- Solo necesitas actualizar tokens **1 vez al día**

### Cuándo Actualizar:
Cada **24 horas**, captura tokens nuevos y actualízalos en Railway:
1. Ve a: https://app8.susalud.gob.pe:8380/login
2. Login → F12 → Network → busca "autenticar"
3. Copia los nuevos tokens
4. Railway → Variables → Actualiza los valores
5. Railway reinicia automáticamente

---

## 🚀 Estado del Endpoint:

✅ `/salud/:dni` - Consultar seguros de salud  
✅ Renovación automática de tokens  
✅ Caché permanente activado  
✅ Logs detallados para debugging  

---

**NOTA**: El `.env` está protegido y NO se sube a GitHub por seguridad. Por eso necesitas configurar las variables manualmente en Railway.


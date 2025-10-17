# 🚀 Guía de Despliegue en Railway

## Pasos para desplegar en Railway

### 1. **Preparar el repositorio**
```bash
# Asegúrate de que todos los archivos estén committeados
git add .
git commit -m "Preparar para Railway deployment"
git push origin main
```

### 2. **Conectar con Railway**
1. Ve a [Railway.app](https://railway.app)
2. Inicia sesión con tu cuenta de GitHub
3. Haz clic en "New Project"
4. Selecciona "Deploy from GitHub repo"
5. Busca y selecciona `NmsK12/Sekrep`

### 3. **Configurar Variables de Entorno**
En el dashboard de Railway, ve a la pestaña "Variables" y agrega:

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

### 4. **Configurar Dominio (Opcional)**
1. En Railway, ve a la pestaña "Settings"
2. En "Domains", puedes configurar un dominio personalizado
3. Railway también proporciona un dominio automático

### 5. **Monitorear el Despliegue**
1. Ve a la pestaña "Deployments" para ver el progreso
2. Revisa los logs en tiempo real
3. Verifica que el health check pase

### 6. **Probar la API**
Una vez desplegado, prueba los endpoints:

```bash
# Información de la API
curl "https://tu-proyecto.railway.app/"

# Consulta DNI con caché (recomendado)
curl "https://tu-proyecto.railway.app/api/consulta/simple=dni?dni=80660243"

# Estadísticas del caché
curl "https://tu-proyecto.railway.app/api/consulta/cache-stats"
```

## 🎯 Características del Despliegue

### ✅ **Optimizaciones incluidas:**
- **Caché inteligente** para consultas repetidas
- **Rate limiting** para prevenir abuso
- **Health checks** automáticos
- **Logs en tiempo real**
- **Escalado automático**

### 📊 **Monitoreo:**
- Métricas de CPU y memoria
- Logs de aplicación
- Alertas de errores
- Estadísticas de uso

### 🔧 **Mantenimiento:**
- Deploy automático en cada push
- Rollback fácil si hay problemas
- Variables de entorno seguras
- Backup automático

## 🚨 Solución de Problemas

### Error de conexión:
- Verificar variables de entorno
- Revisar logs de Railway
- Comprobar que el puerto sea 3000

### Error de autenticación:
- Verificar credenciales en variables de entorno
- Comprobar que las URLs sean correctas

### Error de memoria:
- Railway escala automáticamente
- Revisar métricas de uso
- Optimizar consultas si es necesario

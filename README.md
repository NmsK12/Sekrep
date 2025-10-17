# Sekrep API (Puente Simple)

Servicio web en Node/Express que inicia sesión en `seeker.lat` y expone endpoints:

- `GET /api/dni?dni=XXXXXXXX`
- `GET /api/nombres?nombres=NOMBRE-PATERNO-MATERNO`

## Despliegue en Railway

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


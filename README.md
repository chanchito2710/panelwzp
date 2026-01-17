# WhatsApp Panel Multi-Dispositivo

Panel web/desktop para administrar múltiples sesiones de WhatsApp (sucursales), con chat, plantillas, archivos y estadísticas.

## Estructura

- `backend/`: API + Socket.IO + Baileys (WhatsApp)
- `frontend/`: Vite + React + Ant Design
- `desktop/`: Electron (empaqueta frontend y levanta backend local)

## Requisitos

- Node.js (LTS recomendado)
- WhatsApp en el teléfono para vincular dispositivos

## Configuración (seguridad)

El acceso al panel está protegido por usuario/contraseña.

- Backend:
  - `APP_USERNAME` (default: `admin`)
  - `APP_PASSWORD` (default: `admin`)
  - `APP_AUTH_SECRET` (default dev: `dev-secret-change-me`)
- La contraseña puede cambiarse desde Configuración (se guarda hasheada en `db/app-auth.json`).
- La carpeta `db/` está ignorada por git (no se suben credenciales).

## Desarrollo (web)

### 1) Backend

```bash
cd backend
npm install
npm run start
```

Levanta en `http://127.0.0.1:5000`.

### 2) Frontend

```bash
cd frontend
npm install
npm run dev
```

El frontend usa proxy a `http://127.0.0.1:5000` (según `vite.config.ts`) o variables:

- `VITE_API_BASE`
- `VITE_SOCKET_URL`

## Desktop (Electron)

```bash
cd desktop
npm install
npm run dev
```

Para empaquetar:

```bash
cd desktop
npm run build
```

## Notas

- No subir la carpeta `db/` ni archivos `.env*`.
- Si querés resetear la contraseña al default, borrá `db/app-auth.json`.


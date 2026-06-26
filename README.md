# AlquiListo

Plataforma de alquiler de propiedades con verificación de documentos por IA.

## Stack

- **Frontend:** React 19, Vite 4, Tailwind 3, react-router-dom 6, Axios
- **Backend:** Node.js 16, Express, PostgreSQL (Neon), JWT
- **AI:** Groq (llama-3.3-70b-versatile) para interpretación de búsquedas y ranking
- **File Storage:** Vercel Blob (producción) / disco local (dev)
- **Email:** Resend (transaccional)
- **Deploy:** Vercel (frontend static + API serverless)

## URLs

| Entorno | URL |
|---|---|
| Producción | `https://alqui-listo.vercel.app` |
| API | `https://alqui-listo.vercel.app/api` |

## Usuarios de prueba

| Email | Contraseña | Rol |
|---|---|---|
| `inqui@test.com` | `123456` | Inquilino (verificado, score 80) |
| `prop@test.com` | `123456` | Propietario |
| `admin@alquilisto.com` | `admin123` | Admin |

## Setup local

```bash
# Backend
cd backend
cp .env.example .env   # configurar DATABASE_URL, JWT_SECRET, etc.
npm run migrate
npm run seed
npm run dev            # http://localhost:4000

# Frontend
cd frontend
cp .env.example .env   # VITE_API_URL=http://localhost:4000/api
npm run dev            # http://localhost:5173
```

## Tests

```bash
cd backend
npm test               # corre contra alquilisto_test
```

## Deploy

El monorepo se deploya completo a Vercel desde la raíz. El `vercel.json` define:
- Frontend como static SPA (`frontend/dist`)
- API como serverless function (`api/index.js`)
- Rewrites SPA para react-router

Variables de entorno requeridas en Vercel (Production):
- `DATABASE_URL` — conexión a Neon PostgreSQL con `sslmode=require`
- `JWT_SECRET` — secreto para firmar tokens
- `BLOB_READ_WRITE_TOKEN` — token de Vercel Blob
- `VITE_API_URL=/api` — URL relativa (mismo origen)
- `FRONTEND_URL=https://alqui-listo.vercel.app`
- `GROQ_API_KEY` — para búsqueda semántica
- `RESEND_API_KEY` — para emails (opcional)

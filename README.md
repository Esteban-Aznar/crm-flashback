# CRM Flashback

Aplicación web de gestión interna para Flashback.

## Stack

- **Backend**: Node.js + Express + PostgreSQL
- **Frontend**: React + Vite

## Inicio rápido

### 1. Configurar base de datos

```bash
cd backend
cp .env.example .env
# Editar .env con tus credenciales de PostgreSQL
npm install
npm run init-db
```

### 2. Arrancar backend

```bash
cd backend
npm run dev
# Puerto 5000
```

### 3. Arrancar frontend

```bash
cd frontend
npm install
npm run dev
# Puerto 3000
```

## Credenciales admin (desarrollo)

Las credenciales iniciales se configuran en el script `backend/src/models/init.js` y se pueden cambiar tras el primer login.

# TRUX

Seguimiento y auditoría de viajes de una flota. Proyecto personal de Franklin Rodríguez.

> Estado: etapa 1 (base). Los datos de la demo son ilustrativos.

## Qué hace hoy

- Inicio de sesión con dos roles:
  - **Empresa**: ve el panel de operaciones con todos los viajes y los retrasados.
  - **Conductor**: ve solo sus viajes y los inicia o completa.
- Un viaje se marca **retrasado** automáticamente si pasó su hora prevista de llegada y no está completado.
- Cada cambio de estado queda **auditado** (quién, cuándo, estado anterior y nuevo) en la misma transacción.

## Stack

Next.js 16 (App Router) · TypeScript · PostgreSQL · Prisma 7 · jose (sesión JWT en cookie httpOnly) · Tailwind CSS · Vitest

## Arquitectura

Arquitectura limpia: las dependencias apuntan hacia el dominio.

```
src/
  domain/          Reglas puras: roles y permisos, transiciones de estado, retraso. Sin Next ni Prisma.
  application/     Casos de uso (login, listar viajes, cambiar estado) y puertos (interfaces).
  infrastructure/  Prisma, repositorios, contexto RLS, bcrypt, sesión.
  composition/     Raíz de composición: conecta casos de uso con implementaciones.
  app/             Interfaz (Next.js): páginas y Server Actions. Solo habla con composition/.
  proxy.ts         Protección de rutas.
```

## Seguridad en tres capas

1. **Proxy** (`src/proxy.ts`): sin sesión redirige a `/login`; `/empresa` y `/conductor` exigen su rol.
2. **Servidor** (`requireActor()`): cada página y Server Action vuelve a validar la sesión y el rol.
3. **Base de datos (RLS)** (`prisma/migrations/*_rls`): PostgreSQL filtra por empresa y, para conductores, por viajes propios. Sin contexto no se ve ninguna fila, un conductor solo puede cambiar el estado (un trigger bloquea cambios de ruta) y el historial de auditoría no se puede editar ni borrar.

La app fija el contexto RLS con `set_config(..., true)` dentro de una transacción por petición, así no se filtra entre conexiones del pool.

## Correr en local

Requisitos: Node 22 y PostgreSQL 16 con un rol **sin** superusuario.

```bash
cp .env.example .env      # completa DATABASE_URL y SESSION_SECRET
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

Usuarios de demo (contraseña `trux1234`): `empresa@trux.demo`, `conductor@trux.demo`.

## Pruebas

```bash
npm test          # dominio y casos de uso
npm run test:db   # además, RLS contra PostgreSQL (requiere el seed)
```

## Próximas etapas

Gestión de vehículos, creación de viajes, filtros del panel e historial visible por viaje. Fuera del MVP (trabajo futuro): GPS en tiempo real, optimización de rutas y notificaciones.

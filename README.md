# Prueba Técnica Backend – NestJS + TypeScript + PostgreSQL + Prisma

API REST construida con **NestJS**, **TypeScript**, **PostgreSQL** y **Prisma** para gestión de **Usuarios** y **Tareas** (many-to-many), con filtros combinables y endpoints de analítica.

## Repositorio

Repositorio (público): https://github.com/JesusKno/PruebaBackEndPuul.git  
Rama principal: `main`

---

## Requisitos

- Node.js **20.20.0** (recomendado)
- PostgreSQL (local)
- npm

---

## Setup rápido

### 1) Clonar el repositorio

```bash
git clone https://github.com/JesusKno/PruebaBackEndPuul.git
cd PruebaBackEndPuul

2) Instalar dependencias

npm install

3) Configurar variables de entorno

Crea un archivo .env en la raíz del proyecto:
DATABASE_URL="postgresql://postgres:<PASSWORD>@localhost:5432/puulbd?schema=public"

4) Migraciones Prisma

npx prisma generate
npx prisma migrate dev

5) Seed de catálogos (roles y estatus)

Este proyecto incluye un seed en TypeScript:

npm run db:seed

El seed inserta catálogos en español:

Roles: ADMINISTRADOR, MIEMBRO

Estatus: ACTIVA, TERMINADA

6) Levantar el servidor

npm run start:dev

Servidor por defecto:

http://localhost:3000


7) Modelo de datos (resumen)

UserRole: catálogo de roles

TaskStatus: catálogo de estatus

User

Task

TaskAssignee: relación many-to-many entre User y Task

8) Endpoints
Users
Crear usuario

POST /users

Body:

{
  "name": "Juan Perez",
  "email": "juan.perez@test.com",
  "role": "MIEMBRO"
}
Listar usuarios (con filtros + métricas)

GET /users

Query params opcionales:

name

email

role (MIEMBRO | ADMINISTRADOR)

Incluye métricas por usuario:

cantidad de tareas TERMINADA

suma total de cost_task de tareas TERMINADA

Obtener usuario por id

GET /users/:id

Actualizar usuario

PATCH /users/:id

Body (ejemplo):

{
  "name": "Juan Perez Updated",
  "role": "ADMINISTRADOR"
}
Eliminar usuario

DELETE /users/:id

Tasks
Crear tarea (incluye asignación de usuarios)

POST /tasks

Body:

{
  "title": "Tarea 1",
  "description": "Descripcion de tarea",
  "estimatedHours": 10,
  "spentHours": 2,
  "dueDate": "2026-03-10T00:00:00.000Z",
  "status": "ACTIVA",
  "cost": 1500,
  "assigneeIds": [1, 2]
}

spentHours es opcional.

Listar tareas (orden y filtros combinables)

GET /tasks

Orden:

por created_at desc (más reciente → más antigua)

Query params opcionales (combinables):

status (ACTIVA | TERMINADA)

assigneeId (id de usuario asignado)

title (búsqueda por contains)

dueDateFrom (ISO)

dueDateTo (ISO)

assigneeQuery (búsqueda por nombre o correo del usuario asignado)

Ejemplo:
GET /tasks?status=ACTIVA&assigneeId=2&title=Tarea&dueDateFrom=2026-03-01T00:00:00.000Z&dueDateTo=2026-03-30T00:00:00.000Z&assigneeQuery=@test.com

Obtener tarea por id

GET /tasks/:id

Actualizar tarea (incluye reasignación de usuarios)

PATCH /tasks/:id

Ejemplo:

{
  "title": "Tarea 1 - Updated",
  "status": "TERMINADA",
  "assigneeIds": [2, 3]
}

Si assigneeIds viene en el request, se realiza replace de asignaciones (reescritura total).

Asignar usuarios adicionales a tarea

POST /tasks/:id/assignees

Body:

{
  "assigneeIds": [3, 2]
}

Si un usuario ya estaba asignado, se ignora (no duplica) por PK compuesta y skipDuplicates.

Eliminar tarea

DELETE /tasks/:id

Analytics

Se incluyen endpoints de analítica para consulta separada (y un endpoint agregado).

Analytics agregado

GET /tasks/analytics

Retorna:

tasksByStatus

topUsersByTerminatedCost

Conteo por estatus

GET /tasks/analytics/status

Top usuarios por costo total en tareas TERMINADAS

GET /tasks/analytics/top-users?limit=5
```

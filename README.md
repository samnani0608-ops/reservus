# Reservus

Reservus es una aplicación web para consultar salas, revisar su disponibilidad y
crear o cancelar reservas. La seguridad y las reglas de negocio se aplican en
PostgreSQL mediante RLS, restricciones y funciones RPC; la interfaz no es la
fuente de autoridad.

## Tecnologías

- Next.js 16 con App Router y React 19
- TypeScript estricto y Tailwind CSS
- Supabase Auth, PostgreSQL y Row Level Security
- Zod para validar entradas de formularios
- GitHub Actions para TypeScript, ESLint y build

## Requisitos

- Node.js 20 o superior
- npm
- Un proyecto de Supabase
- Supabase CLI para aplicar migraciones

## Instalación

```bash
npm install
```

Crear `.env.local` a partir de `.env.example` y completar como mínimo:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://TU_PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=TU_CLAVE_PUBLICABLE
```

La `SUPABASE_SERVICE_ROLE_KEY` es privada y se usa únicamente al ejecutar el
seed local. Nunca debe llevar el prefijo `NEXT_PUBLIC_`, llegar al navegador ni
guardarse en Git.

## Base de datos

Vincular el proyecto y aplicar todas las migraciones:

```bash
npx supabase login
npx supabase link --project-ref TU_PROJECT_REF
npx supabase db push
```

Las migraciones de `supabase/migrations/` crean tablas, restricciones, RLS y las
RPC. No se deben editar migraciones ya aplicadas.

## Ejecución

```bash
npm run dev
```

La aplicación queda disponible en `http://localhost:3000`.

Comprobaciones de calidad:

```bash
npm run typecheck
npm run lint
npm run build
```

## Datos iniciales

El seed crea o reutiliza tres usuarios de prueba, tres salas y diez reservas para
el próximo lunes. Requiere en `.env.local`:

```dotenv
SUPABASE_SERVICE_ROLE_KEY=
SEED_USER_PASSWORD=
```

Después se ejecuta:

```bash
npm run seed
```

Usuarios creados:

| Correo | Rol |
| --- | --- |
| `member1@reservus.local` | member |
| `member2@reservus.local` | member |
| `admin@reservus.local` | admin |

Los tres usan el valor configurado en `SEED_USER_PASSWORD`. El script es
idempotente para usuarios y salas; reemplaza las reservas de esos usuarios en
la fecha elegida para mantener exactamente diez.

## Modelo de datos

### `profiles`

Extiende `auth.users` con el rol `member` o `admin`. Un trigger crea el perfil
como `member` al registrarse; el cliente no puede asignarse el rol de admin.

### `rooms`

Contiene nombre, capacidad y estado activo. Desactivar una sala impide reservas
nuevas, pero conserva su historial y sus reservas existentes.

### `reservations`

Relaciona usuario y sala con inicio, final y estado. PostgreSQL impide solapes
activos con una exclusión GiST. Las reservas canceladas no bloquean el horario.

## Reglas principales

- Horario de 07:00 a 21:00 en `America/Costa_Rica`.
- Inicio y final en bloques de 30 minutos.
- Duración entre 1 y 3 horas.
- Mínimo 30 minutos y máximo 14 días de anticipación.
- Máximo 3 reservas activas por semana para members.
- La semana se calcula de lunes a domingo según `start_at` en Costa Rica.
- Los admins están exentos solo del límite semanal.
- La cancelación se permite hasta 2 horas antes; el admin debe indicar motivo.

Los detalles y tradeoffs están en [DECISIONES.md](./DECISIONES.md). El diseño de
RLS, privilegios y pruebas de ataques está en [SEGURIDAD.md](./SEGURIDAD.md).

## Funcionalidad

- Registro, confirmación de correo, inicio y cierre de sesión.
- Dashboard privado con salas activas.
- Disponibilidad diaria sin exponer propietarios de reservas.
- Creación segura mediante `create_reservation`.
- Vista “Mis reservas”, cupo semanal y cancelación propia.
- Panel admin para crear, editar o desactivar salas.
- Filtros admin por sala, usuario, estado y fecha.
- Cancelación admin con motivo obligatorio.
- Redirección de rutas privadas y protección de `/admin` por rol.

## Pruebas reproducibles

### Concurrencia

Configurar las variables `CONCURRENCY_*` de `.env.example` con una cuenta admin,
una sala activa y un bloque válido que empiece entre 2 horas y 14 días en el
futuro. Usar admin evita que el límite semanal oculte el resultado de la prueba
de solape. Después ejecutar:

```bash
npm run test:concurrency
```

El script lanza diez llamadas simultáneas para la misma sala y bloque. Debe
obtener exactamente un éxito y nueve errores `23P01` de exclusión, y cancela
toda reserva creada.

### Seguridad

Configurar las variables `SECURITY_*` con un member sin reservas activas en la
semana del próximo lunes, una sala libre entre 15:00 y 19:00 y una reserva activa
perteneciente a otro usuario. Después ejecutar:

```bash
npm run test:security
```

El script intenta escalar rol, escribir directamente en tablas protegidas,
consultar o cancelar una reserva ajena, reservar fuera de horario y superar el
límite semanal. Termina con error si algún bypass es aceptado.

También deben comprobarse manualmente:

- `/dashboard` y `/reservations` sin sesión redirigen a `/login`.
- `/admin` sin sesión redirige a `/login`.
- `/admin` como member redirige a `/dashboard`.

## CI y despliegue

Cada Pull Request hacia `dev` o `main` ejecuta instalación reproducible,
TypeScript, ESLint y build mediante `.github/workflows/ci.yml`.

Para Vercel se configuran las dos variables públicas de Supabase. Antes de la
prueba de producción también deben configurarse en Supabase las URLs permitidas
de confirmación y redirección de autenticación.

## Estado conocido

La funcionalidad esencial está implementada. Quedan fuera de este bloque la
validación visual completa en dispositivos móviles y el despliegue final a
Vercel. El panel muestra UUID de usuarios porque `profiles` no replica correos de
`auth.users`, evitando exponer datos de autenticación mediante la API pública.

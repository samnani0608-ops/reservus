# Seguridad de Reservus

## Principio general

Reservus no confía en controles del navegador. Un usuario puede modificar HTML,
llamar la API REST o invocar una RPC sin usar la interfaz. Por eso Zod mejora la
respuesta de la UI, pero PostgreSQL conserva la autoridad mediante privilegios,
RLS, restricciones y funciones `security definer` controladas.

Las tablas `profiles`, `rooms` y `reservations` tienen RLS habilitado. La
migración `20260919210000_harden_permissions_and_cancellation.sql` revoca primero
los privilegios de `anon` y `authenticated` y concede únicamente las operaciones
necesarias. La `service_role` no se utiliza en el cliente.

## Políticas de `profiles`

### Lectura del perfil propio

Un usuario autenticado puede seleccionar únicamente la fila cuyo `id` coincide
con `auth.uid()`. Esto permite consultar su rol sin revelar perfiles ajenos.

### Escrituras bloqueadas

Insert, update y delete están bloqueados por RLS y no tienen privilegio directo.
Esto evita que un member cambie su rol a admin o cree un perfil falso. El perfil
real se crea mediante un trigger de `auth.users` con rol `member` por defecto.

## Políticas de `rooms`

### Lectura

Los usuarios autenticados pueden consultar salas activas. También pueden leer la
sala asociada a una reserva propia, aunque luego haya sido desactivada, para no
perder el nombre en su historial. El admin dispone de una política adicional
para ver todas. El dashboard filtra siempre el catálogo por `is_active`.

### Creación y edición

Solo un usuario cuyo perfil tiene rol `admin` satisface las políticas de insert y
update. El member puede tener privilegios de consulta, pero RLS impide estas
mutaciones.

### Eliminación

No existe política delete y el rol `authenticated` no recibe ese privilegio. Las
salas se desactivan en lugar de eliminarse, lo que conserva referencias e
historial.

## Políticas de `reservations`

### Lectura

El propietario puede consultar sus reservas. Un admin puede consultar todas para
operar el panel. Un member no puede obtener una reserva ajena aunque conozca su
UUID.

### Escrituras directas bloqueadas

`authenticated` recibe solo select sobre la tabla y no existen políticas de
insert, update o delete. Esta doble barrera evita elegir otro `user_id`, alterar
horarios, cambiar estados o borrar historial desde la Data API.

Las mutaciones se realizan exclusivamente mediante `create_reservation` y
`cancel_reservation`.

## RPC `create_reservation`

La función recibe sala, inicio y final; nunca recibe `user_id`. Obtiene al
propietario desde `auth.uid()` y comprueba que exista un perfil y una sala activa.

La RPC y las restricciones de tabla aplican:

- mínimo 30 minutos y máximo 14 días de anticipación;
- horario 07:00–21:00 en Costa Rica;
- bloques de 30 minutos y duración de 1 a 3 horas;
- máximo 3 reservas activas por semana para members;
- excepción del máximo semanal para admins;
- exclusión GiST de solapes activos por sala.

Un advisory lock por usuario y semana serializa el conteo semanal. La exclusión
GiST resuelve intentos concurrentes sobre el mismo bloque: solo uno puede
confirmarse aunque los clientes hayan consultado disponibilidad antes.

## RPC `cancel_reservation`

La función exige sesión y bloquea la fila durante la operación. Un member puede
cancelar solo una reserva propia; un admin puede cancelar cualquiera y debe
indicar un motivo. Ambos roles deben hacerlo al menos dos horas antes del inicio.

La autorización se incluye en la búsqueda inicial para no confirmar si un UUID
ajeno existe o está cancelado. El motivo se normaliza y se limita a 300
caracteres. La reserva cambia a `cancelled`; no se borra, y libera el bloque y el
cupo semanal.

## RPC de disponibilidad

`get_room_availability` requiere un usuario autenticado y una sala activa. Es
`security definer` porque debe consultar reservas de todos los propietarios, pero
solo devuelve `start_at` y `end_at`. No expone UUID de reserva, usuario, motivo ni
otros datos privados.

## Ataques comprobables

| Intento | Defensa esperada |
| --- | --- |
| Crear una reserva para otro `user_id` | Sin privilegio insert; la RPC no acepta `user_id` |
| Cancelar una reserva ajena | Autorización dentro de `cancel_reservation` |
| Crear, editar o eliminar una sala como member | Privilegios mínimos y RLS admin |
| Superar tres reservas activas semanales | Conteo y advisory lock en la RPC |
| Reservar a las 22:00 | Restricción SQL de horario |
| Insertar, editar o borrar reservas por REST | Sin privilegios ni políticas de escritura |
| Cambiar el rol propio | Sin privilegio y políticas falsas de escritura |
| Leer una reserva ajena | RLS por propietario o admin |
| Entrar a una ruta privada sin sesión | Guard de servidor y redirección a `/login` |
| Entrar a `/admin` como member | Verificación de perfil y redirección a `/dashboard` |

`npm run test:security` ejecuta los intentos de base de datos con una sesión real
de member. `npm run test:concurrency` lanza diez solicitudes simultáneas y exige
un éxito y nueve rechazos. Las redirecciones se comprueban manualmente porque
dependen de las cookies de la aplicación web.

## Manejo de secretos

- `.env.local` está ignorado por Git.
- `.env.example` contiene nombres, nunca valores.
- Las variables `NEXT_PUBLIC_*` son públicas por diseño.
- `SUPABASE_SERVICE_ROLE_KEY` se limita al seed ejecutado por un operador local.
- GitHub Actions y Vercel reciben variables mediante sus almacenes de secretos.

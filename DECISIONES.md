# Decisiones de Reservus

Las decisiones funcionales se interpretan siempre en `America/Costa_Rica`.

## D1 — Definición de semana

**Problema:** el límite de reservas necesita una semana inequívoca, incluso
cuando el servidor o el navegador usan otra zona horaria.

**Opciones consideradas:** semana móvil de siete días, semana según UTC o semana
calendario local.

**Decisión:** la semana va de lunes a domingo y una reserva pertenece a la semana
de su `start_at` convertido a la fecha local de Costa Rica.

**Motivo:** produce un cupo predecible para usuarios y administradores y evita
que UTC cambie el día de una reserva cercana a medianoche.

**Tradeoff:** el cupo se reinicia al comenzar cada lunes; no limita cualquier
ventana móvil de siete días consecutivos.

## D2 — Reservas canceladas y cupo

**Problema:** definir si una cancelación continúa consumiendo el cupo semanal.

**Opciones consideradas:** contar todo el historial o contar solo reservas
activas.

**Decisión:** solo las reservas con estado `active` cuentan para el máximo de
tres; una reserva `cancelled` libera tanto el horario como el cupo.

**Motivo:** cancelar permite corregir un plan sin penalizar el resto de la
semana. El historial se conserva para auditoría.

**Tradeoff:** un usuario puede crear más de tres registros históricos durante la
semana si cancela, aunque nunca tendrá más de tres activos.

## D3 — Desactivación de salas

**Problema:** decidir qué ocurre con las reservas existentes al desactivar una
sala.

**Opciones consideradas:** borrar o cancelar reservas futuras, impedir la
desactivación o conservarlas.

**Decisión:** la desactivación bloquea reservas nuevas, pero conserva todas las
reservas existentes y su historial.

**Motivo:** evita una modificación masiva implícita y permite que el admin trate
cada reserva afectada de forma explícita.

**Tradeoff:** pueden quedar reservas futuras activas en una sala inactiva hasta
que un administrador las gestione.

## D4 — Límite semanal para administradores

**Problema:** el personal administrador puede necesitar crear reservas
operativas después de alcanzar el cupo normal.

**Opciones consideradas:** aplicar el mismo máximo a todos o eximir al admin.

**Decisión:** el admin está exento del máximo de tres reservas activas por semana.
Las demás reglas de sala, horario, duración, anticipación y solape sí se aplican.

**Motivo:** el rol administrativo debe poder resolver necesidades operativas sin
abrir una vía para ignorar la integridad del calendario.

**Tradeoff:** un admin puede concentrar muchas reservas y debe usar el privilegio
con criterio.

## D5 — Conflictos concurrentes

**Problema:** dos clientes pueden ver libre el mismo bloque e intentar reservarlo
al mismo tiempo.

**Opciones consideradas:** confiar en la UI, comprobar disponibilidad antes del
insert o imponer exclusión transaccional en PostgreSQL.

**Decisión:** una restricción GiST excluye solapes activos en la misma sala. La
base acepta una operación, rechaza la otra y la interfaz revalida disponibilidad.

**Motivo:** solo la base de datos observa todas las transacciones y puede
garantizar RN01 sin una condición de carrera.

**Tradeoff:** un conflicto esperado llega como error de base de datos y la UI
debe traducirlo a un mensaje claro.

## D6 — Anticipación máxima de nuevas reservas

**Fecha/hora:** 2026-09-19; hora de aprobación no registrada.

**Opciones consideradas:** sin máximo (el PDF no lo exige), 7 días o 14 días.

**Decisión:** miembros y administradores pueden crear reservas desde hoy hasta
hoy + 14 días, inclusive, usando el calendario de `America/Costa_Rica`.
El último día completo está permitido dentro del horario 07:00–21:00.
No es una ventana móvil de exactamente 336 horas.

Se mantiene RN-05: al menos 30 minutos de anticipación. Se mantiene RN-06:
máximo 3 reservas activas por semana para miembros; los administradores siguen
exentos del límite de cantidad, pero no del nuevo límite de anticipación.

Las reservas ya creadas fuera de la ventana se conservan y pueden consultarse.
Por eso el selector de disponibilidad no tiene este máximo. El formulario de
creación no precarga una fecha consultada que esté fuera de la ventana.

**Por qué:** dos semanas permiten planificar reuniones sin bloquear salas con
años de anticipación. La regla fue confirmada explícitamente por el responsable
del proyecto; es una decisión adicional, no un requisito del PDF.

**Qué se sacrifica con esta decisión:** no se pueden programar nuevas reuniones
con más de dos semanas de anticipación, ni siquiera siendo administrador.
Las reservas antiguas pueden quedar temporalmente fuera de la ventana nueva.

**Implementación:** `lib/reservation-dates.ts` centraliza fechas reales y límites
para la Server Action y las propiedades del formulario. El servidor recalcula
la ventana en cada envío. La migración
`20260919200000_limit_reservation_advance.sql` actualiza la RPC sin cambiar su
firma, sus permisos ni las restricciones existentes. La comparación SQL ocurre
antes de la excepción de cantidad semanal para administradores.

El límite del navegador es orientativo: una página abierta durante el cambio de
día puede mostrar el rango anterior hasta recargarse; servidor y base de datos
aplican el calendario actual. La migración debe aplicarse a Supabase para que las
llamadas directas a la RPC queden protegidas por la nueva regla.

**Verificación (2026-09-19):** migración aplicada al proyecto Supabase enlazado y
confirmada en el historial remoto. Prueba SQL transaccional con rol
`authenticated` y perfiles temporales member/admin: ambos aceptaron el día +14,
rechazaron el +15 con el mensaje esperado y consultaron una reserva preexistente
a dos años. El admin reservó el último bloque del día +14 (20:00–21:00).
Los datos de prueba se revirtieron con `ROLLBACK`.

También pasaron 13 comprobaciones de calendario en TypeScript (incluyendo
medianoche de Costa Rica, cambio de año y bisiestos), `npx tsc --noEmit`,
`npm run lint` y `npm run build`. Queda pendiente la comprobación visual del
selector actualizado en el navegador.

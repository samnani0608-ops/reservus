import Link from "next/link";

const features = [
  {
    index: "01",
    title: "Disponibilidad precisa",
    description: "Consultá bloques ocupados por día sin exponer información privada.",
  },
  {
    index: "02",
    title: "Reservas protegidas",
    description: "Las reglas de horario, duración y solapes se validan directamente en la base.",
  },
  {
    index: "03",
    title: "Control central",
    description: "Administrá salas y agenda desde una vista operativa, clara y segura.",
  },
];

export default function Home() {
  return (
    <main className="overflow-hidden">
      <section className="mx-auto grid min-h-[calc(100vh-4.5rem)] max-w-7xl items-center gap-14 px-5 py-16 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:py-24">
        <div>
          <div className="mb-7 inline-flex items-center gap-3 rounded-full border border-emerald-300/20 bg-emerald-300/6 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">
            <span className="size-1.5 rounded-full bg-emerald-300 shadow-[0_0_12px_#6ee7b7]" />
            Agenda operativa en tiempo real
          </div>

          <h1 className="max-w-4xl text-5xl font-black leading-[0.94] tracking-[-0.055em] text-white sm:text-6xl lg:text-8xl">
            El espacio correcto,
            <span className="block bg-gradient-to-r from-emerald-300 via-teal-200 to-sky-300 bg-clip-text text-transparent">
              en el momento exacto.
            </span>
          </h1>

          <p className="mt-7 max-w-2xl text-base leading-8 text-slate-400 sm:text-lg">
            Reservus conecta disponibilidad, reservas y administración en una experiencia rápida.
            Menos coordinación manual. Más tiempo para trabajar.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/register"
              className="rounded-xl bg-emerald-300 px-6 py-3.5 text-center text-sm font-black text-emerald-950 shadow-[0_16px_50px_rgba(52,211,153,0.16)] hover:-translate-y-0.5 hover:bg-emerald-200"
            >
              Crear cuenta
            </Link>
            <Link
              href="/login"
              className="rounded-xl border border-white/12 bg-white/4 px-6 py-3.5 text-center text-sm font-bold text-white hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/7"
            >
              Iniciar sesión
            </Link>
          </div>

          <div className="mt-12 flex flex-wrap gap-x-8 gap-y-3 border-t border-white/8 pt-6 text-xs font-semibold uppercase tracking-[0.15em] text-slate-600">
            <span>Horario 07:00 — 21:00</span>
            <span>Zona America/Costa_Rica</span>
            <span>Protegido por RLS</span>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-xl lg:mx-0">
          <div className="absolute -inset-16 rounded-full bg-emerald-400/8 blur-3xl" />
          <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#0b1119]/88 p-5 shadow-[0_40px_100px_rgba(0,0,0,0.45)] sm:p-7">
            <div className="mb-8 flex items-center justify-between border-b border-white/8 pb-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-600">Vista del día</p>
                <p className="mt-1 text-lg font-bold text-white">Sala Centro</p>
              </div>
              <span className="rounded-full border border-emerald-300/20 bg-emerald-300/8 px-3 py-1 text-xs font-bold text-emerald-300">
                Disponible
              </span>
            </div>

            <div className="grid grid-cols-[3.5rem_1fr] gap-x-4 gap-y-3">
              {["08:00", "10:00", "12:00", "14:00", "16:00", "18:00"].map((time, index) => (
                <div key={time} className="contents">
                  <span className="pt-2 font-mono text-xs text-slate-600">{time}</span>
                  <div className="relative h-10 border-t border-white/7">
                    {(index === 1 || index === 4) && (
                      <span className="absolute inset-x-0 top-1 h-8 rounded-lg border border-sky-300/15 bg-sky-300/8 px-3 py-1.5 text-xs font-semibold text-sky-200">
                        Bloque reservado
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-7 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-white/8 bg-white/3 p-4">
                <p className="text-2xl font-black text-white">3</p>
                <p className="mt-1 text-xs text-slate-500">salas activas</p>
              </div>
              <div className="rounded-xl border border-white/8 bg-white/3 p-4">
                <p className="text-2xl font-black text-emerald-300">14 días</p>
                <p className="mt-1 text-xs text-slate-500">ventana de reserva</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-white/7 bg-black/15">
        <div className="mx-auto grid max-w-7xl divide-y divide-white/7 px-5 sm:px-8 lg:grid-cols-3 lg:divide-x lg:divide-y-0">
          {features.map((feature) => (
            <article key={feature.index} className="py-10 lg:px-8 lg:first:pl-0 lg:last:pr-0">
              <span className="font-mono text-xs font-bold text-emerald-300">{feature.index}</span>
              <h2 className="mt-4 text-xl font-bold text-white">{feature.title}</h2>
              <p className="mt-3 max-w-sm text-sm leading-6 text-slate-500">{feature.description}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

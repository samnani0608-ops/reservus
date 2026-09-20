import Link from "next/link";

import LoginForm from "./login-form";

export default function LoginPage() {
  return (
    <main className="mx-auto grid min-h-[calc(100vh-4.5rem)] max-w-6xl items-center gap-10 px-5 py-14 sm:px-8 lg:grid-cols-2">
      <h1 className="sr-only">Iniciar sesión en Reservus</h1>
      <section className="hidden lg:block">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-300">Acceso seguro</p>
        <h2 className="mt-5 max-w-lg text-6xl font-black leading-[0.95] tracking-[-0.05em] text-white">
          Tu agenda empieza acá.
        </h2>
        <p className="mt-6 max-w-md text-base leading-7 text-slate-400">
          Consultá salas, reservá un bloque y seguí cada movimiento desde una sola cuenta.
        </p>
        <div className="mt-10 flex items-center gap-4 text-sm text-slate-500">
          <span className="grid size-10 place-items-center rounded-full border border-emerald-300/20 bg-emerald-300/8 font-mono text-xs text-emerald-300">01</span>
          Sesiones protegidas por Supabase Auth
        </div>
      </section>

      <section className="mx-auto w-full max-w-md rounded-[1.75rem] border border-white/10 bg-[#0d131c]/92 p-6 shadow-[0_30px_90px_rgba(0,0,0,0.35)] sm:p-9">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-300 lg:hidden">Acceso seguro</p>
        <h2 className="mt-3 text-3xl font-black tracking-[-0.035em] text-white">Iniciar sesión</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">Ingresá tus credenciales para abrir tu espacio de trabajo.</p>
        <LoginForm />
        <p className="mt-7 border-t border-white/8 pt-6 text-center text-sm text-slate-500">
          ¿Primera vez en Reservus?{" "}
          <Link href="/register" className="font-bold text-emerald-300 hover:text-emerald-200">
            Crear cuenta
          </Link>
        </p>
      </section>
    </main>
  );
}

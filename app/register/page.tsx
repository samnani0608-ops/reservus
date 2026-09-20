import Link from "next/link";

import RegisterForm from "./register-form";

export default function RegisterPage() {
  return (
    <main className="mx-auto grid min-h-[calc(100vh-4.5rem)] max-w-6xl items-center gap-10 px-5 py-14 sm:px-8 lg:grid-cols-2">
      <section className="mx-auto w-full max-w-md rounded-[1.75rem] border border-white/10 bg-[#0d131c]/92 p-6 shadow-[0_30px_90px_rgba(0,0,0,0.35)] sm:p-9 lg:order-2">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">Nuevo acceso</p>
        <h1 className="mt-3 text-3xl font-black tracking-[-0.035em] text-white">Crear una cuenta</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">Dos datos y ya podés empezar a organizar tus espacios.</p>
        <RegisterForm />
        <p className="mt-7 border-t border-white/8 pt-6 text-center text-sm text-slate-500">
          ¿Ya tenés una cuenta?{" "}
          <Link href="/login" className="font-bold text-emerald-300 hover:text-emerald-200">
            Iniciar sesión
          </Link>
        </p>
      </section>

      <section className="hidden lg:block">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-sky-300">Preparado para coordinar</p>
        <h2 className="mt-5 max-w-lg text-6xl font-black leading-[0.95] tracking-[-0.05em] text-white">
          Reservar no debería tomar más de un minuto.
        </h2>
        <div className="mt-9 grid max-w-lg gap-3">
          {["Disponibilidad diaria visible", "Reglas automáticas y sin solapes", "Historial personal en una sola vista"].map((item, index) => (
            <div key={item} className="flex items-center gap-4 rounded-xl border border-white/8 bg-white/3 p-4 text-sm text-slate-300">
              <span className="font-mono text-xs font-bold text-emerald-300">0{index + 1}</span>
              {item}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

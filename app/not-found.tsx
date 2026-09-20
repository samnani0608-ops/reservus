import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto grid min-h-[calc(100vh-10rem)] max-w-4xl place-items-center px-5 py-16 text-center sm:px-8">
      <div>
        <p className="font-mono text-sm font-bold text-emerald-300">ERROR / 404</p>
        <h1 className="mt-5 text-5xl font-black tracking-[-0.05em] text-white sm:text-7xl">Este espacio no existe.</h1>
        <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-slate-400">
          La dirección puede ser incorrecta o la sala ya no está disponible.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/dashboard" className="rounded-xl bg-emerald-300 px-5 py-3 text-sm font-black text-emerald-950 hover:bg-emerald-200">
            Ver salas
          </Link>
          <Link href="/" className="rounded-xl border border-white/10 bg-white/4 px-5 py-3 text-sm font-bold text-white hover:bg-white/7">
            Volver al inicio
          </Link>
        </div>
      </div>
    </main>
  );
}

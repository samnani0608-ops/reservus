"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function ErrorPage({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto grid min-h-[calc(100vh-10rem)] max-w-4xl place-items-center px-5 py-16 text-center sm:px-8">
      <div>
        <p className="font-mono text-sm font-bold text-rose-300">ERROR / TEMPORAL</p>
        <h1 className="mt-5 text-4xl font-black tracking-[-0.045em] text-white sm:text-6xl">Algo interrumpió la operación.</h1>
        <p className="mx-auto mt-5 max-w-lg text-base leading-7 text-slate-400">
          Intentá cargar esta vista nuevamente. Tus datos no se modificaron por mostrar este mensaje.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <button type="button" onClick={() => retry()} className="rounded-xl bg-emerald-300 px-5 py-3 text-sm font-black text-emerald-950 hover:bg-emerald-200">
            Intentar de nuevo
          </button>
          <Link href="/dashboard" className="rounded-xl border border-white/10 bg-white/4 px-5 py-3 text-sm font-bold text-white hover:bg-white/7">
            Ir a las salas
          </Link>
        </div>
      </div>
    </main>
  );
}

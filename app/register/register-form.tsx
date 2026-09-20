"use client";

import Link from "next/link";
import { useActionState } from "react";

import { register, type RegisterState } from "./actions";

const initialState: RegisterState = { success: false, error: null };

export default function RegisterForm() {
  const [state, formAction, pending] = useActionState(register, initialState);

  if (state.success) {
    return (
      <div aria-live="polite" className="mt-7 rounded-2xl border border-emerald-300/20 bg-emerald-300/7 p-5">
        <div className="grid size-10 place-items-center rounded-full bg-emerald-300 text-lg font-black text-emerald-950">✓</div>
        <h2 className="mt-4 text-lg font-bold text-white">Cuenta registrada</h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Revisá tu correo si Supabase solicita confirmación y después iniciá sesión.
        </p>
        <Link href="/login" className="mt-5 inline-flex rounded-xl bg-emerald-300 px-4 py-2.5 text-sm font-black text-emerald-950 hover:bg-emerald-200">
          Ir a iniciar sesión
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="mt-7 space-y-5">
      <div>
        <label htmlFor="email" className="text-sm font-semibold text-slate-300">Correo electrónico</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="nombre@empresa.com"
          required
          className="mt-2 w-full rounded-xl border px-4 py-3 text-sm"
        />
      </div>

      <div>
        <label htmlFor="password" className="text-sm font-semibold text-slate-300">Contraseña</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
          aria-describedby="password-help"
          className="mt-2 w-full rounded-xl border px-4 py-3 text-sm"
        />
        <p id="password-help" className="mt-2 text-xs text-slate-600">Usá al menos 6 caracteres.</p>
      </div>

      {state.error && (
        <p role="alert" className="rounded-xl border border-rose-300/15 bg-rose-300/7 p-3 text-sm text-rose-200">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-emerald-300 px-5 py-3.5 text-sm font-black text-emerald-950 shadow-[0_14px_40px_rgba(52,211,153,0.12)] hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Creando cuenta..." : "Crear mi cuenta"}
      </button>
    </form>
  );
}

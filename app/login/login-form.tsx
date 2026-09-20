"use client";

import { useActionState } from "react";

import { login, type LoginState } from "./actions";

const initialState: LoginState = { error: null };

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <form action={formAction} className="mt-7 space-y-5">
      <div>
        <label htmlFor="email" className="text-sm font-semibold text-slate-300">
          Correo electrónico
        </label>
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
        <label htmlFor="password" className="text-sm font-semibold text-slate-300">
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          minLength={6}
          className="mt-2 w-full rounded-xl border px-4 py-3 text-sm"
        />
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
        {pending ? "Verificando acceso..." : "Entrar a Reservus"}
      </button>
    </form>
  );
}

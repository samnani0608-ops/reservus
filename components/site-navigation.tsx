"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { logout } from "@/app/actions";

type SiteNavigationProps = {
  email: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
};

type NavigationLink = {
  href: string;
  label: string;
};

export default function SiteNavigation({
  email,
  isAuthenticated,
  isAdmin,
}: SiteNavigationProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const links: NavigationLink[] = isAuthenticated
    ? [
        { href: "/dashboard", label: "Salas" },
        { href: "/reservations", label: "Mis reservas" },
        ...(isAdmin ? [{ href: "/admin", label: "Administración" }] : []),
      ]
    : [
        { href: "/", label: "Inicio" },
        { href: "/login", label: "Ingresar" },
        { href: "/register", label: "Crear cuenta" },
      ];

  function isActive(href: string) {
    if (href === "/") return pathname === href;
    if (href === "/dashboard") {
      return pathname === href || pathname.startsWith("/rooms/");
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <nav
      aria-label="Navegación principal"
      className="relative mx-auto flex min-h-18 max-w-7xl items-center justify-between gap-5 px-5 py-3 sm:px-8"
    >
      <Link
        href={isAuthenticated ? "/dashboard" : "/"}
        className="group flex items-center gap-3 rounded-lg focus-visible:outline-none"
        onClick={() => setIsOpen(false)}
      >
        <span className="relative grid size-10 place-items-center overflow-hidden rounded-xl border border-emerald-300/20 bg-emerald-300/10 text-sm font-black text-emerald-300 shadow-[0_0_32px_rgba(52,211,153,0.13)]">
          R
          <span className="absolute -bottom-2 -right-2 size-5 rounded-full border border-emerald-300/35" />
        </span>
        <span>
          <span className="block text-base font-bold tracking-[-0.02em] text-white">Reservus</span>
          <span className="block text-[0.62rem] font-semibold uppercase tracking-[0.24em] text-slate-500 transition group-hover:text-emerald-300/80">
            rooms / control
          </span>
        </span>
      </Link>

      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls="site-menu"
        aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
        onClick={() => setIsOpen((current) => !current)}
        className="grid size-11 place-items-center rounded-xl border border-white/10 bg-white/5 text-slate-200 md:hidden"
      >
        <span className="sr-only">Menú</span>
        <span aria-hidden className="space-y-1.5">
          <span className="block h-px w-5 bg-current" />
          <span className="block h-px w-5 bg-current" />
          <span className="block h-px w-5 bg-current" />
        </span>
      </button>

      <div
        id="site-menu"
        className={`${
          isOpen ? "flex" : "hidden"
        } absolute left-4 right-4 top-[calc(100%+0.5rem)] flex-col gap-2 rounded-2xl border border-white/10 bg-[#0d121a]/98 p-3 shadow-2xl shadow-black/40 md:static md:flex md:flex-row md:items-center md:border-0 md:bg-transparent md:p-0 md:shadow-none`}
      >
        <div className="flex flex-col gap-1 md:flex-row md:items-center">
          {links.map((link) => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                onClick={() => setIsOpen(false)}
                className={`rounded-lg px-3 py-2.5 text-sm font-semibold transition md:py-2 ${
                  active
                    ? "bg-emerald-300/10 text-emerald-300"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {isAuthenticated && (
          <div className="mt-1 flex items-center justify-between gap-3 border-t border-white/8 pt-3 md:mt-0 md:ml-2 md:border-l md:border-t-0 md:pl-4 md:pt-0">
            <span className="max-w-42 truncate text-xs text-slate-400" title={email ?? undefined}>
              {email}
            </span>
            <form action={logout}>
              <button
                type="submit"
                className="rounded-lg border border-white/10 px-3 py-2 text-xs font-bold text-slate-300 hover:border-rose-300/30 hover:bg-rose-300/8 hover:text-rose-200"
              >
                Salir
              </button>
            </form>
          </div>
        )}
      </div>
    </nav>
  );
}

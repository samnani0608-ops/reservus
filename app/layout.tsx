// Metadata nos permite configurar el título y
// la descripción general de nuestra aplicación.
import type { Metadata } from "next";

// ReactNode representa cualquier contenido que React
// puede mostrar dentro del layout.
// Lo usamos en lugar de LayoutProps para no depender
// de tipos temporales generados por Next.js.
import type { ReactNode } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";

import SiteHeader from "@/components/site-header";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Reservus | Salas bajo control",
    template: "%s | Reservus",
  },
  description: "Reservá salas, consultá disponibilidad y gestioná tu agenda desde un solo lugar.",
};

// Define qué datos recibe el layout principal.
//
// children representa todas las páginas que Next.js
// colocará dentro de este layout.
type RootLayoutProps = {
  children: ReactNode;
};

// Layout principal compartido por toda la aplicación.
export default function RootLayout({
  children,
}: RootLayoutProps) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <a className="skip-link" href="#main-content">
          Saltar al contenido
        </a>
        <Suspense fallback={<div className="h-18 border-b border-white/8 bg-[#070a0f]" />}>
          <SiteHeader />
        </Suspense>
        <div id="main-content" className="min-h-[calc(100vh-4.5rem)]">
          {children}
        </div>
        <footer className="border-t border-white/6 px-6 py-7 text-center text-xs text-slate-600">
          Reservus 0.2.0 · Agenda clara, reservas seguras.
        </footer>
      </body>
    </html>
  );
}

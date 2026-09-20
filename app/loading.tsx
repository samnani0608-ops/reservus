export default function Loading() {
  return (
    <main aria-busy="true" aria-label="Cargando contenido" className="mx-auto max-w-7xl animate-pulse px-5 py-12 sm:px-8 sm:py-16">
      <div className="h-3 w-32 rounded-full bg-emerald-300/15" />
      <div className="mt-5 h-12 max-w-xl rounded-2xl bg-white/7" />
      <div className="mt-4 h-5 max-w-md rounded-full bg-white/5" />
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="h-52 rounded-2xl border border-white/7 bg-white/3" />
        ))}
      </div>
    </main>
  );
}

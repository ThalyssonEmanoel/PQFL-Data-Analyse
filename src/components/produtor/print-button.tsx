"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      className="no-print rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
      onClick={() => window.print()}
    >
      Imprimir diagnóstico A4
    </button>
  );
}

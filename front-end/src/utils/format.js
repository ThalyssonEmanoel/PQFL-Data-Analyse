// Helpers de formatacao para pt-BR.

export function formatNumber(value, decimals = 0) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "—";
  return Number(value).toLocaleString("pt-BR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatScore(value) {
  if (value === null || value === undefined) return "—";
  return Number(value).toFixed(1);
}

export function formatPercent(fraction, decimals = 0) {
  if (fraction === null || fraction === undefined) return "—";
  return `${(fraction * 100).toFixed(decimals)}%`;
}

export function formatDateTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-BR", { dateStyle: "medium" });
}

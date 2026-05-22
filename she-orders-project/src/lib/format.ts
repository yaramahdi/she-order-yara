export function formatMoney(value: number | string | null | undefined) {
  const numberValue = Number(value ?? 0);
  return `${numberValue.toFixed(2)} ₪`;
}

export function formatUsd(value: number | string | null | undefined) {
  const numberValue = Number(value ?? 0);
  return `$${numberValue.toFixed(2)}`;
}

export function formatDate(value: string) {
  if (!value) return "-";

  const date = new Date(`${value}T00:00:00`);

  return new Intl.DateTimeFormat("ar-PS", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}
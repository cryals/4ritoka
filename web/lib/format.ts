export function number(value: number, maximumFractionDigits = 2): string {
  return new Intl.NumberFormat("ru-RU", { maximumFractionDigits }).format(value);
}

export function percent(value: number): string {
  return new Intl.NumberFormat("ru-RU", { style: "percent", maximumFractionDigits: 1 }).format(value);
}

export function dateTime(value: string | null): string {
  if (!value) return "—";
  const normalized = value.includes("T") ? value : `${value.replace(" ", "T")}Z`;
  return new Intl.DateTimeFormat("ru-RU", { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(normalized),
  );
}

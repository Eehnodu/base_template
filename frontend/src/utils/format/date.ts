function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function getParts(dt: string | Date) {
  const d = typeof dt === "string" ? new Date(dt) : dt;
  if (isNaN(d.getTime())) throw new Error("Invalid date");
  return {
    yyyy: d.getFullYear(),
    mm: pad(d.getMonth() + 1),
    dd: pad(d.getDate()),
    hh: pad(d.getHours()),
    mi: pad(d.getMinutes()),
    ss: pad(d.getSeconds()),
  };
}

/**
 * YYYY
 */
export function formatYear(dt: string | Date): string {
  const { yyyy } = getParts(dt);
  return `${yyyy}`;
}

/**
 * YYYY-MM or YYYY.MM
 */
export function formatYearMonth(
  dt: string | Date,
  sep: "-" | "." = "-"
): string {
  const { yyyy, mm } = getParts(dt);
  return `${yyyy}${sep}${mm}`;
}

/**
 * YYYY-MM-DD or YYYY.MM.DD
 */
export function formatDate(dt: string | Date, sep: "-" | "." = "-"): string {
  const { yyyy, mm, dd } = getParts(dt);
  return `${yyyy}${sep}${mm}${sep}${dd}`;
}

/**
 * YYYY-MM-DD HH:mm or YYYY.MM.DD HH:mm
 */
export function formatDateTime(
  dt: string | Date,
  sep: "-" | "." = "-"
): string {
  const { yyyy, mm, dd, hh, mi } = getParts(dt);
  return `${yyyy}${sep}${mm}${sep}${dd} ${hh}:${mi}`;
}

/**
 * YYYY-MM-DD HH:mm:ss or YYYY.MM.DD HH:mm:ss
 */
export function formatDateTimeWithSeconds(
  dt: string | Date,
  sep: "-" | "." = "-"
): string {
  const { yyyy, mm, dd, hh, mi, ss } = getParts(dt);
  return `${yyyy}${sep}${mm}${sep}${dd} ${hh}:${mi}:${ss}`;
}

/**
 * HH:mm
 */
export function formatClock(dt: string | Date): string {
  const { hh, mi } = getParts(dt);
  return `${hh}:${mi}`;
}

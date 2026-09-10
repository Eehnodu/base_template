/**
 * ₩12,345
 */
export function formatCurrencyKRW(value: number | null | undefined): string {
  if (value == null || isNaN(value)) return "₩0";
  return `₩${value.toLocaleString("ko-KR")}`;
}

/**
 * $12,345
 */
export function formatCurrencyUSD(value: number | null | undefined): string {
  if (value == null || isNaN(value)) return "$0";
  return `$${value.toLocaleString("en-US")}`;
}

/**
 * 12,345원
 */
export function formatNumberKRW(value: number | null | undefined): string {
  if (value == null || isNaN(value)) return "0원";
  return `${value.toLocaleString("ko-KR")}원`;
}

/**
 * 12,345달러
 */
export function formatNumberUSD(value: number | null | undefined): string {
  if (value == null || isNaN(value)) return "0달러";
  return `${value.toLocaleString("en-US")}달러`;
}

/**
 * 12,345 point
 */
export function formatNumberPointEN(value: number | null | undefined): string {
  if (value == null || isNaN(value)) return "0 point";
  return `${value.toLocaleString("ko-KR")} point`;
}

/**
 * 12,345 포인트
 */
export function formatNumberPointKR(value: number | null | undefined): string {
  if (value == null || isNaN(value)) return "0포인트";
  return `${value.toLocaleString("ko-KR")} 포인트`;
}

/**
 * 숫자를 소수점 n자리로 반올림해서 number로 반환
 */
export function formatFixed(
  value: number | null | undefined,
  fractionDigits = 1
): number {
  if (value == null || isNaN(value)) return 0;
  return Number(value.toFixed(fractionDigits));
}

/**
 * - 1000ms 미만: "247ms"
 * - 1000ms 이상: "1.3s"
 */
export function formatLatencyMs(
  value: number | null | undefined,
  fractionDigits = 1
): string {
  if (value == null || !Number.isFinite(value)) return "0ms";

  const ms = Math.max(0, value);

  if (ms < 1000) {
    return `${Math.round(ms)}ms`;
  }

  const sec = ms / 1000;
  return `${Number(sec.toFixed(fractionDigits))}s`;
}

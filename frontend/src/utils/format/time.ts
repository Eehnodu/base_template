const normalizeSeconds = (seconds: number) => {
  if (!Number.isFinite(seconds)) return 0;
  return Math.max(0, Math.round(seconds));
};

/**
 * HH:mm:ss (예: 01:23:45)
 */
export function formatTimeFull(seconds: number): string {
  const sec = normalizeSeconds(seconds);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;

  return `${h.toString().padStart(2, "0")}:${m
    .toString()
    .padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

/**
 * mm:ss (예: 03:42)
 */
export function formatTimeShort(seconds: number): string {
  const sec = normalizeSeconds(seconds);
  const m = Math.floor(sec / 60);
  const s = sec % 60;

  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

/**
 * 한글 표기 (예: 1시간 3분 42초)
 */
export function formatTimeKorean(seconds: number): string {
  const sec = normalizeSeconds(seconds);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;

  const parts: string[] = [];
  if (h) parts.push(`${h}시간`);
  if (m) parts.push(`${m}분`);
  if (s || parts.length === 0) parts.push(`${s}초`);
  return parts.join(" ");
}

/**
 * 영어 표기 (예: 1h 3m 42s)
 */
export function formatTimeEnglish(seconds: number): string {
  const sec = normalizeSeconds(seconds);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;

  const parts: string[] = [];
  if (h) parts.push(`${h}h`);
  if (m) parts.push(`${m}m`);
  if (s || parts.length === 0) parts.push(`${s}s`);
  return parts.join(" ");
}

/**
 * 자동
 * - 1분 미만: "32초"
 * - 1시간 미만: "mm:ss"
 * - 1시간 이상: "HH:mm:ss"
 */
export function formatTimeAuto(seconds: number): string {
  const sec = normalizeSeconds(seconds);

  if (sec < 60) {
    return `${sec}s`;
  }

  return formatTimeEnglish(sec);
}

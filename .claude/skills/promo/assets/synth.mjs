// 음악 + 효과음을 로컬에서 계산한다 (작업 폴더에서 실행). 외부 음원 · API 없음.
// audio-music.wav (음악 + 효과음), audio-nomusic.wav (같은 효과음, 같은 배율, 음악만 뺌)
// 음악 설정: timeline.js 의 MUSIC = { bpm, chords: [[미디 음...], ...], drumsFrom, drumsTo, quiet: [[from, to], ...], gain }
//   (프레임 단위. quiet 구간은 킥을 줄여 숨 고르기. 음악 판 효과음 대비 gain 배, 기본 0.34)
// 효과음표: sfx.js = (TL) => [{ at: 프레임, src: 아래 SYN 이름, volume, note, ...옵션 }]
// 출력 지연 보정: OUTPUT_OFFSET_F=프레임 (finish.mjs 가 잰 값이 0 이 아니면 넣고 다시)
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";

const here = process.cwd();
const require = createRequire(path.join(here, "x.js"));
const TL = require(path.join(here, "timeline.js"));
const SFX = require(path.join(here, "sfx.js"))(TL);
const { TOTAL, FPS = 30 } = TL;
const M = { bpm: 120, chords: [[48, 52, 55], [45, 48, 52], [41, 45, 48], [43, 47, 50]], drumsFrom: 0, drumsTo: TOTAL, quiet: [], gain: 0.34, ...(TL.MUSIC ?? {}) };
const SR = 48000, LEN = Math.ceil((TOTAL / FPS) * SR), DUR = TOTAL / FPS, sec = (f) => f / FPS;
const OFFSET_F = Number(process.env.OUTPUT_OFFSET_F ?? 0);

let seed = 11;
const rnd = () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const noise = () => rnd() * 2 - 1;
const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
const buf2 = () => [new Float32Array(LEN), new Float32Array(LEN)];
const [mL, mR] = buf2(), [sL, sR] = buf2();
const put = (L, R) => (t0, dur, fn, gain = 1, pan = 0) => {
  const s0 = Math.floor(t0 * SR), n = Math.floor(dur * SR);
  const gl = gain * Math.cos(((pan + 1) * Math.PI) / 4), gr = gain * Math.sin(((pan + 1) * Math.PI) / 4);
  for (let i = 0; i < n; i++) { const k = s0 + i; if (k < 0 || k >= LEN) continue; const v = fn(i / SR, i / n); L[k] += v * gl; R[k] += v * gr; }
};
const music = put(mL, mR), fx = put(sL, sR);

// ── 음악: 마디마다 화음 하나 (패드), 8분음표 아르페지오, drumsFrom~drumsTo 에 킥 · 베이스 · 하이햇 ──
const beat = 60 / M.bpm, bar = beat * 4;
const inQuiet = (t) => M.quiet.some(([a, b]) => t >= sec(a) && t < sec(b));
for (let b = 0; b * bar < DUR; b++) {
  const t0 = b * bar, ch = M.chords[b % M.chords.length];
  ch.forEach((m, j) => music(t0, bar + 0.15, (t) => {
    const env = Math.min(1, t / 0.4) * Math.min(1, (bar + 0.15 - t) / 0.3), f = hz(m + 12);
    return env * (Math.sin(2 * Math.PI * f * t) + 0.3 * Math.sin(4 * Math.PI * f * t) + 0.1 * Math.sin(6 * Math.PI * f * t * 1.003));
  }, 0.05, (j - 1) * 0.4));
  for (let k = 0; k < 8; k++) {
    const tk = t0 + k * beat / 2; if (tk >= DUR) continue;
    const m = ch[[0, 1, 2, 1, 0, 2, 1, 2][k]] + 24 + (b % 2 && k >= 4 ? 12 : 0);
    music(tk, 0.35, (t) => Math.exp(-t / 0.11) * (Math.sin(2 * Math.PI * hz(m) * t) + 0.25 * Math.sin(4 * Math.PI * hz(m) * t)), 0.085 * (tk < sec(M.drumsFrom) ? 0.6 : 1), k % 2 ? 0.35 : -0.35);
  }
  for (let k = 0; k < 4; k++) {
    const tb = t0 + k * beat; if (tb < sec(M.drumsFrom) || tb >= sec(M.drumsTo)) continue;
    music(tb, 0.45, (t) => Math.exp(-t / 0.18) * Math.sin(2 * Math.PI * hz(ch[0] - 12) * t), 0.2);
    const q = inQuiet(tb);
    music(tb, 0.3, (t) => Math.exp(-t / 0.09) * Math.sin(2 * Math.PI * (45 + 90 * Math.exp(-t / 0.03)) * t), q ? 0.35 : 0.8);
    let prev = 0;
    music(tb + beat / 2, 0.06, (t) => { const n = noise(), h = n - prev; prev = n; return Math.exp(-t / 0.018) * h; }, q ? 0.04 : 0.09, 0.2);
  }
}

// ── 효과음: 사인 "삐" 대신 물건 소리 성격 (나무 블록 · 기계식 키보드 · 금속 걸쇠 · 유리 종). 음은 C 장조 ──
const hp = () => { let prev = 0; return () => { const n = noise(), h = n - prev; prev = n; return h; }; };
const wood = (f, u, tau = 0.035) => Math.exp(-u / tau) * (Math.sin(2 * Math.PI * f * u) + 0.45 * Math.sin(2 * Math.PI * f * 2.76 * u));
const SYN = {
  whoosh: (e) => { let lp = 0; const d = e.dur ?? 0.5; return [d, (t, x) => { lp += (0.02 + 0.25 * Math.sin(Math.PI * x)) * (noise() - lp); return Math.sin(Math.PI * x) ** 2 * lp; }]; },
  whip: () => { let lp = 0; return [0.45, (t, x) => { lp += (0.05 + 0.5 * Math.exp(-x * 4)) * (noise() - lp); return Math.exp(-x * 3.5) * Math.min(1, x * 40) * lp * 1.4; }]; },
  pop: (e) => { const h = hp(), f = hz(e.pitch ?? 76) * 0.5; return [0.2, (t) => wood(f, t) + Math.exp(-t / 0.004) * h() * 0.6]; },
  keyA: () => { const h = hp(); return [0.07, (t) => Math.exp(-t / 0.005) * h() * 0.9 + Math.exp(-t / 0.018) * Math.sin(2 * Math.PI * 310 * t) * 0.5]; },
  keyB: () => { const h = hp(); return [0.07, (t) => Math.exp(-t / 0.005) * h() * 0.85 + Math.exp(-t / 0.018) * Math.sin(2 * Math.PI * 270 * t) * 0.5]; },
  enter: () => { const h = hp(); return [0.12, (t) => Math.exp(-t / 0.008) * h() + Math.exp(-t / 0.03) * Math.sin(2 * Math.PI * 190 * t) * 0.7]; },
  click: () => [0.08, (t) => Math.exp(-t / 0.006) * (noise() * 0.5 + Math.sin(2 * Math.PI * 2400 * t)) + (t > 0.04 ? Math.exp(-(t - 0.04) / 0.006) * Math.sin(2 * Math.PI * 2000 * t) * 0.6 : 0)],
  thud: () => [0.35, (t) => Math.exp(-t / 0.08) * Math.sin(2 * Math.PI * (70 + 80 * Math.exp(-t / 0.02)) * t)],
  stampA: () => [0.2, (t) => Math.exp(-t / 0.04) * (Math.sin(2 * Math.PI * (160 + 120 * Math.exp(-t / 0.01)) * t) + noise() * 0.15)],
  stampB: () => [0.2, (t) => Math.exp(-t / 0.04) * (Math.sin(2 * Math.PI * (140 + 110 * Math.exp(-t / 0.01)) * t) + noise() * 0.15)],
  pen: (e) => { let lp = 0; const d = e.dur ?? 0.33; return [d, (t, x) => { lp += 0.35 * (noise() - lp); return Math.min(1, x * 12) * Math.min(1, (1 - x) * 8) * lp * (0.6 + 0.4 * Math.sin(2 * Math.PI * 9 * t)); }]; },
  lock: () => [0.16, (t) => [0, 0.028].reduce((a, d0, i) => a + (t >= d0 ? Math.exp(-(t - d0) / 0.012) * (Math.sin(2 * Math.PI * 2150 * (t - d0)) * 0.4 + Math.sin(2 * Math.PI * 3420 * (t - d0)) * 0.25 + noise() * 0.35) * (i ? 0.7 : 1) : 0), 0) + Math.exp(-t / 0.03) * Math.sin(2 * Math.PI * 180 * t) * 0.4],
  chime: () => [0.3, (t) => [76, 79].reduce((a, m, i) => (t < i * 0.075 ? a : a + wood(hz(m) * 0.5, t - i * 0.075, 0.04)), 0)],
  whack: () => [0.18, (t) => Math.exp(-t / 0.035) * (Math.sin(2 * Math.PI * (210 + 160 * Math.exp(-t / 0.008)) * t) + noise() * 0.35)],
  freeze: () => [0.4, (t) => Math.exp(-t / 0.12) * Math.sin(2 * Math.PI * (300 * Math.exp(-t / 0.15) + 60) * t) + (t < 0.02 ? noise() * 0.5 : 0)],
  riser: (e) => { let lp = 0; const d = e.dur ?? 1.4; return [d, (t, x) => { lp += (0.02 + 0.3 * x) * (noise() - lp); return x * x * (0.6 * lp + 0.25 * Math.sin(2 * Math.PI * (300 + 900 * x * x) * t)); }]; },
  impact: () => [1.4, (t) => Math.exp(-t / 0.35) * Math.sin(2 * Math.PI * (40 + 60 * Math.exp(-t / 0.05)) * t) + (t < 0.03 ? noise() * 0.4 * (1 - t / 0.03) : 0)],
  chord: () => [2.6, (t) => [60, 64, 67, 72].reduce((a, m) => a + Math.exp(-t / 0.9) * Math.sin(2 * Math.PI * hz(m) * t), 0) * 0.3],
  sparkle: () => { const h = hp(); return [1.2, (t) => [84, 88, 91, 96].reduce((a, m, i) => { const d0 = i * 0.09; if (t < d0) return a; const u = t - d0, f = hz(m) * 0.5;
    return a + Math.exp(-u / 0.25) * (Math.sin(2 * Math.PI * f * u) + 0.4 * Math.sin(2 * Math.PI * f * 2.4 * u) + 0.15 * Math.sin(2 * Math.PI * f * 5.95 * u)); }, 0) * 0.45 + Math.exp(-t / 0.4) * h() * 0.06]; },
};
for (const e of SFX) {
  if (!SYN[e.src]) throw new Error(`sfx.js: 모르는 소리 "${e.src}" (있는 것: ${Object.keys(SYN).join(", ")})`);
  const [d, fn] = SYN[e.src](e);
  fx(sec(e.at - OFFSET_F), d, fn, e.volume, e.src.startsWith("key") ? 0.15 : 0);
}

// ── 마스터: 처음 0.6초 페이드인 · 끝 1.5초 페이드아웃, 부드러운 제한, 정점 -1dBFS (두 판 같은 배율) ──
const write = (file, withMusic, fixedNorm) => {
  const L = new Float32Array(LEN), R = new Float32Array(LEN), mg = withMusic ? M.gain * 2.2 : 0;
  for (let k = 0; k < LEN; k++) {
    const t = k / SR, env = Math.min(1, t / 0.6) * Math.min(1, (DUR - t) / 1.5);
    L[k] = Math.tanh((mL[k] * mg + sL[k]) * 1.1) * env; R[k] = Math.tanh((mR[k] * mg + sR[k]) * 1.1) * env;
  }
  let peak = 0; for (let k = 0; k < LEN; k++) peak = Math.max(peak, Math.abs(L[k]), Math.abs(R[k]));
  const norm = fixedNorm ?? 0.89 / peak;
  const b = Buffer.alloc(44 + LEN * 4);
  b.write("RIFF", 0); b.writeUInt32LE(36 + LEN * 4, 4); b.write("WAVE", 8); b.write("fmt ", 12);
  b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(2, 22); b.writeUInt32LE(SR, 24);
  b.writeUInt32LE(SR * 4, 28); b.writeUInt16LE(4, 32); b.writeUInt16LE(16, 34); b.write("data", 36); b.writeUInt32LE(LEN * 4, 40);
  for (let k = 0; k < LEN; k++) { b.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[k] * norm)) * 32767), 44 + k * 4); b.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[k] * norm)) * 32767), 46 + k * 4); }
  fs.writeFileSync(path.join(here, file), b);
  console.log(file, DUR.toFixed(2), "s, peak", peak.toFixed(3), "norm", norm.toFixed(3));
  return norm;
};
const n0 = write("audio-music.wav", true);
write("audio-nomusic.wav", false, n0);
console.log("sfx", SFX.length, "개, 출력 지연 보정", OFFSET_F, "f");

// 디자인 스타일 프리셋 (작업 폴더에서 실행. styles/ = 스킬 assets/styles 복사본)
//   node style.mjs list
//   node style.mjs use <이름> [--brand "#hex[,#hex]"] [--ink #hex] [--canvas #hex] [--font-display "글꼴"] [--font-body "글꼴"]
//       -> style.css (글꼴 + 변수 + 공용 base.css + 프리셋 css), style.js (window.STYLE: 팔레트 · 글꼴 · 움직임 토큰), style.json (최종 값)
//          브랜드 색: 프리셋 강조색마다 색상 · 채도는 가장 가까운 브랜드 색, 명도는 원래 값 (회색 · 상태색은 그대로). 대비 미달이면 exit 1
//   node style.mjs fonts                       현재 style.json 글꼴을 Google Fonts 에서 받아 fonts/ (무료 OFL. 렌더 때 인터넷 불필요)
//   node style.mjs showcase [이름... | all] [--brand ...]   -> qa/style-<이름>.jpg, qa/styles.jpg (견본 4장면, 눈으로 고르기)
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";

const here = process.cwd(), SD = path.join(here, "styles");
const argv = process.argv.slice(2), cmd = argv.shift();
const opt = (n) => { const i = argv.indexOf(n); if (i < 0) return undefined; const v = argv[i + 1]; argv.splice(i, 2); return v; };
const names = () => fs.readdirSync(SD).filter((f) => f.endsWith(".json")).map((f) => f.slice(0, -5));
const load = (n) => JSON.parse(fs.readFileSync(path.join(SD, `${n}.json`), "utf8"));

// ── 색 ──
const hex2rgb = (h) => { h = h.replace("#", ""); if (h.length === 3) h = [...h].map((c) => c + c).join(""); return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)); };
const rgb2hex = (r) => "#" + r.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("").toUpperCase();
const rgb2hsl = ([r, g, b]) => { r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2; if (mx === mn) return { h: 0, s: 0, l };
  const d = mx - mn, s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn); let h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; return { h: h * 60, s, l }; };
const hsl2rgb = ({ h, s, l }) => { const k = (n) => (n + h / 30) % 12, a = s * Math.min(l, 1 - l), f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1)); return [f(0) * 255, f(8) * 255, f(4) * 255]; };
const lum = (h) => { const c = hex2rgb(h).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const hueDist = (a, b) => Math.min(Math.abs(a - b), 360 - Math.abs(a - b));
const mix = (base, top, alpha) => rgb2hex(hex2rgb(base).map((v, i) => v * (1 - alpha) + hex2rgb(top)[i] * alpha));

const resolve = (name, { brand, ink, canvas, fontDisplay, fontBody } = {}) => {
  const p = load(name), c = { ...p.colors };
  if (brand) {
    const bs = brand.split(",").map((s) => rgb2hsl(hex2rgb(s.trim())));
    for (const k of p.remix?.accents ?? []) {
      if (typeof c[k] !== "string") continue;
      const o = rgb2hsl(hex2rgb(c[k]));
      if (o.s < 0.06) continue;   // 회색은 그대로
      const b = bs.reduce((best, x) => (hueDist(x.h, o.h) < hueDist(best.h, o.h) ? x : best), bs[0]);
      // 색상 · 채도는 브랜드, 밝기는 원래 색과 같게. HSL 명도를 그대로 두면 색상마다 실제 밝기가 달라
      // (예: 코발트 → 청록) 대비가 무너진다 — 원래 색의 휘도와 같아지는 명도를 이분 탐색으로 찾는다
      const target = lum(c[k]);
      let lo = 0, hi = 1;
      for (let i = 0; i < 24; i++) { const m = (lo + hi) / 2; if (lum(rgb2hex(hsl2rgb({ h: b.h, s: b.s, l: m }))) < target) lo = m; else hi = m; }
      c[k] = rgb2hex(hsl2rgb({ h: b.h, s: b.s, l: (lo + hi) / 2 }));
    }
  }
  if (ink) c.ink = ink;
  if (canvas) c.canvas = canvas;
  const flat = {};
  for (const [k, v] of Object.entries(c)) flat[k] = typeof v === "string" ? v : { rgba: v, hex: mix(c.canvas, c[v.from], v.alpha) };
  const fonts = JSON.parse(JSON.stringify(p.fonts));
  if (fontDisplay) fonts.display.ko = fontDisplay;
  if (fontBody) { fonts.body.ko = fontBody; fonts.label.ko = fontBody; }
  return { p, colors: flat, fonts };
};
const cssVar = (k) => (k === "border" ? "--border-color" : "--" + k.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase()).replace(/(\D)(\d)/, "$1$2"));
const stack = (f) => `"${f.en}", "${f.ko}", "SUIT", "Malgun Gothic", sans-serif`;
const buildCss = ({ p, colors, fonts }, fontsCss) => {
  const vars = Object.entries(colors).map(([k, v]) => {
    if (typeof v === "string") return `  ${cssVar(k)}: ${v};`;
    const [r, g, b] = hex2rgb(colors[v.rgba.from]); return `  ${cssVar(k)}: rgba(${r}, ${g}, ${b}, ${v.rgba.alpha});`;
  });
  const extra = Object.entries(p.vars ?? {}).map(([k, v]) => `  ${k}: ${v};`);
  // 순서: 글꼴 → 공용(base.css 의 기본값 포함) → 프리셋 값(:root, 기본값을 덮음) → 프리셋 모양
  return [fontsCss ? `@import url("${fontsCss}");` : "", fs.readFileSync(path.join(SD, "base.css"), "utf8"),
    `/* ${p.title} (${p.name}) — ${p.from} */`,
    `:root {`, ...vars, `  --font-display: ${stack(fonts.display)};`, `  --font-body: ${stack(fonts.body)};`, `  --font-label: ${stack(fonts.label)};`, ...extra, `}`,
    fs.readFileSync(path.join(SD, `${p.name}.css`), "utf8")].join("\n");
};
// 대비 검사 (WCAG). 실패: 본문 4.5 미만 · 강조 바탕 위 큰 글자 3 미만. 경고: 잉크 7 미만 · 강조색이 바탕 위 큰 글자로 3 미만
const check = ({ p, colors }) => {
  const hx = (k) => (typeof colors[k] === "string" ? colors[k] : colors[k]?.hex);
  const res = [], add = (a, b, min, warn, what) => { if (!hx(a) || !hx(b)) return; const r = ratio(hx(a), hx(b)); res.push({ what, r, ok: r >= min, warn: r < warn }); };
  add("ink", "canvas", 4.5, 7, "글자 / 바탕");
  add("inkMuted", "canvas", 4.5, 4.5, "보조 글자 / 바탕");
  add("onAccent", "accent", 3, 4.5, "강조 바탕 위 글자 (CTA · 마무리)");
  add("accent", "canvas", 1, 3, "강조색 / 바탕 (숫자 · 큰 글자)");
  if (colors.canvas2) add(p.ground2Text ?? (p.name === "orange-broadside" ? "onAccent" : "ink"), "canvas2", 4.5, 4.5, "글자 / 바탕 2");
  return res;
};

// ── 글꼴: Google Fonts css2 에서 woff2 를 받아 로컬 경로로 바꾼다 (text 를 주면 그 글자만) ──
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";
const getCss = async (family, weights, text) => {
  const q = (w) => `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}${w ? `:wght@${w.join(";")}` : ""}&display=block${text ? `&text=${encodeURIComponent(text)}` : ""}`;
  for (const u of [q(weights), q(null)]) { const r = await fetch(u, { headers: { "User-Agent": UA } }); if (r.ok) return r.text(); }
  throw new Error(`글꼴을 받지 못함: ${family}`);
};
const fetchFonts = async (fonts, dir, text) => {
  fs.mkdirSync(dir, { recursive: true });
  const fams = new Map();
  for (const role of Object.values(fonts)) for (const f of [role.en, role.ko]) { const w = fams.get(f) ?? new Set(); (role.weights ?? [400]).forEach((x) => w.add(x)); fams.set(f, w); }
  let out = "", n = 0;
  for (const [fam, ws] of fams) {
    let css = await getCss(fam, [...ws].sort((a, b) => a - b), text);
    const urls = [...css.matchAll(/url\((https:[^)]+)\)/g)].map((m) => m[1]);
    const slug = fam.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    fs.mkdirSync(path.join(dir, slug), { recursive: true });
    for (let i = 0; i < urls.length; i += 16) await Promise.all(urls.slice(i, i + 16).map(async (u, j) => {
      const file = `${slug}/${i + j}.woff2`; fs.writeFileSync(path.join(dir, file), Buffer.from(await (await fetch(u)).arrayBuffer())); css = css.replace(u, file); n++;
    }));
    out += css;
  }
  fs.writeFileSync(path.join(dir, "fonts.css"), out);
  return n;
};

const report = (r) => r.forEach((x) => console.log(`  ${x.ok ? (x.warn ? "주의" : "통과") : "실패"} ${x.r.toFixed(2)} ${x.what}`));
const args = () => ({ brand: opt("--brand"), ink: opt("--ink"), canvas: opt("--canvas"), fontDisplay: opt("--font-display"), fontBody: opt("--font-body") });

if (cmd === "list") {
  for (const n of names()) { const p = load(n); console.log(`${n} (${p.title})\n  고를 때: ${p.pick}\n  피할 때: ${p.avoid}\n  움직임: ${p.motion}`); }
} else if (cmd === "use") {
  const name = argv.shift(), a = args(), st = resolve(name, a);
  fs.writeFileSync(path.join(here, "style.css"), buildCss(st, fs.existsSync(path.join(here, "fonts", "fonts.css")) ? "fonts/fonts.css" : null));
  const palette = [...new Set(Object.values(st.colors).flatMap((v) => (typeof v === "string" ? [v] : [v.hex, st.colors[v.rgba.from]]))
    .concat(a.brand ? a.brand.split(",").map((s) => s.trim()) : []))];   // 브랜드 원색도 허용 (로고 등)
  const fams = [...new Set(Object.values(st.fonts).flatMap((f) => [f.en, f.ko]))];
  fs.writeFileSync(path.join(here, "style.json"), JSON.stringify({ name, args: a, colors: st.colors, fonts: st.fonts, token: st.p.token }, null, 1));
  fs.writeFileSync(path.join(here, "style.js"), `window.STYLE = ${JSON.stringify({ name, palette, fonts: fams, token: st.p.token })};\n`);
  console.log(`style.css · style.js · style.json <- ${name}${a.brand ? ` (브랜드 ${a.brand})` : ""}. 움직임: ${st.p.motion} -> V.setToken(STYLE.token)`);
  const r = check(st); report(r);
  if (!fs.existsSync(path.join(here, "fonts", "fonts.css"))) console.log("  글꼴 파일이 아직 없음 -> node style.mjs fonts 뒤 use 를 다시");
  if (r.some((x) => !x.ok)) { console.log("대비 미달 -> --ink · --canvas 로 바꾸거나 다른 프리셋"); process.exit(1); }
} else if (cmd === "fonts") {
  const st = JSON.parse(fs.readFileSync(path.join(here, "style.json"), "utf8"));
  console.log("받은 파일", await fetchFonts(st.fonts, path.join(here, "fonts")), "-> fonts/fonts.css");
} else if (cmd === "showcase") {
  const a = args(), list = argv.length && argv[0] !== "all" ? argv : names();
  const text = fs.readFileSync(path.join(SD, "showcase.html"), "utf8").replace(/<[^>]+>/g, "").replace(/\s+/g, "");
  const { loadChromium, launch } = await import("./pw.mjs");
  const browser = await launch(loadChromium(), ["--allow-file-access-from-files"]);
  const page = await browser.newPage({ viewport: { width: 3840, height: 2160 }, deviceScaleFactor: 0.5 });
  const outDir = path.join(here, "styles-out"); fs.mkdirSync(outDir, { recursive: true }); fs.mkdirSync(path.join(here, "qa"), { recursive: true });
  const shots = [];
  for (const n of list) {
    const st = resolve(n, a);
    await fetchFonts(st.fonts, path.join(outDir, `fonts-${n}`), [...new Set(text + "0123456789")].join(""));
    fs.writeFileSync(path.join(outDir, `${n}.css`), buildCss(st, `fonts-${n}/fonts.css`));
    await page.goto(`${pathToFileURL(path.join(SD, "showcase.html")).href}?css=${encodeURIComponent(pathToFileURL(path.join(outDir, `${n}.css`)).href)}`);
    await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(300);
    const file = path.join(here, "qa", `style-${n}.jpg`); await page.screenshot({ path: file, type: "jpeg", quality: 88 }); shots.push(file);
    console.log(`${n} (${st.p.title})`); report(check(st));
  }
  await browser.close();
  const ins = shots.flatMap((f) => ["-i", f]);
  const cols = Math.min(3, shots.length), rows = Math.ceil(shots.length / cols);
  const layout = shots.map((_, i) => `${(i % cols)}*960_${Math.floor(i / cols)}*540`.replace(/(\d+)\*960/, (m, x) => String(x * 960)).replace(/_(\d+)\*540/, (m, y) => "_" + y * 540)).join("|");
  if (shots.length > 1) execFileSync("ffmpeg", ["-loglevel", "error", "-y", ...ins, "-filter_complex", `${shots.map((_, i) => `[${i}]scale=960:540[s${i}]`).join(";")};${shots.map((_, i) => `[s${i}]`).join("")}xstack=inputs=${shots.length}:layout=${layout}:fill=gray`, path.join(here, "qa", "styles.jpg")]);
  console.log(`견본: qa/style-<이름>.jpg${shots.length > 1 ? " · 모음 qa/styles.jpg" : ""} (${cols}x${rows})`);
} else {
  console.log("node style.mjs list | use <이름> [--brand ...] | fonts | showcase [이름... | all] [--brand ...]");
}

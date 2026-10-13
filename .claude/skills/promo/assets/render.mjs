// composition.html 을 프레임마다 찍는다 (작업 폴더에서 실행).
//   node render.mjs                     전체 → frames/00000.jpg ... (브라우저 4개 병렬)
//   node render.mjs --preview           전체를 960x540 으로 → frames-preview/ (흐름 확인용. 파일이 작고, 속도는 거의 같음)
//   node render.mjs v2 60 120 300       확인 프레임 → qa/v2/f00060.jpg ...
//   --workers N (기본 4) · --strict (자동 검사 경고가 있으면 렌더하지 않음) · --no-audit
// 렌더 전에 V.audit() 를 30프레임마다 돌려 경고를 보여 준다 (장면 밖으로 새는 요소 · 글자 크기 하한 · 1배 아래 확대)
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { loadChromium, launch } from "./pw.mjs";

const here = process.cwd();
const require = createRequire(path.join(here, "x.js"));
const { TOTAL } = require(path.join(here, "timeline.js"));
const argv = process.argv.slice(2);
const flag = (n) => { const i = argv.indexOf(n); if (i < 0) return false; argv.splice(i, 1); return true; };
const opt = (n, d) => { const i = argv.indexOf(n); if (i < 0) return d; const v = argv[i + 1]; argv.splice(i, 2); return v; };
const preview = flag("--preview"), strict = flag("--strict"), noAudit = flag("--no-audit");
const workers = Number(opt("--workers", 4));
const tag = argv.length && isNaN(Number(argv[0])) ? argv.shift() : null;
const picks = argv.map(Number);
const outDir = picks.length ? path.join(here, "qa", tag ?? "v1") : path.join(here, preview ? "frames-preview" : "frames");
fs.mkdirSync(outDir, { recursive: true });

const chromium = loadChromium();
const url = pathToFileURL(path.join(here, "composition.html")).href;
const open = async () => {
  const browser = await launch(chromium, ["--allow-file-access-from-files"]);
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: preview ? 0.5 : 1 });
  page.on("pageerror", (e) => console.log("pageerror", e.message));
  await page.goto(url);
  const info = await page.evaluate(() => window.ready());
  return { browser, page, info };
};
const draw = (page, f) => page.evaluate((n) => window.renderAt(n), f);

// ── 자동 검사 ──
if (!noAudit) {
  const { browser, page, info } = await open();
  console.log("ready", JSON.stringify(info));
  const sample = picks.length ? picks : [...Array(Math.ceil(TOTAL / 30)).keys()].map((k) => k * 30).concat(TOTAL - 1);
  const seen = new Map();
  for (const f of sample) {
    await draw(page, f);
    for (const w of await page.evaluate(() => window.V.audit())) if (!seen.has(w)) seen.set(w, f);
  }
  await browser.close();
  if (seen.size) {
    console.log(`자동 검사 경고 ${seen.size}건:`);
    for (const [w, f] of seen) console.log(`  f${f}: ${w}`);
    if (strict) { console.log("--strict: 렌더하지 않음"); process.exit(1); }
  } else console.log("자동 검사 경고 없음");
}

// ── 렌더 (프레임을 브라우저 n 개에 나눠 동시에) ──
const frames = picks.length ? picks : [...Array(TOTAL).keys()];
const n = picks.length ? 1 : Math.max(1, workers);
const t0 = Date.now();
let done = 0;
await Promise.all([...Array(n).keys()].map(async (k) => {
  const { browser, page } = await open();
  for (let i = k; i < frames.length; i += n) {
    const f = frames[i];
    await draw(page, f);
    const name = picks.length ? `f${String(f).padStart(5, "0")}.jpg` : `${String(f).padStart(5, "0")}.jpg`;
    await page.screenshot({ path: path.join(outDir, name), type: "jpeg", quality: preview ? 80 : 92 });
    if (++done % 150 === 0) console.log("frame", done, `${((Date.now() - t0) / 1000).toFixed(1)}s`);
  }
  await browser.close();
}));
console.log("done", frames.length, `${((Date.now() - t0) / 1000).toFixed(1)}s`, path.relative(here, outDir));

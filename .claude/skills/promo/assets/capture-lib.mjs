// 실제 화면 캡처 · 녹화 도우미. capture.mjs(템플릿)가 불러 쓴다
import fs from "node:fs";
import path from "node:path";
import { loadChromium, launch as launchPw } from "./pw.mjs";

export const launchBrowser = async () => launchPw(loadChromium());

// hide: 화면에서 숨길 문구 정규식 목록 (예: 앱이 자동화 브라우저에 띄우는 안내). 탐지를 피하지 않고 그 문구만 숨긴다
export const newPage = async (browser, { dsf = 1, vw = 1920, vh = 1080, hide = [], colorScheme = "light" } = {}) => {
  const ctx = await browser.newContext({ viewport: { width: vw, height: vh }, deviceScaleFactor: dsf, colorScheme });
  if (hide.length) {
    await ctx.addInitScript((sources) => {
      const res = sources.map((s) => new RegExp(s));
      const run = () => {
        for (const el of document.querySelectorAll("body *")) {
          if (el.children.length === 0 && res.some((r) => r.test(el.textContent ?? ""))) {
            el.style.visibility = "hidden";
            const box = el.closest("[role=status], [role=alert]") ?? el.parentElement;
            if (box) box.style.visibility = "hidden";
          }
        }
      };
      new MutationObserver(run).observe(document, { childList: true, subtree: true, characterData: true });
    }, hide.map((r) => (r instanceof RegExp ? r.source : String(r))));
  }
  return ctx.newPage();
};

// 개발 서버 오류 창(Vite · webpack · Next)이 떠 있으면 찍지 않는다. 사라질 때까지 다시 불러 본다 (최대 3분)
const OVERLAYS = "vite-error-overlay, #webpack-dev-server-client-overlay, nextjs-portal [data-nextjs-dialog]";
export const settle = async (page, extraMs = 0) => {
  for (let i = 0; i < 36; i++) {
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(600 + extraMs);
    if (!(await page.locator(OVERLAYS).count())) return;
    console.log("개발 서버 오류 창이 떠 있어 5초 뒤 다시 불러옴");
    await page.waitForTimeout(5_000);
    await page.reload();
  }
  throw new Error("개발 서버 오류 창이 3분 동안 사라지지 않음");
};

export const box = (locator) => locator.first().boundingBox();

// 녹화: CDP 화면 스트림을 받으면서 fn(mark) 을 실행한다. rec/<이름>/ 에 프레임과 meta.json(프레임 · 사건 시각, 초)
// 화면이 바뀔 때만 프레임이 오므로 resample.mjs 로 30fps 로 다시 뽑는다
export const record = async (page, dir, fn) => {
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const cdp = await page.context().newCDPSession(page);
  const frames = [], events = [];
  cdp.on("Page.screencastFrame", ({ data, metadata, sessionId }) => {
    frames.push({ data, t: metadata.timestamp });
    cdp.send("Page.screencastFrameAck", { sessionId }).catch(() => {});
  });
  const mark = (label, extra = {}) => events.push({ label, t: Date.now() / 1000, ...extra });
  const vp = page.viewportSize(), dsf = await page.evaluate(() => devicePixelRatio);
  const t0 = Date.now() / 1000;
  await cdp.send("Page.startScreencast", { format: "jpeg", quality: 92, maxWidth: Math.round(vp.width * dsf), maxHeight: Math.round(vp.height * dsf), everyNthFrame: 1 });
  await fn(mark);
  await cdp.send("Page.stopScreencast");
  await page.waitForTimeout(200);
  const base = frames.length ? Math.min(frames[0].t, t0) : t0;
  const meta = { frames: [], events: events.map((e) => ({ ...e, t: +(e.t - base).toFixed(3) })) };
  frames.forEach((f, i) => {
    const file = `${String(i).padStart(5, "0")}.jpg`;
    fs.writeFileSync(path.join(dir, file), Buffer.from(f.data, "base64"));
    meta.frames.push({ file, t: +(f.t - base).toFixed(3) });
  });
  fs.writeFileSync(path.join(dir, "meta.json"), JSON.stringify(meta, null, 1));
  const dur = meta.frames.at(-1)?.t ?? 0;
  console.log(`rec ${path.basename(dir)}: ${frames.length} frames, ${dur.toFixed(1)}s, events ${meta.events.length}`);
  return meta;
};

// 캔버스로 그리는 게임의 React 상태 읽기 (읽기만). selector 요소에서 위로 올라가며 hook 의 ref.current[key] 를 찾는다
export const reactRef = (page, selector, key) =>
  page.evaluate(([sel, k]) => {
    const el = document.querySelector(sel);
    const fk = el && Object.keys(el).find((x) => x.startsWith("__reactFiber$"));
    let fiber = fk ? el[fk] : null;
    for (let d = 0; fiber && d < 40; d++, fiber = fiber.return) {
      let hook = fiber.memoizedState;
      for (let h = 0; hook && h < 80; h++, hook = hook.next) {
        const v = hook.memoizedState, cur = v && typeof v === "object" && "current" in v ? v.current : null;
        if (cur && cur[k] !== undefined) return JSON.parse(JSON.stringify(cur[k]));
      }
    }
    return null;
  }, [selector, key]);

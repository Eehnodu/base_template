// 실제 화면 캡처 · 녹화 틀. 프로젝트에 맞게 BASE · 선택자 · 동작을 채운다 (작업 폴더에서: node capture.mjs [이름...])
// 결과: shots/<이름>.jpg (정지) · rec/<이름>/ (녹화) · layout.json (좌표). 녹화는 다음에 node resample.mjs 이름=crop
import fs from "node:fs";
import path from "node:path";
import { launchBrowser, newPage, settle, record, box, reactRef } from "./capture-lib.mjs";

const BASE = "http://localhost:3000";           // 개발 서버 (켜져 있지 않으면 사용자에게 켜 달라고 한다)
const HIDE = [/자동화 브라우저/];                  // 화면에서 숨길 문구 (앱의 자동화 안내 등)
const here = process.cwd();
const only = new Set(process.argv.slice(2));
const want = (n) => only.size === 0 || only.has(n);
const layoutPath = path.join(here, "layout.json");
const layout = fs.existsSync(layoutPath) ? JSON.parse(fs.readFileSync(layoutPath, "utf8")) : {};
fs.mkdirSync(path.join(here, "shots"), { recursive: true });
const browser = await launchBrowser();

// 사이트 화면: 1280x720 을 dsf 3(정지) · 1.5(녹화)로 찍으면 1920x1080 에 글자가 크게 찬다
if (want("home")) {
  const page = await newPage(browser, { dsf: 3, vw: 1280, vh: 720, hide: HIDE });
  await page.goto(BASE);
  await settle(page, 400);
  await page.screenshot({ path: path.join(here, "shots", "home.jpg"), type: "jpeg", quality: 92 });
  // layout.home = { button: await box(page.getByRole("button", { name: "..." })) };
  await page.context().close();
}

// 녹화 예: 같은 화면 크기로 클릭 하나 (정지 캡처와 이어 붙일 거면 같은 시점 · 같은 크기로)
if (want("click")) {
  const page = await newPage(browser, { dsf: 1.5, vw: 1280, vh: 720, hide: HIDE });
  await page.goto(BASE);
  await settle(page);
  await record(page, path.join(here, "rec", "click"), async (mark) => {
    await page.waitForTimeout(400);
    mark("click");
    // await page.getByRole("button", { name: "..." }).click();
    await page.waitForTimeout(1_500);
  });
  await page.context().close();
}

// 게임 · 앱 화면 녹화 예 (1920x1080 dsf 1, 무대만 쓰면 resample 에서 crop). 캔버스 게임은 reactRef 로 상태를 읽기만
// const words = await reactRef(page, ".hud", "words");

fs.writeFileSync(layoutPath, JSON.stringify(layout, null, 1));
fs.writeFileSync(path.join(here, "layout.js"), `window.LAYOUT_DATA = ${JSON.stringify(layout)};\n`);
await browser.close();

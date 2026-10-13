// 프로젝트에 이미 깔린 Playwright 를 불러온다 (새로 설치하지 않는다).
// PW_FROM = @playwright/test 또는 playwright 가 node_modules 에 있는 폴더 (예: <repo>/frontend)
import { createRequire } from "node:module";
import path from "node:path";

export const loadChromium = () => {
  const from = process.env.PW_FROM;
  const tries = [from && path.join(from, "package.json"), path.join(process.cwd(), "package.json")].filter(Boolean);
  for (const p of tries) {
    const req = createRequire(p);
    for (const mod of ["@playwright/test", "playwright"]) {
      try { return req(mod).chromium; } catch { /* 다음 후보 */ }
    }
  }
  throw new Error("Playwright 를 찾지 못함. PW_FROM 에 @playwright/test 가 깔린 폴더를 넣는다. 없으면 설치하지 말고 사용자에게 묻는다 (새 의존성)");
};
// 설치된 크롬을 쓴다 (브라우저를 따로 받지 않음). 없으면 Playwright 기본 chromium
export const launch = async (chromium, args = []) => {
  try { return await chromium.launch({ channel: "chrome", args }); }
  catch { return await chromium.launch({ args }); }
};

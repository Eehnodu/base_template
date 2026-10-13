// rec/<이름>/ 의 불규칙한 녹화 프레임을 시각대로 30fps 로 다시 뽑는다 → seq/<이름>/00001.jpg ...
//   node resample.mjs                      (rec/ 아래 전부, 자르지 않음)
//   node resample.mjs rain=896:1080:512:0 home   (이름=ffmpeg crop 값, 생략하면 자르지 않음)
// 사건 시각은 seq 프레임 번호(0부터)로 바꿔 seq/<이름>/events.json, 개수는 seq-count.js (composition 이 읽음)
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const here = process.cwd();
const recDir = path.join(here, "rec");
const args = process.argv.slice(2);
const jobs = args.length
  ? args.map((a) => { const [name, crop] = a.split("="); return { name, crop: crop ? `crop=${crop}` : null }; })
  : fs.readdirSync(recDir).map((name) => ({ name, crop: null }));
const countPath = path.join(here, "seq-count.js");
const counts = fs.existsSync(countPath) ? JSON.parse(fs.readFileSync(countPath, "utf8").replace(/^window\.SEQ_COUNT = |;\s*$/g, "")) : {};

for (const { name, crop } of jobs) {
  const dir = path.join(recDir, name), out = path.join(here, "seq", name);
  const meta = JSON.parse(fs.readFileSync(path.join(dir, "meta.json"), "utf8"));
  fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out, { recursive: true });
  const fr = meta.frames;
  let list = "";
  fr.forEach((f, i) => { const d = i + 1 < fr.length ? fr[i + 1].t - f.t : 3; list += `file '${f.file}'\nduration ${Math.max(d, 0.001).toFixed(4)}\n`; });
  list += `file '${fr.at(-1).file}'\n`;   // 마지막 프레임 3초 유지
  fs.writeFileSync(path.join(dir, "list.txt"), list);
  execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-f", "concat", "-safe", "0", "-i", path.join(dir, "list.txt"),
    "-vf", ["fps=30", crop].filter(Boolean).join(","), "-q:v", "2", path.join(out, "%05d.jpg")]);
  const count = fs.readdirSync(out).filter((x) => x.endsWith(".jpg")).length;
  const events = meta.events.map((e) => ({ ...e, f: Math.round((e.t - fr[0].t) * 30) }));
  fs.writeFileSync(path.join(out, "events.json"), JSON.stringify({ count, events }, null, 1));
  counts[name] = count;
  console.log(name, count, "frames", JSON.stringify(events.map((e) => [e.label, e.f])));
}
fs.writeFileSync(countPath, `window.SEQ_COUNT = ${JSON.stringify(counts)};\n`);

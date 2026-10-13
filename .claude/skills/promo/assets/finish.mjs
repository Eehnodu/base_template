// 묶기 · 포스터 · 확인을 한 번에 (작업 폴더에서 실행, 결과는 한 단계 위 폴더에)
//   node finish.mjs --name promo --poster 1340 [--both] [--out 경로]
//   1) frames/ -> video.mp4   2) 소리 붙이기: <name>.mp4 (음악 판), --both 면 <name>-nomusic.mp4 도
//   3) 포스터: --poster 프레임을 <name>.jpg 로 뽑아 모든 판의 0번 프레임에 굽기 (프레임을 바꾸고 추가하지 않음)
//   4) ffprobe (해상도 · fps · 프레임 수 · 길이)   5) 소리 싱크: 날카로운 효과음 3곳에서 원본 wav 와 교차상관 (샘플 차이)
//   6) work/qa/contact-final.jpg (1초 1장)
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const here = process.cwd();
const require = createRequire(path.join(here, "x.js"));
const TL = require(path.join(here, "timeline.js"));
const argv = process.argv.slice(2);
const opt = (n, d) => { const i = argv.indexOf(n); return i < 0 ? d : argv[i + 1]; };
const name = opt("--name", "video"), poster = Number(opt("--poster", TL.TOTAL - 10)), both = argv.includes("--both");
const out = path.resolve(opt("--out", path.join(here, "..")));
const ff = (...a) => execFileSync("ffmpeg", ["-loglevel", "error", "-y", ...a]);
const FPS = TL.FPS ?? 30;

ff("-framerate", String(FPS), "-i", path.join(here, "frames", "%05d.jpg"), "-c:v", "libx264", "-crf", "18", "-preset", "slow", "-pix_fmt", "yuv420p", path.join(here, "video.mp4"));
const versions = [[`${name}.mp4`, "audio-music.wav"], ...(both ? [[`${name}-nomusic.mp4`, "audio-nomusic.wav"]] : [])];
for (const [file, wav] of versions)
  ff("-i", path.join(here, "video.mp4"), "-i", path.join(here, wav), "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", path.join(out, file));
const jpg = path.join(out, `${name}.jpg`);
ff("-ss", (poster / FPS).toFixed(3), "-i", path.join(out, `${name}.mp4`), "-frames:v", "1", "-q:v", "2", jpg);
for (const [file] of versions) {
  const src = path.join(out, file), tmp = src.replace(/\.mp4$/, ".poster.mp4");
  ff("-i", src, "-i", jpg, "-filter_complex", "[0:v][1:v]overlay=0:0:enable='eq(n,0)'[v]", "-map", "[v]", "-map", "0:a?", "-c:v", "libx264", "-crf", "18", "-preset", "slow", "-pix_fmt", "yuv420p", "-c:a", "copy", "-movflags", "+faststart", tmp);
  fs.renameSync(tmp, src);
  console.log(file, execFileSync("ffprobe", ["-v", "error", "-count_frames", "-select_streams", "v:0", "-show_entries", "stream=width,height,r_frame_rate,nb_read_frames", "-show_entries", "format=duration,size", "-of", "compact", src]).toString().trim().replace(/\n/g, " | "));
}

// 소리 싱크: 효과음표에서 날카로운 소리 3곳을 골라 원본 wav 와 완성 영상의 소리를 맞대 본다
const raw = (src, dst) => ff("-i", src, "-vn", "-ac", "1", "-ar", "48000", "-f", "s16le", dst);
const rd = (p) => { const b = fs.readFileSync(p); return new Int16Array(b.buffer, b.byteOffset, b.length >> 1); };
raw(path.join(out, `${name}.mp4`), path.join(here, "out.raw")); raw(path.join(here, "audio-music.wav"), path.join(here, "ref.raw"));
const [ref, got] = [rd(path.join(here, "ref.raw")), rd(path.join(here, "out.raw"))];
const sharp = require(path.join(here, "sfx.js"))(TL).filter((e) => ["impact", "click", "lock", "whack", "enter", "thud"].includes(e.src)).map((e) => e.at);
const probes = sharp.length ? [sharp[0], sharp[Math.floor(sharp.length / 2)], sharp.at(-1)] : [TL.TOTAL / 3, TL.TOTAL / 2, TL.TOTAL * 0.8];
for (const f of probes) {
  const s = Math.round((f / FPS) * 48000), n = 9600; let best = [0, -Infinity];
  for (let lag = -3000; lag <= 3000; lag++) { let c = 0; for (let i = 0; i < n; i += 2) c += (ref[s + i] ?? 0) * (got[s + i + lag] ?? 0); if (c > best[1]) best = [lag, c]; }
  console.log(`싱크 f${f}: ${best[0]} 샘플 (${(best[0] / 1600).toFixed(2)} 프레임)${best[0] ? "  -> OUTPUT_OFFSET_F 로 보정하고 synth · finish 다시" : ""}`);
}
fs.rmSync(path.join(here, "out.raw")); fs.rmSync(path.join(here, "ref.raw"));
fs.mkdirSync(path.join(here, "qa"), { recursive: true });
ff("-i", path.join(out, `${name}.mp4`), "-vf", "fps=1,scale=480:-1,tile=6x10", "-frames:v", "1", path.join(here, "qa", "contact-final.jpg"));
console.log("contact:", path.join("qa", "contact-final.jpg"), "· out:", out);

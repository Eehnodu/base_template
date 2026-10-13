// 시간표는 여기 한 곳. composition.html(브라우저) · synth.mjs · finish.mjs · sfx.js 가 함께 읽는다. 단위는 30fps 프레임
// 아래 값은 틀(8초 시험 영상)이다. 장면표(plan.md)대로 바꾼다
(function (root) {
  const FPS = 30;
  const SHOTS = {
    open: { start: 0, len: 60 },
    t1: { start: 60, len: 54 },
    game: { start: 114, len: 90 },
    outro: { start: 204, len: 66 },
  };
  const TOTAL = 270;
  // 장면이 들어올 때의 전환 (engine.js placeScenes): cut · flash · push · pushY · whip · hidden
  const ENTER = {
    t1: { type: "flash", len: 5 },
    game: { type: "push", len: 18 },
    outro: { type: "pushY", len: 26 },
  };
  // 장면 안 사건 (장면 시작 기준 프레임)
  const BEATS = {
    open: { wordIn: 6 },
    title: { stamp: 4, underline: 18 },
    game: { typeAt: 20, enterAt: 34, lockStart: 40, lockAt: 50, lockEnd: 62, punchFrom: 60, punch: 66 },
    outro: { cardsStart: 4, logoLand: 30 },
  };
  // 음악 (synth.mjs). 프레임 단위. quiet 는 킥을 줄이는 구간 (글자 카드 등)
  const MUSIC = { bpm: 120, drumsFrom: 60, drumsTo: 230, quiet: [[60, 114]] };
  const TL = { FPS, SHOTS, TOTAL, ENTER, BEATS, MUSIC };
  if (typeof module !== "undefined" && module.exports) module.exports = TL;
  else root.TL = TL;
})(typeof window !== "undefined" ? window : globalThis);

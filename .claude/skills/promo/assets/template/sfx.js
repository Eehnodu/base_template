// 효과음표. at 은 숫자가 아니라 시간표 식(SHOTS · BEATS)으로 쓴다 — 장면 길이가 바뀌면 따라 움직인다
// src 는 synth.mjs 의 SYN 이름: whoosh · whip · pop(pitch) · keyA · keyB · enter · click · thud · stampA · stampB · pen(dur)
//   · lock · chime · whack · freeze · riser(dur) · impact · chord · sparkle
// 연속 효과음은 두 소리 번갈아(keyA/keyB, stampA/stampB) + 음량 계단식. 음 높이로 구분하지 않는다 (craft S2)
module.exports = (TL) => {
  const { SHOTS: S, BEATS: B, ENTER } = TL;
  const list = [];
  const add = (at, src, volume, note, extra = {}) => list.push({ at, src, volume, note, ...extra });
  const keys = (start, count, gap, vol, note) => { for (let i = 0; i < count; i++) add(start + i * gap, i % 2 ? "keyB" : "keyA", vol * (1 - i * 0.08), note); };

  // 전환마다 휙 (flash 는 컷에 둔탁음)
  Object.entries(ENTER).forEach(([id, e]) => {
    if (e.type === "flash") { add(S[id].start - e.len, "whoosh", 0.5, "흰 번쩍", { dur: 0.4 }); add(S[id].start, "thud", 0.45, "컷"); }
    else if (e.type === "whip") add(S[id].start, "whip", 0.6, "휩팬");
    else add(S[id].start - (e.type === "hidden" ? Math.floor(e.len / 2) : 0), "whoosh", 0.45, `${id} 전환`, { dur: 0.5 });
  });
  [0, 1, 2].forEach((i) => add(S.t1.start + B.title.stamp + 4 * i, i % 2 ? "stampB" : "stampA", 0.32 - i * 0.04, "글자 카드 어절"));
  add(S.t1.start + B.title.underline, "pen", 0.38, "마커 밑줄", { dur: 0.33 });
  keys(S.game.start + B.game.typeAt, 3, 4.2, 0.42, "입력");
  add(S.game.start + B.game.enterAt, "enter", 0.4, "Enter");
  add(S.game.start + B.game.lockAt, "lock", 0.45, "지목");
  add(S.game.start + B.game.punch, "impact", 0.65, "급줌 착지");
  add(S.outro.start + B.outro.logoLand - 20, "riser", 0.6, "모임", { dur: 20 / 30 });
  add(S.outro.start + B.outro.logoLand, "impact", 1.0, "로고 착지 (가장 큼)");
  add(S.outro.start + B.outro.logoLand + 6, "sparkle", 0.35, "여운");
  return list;
};

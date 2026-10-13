// 영상 엔진 (브라우저). composition.html 이 <script src="engine.js"> 로 불러 window.V 로 쓴다.
// 모든 함수는 프레임 번호(또는 장면 안 프레임 t)만의 순수 함수다. 값(색 · 위치 · 글자 · 시각)은 전부 인자로 받는다.
// 부품 목록과 쓰는 법은 PARTS.md
(function (root) {
  const W = 1920, H = 1080;

  // ── 수학 · 이징 ──
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, p) => a + (b - a) * p;
  const bezier = (x1, y1, x2, y2) => (t) => {
    if (t <= 0) return 0; if (t >= 1) return 1;
    const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
    const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
    let u = t;
    for (let i = 0; i < 10; i++) { const x = ((ax * u + bx) * u + cx) * u - t, d = (3 * ax * u + 2 * bx) * u + cx; if (Math.abs(x) < 1e-6 || !d) break; u -= x / d; }
    return ((ay * u + by) * u + cy) * u;
  };
  const E = {
    linear: (t) => t,
    quintOut: (t) => 1 - Math.pow(1 - t, 5),
    cubicOut: (t) => 1 - Math.pow(1 - t, 3),
    cubicIn: (t) => t * t * t,
    cubicInOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    smoother: (t) => t * t * t * (t * (t * 6 - 15) + 10),
    backOut: (s = 1.6) => (t) => 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2),
    push: bezier(0.12, 0.9, 0.2, 1),          // 장면 밀기
    stamp: bezier(0.2, 0.75, 0.3, 1),          // 글자 카드 도장
  };
  // 움직임 토큰 (craft.md "움직임 성격"). setToken 으로 프로젝트마다 바꾼다. land = 착지 이징
  let TOKEN = { dur: 24, land: bezier(0.34, 1.56, 0.64, 1) };
  const setToken = (t) => { TOKEN = { ...TOKEN, ...t, land: t.land ? bezier(...t.land) : TOKEN.land }; return TOKEN; };
  const ramp = (f, s, d, e = E.linear) => e(clamp((f - s) / d));

  // ── DOM ──
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const byId = (id) => document.getElementById(id);
  const set = (el, tf, op = 1, blur = 0) => {
    el.style.transform = tf; el.style.opacity = op;
    el.style.filter = blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : "none";
  };
  // 장면(.scene)만 visible/hidden. 장면 안 요소는 showIn — visible 을 직접 주면 장면이 숨어도 남아 아래에 비친다
  const show = (el, on) => { el.style.visibility = on ? "visible" : "hidden"; };
  const showIn = (el, on) => { el.style.visibility = on ? "" : "hidden"; };
  // 어절마다 흐림을 벗으며 떠오르기 (진행값 하나에 위치 · 흐림 · 투명도)
  const blurSlide = (els, t, start, gap, dur, dy, blur) =>
    els.forEach((el, i) => { const p = ramp(t, start + i * gap, dur, E.quintOut); set(el, `translateY(${((1 - p) * dy).toFixed(2)}px)`, p, (1 - p) * blur); });

  // ── 이미지 시퀀스 ── renderAt 끝에서 await V.flush() 로 이번 프레임 이미지 디코드를 기다린다
  let pending = [];
  const setSrc = (img, src) => { if (img.getAttribute("src") !== src) { img.setAttribute("src", src); pending.push(img.decode().catch(() => {})); } };
  const flush = async () => { const p = pending; pending = []; await Promise.all(p); };
  const pad = (n) => String(n).padStart(5, "0");
  // seq/<이름>/00001.jpg ... (resample.mjs 결과, 1부터). 개수는 window.SEQ_COUNT[이름]
  const seq = (name, n) => `seq/${name}/${pad(clamp(Math.round(n), 0, (root.SEQ_COUNT?.[name] ?? 1e9) - 1) + 1)}.jpg`;

  // ── 전환 ── SHOTS = { id: {start, len} }, ENTER = { id: {type, len, color} } (그 장면이 들어올 때)
  // type: cut · flash(앞뒤 len) · push(가로) · pushY(아래에서) · whip(휩팬) · hidden(전경 판, 시작 앞뒤 len/2)
  const placeScenes = (f, SHOTS, ENTER = {}) => {
    const ids = Object.keys(SHOTS).sort((a, b) => SHOTS[a].start - SHOTS[b].start);
    ids.forEach((id) => { const el = byId(id); el.style.transform = "none"; el.style.filter = "none"; el.style.boxShadow = "none"; show(el, false); });
    const on = (id, tf = "none", filter = "none") => { const el = byId(id); show(el, true); el.style.transform = tf; el.style.filter = filter; };
    const plate = byId("plate"); if (plate) show(plate, false);
    let i = 0; ids.forEach((id, k) => { if (f >= SHOTS[id].start) i = k; });
    const cur = ids[i], prev = ids[i - 1], next = ids[i + 1];
    const hidden = (a, b) => {
      const e = ENTER[b]; if (!e || e.type !== "hidden" || !plate) return false;
      const s0 = SHOTS[b].start - Math.floor(e.len / 2);
      if (f < s0 || f >= s0 + e.len) return false;
      const p = ramp(f, s0, e.len, bezier(0.3, 0, 0.7, 1));
      const pw = plate.offsetWidth || 3280, c = e.color ?? "#fff";
      plate.style.background = `linear-gradient(90deg, transparent 0, ${c} 340px, ${c} ${pw - 340}px, transparent ${pw}px)`;
      show(plate, true); plate.style.transform = `translateX(${(W - p * (W + pw)).toFixed(1)}px)`;
      const drift = lerp(40, -40, p);
      on(p < 0.5 ? a : b, `translateX(${drift.toFixed(1)}px) scale(1.06)`);   // 6% 키워 가장자리가 드러나지 않게
      return true;
    };
    if (!(next && hidden(cur, next)) && !(prev && hidden(prev, cur))) {
      const e = ENTER[cur] ?? { type: "cut" }, t = f - SHOTS[cur].start, len = e.len ?? 0;
      if (prev && t < len && e.type === "push") {
        const p = ramp(t, 0, len, E.push);
        on(prev, `translateX(${(-p * W).toFixed(1)}px)`); on(cur, `translateX(${((1 - p) * W).toFixed(1)}px)`);
      } else if (prev && t < len && e.type === "pushY") {
        const p = ramp(t, 0, len, E.push);
        on(prev, `translateY(${(-p * H).toFixed(1)}px)`); on(cur, `translateY(${((1 - p) * H).toFixed(1)}px)`);
        byId(cur).style.boxShadow = "0 -56px 80px rgba(0,0,0,0.28), inset 0 2px 0 rgba(255,255,255,0.35)";
      } else if (prev && t < len && e.type === "whip") {
        const x = (u) => 1 - Math.pow(1 - clamp(u / len), 4);   // 이어지는 속도 곡선: 30% 시간에 76%
        const p = x(t), blur = Math.min(64, Math.abs((x(t + 1) - p) * W) * 0.085);
        on(prev, `translateX(${(-p * W).toFixed(1)}px)`, `blur(${blur.toFixed(1)}px)`);
        on(cur, `translateX(${((1 - p) * W).toFixed(1)}px)`, `blur(${blur.toFixed(1)}px)`);
      } else on(cur);
    }
    let flash = 0;
    ids.forEach((id) => { const e = ENTER[id]; if (e?.type === "flash") { const d = f - SHOTS[id].start; if (Math.abs(d) <= e.len) flash = Math.max(flash, 1 - Math.abs(d) / (e.len + 1)); } });
    const fl = byId("flash"); if (fl) fl.style.opacity = flash.toFixed(3);
  };

  // ── 부품 ──
  // 확대 말풍선: 실제로 친 글자를 키 시각대로 한 자씩, enter 뒤 강조색, tagAt 부터 .tag 표시
  const callout = (el, t, { word, keys, enter, cx, cy, tagAt, off, color = "#02787D" }) => {
    const on = keys[0] - 4, end = off ?? enter + 10;
    if (t < on || t > end + 6) { el.style.opacity = 0; return; }
    $(".txtv", el).textContent = word.slice(0, keys.filter((k) => t >= k).length);
    const hit = t >= enter;
    el.style.borderColor = color;
    el.style.background = hit ? color : "#fff"; el.style.color = hit ? "#fff" : "#12302F";
    const caret = $(".caret", el); if (caret) { caret.style.display = hit ? "none" : "block"; caret.style.background = color; }
    const tag = $(".tag", el); if (tag) { tag.style.display = tagAt !== undefined && t >= tagAt ? "inline-block" : "none"; tag.style.color = color; }
    const pin = ramp(t, on, 6, TOKEN.land), pop = hit ? 1 + 0.06 * Math.sin(Math.PI * ramp(t, enter, 8)) : 1;
    el.style.left = `${cx - el.offsetWidth / 2}px`; el.style.top = `${cy - el.offsetHeight / 2}px`;
    set(el, `scale(${(lerp(0.85, 1, pin) * pop).toFixed(4)})`, clamp(pin * 1.2) * (1 - ramp(t, end, 6)));
  };
  // 지목(lock-on): 모서리 넷이 날아와 상자(x,y,w,h — svg 좌표)를 물고, 무는 순간 흰 덧칠 + 라벨
  const lockOn = (svg, t, { x, y, w, h, start, at, end, color = "#02787D", label }) => {
    if (t < start || t > end + 8) { svg.innerHTML = ""; return; }
    const fly = ramp(t, start, 10, E.cubicOut);
    const shrink = t < at ? lerp(2.2, 0.94, ramp(t, start, at - start, E.cubicOut)) : lerp(0.94, 1, ramp(t, at, 6, E.cubicOut));
    const cx = x + w / 2, cy = y + h / 2, ww = w * shrink, hh = h * shrink, off = (1 - fly) * 1000, out = 1 - ramp(t, end, 8);
    const parts = [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sy]) => {
      const px = cx + sx * ww / 2 + sx * off, py = cy + sy * hh / 2 + sy * off * 0.6;
      return `<path d="M${px - sx * 30} ${py} L${px} ${py} L${px} ${py - sy * 30}" stroke="${color}" stroke-width="9" fill="none" stroke-linecap="round"/>`;
    }).join("");
    const bite = t >= at ? lerp(0.55, 0.28, ramp(t, at, 8)) : 0, lab = ramp(t, at, 8, E.backOut(1.6));
    const lw = label ? 40 + label.length * 30 : 0;
    svg.innerHTML = `<g opacity="${out.toFixed(3)}">${t >= at ? `<rect x="${x + 14}" y="${y + 14}" width="${w - 28}" height="${h - 28}" rx="10" fill="#fff" opacity="${bite.toFixed(3)}"/>` : ""}${parts}
      ${t >= at && label ? `<g transform="translate(${cx} ${y - 34}) scale(${lab.toFixed(3)})"><rect x="${-lw / 2}" y="-30" width="${lw}" height="52" rx="26" fill="${color}"/><text x="0" y="8" text-anchor="middle" font-family="SUIT, sans-serif" font-weight="800" font-size="30" fill="#fff">${label}</text></g>` : ""}</g>`;
  };
  const corners = (x, y, w, h, len, stroke, color = "#fff") =>
    [[x, y, 1, 1], [x + w, y, -1, 1], [x, y + h, 1, -1], [x + w, y + h, -1, -1]]
      .map(([px, py, sx, sy]) => `<path d="M${px + sx * len} ${py} L${px} ${py} L${px} ${py + sy * len}" stroke="${color}" stroke-width="${stroke}" fill="none" stroke-linecap="round"/>`).join("");
  // 멈추고 표시(freeze-annotate) 의 그림 부분: 번쩍 · 모서리 · "멈춤" · 마커 동그라미 · 화살표 · 라벨. u = 멈춘 뒤 프레임
  const freezeMark = (svg, u, { len, w, h, cx, cy, rx = 96, ry = 84, label, color = "#FFE14D", ink = "#2B3A12" }) => {
    if (u < 0 || u >= len) { svg.innerHTML = ""; return; }
    const flash = u < 3 ? 0.6 * (1 - u / 3) : 0, draw = ramp(u, 4, 10, E.cubicOut), arrow = ramp(u, 14, 6, E.cubicOut), lab = ramp(u, 18, 8, E.backOut(1.6));
    const end = 1 - ramp(u, len - 6, 6), C = 2 * Math.PI * Math.max(rx, ry) * 1.08, lw = label ? 48 + label.length * 32 : 0;
    svg.innerHTML = `<defs><filter id="rough"><feTurbulence baseFrequency="0.04" numOctaves="2" seed="3"/><feDisplacementMap in="SourceGraphic" scale="6"/></filter></defs>
      <rect width="${w}" height="${h}" fill="#fff" opacity="${flash.toFixed(3)}"/>
      <g opacity="${end.toFixed(3)}">${corners(24, 24, w - 48, h - 48, 46, 7)}
      <g transform="translate(${w / 2} 70)"><rect x="-70" y="-28" width="140" height="56" rx="28" fill="rgba(0,0,0,0.55)"/><text x="0" y="10" text-anchor="middle" font-family="SUIT, sans-serif" font-weight="800" font-size="30" fill="#fff">멈춤</text></g>
      <g filter="url(#rough)"><ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" transform="rotate(-8 ${cx} ${cy})" fill="none" stroke="${color}" stroke-width="9" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${(C * (1 - draw * 0.98)).toFixed(1)}"/>
      <path d="M${cx + 150} ${cy - 150} Q${cx + 120} ${cy - 110} ${cx + 92} ${cy - 76}" fill="none" stroke="${color}" stroke-width="8" stroke-linecap="round" pathLength="1" stroke-dasharray="1 1" stroke-dashoffset="${(1 - arrow).toFixed(3)}"/></g>
      ${label ? `<g transform="translate(${cx + 196} ${cy - 176}) scale(${lab.toFixed(3)})"><rect x="${-lw / 2}" y="-32" width="${lw}" height="60" rx="30" fill="${color}"/><text x="0" y="10" text-anchor="middle" font-family="SUIT, sans-serif" font-weight="800" font-size="32" fill="${ink}">${label}</text></g>` : ""}</g>`;
  };
  // 돋보기: 소재 이미지의 한 점(cell, 소재 좌표)을 zoom 배로. 원(lo) 중심은 center(화면 좌표), 점의 화면 좌표는 cellScr
  const loupe = (lo, tag, line, t, { src, cell, cellScr, center, zoom = 3, size = 300, start, end, color = "#02787D" }) => {
    const on = t >= start && t < end + 6, lin = ramp(t, start, 8, TOKEN.land), lout = 1 - ramp(t, end, 6), r = size / 2;
    showIn(lo, on); if (tag) showIn(tag, on);
    if (!on) { if (line) line.innerHTML = ""; return; }
    const img = $("img", lo); setSrc(img, src);
    img.style.transform = `translate(${(r - cell.x * zoom).toFixed(1)}px, ${(r - cell.y * zoom).toFixed(1)}px) scale(${zoom})`;
    lo.style.left = `${center.x - r}px`; lo.style.top = `${center.y - r}px`; lo.style.borderColor = color;
    set(lo, `scale(${lin.toFixed(4)})`, clamp(lin * 1.3) * lout);
    if (tag) { tag.style.left = `${center.x - tag.offsetWidth / 2}px`; tag.style.top = `${center.y + r + 18}px`; tag.style.background = color; set(tag, `translateY(${((1 - lin) * 20).toFixed(1)}px)`, clamp(lin) * lout); }
    if (line) line.innerHTML = `<g opacity="${(clamp(lin) * lout).toFixed(3)}"><circle cx="${cellScr.x}" cy="${cellScr.y}" r="26" fill="none" stroke="${color}" stroke-width="5"/><line x1="${cellScr.x + 20}" y1="${cellScr.y + 18}" x2="${center.x - r * 0.73}" y2="${center.y - r * 0.67}" stroke="${color}" stroke-width="5" stroke-linecap="round"/></g>`;
  };
  // 윤곽 그리기(draw-trace): 둥근 사각형을 펜 끝(가늘어지는 dash 3겹)과 함께 start~end 에 그리고 닫히는 순간 굵게
  const trace = (svg, t, { x, y, w, h, rx = 8, start, end, color = "#02787D", width = 5 }) => {
    if (t < start) { svg.innerHTML = ""; return; }
    const d = ramp(t, start, end - start, E.cubicInOut), close = t >= end ? ramp(t, end, 6) : 0;
    const sw = t >= end && t < end + 2 ? width + 3 : lerp(width + 3, width, close);
    const tip = (k, wd, op) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" pathLength="1" fill="none" stroke="${color}" stroke-width="${wd}" stroke-linecap="round" stroke-dasharray="${0.04 * k} 1" stroke-dashoffset="${(-(d - 0.04 * k)).toFixed(4)}" opacity="${op}"/>`;
    svg.innerHTML = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" pathLength="1" fill="none" stroke="${color}" stroke-width="${sw}" stroke-dasharray="1 1" stroke-dashoffset="${(1 - d).toFixed(4)}"/>` +
      (d < 1 ? tip(1, width + 1, 0.9) + tip(0.6, width + 3, 0.6) + tip(0.3, width + 5, 0.35) : "");
  };
  // 글자 카드: 어절(.w) 도장 + 마커 밑줄(path, pathLength=1). 긋기 전엔 숨겨 둥근 끝이 점으로 남지 않게
  const titleCard = (sc, t, { stamp = 4, gap = 4, underline = 18 } = {}) => {
    $$(".w", sc).forEach((el, i) => { const p = ramp(t, stamp + gap * i, 9, E.stamp); set(el, `scale(${lerp(1.28, 1, p).toFixed(4)})`, p, (1 - p) * 7); });
    const path = $("path", sc); if (!path) return;
    const ul = ramp(t, underline, 10, E.cubicOut);
    path.style.strokeDashoffset = (1 - ul).toFixed(4); path.style.visibility = ul > 0 ? "" : "hidden";
  };
  // 커서 클릭: from -> to 를 start~at 에 호를 그리며, click 에 누름 3f · 물결 18f, 클릭 2f 뒤 5f 에 사라짐
  const cursorClick = (cur, ripple, t, { from, to, start, at, click }) => {
    const mv = ramp(t, start, at - start, bezier(0.55, 0, 0.18, 1));
    const cx = lerp(from.x, to.x, mv), cy = lerp(from.y, to.y, mv) - Math.sin(mv * Math.PI) * 60;
    const press = t >= click && t < click + 7 ? (t < click + 3 ? 0.84 : lerp(0.84, 1, (t - click - 3) / 4)) : 1;
    set(cur, `translate(${(cx - 6).toFixed(1)}px, ${(cy - 4).toFixed(1)}px) scale(${press.toFixed(3)})`, clamp(ramp(t, start, 6)) * (1 - ramp(t, click + 2, 5)));
    const rp = ramp(t, click, 18, E.cubicOut);
    if (ripple) set(ripple, `translate(${to.x.toFixed(1)}px, ${to.y.toFixed(1)}px) scale(${(0.2 + 0.8 * rp).toFixed(3)})`, t >= click ? 1 - rp : 0);
  };
  // 급줌(crash-zoom): from~at 에 zmax 배, 착지 5f 되튀기. P = 확대할 점(요소 좌표), target = 그 점이 갈 자리. 1배 아래로 줄이지 않는다
  const crashZoom = (zoomEl, t, { from, at, zmax = 2.2, P, target, w, h }) => {
    let z = 1;
    if (t >= from) z = lerp(1, zmax, ramp(t, from, at - from, E.cubicIn)) * (1 + 0.04 * Math.sin(Math.PI * ramp(t, at, 5)));
    const pz = clamp((z - 1) / (zmax - 1));
    const ox = clamp(target.x - P.x * z, w - w * z, 0), oy = clamp(target.y - P.y * z, h - h * z, 0);
    zoomEl.style.transformOrigin = "0 0";
    zoomEl.style.transform = z === 1 ? "none" : `translate(${lerp(0, ox, pz).toFixed(1)}px, ${lerp(0, oy, pz).toFixed(1)}px) scale(${z.toFixed(4)})`;
    zoomEl.style.filter = t >= from && t < at ? "blur(3px)" : "none";
  };
  // 날아와 앉기 (단체 사진 등): (x,y,r) 자리로 (fx,fy) 만큼 떨어진 곳에서
  const flyIn = (el, u, { x, y, r = 0, fx, fy, start, dur = 24, scale = 1 }) => {
    const p = ramp(u, start, dur, bezier(0.16, 1, 0.3, 1));
    set(el, `translate(${(x + (1 - p) * fx).toFixed(1)}px, ${(y + (1 - p) * fy).toFixed(1)}px) rotate(${(r * p).toFixed(2)}deg) scale(${scale})`, clamp(p * 3));
  };

  // ── 렌더 전 자동 검사 (render.mjs 가 부른다) ──
  // leak: 숨은 장면 안인데 visibility:visible 이 직접 걸린 요소 / text: .read(읽는 글 64px 이상) · .read-sub(보조 37px 이상)의 렌더 크기 / zoom: .zoom 이 1배 아래
  const audit = () => {
    const out = [];
    $$("[style*='visibility: visible']").forEach((el) => {
      const sc = el.closest(".scene");
      if (sc && sc !== el && sc.style.visibility === "hidden") out.push(`leak: #${sc.id} 가 숨었는데 ${el.tagName.toLowerCase()}${el.id ? "#" + el.id : ""} 가 visible — showIn 을 쓴다`);
    });
    const visible = (el) => el.checkVisibility ? el.checkVisibility({ opacityProperty: true, visibilityProperty: true }) : true;
    const scaleOf = (el) => { const r = el.getBoundingClientRect(); return el.offsetHeight ? r.height / el.offsetHeight : 1; };
    [[".read", 64, "읽는 글"], [".read-sub", 37, "보조 문구"]].forEach(([sel, min, name]) => $$(sel).forEach((el) => {
      if (!visible(el) || +getComputedStyle(el).opacity < 0.9) return;
      const px = parseFloat(getComputedStyle(el).fontSize) * scaleOf(el);
      if (px < min - 0.5) out.push(`text: ${name} "${el.textContent.trim().slice(0, 16)}" ${px.toFixed(0)}px (하한 ${min}px, 렌더 높이 56 · 32px 에 해당)`);
    }));
    $$(".zoom").forEach((el) => { if (!visible(el)) return; const m = new DOMMatrix(getComputedStyle(el).transform); if (m.a < 0.999) out.push(`zoom: ${el.closest(".scene")?.id} 의 .zoom 이 ${m.a.toFixed(3)}배 — 1배 아래면 가장자리에 틈`); });
    return out;
  };

  root.V = { W, H, clamp, lerp, bezier, E, ramp, setToken, get TOKEN() { return TOKEN; }, $, $$, byId, set, show, showIn, blurSlide,
    setSrc, flush, seq, pad, placeScenes, callout, lockOn, corners, freezeMark, loupe, trace, titleCard, cursorClick, crashZoom, flyIn, audit };
})(window);

# 영상 부품 · 스크립트

`/promo` · `/teaser` 가 같이 쓴다. 고정된 건 "어떻게 움직이는지" 계산뿐이고, 색 · 글꼴 · 문구 · 시각 · 위치는 전부 인자 · `timeline.js` · CSS 변수로 프로젝트마다 정한다. 맞는 부품이 없으면 composition 안에서 새로 만들고, 다시 쓸 만하면 여기에 더한다.

출처: `/promo` 첫 제작(한판 소개 영상, 2026-10-13)에서 쓴 코드와 독립 검수 지적을 정리. 기법 이름은 `techniques.md`.

## 시작하기

```bash
SK=<스킬 폴더>/promo/assets
mkdir -p work && cp $SK/*.mjs $SK/engine.js $SK/parts.css work/
cp $SK/template/* work/            # composition.html · timeline.js · sfx.js · capture.mjs 틀
export PW_FROM=<프로젝트에서 @playwright/test 가 깔린 폴더>   # 예: <repo>/frontend. 없으면 설치하지 말고 사용자에게 묻는다
```

## 브라우저 엔진 `engine.js` (window.V)

| 함수 | 하는 일 | 함정 (검수에서 나온 것) |
| ---- | ------- | ----------------------- |
| `ramp(f, s, d, ease)` · `E.*` · `bezier` · `lerp` · `clamp` | 시간 → 진행값 | |
| `setToken({ dur, land: [x1,y1,x2,y2] })` | 움직임 성격(craft.md 표) 한 벌 | 등장 · 착지가 다른 토큰을 섞지 않는다 |
| `blurSlide(els, t, start, gap, dur, dy, blur)` | 어절마다 흐림 벗으며 등장 | 세 속성을 진행값 하나로 |
| `show` / `showIn` | 장면 / 장면 안 요소 표시 | 장면 안 요소에 `visible` 을 직접 주면 장면이 숨어도 남아 다른 전환 때 비친다 |
| `setSrc(img, src)` · `seq(name, n)` · `await flush()` | 녹화 프레임 바꾸기 · 디코드 대기 | `renderAt` 끝에서 꼭 `await V.flush()` |
| `placeScenes(f, SHOTS, ENTER)` | 장면 표시 + 전환 (cut · flash · push · pushY · whip · hidden) | hidden 은 장면을 6% 키워 가장자리를 숨긴다. pushY 꼬리에 이전 장면 띠가 잠깐 보이는 건 밀기의 성질 |
| `callout(el, t, {word, keys, enter, cx, cy, tagAt, off, color})` | 확대 말풍선 — 게임 안 작은 글자(12px)를 키 시각대로 크게 | 글자는 녹화에서 실제로 친 것 · 실제 화면 문구만 |
| `lockOn(svg, t, {x,y,w,h,start,at,end,color,label})` | 모서리 넷이 날아와 지목 | 밝은 바탕엔 흰색 말고 강조색. 밀기 전환 중에 시작하지 않기 |
| `freezeMark(svg, u, {len,w,h,cx,cy,label})` | 멈춤 번쩍 · 모서리 · 마커 동그라미 · 라벨 | 녹화 쪽 정지(프레임 고정)는 composition 이 직접 |
| `loupe(lo, tag, line, t, {src, cell, cellScr, center, zoom, start, end})` | 돋보기 (소재 한 점 확대) | 1배 녹화 3배 확대는 흐리다. 가능하면 2배 소재 |
| `trace(svg, t, {x,y,w,h,rx,start,end})` | 윤곽 그리기 | rx 를 실제 버튼 모서리에 맞추고, 위 문구를 가리지 않게 6px 바깥 · 5px 선 |
| `titleCard(sc, t, {stamp, underline})` | 글자 카드 도장 + 마커 밑줄 | 밑줄 path 는 `pathLength="1" stroke-dasharray="1 1"` |
| `cursorClick(cur, ripple, t, {from,to,start,at,click})` | 커서 이동 · 클릭 · 물결 | 클릭 뒤 바로 사라짐 (새 페이지 위에 남지 않게) |
| `crashZoom(zoomEl, t, {from,at,zmax,P,target,w,h})` | 급줌 | 1배 아래로 줄이지 않는다(틈). 사라지기 전의 대상에 착지 |
| `flyIn(el, u, {x,y,r,fx,fy,start,dur})` | 날아와 앉기 (단체 사진) | |
| `audit()` | 자동 검사 (아래) | |

CSS `parts.css`: `.scene` `.card` `.frame` `.callout` `.loupe` `.paper` `.pill-cap` `.cursor` `.ripple`, 글자 크기 클래스 `.read`(66px) · `.read-sub`(44px) · `.title`. 색은 `:root` 의 `--brand` `--ink` `--paper` `--font`.

## Node 스크립트

| 스크립트 | 하는 일 |
| -------- | ------- |
| `capture-lib.mjs` | `launch` · `newPage({dsf, vw, vh, hide})` · `settle` (개발 서버 오류 창이 있으면 기다렸다 다시 불러옴) · `record(page, name, fn)` (CDP 화면 스트림 녹화 + 사건 시각) · `reactRef(page, selector, key)` (캔버스 게임의 React 상태 읽기, 읽기만) |
| `resample.mjs [이름=crop ...]` | 불규칙한 녹화 프레임을 시각대로 30fps 로, 사건을 프레임 번호로 (`seq/<이름>/events.json`), `seq-count.js` |
| `render.mjs [--preview] [--workers 4] [판 프레임...]` | 프레임 렌더. 기본 브라우저 4개 병렬, `--preview` 는 960x540. 시작 전에 `audit()` 를 프레임 30개마다 돌려 경고를 보여 준다 (`--strict` 면 경고가 있을 때 멈춤) |
| `synth.mjs` | 음악(timeline.MUSIC) + 효과음(sfx.js) 로컬 합성 → `audio-music.wav` · `audio-nomusic.wav` (같은 배율) |
| `finish.mjs --name promo --poster 1340` | 묶기(두 판) · 포스터 뽑아 0번 프레임에 굽기 · ffprobe · 소리 싱크 측정 · 컨택트 시트를 한 번에 |

## 녹화에서 미리 알면 시간을 버는 것

- 개발 서버가 다른 작업 중이면 컴파일 오류 창이 찍힌다 → `settle` 이 막는다. 찍은 뒤에도 한 장은 눈으로 본다.
- 사이트 화면은 1920 폭에서 내용이 작다 → 1280x720 · `dsf 1.5`(녹화) / `dsf 3`(정지) 로 찍으면 1920x1080 에 꽉 찬다.
- 게스트 · 로그인 상태는 브라우저 창(context)마다 다르다 → "풀던 판이 있음" 같은 화면은 같은 창에서 만든 뒤 찍는다.
- 정지 캡처와 녹화를 이어 붙이는 장면은 같은 시점 · 같은 화면 크기로 찍는다 (그사이 사이트가 바뀌면 버튼 글자가 바뀌어 튄다).
- 녹화 사건 시각(클릭 · Enter)과 화면 반응은 몇 프레임 차이가 난다 → 효과 · 소리는 반응이 보이는 프레임에 맞춘다 (`seq` 프레임을 띠로 모아 보고 정함).
- 캔버스로 그리는 게임은 DOM 으로 글자를 못 읽는다 → `reactRef` 로 상태를 읽기만 한다. 응답 · 로직은 바꾸지 않는다.
- 앱이 자동화 브라우저에 띄우는 안내는 `newPage({ hide: [/정규식/] })` 로 그 문구만 숨긴다 (탐지를 피하지 않는다).

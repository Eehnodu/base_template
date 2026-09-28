"""index.css 의 색 토큰(rgb 삼중값)으로 WCAG 2.x 대비를 라이트 · 다크 각각 계산한다.

사용 (frontend/ 에서):  python scripts/check_contrast.py [--all]
- 텍스트 쌍은 4.5:1 미만이면 실패(exit 1). UI 쌍(테두리 · 포커스 링)은 3:1 미만이면 경고만.
- --all : 통과한 쌍도 전부 출력
토큰 이름이 index.css 에 없으면 그 쌍은 건너뛰고 알린다. 새 토큰을 만들면 PAIRS 에 쌍을 추가한다.
대비 공식은 WCAG 2.x 상대 휘도 정의를 그대로 쓴다. 다크모드는 WCAG 2 가 가장 부정확한 영역이므로(APCA 참고) 통과해도 브라우저 확인은 필요하다.
"""
import re
import sys
from pathlib import Path

for _s in (sys.stdout, sys.stderr):
    try:
        _s.reconfigure(encoding="utf-8")
    except Exception:
        pass

CSS = Path(__file__).resolve().parent.parent / "src" / "index.css"

# (전경, 배경, 최소 비율, 종류) — 종류: "text" 는 실패, "ui" 는 경고
PAIRS = [
    ("text-main", "bg", 4.5, "text"),
    ("text-main", "bg-card", 4.5, "text"),
    ("text-main", "bg-sub", 4.5, "text"),
    ("text-sub", "bg", 4.5, "text"),
    ("text-sub", "bg-card", 4.5, "text"),
    ("text-placeholder", "input-bg", 4.5, "text"),
    ("text-inverse", "btn-main", 4.5, "text"),
    ("white", "btn-sub1", 4.5, "text"),  # Button sub1 은 text-white 고정
    ("black", "btn-sub2", 4.5, "text"),  # Button sub2 는 text-black 고정
    ("text-inverse", "point-red", 4.5, "text"),  # Button danger 는 bg-error text-text-inverse
    ("text-inverse", "primary", 4.5, "text"),
    ("point-green", "success-bg", 4.5, "text"),
    ("point-red", "error-bg", 4.5, "text"),
    ("point-amber", "warning-bg", 4.5, "text"),
    ("point-blue", "info-bg", 4.5, "text"),
    ("point-green", "bg-card", 4.5, "text"),
    ("point-red", "bg-card", 4.5, "text"),
    ("point-amber", "bg-card", 4.5, "text"),
    ("point-blue", "bg-card", 4.5, "text"),
    ("border-focus", "bg", 3.0, "ui"),
    ("border-focus", "bg-card", 3.0, "ui"),
    ("input-border", "input-bg", 3.0, "ui"),
    ("border-strong", "bg-card", 3.0, "ui"),
]


# 컴포넌트가 토큰 대신 고정으로 쓰는 색
CONST = {"white": (255, 255, 255), "black": (0, 0, 0)}


def parse(css: str) -> dict[str, dict[str, tuple[int, int, int]]]:
    themes = {}
    for name, sel in (("light", r":root"), ("dark", r"\.dark")):
        m = re.search(sel + r"\s*\{(.*?)\n\s*\}", css, re.S)
        if not m:
            continue
        vals = {}
        for k, r, g, b in re.findall(r"--([\w-]+):\s*(\d+)\s+(\d+)\s+(\d+)\s*;", m.group(1)):
            vals[k] = (int(r), int(g), int(b))
        themes[name] = vals
    return themes


def luminance(rgb: tuple[int, int, int]) -> float:
    def ch(c: int) -> float:
        c = c / 255
        return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
    r, g, b = rgb
    return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b)


def ratio(fg, bg) -> float:
    l1, l2 = luminance(fg), luminance(bg)
    hi, lo = max(l1, l2), min(l1, l2)
    return (hi + 0.05) / (lo + 0.05)


def main() -> int:
    show_all = "--all" in sys.argv
    themes = parse(CSS.read_text(encoding="utf-8"))
    if not themes:
        print(f"토큰 블록을 찾지 못했다: {CSS}")
        return 1

    failed = 0
    warned = 0
    for theme, vals in themes.items():
        print(f"\n== {theme} ==")
        missing = set()
        for fg, bg, need, kind in PAIRS:
            colors = {**CONST, **vals}
            if fg not in colors or bg not in colors:
                missing.update(t for t in (fg, bg) if t not in colors)
                continue
            r = ratio(colors[fg], colors[bg])
            ok = r >= need
            if ok and not show_all:
                continue
            if not ok:
                if kind == "text":
                    failed += 1
                    tag = "실패"
                else:
                    warned += 1
                    tag = "경고"
            else:
                tag = "통과"
            print(f"  [{tag}] {fg} on {bg}: {r:.2f}:1 (기준 {need}:1, {kind})")
        if missing:
            print(f"  (index.css 에 없는 토큰이라 건너뜀: {', '.join(sorted(missing))})")

    print(f"\n텍스트 실패 {failed} · UI 경고 {warned}")
    if failed:
        print("실패한 쌍은 전경 · 배경 중 하나의 명도를 바꾼다 (색상 · 채도는 유지). 라이트 · 다크 값을 따로 고친다.")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())

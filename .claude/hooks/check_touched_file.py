"""PostToolUse(Edit | Write): 방금 고친 파일 하나만 빠르게 검사한다.

- .py : 문법(py_compile) + HTTPException 직접 raise · print · 예외 삼키기
- .ts/.tsx : any · eslint-disable · ts-ignore · console.log · 고정색
문제가 있으면 stderr 에 [심각도] 줄: 내용 — 규칙 을 쓰고 exit 2 (이미 수정된 파일을 되돌리지는 않는다.
Claude 가 메시지를 보고 고치거나, 의도된 예외면 보고에 이유를 적는다).
전체 lint · 타입 검사는 /verify 가 한다. 여기서는 1초 안에 끝나는 것만.
"""
import json
import py_compile
import re
import sys

for _s in (sys.stdout, sys.stderr):
    try:
        _s.reconfigure(encoding="utf-8")
    except Exception:
        pass
from pathlib import Path

SKIP_PARTS = ("node_modules", "dist", ".venv", "__pycache__", ".claude", "zz_docs", "zz_claude100", "alembic")

PY_RULES = [
    (r"raise\s+HTTPException", "High", "실패는 fail(메시지, 코드, 상태) 로 (rules/backend/module.md 에러 처리)"),
    (r"except\s+Exception\s*:\s*\n\s*pass\b", "High", "예외를 삼키지 않는다"),
    (r"^\s*print\(", "Low", "로그는 get_logger 로"),
]

TS_RULES = [
    (r":\s*any\b|\bas\s+any\b", "High", "any 금지 — 타입을 정의한다"),
    (r"eslint-disable|@ts-ignore|@ts-expect-error", "High", "검증 약화 금지"),
    (r"console\.log\(", "Medium", "디버그 코드 금지"),
    (r"\bfetch\(", "Medium", "API 호출은 useAPI 훅으로"),
]

TSX_COLOR_RULES = [
    (r"(?<![\w&])#[0-9a-fA-F]{3,8}\b", "Medium", "색은 토큰만 (의도된 예외: admin 사이드바 · 로그인 패널 · 카카오 버튼 → 보고에 이유)"),
    (r"\b(bg|text|border)-(gray|slate|zinc|neutral|red|blue|green|yellow)-\d{2,3}\b", "Medium", "기본 팔레트 대신 토큰 (bg-bg-card, text-text-main 등)"),
    (r"\bbg-(white|black)\b", "Medium", "색은 토큰만"),
]


def scan(text: str, rules, multiline=False):
    found = []
    for pattern, sev, rule in rules:
        flags = re.MULTILINE | (re.DOTALL if multiline else 0)
        for m in re.finditer(pattern, text, flags):
            line = text.count("\n", 0, m.start()) + 1
            snippet = text.splitlines()[line - 1].strip()[:80]
            found.append((sev, line, snippet, rule))
    return found


def main() -> int:
    try:
        data = json.load(sys.stdin)
    except Exception:
        return 0

    raw = data.get("tool_input", {}).get("file_path") or ""
    if not raw:
        return 0
    p = Path(raw)
    if not p.exists() or any(part in SKIP_PARTS for part in p.parts):
        return 0

    findings = []
    try:
        text = p.read_text(encoding="utf-8")
    except Exception:
        return 0

    if p.suffix == ".py" and "backend" in p.parts:
        try:
            py_compile.compile(str(p), doraise=True)
        except py_compile.PyCompileError as e:
            print(f"[hook] 문법 오류: {raw}\n{e.msg}", file=sys.stderr)
            return 2
        rules = PY_RULES
        if "scripts" in p.parts:
            rules = [r for r in rules if "print" not in r[0]]
        findings += scan(text, rules, multiline=True)

    elif p.suffix in (".ts", ".tsx") and "frontend" in p.parts:
        findings += scan(text, TS_RULES)
        if p.suffix == ".tsx":
            findings += scan(text, TSX_COLOR_RULES)

    if not findings:
        return 0

    order = {"High": 0, "Medium": 1, "Low": 2}
    findings.sort(key=lambda f: (order[f[0]], f[1]))
    print(f"[hook] 규칙 점검: {raw} — {len(findings)}건", file=sys.stderr)
    for sev, line, snippet, rule in findings[:20]:
        print(f"  [{sev}] {line}: {snippet} — {rule}", file=sys.stderr)
    print("  → 고치거나, 의도된 예외면 보고에 이유를 적는다. 검증을 약화해서 통과시키지 않는다.", file=sys.stderr)
    return 2


if __name__ == "__main__":
    raise SystemExit(main())

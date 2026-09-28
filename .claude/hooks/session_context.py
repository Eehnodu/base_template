"""SessionStart(startup | clear | compact): 세션이 시작되거나 컨텍스트가 정리된 직후 현재 상태를 짧게 주입한다.

주입 내용: 브랜치, 작업 트리 변경 파일, 마지막 /verify 마커, zz_docs/TODO.md 의 "진행 중" 섹션.
CLAUDE.md 원칙 8(세션 재개 시 TODO · git status 먼저)을 Claude 의 기억이 아니라 훅이 대신 해 준다.
출력은 hookSpecificOutput.additionalContext JSON. 실패하면 조용히 exit 0 (세션을 막지 않는다).
"""
import json
import re
import subprocess
import sys
from pathlib import Path

for _s in (sys.stdout, sys.stderr):
    try:
        _s.reconfigure(encoding="utf-8")
    except Exception:
        pass

ROOT = Path(__file__).resolve().parent.parent.parent
MARKER = ROOT / ".claude" / "last-verify.json"
TODO = ROOT / "zz_docs" / "TODO.md"
MAX_FILES = 15


def git(*args: str) -> str:
    try:
        return subprocess.run(["git", *args], cwd=ROOT, capture_output=True, text=True, timeout=10).stdout.strip()
    except Exception:
        return ""


def main() -> int:
    try:
        data = json.load(sys.stdin)
    except Exception:
        data = {}
    source = data.get("source", "startup")

    lines = [f"[세션 상태 — {source}]"]

    branch = git("rev-parse", "--abbrev-ref", "HEAD")
    if branch:
        lines.append(f"브랜치: {branch}")

    status = git("status", "--porcelain")
    if status:
        files = status.splitlines()
        lines.append(f"작업 트리 변경 {len(files)}개:")
        lines += [f"  {l.strip()}" for l in files[:MAX_FILES]]
        if len(files) > MAX_FILES:
            lines.append(f"  ... 외 {len(files) - MAX_FILES}개")
    else:
        lines.append("작업 트리: 깨끗함")

    if MARKER.exists():
        try:
            m = json.loads(MARKER.read_text(encoding="utf-8"))
            lines.append(f"마지막 /verify: {m.get('at')} {m.get('scope')} {m.get('result')} (그 뒤 코드가 바뀌었으면 다시 돌린다)")
        except Exception:
            pass
    else:
        lines.append("마지막 /verify: 기록 없음")

    if TODO.exists():
        try:
            text = TODO.read_text(encoding="utf-8")
            m = re.search(r"^## 진행 중.*?(?=^## |\Z)", text, re.S | re.M)
            if m:
                block = m.group(0).strip().splitlines()
                lines.append("")
                lines += block[:25]
                if len(block) > 25:
                    lines.append("  ... (zz_docs/TODO.md 에서 계속)")
            else:
                lines.append("TODO '진행 중' 섹션: 없음 — 새 작업이면 요청 정리부터")
        except Exception:
            pass

    lines.append("")
    lines.append("이어서 작업하면 위 상태를 먼저 확인한다. 이전 세션의 검증 결과를 현재 통과로 가정하지 않는다.")

    out = {
        "hookSpecificOutput": {
            "hookEventName": "SessionStart",
            "additionalContext": "\n".join(lines),
        }
    }
    print(json.dumps(out, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

"""Stop: 코드가 바뀌었는데 그 뒤 /verify 기록이 없으면 끝내기 전에 알린다.

- 검사 대상: git 작업 트리에서 바뀐 frontend/src · backend/app · backend/scripts 의 코드 파일
- 기준: .claude/last-verify.json (mark_verified.py 가 기록) 보다 나중에 수정된 코드 파일이 있으면 exit 2
- stop_hook_active 가 true 면(이미 이 훅 때문에 이어서 작업 중) 통과 → 무한 반복 방지
문서 · 설정만 바꾼 경우는 검사하지 않는다.
"""
import json
import subprocess
import sys

for _s in (sys.stdout, sys.stderr):
    try:
        _s.reconfigure(encoding="utf-8")
    except Exception:
        pass
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
MARKER = ROOT / ".claude" / "last-verify.json"
CODE_DIRS = ("frontend/src", "backend/app", "backend/scripts")
CODE_EXT = (".ts", ".tsx", ".py", ".css")


def changed_code_files():
    try:
        out = subprocess.run(
            ["git", "status", "--porcelain", "--untracked-files=all"],
            cwd=ROOT, capture_output=True, text=True, timeout=10,
        ).stdout
    except Exception:
        return []
    files = []
    for line in out.splitlines():
        if len(line) < 4:
            continue
        rel = line[3:].strip().strip('"').replace("\\", "/")
        if " -> " in rel:
            rel = rel.split(" -> ", 1)[1]
        if rel.startswith(CODE_DIRS) and rel.endswith(CODE_EXT):
            files.append(rel)
    return files


def main() -> int:
    try:
        data = json.load(sys.stdin)
    except Exception:
        data = {}
    if data.get("stop_hook_active"):
        return 0

    files = changed_code_files()
    if not files:
        return 0

    marker_time = 0.0
    marker_desc = "없음"
    if MARKER.exists():
        try:
            m = json.loads(MARKER.read_text(encoding="utf-8"))
            marker_time = float(m.get("time", 0))
            marker_desc = f"{m.get('at')} {m.get('scope')} {m.get('result')}"
        except Exception:
            pass

    stale = []
    for rel in files:
        p = ROOT / rel
        if p.exists() and p.stat().st_mtime > marker_time:
            stale.append(rel)

    if not stale:
        return 0

    scope = "all"
    fe = any(f.startswith("frontend/") for f in stale)
    be = any(f.startswith("backend/") for f in stale)
    if fe and not be:
        scope = "frontend"
    elif be and not fe:
        scope = "backend"

    print(f"[hook] 마지막 /verify 기록: {marker_desc}. 그 뒤 바뀐 코드 파일 {len(stale)}개:", file=sys.stderr)
    for f in stale[:15]:
        print(f"  - {f}", file=sys.stderr)
    print(
        f"  → 끝내기 전에 /verify {scope} 를 돌린다. 돌릴 수 없으면 이유와 대체 검증을 보고에 적고 끝낸다. "
        "통과한 것처럼 말하지 않는다.",
        file=sys.stderr,
    )
    return 2


if __name__ == "__main__":
    raise SystemExit(main())

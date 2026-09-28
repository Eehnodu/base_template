"""verifier 가 검증을 끝낸 뒤 실행: .claude/last-verify.json 에 시각 · 범위 · 결과를 남긴다.

사용: python .claude/hooks/mark_verified.py <backend|frontend|all> <통과|실패|일부 미실행>
Stop 훅(check_verify_before_stop.py)이 이 마커로 "코드를 고친 뒤 검증 없이 끝내는지"를 판단한다.
마커는 보조 장치일 뿐이다. 검증 결과 자체는 보고와 zz_docs/TODO.md 에 적는다.
"""
import json
import sys

for _s in (sys.stdout, sys.stderr):
    try:
        _s.reconfigure(encoding="utf-8")
    except Exception:
        pass
import time
from datetime import datetime
from pathlib import Path

MARKER = Path(__file__).resolve().parent.parent / "last-verify.json"


def main() -> int:
    scope = sys.argv[1] if len(sys.argv) > 1 else "all"
    result = " ".join(sys.argv[2:]) if len(sys.argv) > 2 else "unknown"
    payload = {
        "time": time.time(),
        "at": datetime.now().isoformat(timespec="seconds"),
        "scope": scope,
        "result": result,
    }
    MARKER.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"verify marker: {payload['at']} {scope} {result}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

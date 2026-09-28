"""PreToolUse(Edit | Write): 민감 파일 · 생성 파일 수정을 막는다.

stdin으로 훅 JSON을 받고, 막을 때는 stderr에 이유 + 대체 행동을 쓰고 exit 2.
permissions.deny 가 이미 .env 류를 막지만, 여기서는 메시지를 붙여 같은 시도를 반복하지 않게 한다.
"""
import fnmatch
import json
import sys

for _s in (sys.stdout, sys.stderr):
    try:
        _s.reconfigure(encoding="utf-8")
    except Exception:
        pass


def main() -> int:
    try:
        data = json.load(sys.stdin)
    except Exception:
        return 0

    raw = data.get("tool_input", {}).get("file_path") or ""
    if not raw:
        return 0

    path = raw.replace("\\", "/")
    name = path.rsplit("/", 1)[-1]

    # 허용: 문서 · 온보딩용 예시 파일
    if name == ".env.example":
        return 0

    reasons = []

    if name == ".env" or fnmatch.fnmatch(name, ".env.*"):
        reasons.append("환경변수 파일은 비밀정보를 담는다. 새 변수가 필요하면 키 이름만 사용자에게 알리고 .env.example 에만 적는다.")
    if name.endswith((".pem", ".key", ".p12")) or "/secrets/" in path:
        reasons.append("인증서 · 키 · secrets 는 Claude 가 만들거나 고치지 않는다. 필요하면 사용자에게 요청한다.")
    if "/alembic/versions/" in path and name.endswith(".py"):
        reasons.append("마이그레이션 파일은 ./migrate.sh 가 생성한다 (사용자 실행). 모델(app/module/*/*.py)을 고치고 마이그레이션이 필요하다고 보고한다.")
    if name in ("package-lock.json", "yarn.lock", "pnpm-lock.yaml"):
        reasons.append("lock 파일은 직접 편집하지 않는다. 의존성 변경은 승인 뒤 npm 명령으로 한다.")

    if not reasons:
        return 0

    print(f"[hook] 수정 차단: {raw}", file=sys.stderr)
    for r in reasons:
        print(f"  - {r}", file=sys.stderr)
    return 2


if __name__ == "__main__":
    raise SystemExit(main())

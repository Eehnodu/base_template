# 등록된 API 라우트 목록을 출력한다 (DB · Redis 연결 없이 동작).
# 새 엔드포인트가 실제로 등록됐는지 확인할 때 backend/ 에서 실행한다.
#   python scripts/check_routes.py            → 전체 목록
#   python scripts/check_routes.py api/notice  → /api/notice 로 시작하는 것만
# 인자는 앞에 / 없이 쓴다 (Git Bash 가 /api 를 윈도우 경로로 바꿔 버린다)
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.main import app  # noqa: E402

prefix = "/" + sys.argv[1].lstrip("/") if len(sys.argv) > 1 else ""

for route in app.routes:
    path = getattr(route, "path", "")
    if not path.startswith(prefix):
        continue
    methods = getattr(route, "methods", None)
    kind = ",".join(sorted(methods)) if methods else "WS"
    print(f"{kind:<10} {path}")

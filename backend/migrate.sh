#!/bin/bash
set -e

# venv 활성화 안 돼 있으면 활성화
if ! command -v alembic &> /dev/null; then
  source .venv/Scripts/activate
fi

# 커밋 메시지 (기본: update) — ./migrate.sh "add edit log" 처럼 사용
MSG="${1:-update}"

# 1) head가 여러 개면 먼저 병합 — 갈라진 채로 진행하면 upgrade가 거부된다
HEAD_COUNT=$(alembic heads 2>/dev/null | grep -c "(head)" || true)
if [ "$HEAD_COUNT" -gt 1 ]; then
  echo "⚠️  head가 ${HEAD_COUNT}개로 갈라져 있어 병합 리비전을 만듭니다."
  alembic merge heads -m "merge heads"
fi

# 2) DB를 먼저 최신으로 — 뒤처진 DB 상태로 autogenerate 하면 잘못된 diff가 생긴다
alembic upgrade head

# 3) 모델 변경분으로 리비전 생성
alembic revision --autogenerate -m "$MSG"

# 4) 변경이 없어서 빈 리비전이 생겼으면 지운다
LATEST=$(ls -t alembic/versions/*.py | head -1)
if python - "$LATEST" <<'EOF'
import re, sys

src = open(sys.argv[1], encoding="utf-8").read()

def body_is_empty(name: str) -> bool:
    m = re.search(rf"def {name}\(\).*?:\n(.*?)(?=\ndef |\Z)", src, re.S)
    body = m.group(1) if m else ""
    # 주석과 docstring 은 내용으로 세지 않는다. alembic 템플릿이 함수마다
    # """Upgrade schema.""" 를 넣기 때문에, 빼지 않으면 빈 리비전도 '내용 있음' 으로 판정된다
    skip = ("#", '"""', "'''")
    lines = [l.strip() for l in body.splitlines() if l.strip() and not l.strip().startswith(skip)]
    return lines == ["pass"]

sys.exit(0 if body_is_empty("upgrade") and body_is_empty("downgrade") else 1)
EOF
then
  echo "ℹ️  모델 변경이 없어 빈 리비전을 삭제합니다: $LATEST"
  rm "$LATEST"
else
  # 5) 적용
  alembic upgrade head
  echo "✅ 마이그레이션 완료: $LATEST"
fi

---
paths:
  - "backend/app/module/infra/**"
  - "backend/app/core/provider/**"
  - "backend/app/core/config/**"
---

# infra 모듈 — 외부 서비스 연동

`app/module/infra/`에는 외부 서비스 호출만 둔다. 도메인 모듈과 구조가 다르다.

| 구분 | 도메인 모듈 (`user/`, `admin/` 등) | infra 모듈 |
| ---- | ---------------------------------- | ---------- |
| 파일 | 모델 + repository + service + router | `{name}_service.py` 하나 |
| 역할 | DB CRUD + 비즈니스 로직 | 외부 API · 클라이언트 호출 래핑 |
| 의존성 | DB 세션 | 다른 repository 또는 infra 서비스 |

## 현재 모듈

| 모듈 | 클래스 | 주입받는 것 | 상태 |
| ---- | ------ | ----------- | ---- |
| `infra/google/google_service.py` | `GoogleService` | `user_repo` | Google OAuth 로그인. 동작함 |
| `infra/kakao/kakao_service.py` | `KakaoService` | `user_repo` | Kakao OAuth 로그인. 동작함 |
| `infra/gpt/gpt_service.py` | `GPTService` | `redis_service` | OpenAI 클라이언트(`self.client`, 처음 쓸 때 생성)만 있다. 호출 메서드는 필요할 때 추가한다. |
| `infra/redis/redis_service.py` | `RedisService` | 없음 | Redis 읽기 · 쓰기 (`set` · `get` · `hset` · `sadd` · `lock` 등). 접속 정보는 `settings.redis_*` |

## 새 infra 서비스 추가

```python
# app/module/infra/my_api/my_api_service.py
from app.core.config.settings import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


class MyApiService:
    def __init__(self, redis_service: RedisService):
        self.redis_service = redis_service

    async def call(self, payload: dict) -> dict:
        ...
```

ServiceProvider에 lazy-load 프로퍼티로 등록한다.

```python
@property
def my_api_service(self):
    if not self._my_api_service:
        from app.module.infra.my_api.my_api_service import MyApiService
        self._my_api_service = MyApiService(self.redis_service)
    return self._my_api_service
```

## 규칙

- API 키는 `settings`를 거쳐 읽는다. 새 키는 `RawEnv`에 필드, `Settings`에 프로퍼티로 추가한다 (`module.md`의 "설정 · 로깅" 참고).
- 클라이언트는 모듈 import 시점이 아니라 서비스 안에서 만든다. import 시점에 만들면 키가 없을 때 앱 전체가 뜨지 않는다.
- 키가 없으면 mock 응답으로 대신하고, 키를 받은 뒤 실제 호출로 바꾼다.
- 외부 호출 실패는 `try`로 감싸 `fail(...)`로 바꾼다. `raise_for_status()`는 `try` 안에서 호출한다.
- 새 패키지를 쓰면 `backend/requirements.txt`에 추가한다.

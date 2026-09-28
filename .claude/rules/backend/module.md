---
paths:
  - "backend/**"
---

# 백엔드 도메인 모듈

## 4파일 세트

도메인마다 `app/module/{domain}/`에 4개 파일을 만든다. 참고 구현은 `user/`.

| 파일 | 역할 |
| ---- | ---- |
| `{domain}.py` | SQLAlchemy 모델 |
| `{domain}_repository.py` | DB 쿼리와 commit. 비즈니스 로직을 넣지 않는다. |
| `{domain}_service.py` | 비즈니스 로직, 응답용 dict 변환 |
| `{domain}_router.py` | HTTP 엔드포인트 |

## 새 모듈 등록 — `app/module/__init__.py`

두 가지를 모두 한다.

1. **모델 import**: SQLAlchemy가 relationship을 인식하고 Alembic이 테이블을 감지하려면 모든 모델이 `Base.metadata`에 등록돼야 한다. `alembic/env.py`는 `import app.module` 한 줄로 이 파일을 실행하므로 따로 고치지 않는다.
2. **라우터 등록**: `setup_routers()`에 `app.include_router(...)`를 추가한다.

```python
from app.module.my_domain import my_domain_router
from app.module.my_domain.my_domain import MyDomain

def setup_routers(app: FastAPI):
    ...
    app.include_router(my_domain_router.router, prefix="/api/my_domain")
```

## 모델

```python
from sqlalchemy import Column, DateTime, Integer, String

from app.core.database.base import Base, now_kst


class MyDomain(Base):
    __tablename__ = "tb_my_domains"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    name = Column(String(50), nullable=False)
    created_at = Column(DateTime, default=now_kst)
```

- `Base`와 `now_kst`(Asia/Seoul, tz-aware)는 `app.core.database.base`에서 가져온다.
- 기존 모델과 같은 `Column(...)` 스타일을 쓴다 (`Mapped[]` 아님).
- 테이블명은 `tb_` 접두사 + 복수형.
- FK를 걸 때는 상대 모델 파일을 직접 열어 실제 테이블명과 PK 컬럼명을 확인한다. 양방향이면 양쪽에 `relationship(..., back_populates=...)`을 둔다.
- 마이그레이션은 모델을 고친 뒤 `./migrate.sh "메시지"`로 만든다. 실행 전에 확인을 받는다. 생성된 `alembic/versions/*.py`도 커밋한다.

### DB 변경 시 주의

- 기존 데이터가 있는 테이블에 **NOT NULL 컬럼을 바로 추가하지 않는다.** nullable로 추가 → 기존 행 채우기 → 제약 강화 순서로 나눈다.
- 컬럼 삭제 · 이름 변경 · 타입 변경, unique · FK 추가는 데이터 손실이나 실패 위험이 있다. **계획을 먼저 보여 주고 승인을 받는다.**
- 마이그레이션 파일은 autogenerate 결과를 그대로 믿지 말고 열어서 의도한 변경만 있는지 확인한다.

## Repository

```python
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession


class MyDomainRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_my_domain_by_id(self, id: int) -> MyDomain | None:
        result = await self.db.execute(select(MyDomain).where(MyDomain.id == id))
        return result.scalar_one_or_none()

    async def create_my_domain(self, name: str) -> MyDomain:
        item = MyDomain(name=name)
        self.db.add(item)
        await self.db.commit()
        await self.db.refresh(item)
        return item
```

- 메서드 이름은 `get_{entity}_by_{field}`, `create_{entity}`, `update_{entity}`, `delete_{entity}` 형태. 서비스도 같은 이름을 쓴다.
- **commit은 repository가 한다.** 세션은 요청마다 하나이고 자동 commit · rollback이 없다.
- commit 뒤에 객체 속성을 읽으려면 `await self.db.refresh(obj)`를 먼저 한다. 안 하면 비동기 lazy-load 에러(MissingGreenlet)가 난다.
- relationship은 `selectinload` 등으로 미리 로드한다. joined 로드를 쓰면 `result.unique()`를 붙인다.

## Service

- 요청 본문은 `body = await request.json()`으로 읽고 `body.get("필드")`로 꺼낸다. Pydantic 요청 스키마는 쓰지 않는다. 필수 값이 없으면 `fail(...)`로 막는다.
- 실패는 `fail(...)`을 호출한다 (`raise fail(...)` 아님, 스스로 raise한다).
- **반환값은 JSON으로 바로 바꿀 수 있는 dict · list로 만든다.** ORM 객체를 그대로 넘기지 않는다. `datetime`은 `.isoformat()`으로 바꾼다. 비밀번호 같은 민감 필드는 빼고 필요한 필드만 담는다.

```python
async def get_my_domain(self, request):
    item_id = int(request.path_params["item_id"])
    item = await self.my_domain_repo.get_my_domain_by_id(item_id)
    if not item:
        fail("항목을 찾을 수 없습니다.", "MY_DOMAIN_NOT_FOUND", 404)
    return {
        "id": item.id,
        "name": item.name,
        "created_at": item.created_at.isoformat(),
    }
```

## Router — `@with_provider` · `@with_login`

```python
from fastapi import APIRouter

from app.core.provider.http.endpoint import with_provider
from app.core.provider.http.login import with_login
from app.core.provider.http.service import ServiceProvider
from app.core.utils.response import success

router = APIRouter()

# 로그인 불필요
@router.post("/example")
@with_provider
async def example(p: ServiceProvider):
    return success(await p.my_domain_service.do_something(p.request))

# 로그인 필요 — @with_provider 아래에 @with_login()을 쌓는다 (괄호 필수)
@router.get("/{item_id}")
@with_provider
@with_login()             # admin API는 @with_login("admin")
async def get_item(p: ServiceProvider):
    return success(await p.my_domain_service.get_my_domain(p.request))
```

- `@with_login()`을 거치면 `p.request.user_id`, `p.request.auth_type`을 쓸 수 있다.
- `@with_provider`는 함수 시그니처를 감추므로 경로 · 쿼리 파라미터를 함수 인자로 받을 수 없다. `p.request.path_params["item_id"]`(문자열), `p.request.query_params.get("page")`로 읽는다.
- 쿠키를 다뤄야 하면(로그인 · 로그아웃) `auth_router.py`처럼 `response = success(...)`를 먼저 만들고 `AuthToken`으로 쿠키를 붙인 뒤 `return response`한다.

## 응답 — `app.core.utils.response`

| 함수 | 동작 |
| ---- | ---- |
| `success(data=None, message="ok", status_code=200)` | `JSONResponse`로 `{ success: true, message, data, errorCode: null }`을 반환한다. `data`는 JSON으로 바꿀 수 있어야 한다. ORM 객체나 `datetime`이 들어가면 500이 난다. |
| `fail(message, error_code, status_code=400)` | `HTTPException`을 **raise**한다. 전역 예외 핸들러가 `{ success: false, message, errorCode }`로 바꿔 준다. |

## 에러 처리

예상한 실패는 **모두 `fail(메시지, 에러코드, 상태코드)`**로 낸다. `HTTPException`을 직접 raise하지 않는다 (errorCode가 `"HTTP_ERROR"`로 뭉개진다).

### 세 가지 값

| 값 | 규칙 | 예 |
| -- | ---- | -- |
| `message` | 사용자에게 그대로 보여 줄 **한국어 문장**. 내부 정보(쿼리, 외부 API 응답 원문, 경로)를 넣지 않는다 | "공지를 찾을 수 없습니다." |
| `error_code` | 프론트가 분기에 쓰는 코드. **대문자 스네이크, `{대상}_{이유}`**. 한 번 정하면 바꾸지 않는다 | `NOTICE_NOT_FOUND`, `USER_ALREADY_EXISTS` |
| `status_code` | 아래 표 | 404 |

### 상태 코드

| 코드 | 언제 | errorCode 예 |
| ---- | ---- | ------------ |
| 400 | 필수 값 누락, 형식 · 길이 · 허용 값 위반, 로그인 실패, 외부 연동 실패 | `INVALID_INPUT`, `INVALID_CREDENTIALS`, `OAUTH_TOKEN_FAILED` |
| 401 | **로그인 토큰이 없거나 만료 · 위조됐을 때만** (`AuthToken`이 낸다) | `ACCESS_TOKEN_EXPIRED`, `REFRESH_TOKEN_MISSING` |
| 403 | 로그인은 했지만 이 데이터 · 기능에 권한이 없음 | `FORBIDDEN`, `NOTICE_FORBIDDEN` |
| 404 | 대상이 없음 | `NOTICE_NOT_FOUND` |
| 409 | 중복 · 상태 충돌 (이미 존재, 이미 처리됨) | `USER_ALREADY_EXISTS` |
| 500 | 예상하지 못한 에러. 직접 쓰지 않는다 — 전역 핸들러가 `INTERNAL_ERROR`로 바꾸고 로그를 남긴다 | `INTERNAL_ERROR` |

> **401은 토큰 문제에만 쓴다.** 프론트 훅은 401을 받으면 세션 갱신부터 시도하고, 실패하면 로그인 화면으로 보낸다. 로그인 실패 · 권한 부족에 401을 쓰면 사용자가 로그인 화면으로 튕긴다.

### 주의

- 로그인 실패는 "사용자 없음"과 "비밀번호 틀림"을 구분하지 않는다 (`INVALID_CREDENTIALS`, 가입 여부 노출 방지).
- 외부 API 실패 원문은 `logger.warning(...)`으로 남기고, 사용자에게는 일반 문구를 보낸다.
- `try: ... except Exception: pass`처럼 예외를 삼키지 않는다. 처리할 수 없는 예외는 그대로 두면 전역 핸들러가 500으로 바꾸고 로그를 남긴다.
- 새 errorCode를 만들면 프론트가 분기해야 하는지 생각한다. 분기가 필요하면 `zz_docs/LOGIC.md`에 적는다.

## ServiceProvider — `core/provider/http/service.py`

repository와 service는 lazy-load 프로퍼티로 등록한다. `__init__`에 `self._xxx = None`을 먼저 추가한다. 이름은 `{domain}_repo`, `{domain}_service`.

```python
@property
def my_domain_repo(self):
    if not self._my_domain_repo:
        from app.module.my_domain.my_domain_repository import MyDomainRepository
        self._my_domain_repo = MyDomainRepository(self.db)
    return self._my_domain_repo

@property
def my_domain_service(self):
    if not self._my_domain_service:
        from app.module.my_domain.my_domain_service import MyDomainService
        self._my_domain_service = MyDomainService(self.my_domain_repo)
    return self._my_domain_service
```

## 설정 · 로깅

- 설정값은 `from app.core.config.settings import settings`로 읽는다. 환경은 `settings.env`("local" | "prod")이고, `APP_ENV` 환경변수가 우선한다.
- 새 환경변수는 두 곳에 추가한다: `RawEnv`에 `local_xxx` · `prod_xxx` 필드, `Settings`에 환경에 맞는 값을 돌려주는 프로퍼티. `.env`는 직접 열지 않는다. 필요한 키 이름만 사용자에게 알린다.
- 로그는 `print` 대신 `from app.core.logging import get_logger` → `logger = get_logger(__name__)`. 요청 ID가 자동으로 붙는다.

## WebSocket 모듈

HTTP와 구조가 다르다. 참고 구현은 `web_socket/`.

| 파일 | 역할 |
| ---- | ---- |
| `manager.py` | 연결 관리 (connect · disconnect · broadcast) |
| `{domain}_service.py` | 메시지 처리. 모듈 단위 싱글턴(`xxx_service = XxxService()`)으로 둔다. |
| `{domain}_router.py` | 아래 데코레이터 조합 |

```python
@router.websocket("/")
@with_provider_web_socket
@with_login_web_socket("user")      # 로그인 불필요면 @without_login_web_socket (괄호 없음)
async def ws_endpoint(p: WebSocketProvider, websocket: WebSocket):
    ...
```

- 로그인 정보는 `websocket.user_id`, `websocket.auth_type`에 담긴다.
- 쿼리 파라미터는 `websocket.query_params.get(...)`.
- `core/provider/web_socket/service.py`의 `WebSocketProvider`에 service 프로퍼티를 추가한다. 싱글턴 인스턴스를 반환한다.

## 보안

- **사용자 식별은 서버에서 한다.** 현재 사용자는 `@with_login()`이 넣어 주는 `p.request.user_id`로 판단한다. 요청 본문의 `user_id` · `role` · `author_id` 같은 값을 믿지 않는다.
- **객체 단위 권한**: `GET /items/{id}`는 "로그인했는가"가 아니라 "이 사용자가 **이 id**에 접근할 수 있는가"를 확인한다. 남의 데이터면 `fail(..., "FORBIDDEN", 403)`.
- admin 전용 API는 `@with_login("admin")`을 쓴다.
- 입력값은 서비스에서 검증한다: 필수 값, 길이, 형식, 허용 값(enum). SQL은 SQLAlchemy 쿼리로만 만든다 (문자열로 조립하지 않는다).
- 응답 · 로그에 비밀번호 해시 · 토큰 · 개인정보를 넣지 않는다. 에러 응답에 stack trace를 넣지 않는다.
- 목록 API는 페이지네이션(`page`, `size`)을 두고, 한 번에 가져오는 개수에 상한을 둔다.

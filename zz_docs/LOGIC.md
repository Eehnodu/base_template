# LOGIC

백엔드 모듈 · API 현황. 모듈, 메서드, API가 바뀌면 여기에 반영한다.

## 모듈

| 모듈 | 종류 | 설명 |
| ---- | ---- | ---- |
| `auth/` | 도메인 (모델 없음) | 로그인 · 로그아웃 · 토큰 갱신 · OAuth. `auth_token.py`가 JWT 발급 · 검증과 쿠키를 맡는다. `AuthService.signup`은 있지만 라우트가 없다. |
| `user/` | 도메인 | 사용자 (`tb_users`) |
| `admin/` | 도메인 | 관리자. 모델 · repository · service는 있고 라우트는 아직 없다. |
| `web_socket/` | WebSocket | 오디오 스트림 연결 관리 (`manager.py`, `audio_utils.py`) |
| `infra/google` | infra | Google OAuth |
| `infra/kakao` | infra | Kakao OAuth |
| `infra/gpt` | infra | OpenAI 호출 |
| `infra/redis` | infra | Redis 읽기 · 쓰기 |

## 인증

- 쿠키 기반. 이름은 `{user_|admin_}` + `access_token` · `refresh_token`(httponly), `user_info`(base64 JSON), `refresh_exp`
- access 1시간, refresh 6시간. JWT(HS256) payload: `{ sub, user: "user" | "admin", type: "access" | "refresh", exp }`
- 비밀번호 해시: argon2 (passlib)

## API

| 메서드 | 경로 | 로그인 | 설명 |
| ------ | ---- | ------ | ---- |
| POST | `/api/auth/login` | - | 로그인 |
| POST | `/api/auth/logout` | user | 로그아웃 |
| POST | `/api/auth/logout_admin` | admin | 관리자 로그아웃 |
| POST | `/api/auth/refresh_token` | - | 사용자 토큰 갱신 |
| POST | `/api/auth/refresh_token_admin` | - | 관리자 토큰 갱신 |
| POST | `/api/auth/google` | - | Google 로그인 |
| POST | `/api/auth/kakao` | - | Kakao 로그인 |
| GET | `/api/user/me` | user | 내 정보 |
| WS | `/api/ws/` | - | WebSocket 연결 |

## 에러 코드

프론트가 분기에 쓸 수 있는 `errorCode` 목록. 새 코드를 만들면 여기에 추가한다.

| 코드 | 상태 | 어디서 | 의미 |
| ---- | ---- | ------ | ---- |
| `ACCESS_TOKEN_MISSING` · `ACCESS_TOKEN_EXPIRED` · `ACCESS_TOKEN_INVALID` · `INVALID_TOKEN_TYPE` | 401 | `auth_token.py` | 로그인 토큰 문제 → 프론트가 자동으로 세션 갱신 · 로그인 화면 이동 |
| `REFRESH_TOKEN_MISSING` · `REFRESH_TOKEN_EXPIRED` · `INVALID_REFRESH_TOKEN` · `INVALID_REFRESH_PAYLOAD` | 401 | `auth_token.py` | 세션 갱신 실패 |
| `INVALID_AUTH_TYPE` | 400 | `auth_token.py` | user · admin 외의 인증 유형 |
| `INVALID_TYPE` | 400 | `auth_service.login` | 로그인 요청의 type 이 user · admin 이 아님 |
| `INVALID_CREDENTIALS` | 400 | `auth_service.login` | 이메일 또는 비밀번호 불일치 (사용자 없음과 구분하지 않음) |
| `USER_ALREADY_EXISTS` | 409 | `auth_service.signup` | 이미 가입된 이메일 |
| `USER_NOT_FOUND` · `ADMIN_NOT_FOUND` | 404 | `user_service` · `auth_router` | 대상 사용자 없음 |
| `AUTH_CODE_NOT_PROVIDED` | 400 | Google · Kakao | OAuth 인증 코드 누락 |
| `OAUTH_TOKEN_FAILED` · `OAUTH_TOKEN_MISSING` · `OAUTH_USERINFO_FAILED` | 400 | Google · Kakao | 소셜 로그인 실패 (원문은 서버 로그) |
| `INTERNAL_ERROR` | 500 | 전역 예외 핸들러 | 예상하지 못한 에러 |
| `SESSION_EXPIRED` | (프론트) | `useAPI.ts` | 세션 갱신까지 실패해 로그인 화면으로 이동 |

# CHANGELOG

템플릿은 파생 프로젝트에서 검증된 변경을 되가져오는 방식으로 갱신합니다. 날짜별로 무엇을 왜 바꿨는지만 적습니다.

## 2026-10-08

- 로딩 표시 기준 `.claude/rules/frontend/loading.md` 추가. 대기 시간별(0.1 · 1 · 3 · 10초)로 스피너 · 스켈레톤 · 진행률 · 취소 중 무엇을 쓸지, 깜빡임 막기(약 300ms 뒤 표시 · 500ms 유지), 다시 조회는 스켈레톤으로 덮지 않기, 움직임 줄이기 설정, 접근성, 15 ~ 30초 타임아웃. 아직 없는 장치(진행률 컴포넌트 · 표시 지연 훅 · 요청 타임아웃)는 만들 때 승인 대상으로 표시. `CLAUDE.md` 규칙 표 · `components.md`에 연결.

## 2026-09-29

- Claude 작업 규칙 추가 (`CLAUDE.md` 원칙 12~14): 과금되는 외부 API는 모델 · 횟수 · 금액을 말하고 허락받은 뒤 호출, 이모지 금지, git 명령은 파이프 없이 단독. 완료 보고에서 규칙 · 설정 · 문서 변경은 이전 · 이후 표로.
- 훅 `ask_paid_api.py`: 명령이나 실행하는 스크립트에 유료 생성 API(Gemini 이미지 · Lyria · Veo, Stability, ElevenLabs, OpenAI 이미지 · 오디오) 호출이 있으면 실행 전에 승인창을 띄운다. 무료 호출은 통과.

## 2026-09-28

- Claude Code 설정 포함. `.claude/`(규칙 6 · 스킬 16 · 에이전트 11 · 훅 6 · 권한), `CLAUDE.md`, `zz_claude_guide.md`, `zz_docs/` 뼈대. 구성과 흐름은 `.claude/README.md`. 새 프로젝트에서 `/feature` · `/design` · `/fullstack` · `/fix` · `/verify` · `/review`를 바로 쓸 수 있다.
- 보안: `/api/user/me`가 비밀번호 해시를 내보내던 문제, OAuth 사용자의 일반 로그인이 500을 내던 문제, Google · Kakao 토큰 응답 검사 위치.
- 에러 처리 통일. 백엔드는 예상한 실패를 모두 `fail(메시지, 에러코드, 상태코드)`로 내고, 프론트는 `ApiError` 하나로 받는다. 조회 실패는 `ErrorState` + 다시 시도, 빈 목록은 `EmptyState`. 에러 코드 목록은 `zz_docs/LOGIC.md`.
- TypeScript `strict` 켬. 남아 있던 고정색을 테마 토큰으로 교체, 다크모드 danger 버튼 글자 대비 1.9:1 → 9.3:1.
- 소셜 로그인 컴포넌트를 `hooks/auth/` → `component/client/auth/`로 이동(훅이 아니라 컴포넌트). 안 쓰던 `App.css` · Apple SDK · `core/database/redis.py` 제거.
- 마이크 오디오 워크릿(`public/audio/resamplePcmProcessor.js`) 추가. 없어서 `useAudioWs`가 동작하지 않았다.
- CORS 허용 주소 · 운영 쿠키 도메인을 환경변수로(`PROD_CORS_ORIGINS` · `PROD_COOKIE_DOMAIN`).
- 검사 스크립트: `backend/scripts/check_routes.py`(등록된 API 목록), `frontend/scripts/check_contrast.py`(색 토큰 대비, 라이트 · 다크).

## 2026-09-22

- 빈 리비전 자동 삭제가 작동하지 않던 문제. alembic 템플릿이 `upgrade`/`downgrade` 마다 docstring 을 넣기 시작하면서, 내용 판정이 docstring 을 본문으로 세어 빈 리비전도 "내용 있음" 이 됐다. 판정에서 주석과 함께 docstring 도 제외한다. 그동안 모델 변경 없이 `migrate.sh` 를 돌릴 때마다 빈 리비전이 쌓이고 DB 에 그대로 적용되고 있었다.
- `cryptography` 를 requirements 에 추가. MySQL 8 의 기본 인증 방식(`caching_sha2_password`) 은 pymysql/aiomysql 단독으로 처리하지 못해, 없으면 DB 접속 자체가 `RuntimeError` 로 끊긴다. 그동안은 다른 패키지에 딸려 우연히 설치돼 있었을 뿐이라, 새 PC 에서 `pip install -r requirements.txt` 만 하면 모든 API 가 500 이 됐다.

## 2026-09-17

- 관리자 사이드바 접힘 · 펼침 전환 중 반대쪽 hover 토글이 잠깐 비치던 문제. 전환 시간 동안 토글을 그리지 않는다.
- Skeleton · PageSkeleton 공통 컴포넌트 추가. 첫 조회는 스피너 대신 실제 레이아웃과 같은 골격을 그려 데이터가 와도 화면이 튀지 않게 한다. 기존 스켈레톤 색 토큰을 그대로 사용.
- 공개판 정리. 비밀값은 `.env.example` 로 키 이름만 남기고, 개발 중 확인용 페이지와 내부 문서를 제외.
- README 에 새 프로젝트로 쓸 때 바꿀 항목(프로젝트명 · DB · OAuth · 쿠키 도메인 · CORS · 테마) 정리.

## 2026-09-02

- 다크모드 도입. 테마 훅과 헤더 토글을 두고, 첫 페인트 전에 테마를 적용하는 인라인 스크립트로 새로고침 깜빡임을 제거.
- 팔레트를 slate + blue 에서 zinc 모노톤으로 교체. 버튼 색(main · sub1 · sub2)을 CSS 변수로 토큰화해 다크모드에서 자동 전환.
- 모달 · 알림 · 토스트 · 입력 · 셀렉트 · 캘린더 · 토글 · 표 · 페이지네이션 · 로그인 · 레이아웃을 시맨틱 색 토큰으로 통일. 파생 프로젝트에서 라이트 전용 색이 남아 다크모드에서 글자가 보이지 않던 문제의 재발 방지.
- 캘린더 팝업의 테두리 · 폭 · 선택 날짜 색을 다른 입력 컴포넌트와 같은 토큰으로 맞춤.
- 마이그레이션 스크립트 안정화. 헤드가 갈라지면 자동 병합하고, autogenerate 전에 upgrade 를 먼저 실행해 뒤처진 DB 에서 잘못된 diff 가 생기는 것을 방지. 빈 리비전은 자동 삭제.
- 외래키가 참조하는 인덱스 · 컬럼을 지우는 리비전이 제약에 막히던 문제(MySQL errno 1553). autogenerate 후처리에서 참조 제약 삭제를 리비전 앞에 자동 주입.
- 관리자 계정 스크립트가 `.env` 의 CRLF, mysql 경로 부재, 히어독 변수 확장으로 인한 Argon2 해시 깨짐에 대응.
- 쉘 스크립트를 `.gitattributes` 로 LF 고정. Windows 체크아웃에서 CRLF 로 바뀌어 bash 실행이 실패하던 문제.

## 2026-09-01

- 파생 프로젝트에서 발견한 공통 컴포넌트 수정을 반영.

## 2026-05-06

- 공통 컴포넌트와 관리자 레이아웃 보강.

## 2026-04-21 ~ 04-24

- 최초 구성. FastAPI + SQLAlchemy(async) + Alembic 백엔드와 React + Vite 프론트, JWT · Google · Kakao 인증, 사용자 · 관리자 모듈, 요청 단위 DI(provider), 공통 UI 컴포넌트 세트.

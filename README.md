# base_template — 풀스택 프로젝트 베이스 템플릿

새 프로젝트를 시작할 때 복제해서 쓰는 템플릿입니다. 로그인 · 관리자 · 공통 UI · DB 마이그레이션 · 실행 스크립트처럼 프로젝트마다 반복되는 것을 미리 갖춰 두었습니다.
공개용 판이라 비밀값은 `.env.example`에 키 이름만 있고, 개발 중 확인용 페이지와 내부 문서는 빠져 있습니다. 파생 프로젝트에서 검증된 변경을 되가져와 갱신합니다.
이 템플릿에서 시작한 프로젝트 예시: [home_project](https://github.com/Eehnodu/home_project) (개인 소개 사이트 + AI 챗봇).

## 들어 있는 것

**Backend**

- FastAPI + SQLAlchemy 2.0 (async) + MySQL + Redis + Alembic
- JWT 인증 (Argon2 비밀번호 해시, access · refresh 토큰, 쿠키 기반), Google · Kakao OAuth
- 사용자 / 관리자 분리, 관리자 그룹 관리
- 전역 예외 핸들러, CORS · 보안 헤더 미들웨어, 요청 단위 DI(`ServiceProvider`)
- 통일된 응답 형식 `{ success, message, data, errorCode }`
- WebSocket 모듈, OpenAI 호출 래퍼
- 스크립트: `run.sh`(uvicorn), `migrate.sh`(head 병합 → upgrade → autogenerate → 빈 리비전 정리), `insertAdmin.sh`(관리자 계정), `scripts/check_routes.py`(등록된 API 목록)

**Frontend**

- React 19 + TypeScript + Vite, react-router-dom v7, TanStack Query v5, Tailwind CSS v3
- 다크모드 + 모노톤 팔레트 (CSS 변수 토큰), `scripts/check_contrast.py`(토큰 대비 검사, 라이트 · 다크)
- 공통 컴포넌트 (admin · client 두 벌): Alert · Modal · FormModal · Toast · ErrorState · EmptyState · Button · InputBox · SelectBox · ComboBox · TextareaBox · Checkbox · RadioButton · Toggle · Calendar · DepartmentTreeSelect · Table · Pagination · Loading · Skeleton · PageSkeleton
- `useGet / usePost / usePatch / useDelete` 훅 (401 시 토큰 자동 갱신, 실패는 `ApiError`), `useAuth`, `useTheme`, 인증 컨텍스트
- 관리자 레이아웃(헤더 · 사이드바) + 로그인 화면, 클라이언트 레이아웃, Google · Kakao 로그인 버튼

**Claude Code 설정**

- `CLAUDE.md` + `.claude/`: 규칙(프론트 · 백엔드 · 글쓰기), 스킬 16개(`/feature` · `/design` · `/fullstack` · `/fix` · `/verify` · `/review` · `/audit` 등), 에이전트 11개, 훅 7개(민감 파일 · 위험 명령 차단, 유료 생성 API 호출 승인, 수정 파일 검사, 검증 없이 종료 알림, 세션 시작 상태 주입)
- 구성과 흐름은 [.claude/README.md](.claude/README.md), 요청하는 법과 설정 근거는 [zz_claude_guide.md](zz_claude_guide.md)
- 작업 기록은 `zz_docs/`(CHANGELOG · TODO · LOGIC)에 쌓는다. `LOGIC.md`에는 지금 들어 있는 모듈 · API · 에러 코드가 정리돼 있다

## 폴더 구조

```
backend/app/
├── main.py
├── core/
│   ├── config/settings.py     환경변수 (local / prod 자동 감지)
│   ├── database/              AsyncSession · Redis
│   ├── exception/             전역 예외 핸들러
│   ├── middleware/            CORS · 보안 헤더
│   ├── provider/              @with_provider · @with_login · ServiceProvider
│   └── utils/response.py      success() / fail()
└── module/
    ├── auth/ user/ admin/ web_socket/
    └── infra/                 google · kakao · gpt · redis

frontend/src/
├── container/                 라우터가 가리키는 페이지 (admin / client)
├── component/                 재사용 UI (admin/ui · client/ui 아래 공통 컴포넌트)
├── hooks/ context/ constants/ types/ utils/
```

도메인 모듈은 `모델 · repository · service · router` 4파일 세트로 만들고, 외부 서비스 연동은 `infra/` 아래 service 만 둡니다. 새 도메인을 추가할 때는 `module/__init__.py` 에 모델 import 와 라우터 등록을 넣고, `ServiceProvider` 에 lazy-load 프로퍼티를 추가합니다. 자세한 규칙은 `.claude/rules/`에 있습니다.

## 새 프로젝트로 시작하기

1. 이 레포를 새 이름으로 복제하고 원격을 새 레포로 바꾼다.
2. 이름을 바꾼다: `frontend/src/constants/app.ts`의 `APP_NAME`, `frontend/package.json`의 `name`, `CLAUDE.md` 제목.
3. 환경변수를 채운다. `backend/.env.example` → `backend/.env`, `frontend/.env.example` → `frontend/.env`(배포용은 `.env.production`).
   - backend: `LOCAL_MYSQL_*` · `PROD_MYSQL_*`, `JWT_SECRET` · `HASH_KEY`, `LOCAL_REDIS_*` · `PROD_REDIS_*`, `PROD_CORS_ORIGINS` · `PROD_COOKIE_DOMAIN`, `OPENAI_API_KEY`, `KAKAO_*` · `GOOGLE_*`
   - frontend: `VITE_APP_PUBLIC_BASE_URL`, `VITE_APP_PUBLIC_GOOGLE_*`, `VITE_APP_PUBLIC_KAKAO_*`
4. 아래 순서로 실행한다.

```bash
# backend
cd backend
python -m venv .venv && source .venv/Scripts/activate
pip install -r requirements.txt
./migrate.sh            # 모델 기준 리비전 생성 + 적용
./insertAdmin.sh        # 관리자 계정 (id 1). 계정 값은 스크립트 안에 있으니 바꿔서 쓴다
./run.sh                # http://localhost:8000

# frontend
cd frontend
npm install
npm run dev             # http://localhost:3000
```

검사 명령은 `npm run check:types` · `npm run lint` · `npm run build`(frontend), `python -m compileall -q app` · `python -c "import app.main"`(backend)입니다. 테스트 러너는 아직 없습니다.

새 프로젝트로 쓸 때 더 바꿀 것: DB 이름 · OAuth 클라이언트 · 쿠키 도메인 · CORS 허용 주소 · 테마 색(Claude Code에서 `/palette`).

`.claude/settings.json`은 `git commit` · `push`를 승인 없이 허용합니다. 원하지 않으면 `permissions.allow`에서 빼거나 `/permissions`로 바꾸세요.

## 참고 문서

- 갱신 이력: [CHANGELOG.md](CHANGELOG.md) (날짜별)
- 모듈 · API · 에러 코드: [zz_docs/LOGIC.md](zz_docs/LOGIC.md)
- Claude Code 구성: [.claude/README.md](.claude/README.md), [zz_claude_guide.md](zz_claude_guide.md)

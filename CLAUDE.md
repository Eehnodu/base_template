# base

풀스택 프로젝트 베이스 템플릿. 새 프로젝트는 이 레포를 복제해 시작한다.

## 기술 스택

| 영역         | 기술                                   |
| ------------ | -------------------------------------- |
| Frontend     | React 19 + TypeScript + Vite           |
| 라우팅       | react-router-dom v7                    |
| 서버 상태    | TanStack Query v5                      |
| 스타일       | Tailwind CSS v3 (CSS 변수 토큰, 다크모드) |
| 아이콘       | lucide-react                           |
| Backend      | FastAPI + SQLAlchemy 2.0 (async)       |
| DB           | MySQL (aiomysql)                       |
| 캐시         | Redis                                  |
| 인증         | JWT + OAuth (Google, Kakao)            |
| 마이그레이션 | Alembic                                |

## 폴더 구조

```
base/
├── CLAUDE.md
├── .gitignore                   # settings.local.json · 훅 마커 · 로그 제외
├── .claude/                     # rules · agents · skills · hooks · settings.json (아래 참고)
├── zz_docs/                     # 작업 기록 (CHANGELOG · TODO · LOGIC)
├── zz_claude_guide.md           # Claude 요청법 · .claude 설정 기준
│
├── frontend/
│   ├── scripts/check_contrast.py  # 색 토큰 대비 검사 (라이트 · 다크)
│   └── src/
│       ├── App.tsx              # 루트 라우터
│       ├── index.css            # 색 토큰 (CSS 변수, :root · .dark)
│       ├── container/           # 라우터가 가리키는 페이지 (admin/ · client/)
│       ├── component/
│       │   ├── admin/           # ui/ (공통 컴포넌트) · layout/ · modal/
│       │   └── client/          # ui/ (공통 컴포넌트) · layout/ · modal/ · auth/ (소셜 로그인)
│       ├── hooks/common/        # useAPI · useAuth · useTheme · useAudioWs · getCookie
│       ├── constants/           # APP_NAME 등 프로젝트 상수
│       ├── context/             # AuthProvider
│       ├── types/
│       └── utils/format/
│
└── backend/
    ├── run.sh                   # 개발 서버 (uvicorn --reload, :8000)
    ├── migrate.sh               # Alembic 리비전 생성 + 적용 (사용자가 실행)
    ├── scripts/check_routes.py  # 등록된 API 목록 확인
    └── app/
        ├── main.py
        ├── core/                # config · database · exception · middleware · provider · utils
        └── module/
            ├── __init__.py      # 모델 import + setup_routers()
            ├── auth/ user/ admin/ web_socket/
            └── infra/           # google · kakao · gpt · redis
```

## 자주 쓰는 명령

| 영역 | 명령 (해당 폴더에서) | 용도 |
| ---- | -------------------- | ---- |
| frontend | `npm install` | 의존성 설치 (`node_modules`가 없을 때) |
| frontend | `npm run dev` | 개발 서버 (Vite) |
| frontend | `npm run check:types` · `npm run lint` | 타입 · lint 검사. 둘 다 에러 0이 기준 |
| frontend | `npm run build` | 프로덕션 빌드. 기능을 마무리할 때 |
| frontend | `python scripts/check_contrast.py [--all]` | 색 토큰 대비 검사 (라이트 · 다크, WCAG AA). 토큰을 바꿨을 때 |
| backend | `pip install -r requirements.txt` | 의존성 설치 (`.venv` 활성화 후) |
| backend | `./run.sh` | 개발 서버 (uvicorn `--reload`, 8000 포트) |
| backend | `python -m compileall -q app` · `python -c "import app.main"` | 문법 · import · 등록 오류 검사 |
| backend | `python scripts/check_routes.py api/{도메인}` | 등록된 라우트 확인 (앞에 `/` 없이) |
| backend | `./migrate.sh "메시지"` | Alembic 리비전 생성 + 적용. **사용자가 실행한다** |

테스트 러너(pytest · vitest)는 아직 없다. 도입 전까지 "테스트"는 위 검사 + 수용 기준 기준의 수동 확인을 뜻한다.

## 규칙 문서

세부 규칙은 `.claude/rules/`에 있다. 해당 폴더의 파일을 다룰 때 자동으로 로드된다. 사람이 요청하는 법과 이 설정들의 근거는 `zz_claude_guide.md`에 있다.

| 파일 | 내용 |
| ---- | ---- |
| `rules/frontend/components.md` | 공통 컴포넌트 위치와 props |
| `rules/frontend/conventions.md` | 네이밍, API 훅, 컴포넌트 작성 스타일, 색상 토큰, 화면 품질 |
| `rules/frontend/design.md` | 화면 디자인 기준 — 위계 · 색 · 모션 · 피할 패턴 · 만들기 전 절차 · 기존 화면 고치는 순서 |
| `rules/backend/module.md` | 도메인 모듈 4파일 세트, 라우터 · ServiceProvider · repository 패턴 |
| `rules/backend/infra.md` | 외부 서비스 연동 모듈 |
| `rules/writing.md` | 글쓰기 기준 — 문서 · 커밋 · PR · 보고에서 AI 냄새(강조하는 척 · 3개 나열 · 대시 · 장식 볼드 · 챗봇 잔재) 빼기, 답장은 결정부터 |

## 작업 흐름

```
요청 정리 → 조사 → 계획(필요하면 승인) → 실행 → 검증 → 기록 · 보고
```

- 요청을 **목표 · 배경 · 범위 · 비범위 · 제약 · 수용 기준(Given / When / Then)**으로 정리하고 시작한다. 빠졌거나 모호하면 추측하지 말고 질문한다.
- 조사 · 계획 단계에서는 파일을 고치지 않는다.
- 아래에 해당하면 **계획을 보여 주고 승인을 받은 뒤** 실행한다. 해당하지 않는 작은 작업은 계획만 알리고 진행한다.
  - DB 모델 · 스키마 변경
  - 인증 · 권한 · 쿠키 · 보안 설정 변경
  - 새 의존성 추가
  - 파일 삭제 · 이동 · 이름 변경, 공개 API(URL · 응답 형식) 변경
  - 요구사항이 모호하거나 수정 파일이 많을 때
- **계획이 크면 한 번에 승인받지 않는다.** 수정 파일이 5개를 넘거나 단계가 3개 이상이면 첫 단계만 승인받고, 단계마다 결과를 보고한 뒤 다음 단계로 간다.
- 계획에는 **검증이 안 다루는 실패 모드**(권한 없는 사용자, 빈 목록, 중복, 동시 요청 등) 상위 3개를 적고, 해당 단계에서 확인 방법을 붙인다.
- 버그는 **재현 → 원인 후보 좁히기 → 원인 하나만 수정** 순서로 한다. 원인을 못 찾으면 멈추고 알린다. **같은 문제에 수정을 3번 시도해도 안 되면** 접근이 틀린 것이다 — 더 시도하지 말고 지금까지의 가설 · 결과를 정리해 사용자와 논의한다.

## 작업 원칙

1. 과도한 추상화 금지. 지금 필요한 것만 구현한다.
2. **요청 범위 밖은 건드리지 않는다.** 관련 없는 리팩터링 · 포맷 · 파일명 변경을 하지 않고, 버그 수정과 리팩터링을 섞지 않는다.
3. **사용자가 만든 변경을 되돌리거나 덮어쓰지 않는다.** 예상치 못한 파일이나 상태를 발견하면 삭제 전에 확인을 받는다.
4. **검증을 약화해서 통과시키지 않는다.** `any` 우회, `eslint-disable`, 테스트 삭제 · skip, lint 규칙 끄기 금지.
5. 코드를 고친 뒤에는 **`/verify`**(verifier 에이전트)로 검증한다. 명령은 "자주 쓰는 명령" 표. 실패하면 마지막 줄이 아니라 최초 원인을 찾는다. 에러 처리 기준은 `rules/backend/module.md`와 `rules/frontend/conventions.md`의 "에러 처리".
6. DB 마이그레이션(`./migrate.sh`, `alembic`)과 PR 생성(`gh pr create`)은 실행 전에 확인을 받는다. **commit · push는 작업 단위가 끝나면 묻지 않고 바로 한다** (`settings.json` allow). 한 커밋에 한 주제.
7. `.env` 파일은 읽거나 고치지 않는다. 새 환경변수가 필요하면 키 이름만 사용자에게 알린다. `alembic/versions/*.py`는 직접 쓰지 않는다 (`./migrate.sh`가 만든다).
8. **세션을 이어서 시작하면** `zz_docs/TODO.md`("진행 중" · "마지막 검증")와 `git status` · `git diff --stat`을 먼저 본다 (SessionStart 훅이 요약을 주입한다). 이전 세션의 검증 결과를 현재 통과로 가정하지 않는다. 작업을 중간에 멈출 때는 `/handoff`로 기록을 남긴다.
9. 커밋 메시지는 `type(scope): 요약` (type: feat · fix · docs · refactor · chore). 한 커밋에 한 주제, diff에 없는 내용은 쓰지 않는다.
10. **hooks**(`.claude/hooks/`)가 자동으로 돈다: 세션 시작 · 컴팩션 뒤 현재 상태(브랜치 · 변경 파일 · 마지막 검증 · 진행 중 작업) 주입, 민감 파일 · 마이그레이션 파일 · lock 파일 수정 차단, 되돌릴 수 없는 명령(강제 삭제 · `reset --hard` · 강제 푸시 · `DROP` · `downgrade`)과 유료 생성 API 호출은 승인 요청(스크래치 아래 `rm -rf`만 통과), 수정한 파일의 규칙 위반 · 문법 검사, 코드를 고치고 `/verify` 없이 끝내려 하면 알림. 훅이 막으면 우회하지 말고 메시지가 알려 주는 대체 행동을 한다. 끄는 방법은 `settings.json`의 `hooks` 항목 제거.
11. **묻지 않고 내린 결정은 기록한다.** 승인 대상이 아닌 작은 판단(이름, 기본값, 모호한 요구의 해석)은 진행하되 `결정 — 이유 — 틀리면 생기는 비용` 형태로 보고에 모두 나열한다. 보고 없이 한 결정은 몰래 한 결정이다.
12. **과금되는 외부 API는 허락받은 뒤에만 호출한다.** 이미지 · 음악 · 영상 생성, LLM 대량 호출처럼 돈이 드는 호출은 "모델 · 횟수 · 예상 금액"을 먼저 말하고 사용자가 답한 뒤 실행한다. 같은 답장 안에서 알리고 바로 실행하지 않는다. 허락받은 횟수 · 금액을 넘기면 다시 묻는다. 무료 호출(모델 목록 조회 등)은 그대로 해도 된다. 훅 `ask_paid_api.py`가 유료 호출 코드를 찾으면 실행 전에 승인창을 띄운다.
13. **이모지를 쓰지 않는다.** 문서 · 커밋 · PR · 채팅 답장 어디에도. 상태 표시도 글자로 한다 (`rules/writing.md` 4절).
14. **git 명령은 단독으로 보낸다.** `cd … &&`, `| tail` · `| grep` 같은 파이프를 섞지 않는다. 허용 목록 밖 조각이 하나라도 섞이면 승인창이 뜬다. 출력은 git 옵션(`-q`, `-sb`, `--oneline -1`)으로 줄이고, 파일 검색은 Grep 도구, 문서 수정은 Edit 도구를 쓴다.

이런 생각이 들면 규칙을 건너뛰려는 신호다:

| 변명 | 실제 |
| ---- | ---- |
| "간단한 수정이라 검증은 생략" | 간단한 수정이 가장 자주 깨진다. `/verify`는 1분이다 |
| "이전 세션(또는 아까)에 통과했으니" | 그 뒤 코드가 바뀌었다. 지금 돌린 것만 증거다 |
| "에이전트가 성공했다고 보고했으니" | 보고는 자기 채점이다. `git diff`와 검증 출력으로 확인한다 |
| "원인은 대충 알겠으니 바로 고치자" | 후보를 코드에서 확정하기 전의 수정은 증상 덮기다 |
| "요청엔 없지만 이왕 하는 김에" | 범위 밖이다. 보고에 적고 손대지 않는다 |
| "질문하면 귀찮아하실 테니 추정하자" | 추정은 기록하고(원칙 11), 승인 대상이면 묻는다 |

## 완료 기준

작업을 끝낼 때 아래를 보고한다.

- **변경 파일**과 각 파일을 바꾼 이유. **동작이 바뀐 것**(사용자에게 보이는 변화, API 응답 변화)은 따로 적는다. 규칙 · 설정 · 문서를 바꿨으면 파일마다 **이전 | 이후** 표로 실제 문장 · 값을 보여 주고, 그다음 동작이 어떻게 달라지는지 쓴다. "했습니다"만 쓰지 않는다.
- **실행한 검증과 결과**. **이 작업 안에서 직접 실행하고 출력을 읽은 것**만 통과라고 쓴다. 돌리지 못한 검증은 못 돌렸다고 이유와 함께 적는다. 에이전트의 "완료" 보고는 증거가 아니다 — `git diff`와 검증 출력으로 확인한다. 검증 전에 "완료 · 완벽 · 문제없음" 같은 표현을 쓰지 않는다.
- **확인된 사실과 추정을 구분**한다. 코드에서 확인한 내용은 근거 파일을 적고, 확인하지 못한 것은 "확인 필요"로 표시한다.
- **수용 기준 충족 여부**를 항목별로 적는다.
- **묻지 않고 내린 결정** 목록 (원칙 11). 없으면 "없음".
- **범위 밖 변경**이 있으면 파일과 이유를 적는다. **diff · 로그에 비밀정보(토큰 · 키 · 비밀번호)가 들어가지 않았는지** 확인한다.
- **남은 위험 · 할 일**. 마이그레이션 · 환경변수처럼 사용자가 해야 할 일이 있으면 명시한다.

## 작업 기록 (`zz_docs/`)

작업을 마치면 아래 파일을 갱신한다.

| 파일 | 갱신 내용 |
| ---- | --------- |
| `zz_docs/CHANGELOG/YYYY-MM-DD.md` | 그날 한 작업의 설명. 파일이 없으면 만든다. 날짜는 오늘 날짜를 쓴다. |
| `zz_docs/CHANGELOG.md` | 인덱스. 본문 없이 날짜별 한 줄 요약만 추가한다. |
| `zz_docs/TODO.md` | 끝낸 항목 체크, 새로 생긴 할 일 추가. "마지막 검증" 표에 범위 · 명령 · 결과 · 미실행을 갱신 |
| `zz_docs/LOGIC.md` | 백엔드 모듈 · 메서드 · API · 에러 코드가 바뀌었을 때만 반영 |

문서는 코드 근거로 쓴다. 확인하지 못한 내용은 "확인 필요"로 표시하고, 기존 문서의 경고 · 제약을 지우지 않는다 (`doc-writer` 규칙).

## 에이전트 · 스킬

구현 스킬은 **요청 정리 → 조사 → 계획(필요하면 승인) → 실행 → 검증(`/verify`) → 기록 · 보고** 순서로 진행한다.

| 스킬 | 용도 | 실행 순서 |
| ---- | ---- | --------- |
| `/feature` | 백엔드 기능 | be-researcher → 계획 → be-db-modeler → be-api-builder |
| `/design` | 프론트 화면 | fe-researcher → 계획 → fe-ui-builder |
| `/fullstack` | 풀스택 기능 | be · fe-researcher → 계획(API 계약) → be-db-modeler → be-api-builder → `/verify backend` → fe-ui-builder → fe-api-connector → `/verify all`(계약 대조) |
| `/debug` | 버그 원인 조사 (수정 없음) | be · fe-researcher → 재현 판단 → 원인 후보 표 → 확정 / 미확정 보고 |
| `/fix` | 버그 수정 | `/debug` 1~3단계 → 원인 하나만 수정 → `/verify` (3회 실패면 멈춤) |
| `/refactor` | 동작 유지 리팩터링 | 필요성 검토 → 계획(금지 목록 · 동작 유지 검증) 승인 → 단계별 실행 → `/verify` → `/review`(회귀 중심) |
| `/verify` | 검증 (`backend` · `frontend` · `all`) | verifier → 명령 실행 · 최초 원인 분석 · 규칙 점검 · 계약 대조 (파일 수정 없음) |
| `/review` | 코드 리뷰 (`git diff` 기준) | code-reviewer (+ 인증 · 권한 · 입력 처리가 바뀌었으면 security-reviewer) → findings 분류 (파일 수정 없음) |
| `/audit` | 화면 품질 감사 (화면 단위 전체) | fe-ui-auditor → 접근성 · 토큰 · 상태 · 폼 · 반응형 · 모션 · 문구 finding + 브라우저 확인 목록 (파일 수정 없음) |
| `/palette` | 색 토큰 만들기 · 바꾸기 | 대비 검사 → OKLCH 기준 설계(승인) → `index.css` 라이트 · 다크 + `tailwind.config.js` → 대비 검사 → `/verify frontend` |
| `/test` | 테스트 케이스 설계 (골격) | 기존 테스트 구조 확인 → Given / When / Then 케이스 → 러너 도입 전까지는 수동 확인 절차 |
| `/docs` | 문서 작성 · 동기화 | doc-writer → 초안 → 코드 대조 검토 → 반영 (LOGIC · README · API 문서) |
| `/pr` | 커밋 · PR 준비 | 변경 점검 → 커밋 분리 · 메시지 제안 → PR 본문 초안 → 승인 후 생성 |
| `/handoff` | 세션 인수인계 | git · 마커 · 대화의 결정을 모아 `TODO.md` "진행 중"에 기록 → 다음 첫 명령 |
| `/explore` | 외부 레포 분석 | 스크래치에 클론(또는 repomix `--remote`) → general-purpose 에이전트 조사 → base 대조(가져옴 / 새로 / 나중에 / 안 가져옴) |
| `/challenge` | 설계 · 주장 반론 (`full` · `steelman` · `decision`) | 근거 있는 장점 → 반론(base 코드 · 과거 결정 대조) → 대안 → 종합 + 확신도 (파일 수정 없음) |

`/verify`(기계적 검사 — 명령 · grep 규칙 · 계약)와 `/review`(의미 리뷰 — 로직 · 회귀 · 보안 · 검증 공백), `/audit`(화면 단위 UI 품질)은 역할이 다르다. 기능을 마무리할 때는 `/verify` + `/review`, 화면이 있으면 `/audit`까지.

에이전트를 부를 때는 **그 일에 필요한 것만** 넘긴다: 담당 파일, 계약, 수용 기준, 읽을 파일 경로. 대화 히스토리 · 계획 전체 · diff 원문을 붙여 넣지 않는다 (에이전트가 직접 읽게 한다). 결과도 형식에 맞는 요약만 받는다.

| 에이전트 | 역할 | 권한 | 모델 |
| -------- | ---- | ---- | ---- |
| be-researcher | 백엔드 코드 탐색 | 읽기 | haiku |
| fe-researcher | 프론트 코드 탐색 | 읽기 | haiku |
| be-db-modeler | SQLAlchemy 모델 작성 | 쓰기 (계획한 파일만) | sonnet |
| be-api-builder | repository · service · router 작성 | 쓰기 (계획한 파일만) | sonnet |
| fe-ui-builder | 컴포넌트 · 컨테이너 작성 | 쓰기 (계획한 파일만) | sonnet |
| fe-api-connector | API 연동 · 타입 정의 | 쓰기 (계획한 파일만) | sonnet |
| verifier | 검증 실행 · 실패 분석 · 규칙 점검 · 계약 대조 | 읽기 + 명령 실행 | sonnet |
| code-reviewer | 버그 · 회귀 · 검증 공백 리뷰, 심각도순 findings | 읽기 | sonnet |
| security-reviewer | 인증 · 권한 · 입력 · 비밀정보 리뷰, 공격 시나리오 | 읽기 | sonnet |
| fe-ui-auditor | 화면 품질 감사 — 코드로 판정 가능한 것만 finding, 나머지는 브라우저 확인 목록 | 읽기 | sonnet |
| doc-writer | 코드 근거 문서 작성 · 검토 | 문서 파일만 쓰기 | sonnet |

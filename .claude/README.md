# .claude 안내

이 폴더는 Claude Code가 base에서 일하는 방식이다. 규칙(rules) · 절차(skills) · 일꾼(agents) · 자동 검사(hooks) · 권한(settings.json)으로 나뉜다. 사람이 요청하는 법과 각 설정의 근거는 루트 `zz_claude_guide.md`, 항상 로드되는 총칙은 루트 `CLAUDE.md`에 있다.

## 구성

| 경로 | 역할 | 언제 읽히나 |
| ---- | ---- | ----------- |
| `../CLAUDE.md` | 스택 · 폴더 · 명령 · 작업 흐름 · 원칙 · 완료 기준 · 스킬 표 · 에이전트 표 | 항상 (컴팩션 뒤에도 다시) |
| `rules/frontend/*.md` | 공통 컴포넌트, 컨벤션 · 토큰 · 화면 품질, 디자인 기준 | `frontend/**` 파일을 만질 때 |
| `rules/backend/*.md` | 도메인 모듈 4파일 세트 · 에러 · 보안, infra 모듈 | `backend/**` 파일을 만질 때 |
| `rules/writing.md` | 문서 · 커밋 · PR · 보고 문체 (AI 냄새 · 이모지 금지) | `*.md` 파일을 만질 때 |
| `skills/<이름>/SKILL.md` | 슬래시 명령 하나 = 절차 하나. 입력 · 단계 · 돌려줄 형식 · 하지 않는 것 | `/이름`으로 부르거나 description의 트리거 문구에 맞는 요청이 올 때 |
| `agents/<이름>.md` | 스킬이 부르는 전담 일꾼. 입력 · 범위 · 보고 형식 · 종료 조건 | 스킬 절차 안에서 호출될 때 |
| `hooks/*.py` | 이벤트마다 자동으로 도는 검사 | `settings.json`의 `hooks`가 등록 |
| `settings.json` | 권한(allow · ask · deny)과 훅 등록. 커밋 대상 | 세션 시작 시 |
| `settings.local.json` | 개인 설정. 커밋 안 함 (`.gitignore`) | 있으면 `settings.json` 위에 덮임 |
| `last-verify.json` | `/verify` 마커. 커밋 안 함 | Stop 훅 · SessionStart 훅이 읽음 |

## 흐름 한 장

```
요청 → (스킬 선택) → researcher 조사 → 계획 · 승인 → builder 실행 → /verify → /review · /audit → 기록(zz_docs) → 보고 → commit · push
```

- 구현은 `/feature`(백엔드) · `/design`(프론트) · `/fullstack`. 스킬이 researcher → builder 순으로 에이전트를 부르고, 마지막에 `/verify`를 거친다.
- 점검은 셋으로 나뉜다. `/verify`는 명령 · grep 규칙 · 계약 대조(기계적), `/review`는 diff의 버그 · 회귀 · 보안(의미), `/audit`은 화면 단위 UI 품질. 셋 다 파일을 고치지 않는다.
- 에이전트에는 담당 파일 · 계약 · 수용 기준만 넘긴다. 히스토리 · diff 원문을 붙이지 않는다.
- 끝나면 `zz_docs/`(CHANGELOG · TODO · LOGIC)를 갱신하고 CLAUDE.md "완료 기준"대로 보고한다.

## 스킬 16개

| 묶음 | 스킬 | 한 줄 |
| ---- | ---- | ----- |
| 구현 | `/feature` `/design` `/fullstack` `/refactor` | 요청 정리 → 조사 → 계획 → 실행 → `/verify` → 기록 |
| 진단 · 점검 | `/debug` `/fix` `/verify` `/review` `/audit` `/challenge` | 원인 조사(수정 없음) / 원인 하나만 수정 / 기계 검증 / diff 리뷰 / 화면 감사 / 설계 반론 |
| 문서 · 정리 | `/docs` `/pr` `/handoff` `/test` | 코드 근거 문서 / 커밋 · PR / 세션 인수인계 / 테스트 케이스 설계(러너 도입 전 골격) |
| 기타 | `/palette` `/explore` | 색 토큰 설계 + 대비 검사 / 외부 레포 분석 후 가져올지 판단 |

경계가 헷갈리는 쌍은 각 SKILL.md description 끝에 적혀 있다 (예: `/debug`는 진단만, 수정은 `/fix`).

## 에이전트 11개

| 묶음 | 에이전트 | 권한 |
| ---- | -------- | ---- |
| 조사 | be-researcher, fe-researcher | 읽기 (haiku) |
| 구현 | be-db-modeler, be-api-builder, fe-ui-builder, fe-api-connector | 계획한 파일만 쓰기 |
| 점검 | verifier, code-reviewer, security-reviewer, fe-ui-auditor | 읽기 (verifier는 검증 명령 실행) |
| 문서 | doc-writer | 문서 파일만 쓰기 |

리뷰 · 감사의 finding 형식과 심각도는 `skills/review/references/finding-format.md` 하나를 셋이 공유한다.

## 훅 7개

| 스크립트 | 이벤트 | 하는 일 | 걸리면 |
| -------- | ------ | ------- | ------ |
| `session_context.py` | SessionStart | 브랜치 · 변경 파일 · 마지막 검증 · TODO "진행 중"을 주입 | 없음 (정보만) |
| `block_sensitive_edits.py` | PreToolUse Edit · Write | `.env`류 · 키 · `secrets/` · `alembic/versions` · lock 파일 수정 | 차단 + 대체 행동 안내 |
| `block_dangerous_bash.py` | PreToolUse Bash · PowerShell | `rm -rf` · `reset --hard` · 강제 푸시 · `DROP` · `downgrade` 등 11패턴 | 승인창. 예외: 대상이 전부 Claude 스크래치 절대 경로인 `rm -rf`는 통과 |
| `ask_paid_api.py` | PreToolUse Bash · PowerShell | 명령 본문과 실행하는 스크립트 파일에서 유료 생성 API 호출(Gemini 이미지 · Lyria · Veo, Stability, ElevenLabs, OpenAI 이미지 · 오디오)을 찾음. 모델 목록 조회 같은 무료 호출은 통과 | 승인창 (CLAUDE.md 원칙 12) |
| `check_touched_file.py` | PostToolUse Edit · Write | 고친 파일 하나만 문법 · 규칙(any · HTTPException · 고정색 등) 검사 | 위반 목록 + 심각도 |
| `check_verify_before_stop.py` | Stop | 코드를 고치고 `/verify` 없이 끝내려 하면 | 알림 |
| `mark_verified.py` | (훅 아님) | verifier가 검증 뒤 마커 기록 | |

훅은 검사 · 알림 · 승인 요청만 한다. 파일을 되돌리거나 명령을 대신 실행하지 않는다. 끄려면 `settings.json`의 `hooks`에서 해당 항목을 지운다. 훅 명령 경로는 반드시 `"$CLAUDE_PROJECT_DIR"` 절대 경로로 둔다 (상대 경로면 셸이 `cd`한 순간 모든 훅이 exit 2를 내서 편집이 전부 막힌다).

## 권한 (`settings.json`)

| 종류 | 내용 |
| ---- | ---- |
| allow | 검증 명령(`npm run check:types · lint · build`, `python -m compileall`, `check_routes.py`, `check_contrast.py`), `git status · diff · log · add · commit · push` |
| ask | `./migrate.sh`, `alembic`, `gh pr create` |
| deny | `.env`류 읽기 · 수정, `*.pem` · `*.key` 읽기 |

승인창이 뜨는 경우는 세 가지다. (1) ask 목록의 명령, (2) 훅이 잡은 위험 명령, (3) allow에 없는 조각이 섞인 복합 명령 (`cd … &&`, `| tail`, `grep`, `python -c`). git 명령은 파이프 · `cd` 없이 단독으로 보낸다. 검색은 Grep 도구, 문서 수정은 Edit 도구를 쓴다. `settings.json`의 권한을 넓히는 편집은 Claude가 못 한다 (자기 권한 확장은 Claude Code가 막음). 사람이 `/permissions`에서 바꾼다.

## 새로 추가할 때

| 무엇 | 어디에 | 같이 고칠 곳 |
| ---- | ------ | ------------ |
| 스킬 | `skills/<이름>/SKILL.md`. frontmatter: `name`, `description`(무엇 + 언제 + 트리거 문구 + 인접 스킬 경계), `argument-hint`, 읽기 전용이면 `allowed-tools` | CLAUDE.md 스킬 표, `zz_claude_guide.md` 스킬 표 |
| 에이전트 | `agents/<이름>.md`. frontmatter: `name`, `description`(언제 호출), `model`, `tools`. 본문: 입력 · 범위 · 절차 · 돌려줄 형식 · 하지 않는 것 · 종료 | CLAUDE.md 에이전트 표, 부르는 스킬 |
| 규칙 | `rules/<영역>/<주제>.md`. frontmatter `paths:` 글롭으로 로드 범위 지정 | CLAUDE.md 규칙 문서 표 |
| 훅 | `hooks/<이름>.py`. stdin JSON 읽기, 실패 시 exit 0(통과), stdout · stderr UTF-8 고정, 샘플 입력으로 허용 · 차단 둘 다 테스트 | `settings.json` `hooks` 등록(절대 경로), CLAUDE.md 원칙 10, `zz_claude_guide.md` hooks 표 |
| 외부 스킬 검토 | `/explore` | `zz_docs/TODO.md` 2단계, `zz_claude_guide.md` "외부 스킬에서 가져온 것" 표, `zz_docs/claude-skills-guide.md` 평가 |

원칙: 플러그인은 설치하지 않고 장치만 옮긴다. base 흐름과 겹치는 규칙은 기존 파일에 문장으로, 겹치지 않는 절차는 새 스킬 · 훅으로, 전제(러너 · MCP)가 없는 것은 TODO로. 어떤 반복 문제를 해결하는지 말할 수 없으면 가져오지 않는다.

## 일부러 그대로 둔 중복

- 구현 스킬 4개가 "요청 정리 항목 · 승인 대상 · 실패 모드 3개 · 완료 보고"를 CLAUDE.md와 겹치게 다시 쓴다. 스킬은 단독으로 로드되므로 스스로 완결돼야 한다.
- `/fix` 1~3단계는 `/debug`와 같은 본문이다. 스킬은 다른 스킬을 include할 수 없다.
- 백엔드 보안 · 에러 규칙(401은 토큰 문제에만, 본문 `user_id` 신뢰 금지, `HTTPException` 직접 raise 금지)이 module.md · builder · reviewer · verifier · 훅에 각각 있다. 만드는 쪽 · 검사하는 쪽 · 자동 검사가 같은 기준을 들고 있어야 해서다. 바꿀 때는 다섯 곳을 같이 고친다.
- 훅 `check_touched_file.py`의 grep 규칙은 verifier 규칙 표의 부분집합이다 (훅은 빠른 사전 검사, verifier가 최종).

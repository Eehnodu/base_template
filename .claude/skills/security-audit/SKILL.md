---
name: security-audit
description: 보안 감사 · 보안 질문. "보안 점검해줘", "배포 전에 취약점 봐줘", "보안 감사", "펜테스트", "이 API 인증 안전해?", "이 취약점 진짜야?"처럼 코드베이스 전체나 한 영역의 보안 약점을 소스 근거로 찾고 판정하거나 보안 질문에 답하는 요청에 사용한다. 기본은 질문에 답하는 안내 모드이고, 6단계 전체 감사와 보고서 파일은 사용자가 명시할 때만. 대상 코드를 실행하거나 고치지 않는다. 현재 변경(diff)의 보안 리뷰는 /review(security-reviewer), 고치기는 /fix.
argument-hint: "[질문 · 볼 경로 · 영역 — 전체 감사는 '전체 보안 감사' · '펜테스트'처럼 명시]"
allowed-tools: Read, Grep, Glob, Bash, Agent, Write
---

# /security-audit — 보안 감사

출처: Cloudflare [security-audit-skill](https://github.com/cloudflare/security-audit-skill) 의 `skills/security-audit/`, 커밋 `c1c8a8c`(2026-09-14), MIT 라이선스(이 폴더의 `LICENSE`). 참고 문서 14개 · `report-schema.json` · 검사 스크립트 2개 · 시험 2개는 원본 그대로다. 이 파일은 머리말과 아래 "이 저장소에서 쓰는 법"만 더했고, 그 아래는 원본 본문이다. 원본과 이 절이 어긋나 보이면 안전한 쪽(실행하지 않음 · 파일을 만들지 않음)을 따른다.

## 이 저장소에서 쓰는 법

**모드.** 기본은 guidance 모드다. 질문 · 한 영역 점검에 필요한 참고 문서만 골라 읽고 답하며, 파일을 만들지 않는다. 6단계 전체 감사(결과 파일 · 보고서)는 사용자가 "전체 보안 감사", "펜테스트", "보고서로 남겨줘"처럼 명시할 때만 한다. 애매하면 하나만 묻는다. 전체 감사는 에이전트를 많이 부른다(정찰 4 + 단위마다 헌터 + 후보마다 검증 1~2 + 비평). 시작 전에 프로필(`quick` · `standard` · `deep`)과 대략의 에이전트 수를 말하고 답을 받는다(원본 "Cost budget").

**대상 코드를 실행하지 않는다.** 회사 Windows PC 에는 원본이 요구하는 OS 샌드박스(외부 네트워크 차단 · 빈 환경 변수 · 읽기 전용 대상 · CPU · 메모리 · 시간 제한)가 없다. 그래서 빌드 · 시험 · 서버 · 브라우저를 돌리지 않고 소스만 읽는다. 실행해야 결론이 나는 단서는 `needs_validation` 으로 남기고, 막힌 이유(샌드박스 없음)와 안전한 확인 계획을 적는다 — 원본 "Universal execution safety" 그대로다. 배포된 주소 · 운영 DB · 외부 서비스에는 요청을 보내지 않는다. `.env` 류는 열지 않는다(CLAUDE.md 원칙 7) — 저장소에 들어 있는지는 `git ls-files` 로 이름만 보고, 값 대신 설정을 읽는 코드로 판단한다.

**결과 폴더는 저장소 밖.** 전체 감사 결과는 원본 기본값 `~/security-audit-skill/<repo>/run-<N>` 에 둔다. 저장소 안에 두지 않고 커밋하지 않는다(취약점 재현 방법이 담긴다). 에이전트는 실행을 하지 않으므로 아무 파일도 쓰지 않고, 결과 파일은 부모(이 스킬을 돌리는 세션)만 쓴다.

**검사 스크립트 (Windows).** Windows 의 node 에는 `O_NOFOLLOW` 가 없어 `validate-*.cjs` CLI 가 "OS no-follow and nonblocking input protection is unavailable" 로 멈춘다(원본 설계. 원본 시험도 Windows 에서는 CLI 시험 7개가 이 이유로 실패하고 검사 로직 시험은 통과한다). 두 JSON 은 부모가 직접 쓴 파일이므로 같은 검사 함수를 아래처럼 부르고, 보고서에 "Windows 대체 실행"이라고 적는다. macOS · Linux · WSL 에서는 원본 명령 그대로 쓴다.

```
node -e "const f=require('fs'),v=require(process.argv[1]),e=v.validateDocument(JSON.parse(f.readFileSync(process.argv[2],'utf8')));e.forEach(m=>console.error('ERROR:',m));console.log(e.length?'FAIL: '+e.length:'PASS');process.exitCode=e.length?1:0" <스킬 폴더>/validate-coverage-ledger.cjs <결과 폴더>/coverage-ledger.json
node -e "const f=require('fs'),p=require('path'),v=require(process.argv[1]),s=JSON.parse(f.readFileSync(p.join(p.dirname(process.argv[1]),'report-schema.json'),'utf8')),e=v.validateDocument(JSON.parse(f.readFileSync(process.argv[2],'utf8')),s);e.forEach(m=>console.error('ERROR:',m));console.log(e.length?'FAIL: '+e.length:'PASS');process.exitCode=e.length?1:0" <스킬 폴더>/validate-findings.cjs <결과 폴더>/findings.json
```

**base 스택에서 먼저 볼 참고 문서.** FastAPI · React · MySQL · Redis · JWT 쿠키 · Google · Kakao OAuth 기준이다.

| 문서 | base 에서 볼 곳 |
| ---- | --------------- |
| [WEB-PROTOCOL-AND-AUTH.md](WEB-PROTOCOL-AND-AUTH.md) | JWT 쿠키 · refresh · 로그아웃, OAuth 콜백 `state`, CSRF, CORS · 보안 헤더 미들웨어 |
| [CLIENT-SIDE.md](CLIENT-SIDE.md) | React 의 `dangerouslySetInnerHTML` · 리다이렉트 파라미터 · 브라우저 저장소, WebSocket(`useAudioWs`) |
| [DATA-ISOLATION-AND-LIFECYCLE.md](DATA-ISOLATION-AND-LIFECYCLE.md) | 사용자 · 관리자 분리, `{id}` 조회의 소유자 확인, 목록 필터, Redis 캐시 키, 삭제 · 탈퇴 |
| [AI-AND-LLM.md](AI-AND-LLM.md) | `infra/gpt` 를 쓰는 기능 — 프롬프트에 들어가는 사용자 입력, 모델 출력이 쓰이는 곳 |
| [ATTACK-CLASSES.md](ATTACK-CLASSES.md) | Access control · Injection · Obvious things. 업로드 · 외부 호출이 있으면 Resource and file handling |

배포 설정이 저장소에 있으면 [CLOUD-AND-DEPLOYMENT.md](CLOUD-AND-DEPLOYMENT.md) 를 더한다. base 고유의 공격면 표(`@with_login` 누락, 본문 `user_id` 신뢰 등)는 `.claude/agents/security-reviewer.md` "우선순위"에 있다.

**에이전트 대응.** 원본의 Task tool 은 Agent 도구다.

| 원본 역할 | 여기서 |
| --------- | ------ |
| `research` — 정찰 1a · 1c · 1d (사실 지도) | `be-researcher`(backend) · `fe-researcher`(frontend). 사실만 받고 판정은 맡기지 않는다 |
| `research` — 정찰 1b(권한 지도), 커버리지 비평, 5단계 기록 검증 | `security-reviewer` |
| `general` — 헌터, 3단계 후보 검증 | `security-reviewer`(실행을 하지 않으므로 읽기 전용으로 충분). 한 영역이 넓으면 `general-purpose` 를 쓰되 프롬프트에 파일 쓰기 · 명령 실행 금지를 적는다 |

- 헌터 · 검증 프롬프트에는 [HUNTING.md](HUNTING.md) · [VALIDATION-AND-REPORTING.md](VALIDATION-AND-REPORTING.md) 의 블록을 원문 그대로 넣고, "돌려줄 형식은 에이전트의 기본 보고 형식이 아니라 이 프롬프트 끝의 JSON 하나"라고 적는다.
- 검증은 매번 새 Agent 호출로 한다. 찾은 에이전트와 검증하는 에이전트가 같으면 안 된다(원본 독립성 규칙).

**보고와 다음 단계.** 결과는 한국어로 보고한다 — 확정(confirmed) 표, 확인 필요(needs_validation) 표, 강화 메모, 본 범위와 못 본 범위. 심각도 이름은 원본(critical · high · medium · low · informational)을 그대로 쓰고, `needs_validation` 에는 심각도를 붙이지 않는다. 이 스킬은 대상 소스를 고치지 않는다. 고칠 것은 finding 하나씩 `/fix` 로 넘기고(인증 · 권한 · 쿠키 변경은 CLAUDE.md 승인 대상), 고친 뒤 `/review` 로 본다.

**경계.** 현재 변경(diff)의 보안 확인은 `/review`(security-reviewer)가 맡는다. 이 스킬은 코드베이스 전체 · 영역 단위 감사와 보안 질문을 맡는다.

---

아래는 원본 SKILL.md 본문이다(바꾸지 않음).

# Security Audit

Find vulnerabilities that violate a real trust boundary, then give owners the source evidence, safe reproduction, priority, and smallest effective fix. This is a defensive, source-first workflow. A candidate without a concrete affected principal, resource, or security outcome is not a confirmed finding.

## Operating modes

This skill is guidance by default. Loading it does not authorize the complete audit workflow or file creation.

- **Guidance mode**: For security questions, focused reviews, methodology, triage, or investigation of specific findings, use only the relevant parts of this skill. Do not automatically run all six phases, create an output directory, or write audit artifacts. You may launch focused agents when useful; they return results to the current task.
- **Full audit mode**: Use the complete workflow when the user explicitly asks to audit or pen-test a codebase, asks for a full, comprehensive, or end-to-end security review, or requests report artifacts. Run all six phases and write the files defined below.

If the request could mean either mode, ask one focused question before creating files or starting the complete workflow.

## Platform terminology

This skill is agent-neutral:

- **Parent** is the agent that coordinates the run and owns shared state.
- **Task tool** is the platform's delegation or sub-agent mechanism.
- **`research` agent** is a delegated agent for focused source exploration and factual verification.
- **`general` agent** is a delegated agent for broad investigation and bounded local execution.
- **`subagent_type:`** in a heading names which of these two delegated agent roles runs that work.

Use equivalent platform capabilities while preserving role, write-isolation, prompt, and independence boundaries.

## Universal execution safety

These rules apply in both operating modes. Source inspection is read-only. Run target-controlled builds, tests, processes, browsers, emulators, fuzzers, and fixture processing only inside an OS-enforced sandbox that provides all of these controls:

- no external network; use only an isolated loopback namespace when the check needs local client/server traffic;
- an empty environment populated from an explicit allowlist with safe values, with scratch-local `HOME`, temporary directories, and caches;
- a read-only target and toolchain, with the target-controlled process able to write only inside its assigned `scratch/` directory; and
- explicit low CPU, memory, process, file-size, disk, and wall-clock limits.

The agent, outside the target-controlled process, may make a disposable source copy in an assigned `scratch/` directory when a build must write beside source. In guidance mode, do not retain target-controlled files. In full audit mode, only trusted parent-side code may promote the minimum non-secret result to retained `artifacts/` using the procedure under Write isolation. Never expose a retained output directory (other than the agent's own assigned `scratch/`), another agent's directory, the host home directory, credentials, sockets, or shared services to target code. Do not install dependencies or let builds fetch them. Use only tools and dependencies already available locally. If every control cannot be enforced, do not execute target code: report the missing sandbox capability as a needs-validation blocker and give a safe validation plan.

Use dummy principals, fixtures, and secrets. Do not probe deployed endpoints, external services, shared infrastructure, production identities, other users' data, or live control planes. Do not test availability against a live or shared process, publish artifacts, alter releases, spend paid API quota, or continue beyond the minimum local effect needed to establish a defect. If the decisive fact is outside source or the sandboxed fixture, report it as needing validation.

## Full audit setup

In full audit mode, resolve these values before reconnaissance:

- **Skill directory**: the absolute directory containing this `SKILL.md`.
- **Target**: the absolute repository root under review.
- **Repo name**: a stable repository identifier from the directory or local Git remote.
- **Output directory**: a new writable directory outside the target, defaulting to `~/security-audit-skill/<repo-name>/run-<N>`, where `<N>` is the next unused integer. Use a directory inside the target only when the user explicitly selects it and the parent verifies that version control ignores the whole directory. Otherwise stop and request an external path.
- **Source ref**: the reviewed commit and whether the worktree is dirty. Do not treat unreviewed generated or modified files as another revision.

### Write isolation

The parent creates and is the only writer of shared run files:

- `run-metadata.json`
- `architecture.md`
- `coverage-ledger.json`
- `findings.json`
- `REPORT.md`
- `FINDINGS-DETAIL.md`
- `NEEDS-VALIDATION.md`

Each hunter or verifier receives a unique root under `<output-dir>/agents/<agent-id>/`, with separate `scratch/` and `artifacts/` directories. Canonical agent IDs match `^[a-z0-9][a-z0-9_-]{0,63}$` and must not equal a Windows device name such as `con`, `prn`, `aux`, `nul`, `com1` through `com9`, or `lpt1` through `lpt9`. Lowercase IDs prevent case-fold collisions. The agent and every target-controlled process may write only to `scratch/`; retained `artifacts/` is parent-owned, is never exposed to the sandbox, and is writable only by trusted parent-side promotion code. Agents may not change shared files, target source, retained artifacts, or another agent's directory. Do not use `/tmp` or the host home directory as a writable fallback.

Before execution, the parent opens and retains trusted, non-inheritable directory descriptors for the agent's `scratch/` and `artifacts/` roots, and records an allowlist of expected scratch-relative artifact files plus explicit per-file and cumulative byte limits. Never pass those descriptors to the agent or sandbox. After the sandbox and all its processes terminate, trusted parent-side code promotes each allowlisted file separately:

1. Validate the declared relative path: reject absolute, empty, `.`, `..`, or symlinked components.
2. Walk each parent component from the retained scratch-root descriptor with no-follow directory-relative operations; never reopen by path.
3. Open the leaf no-follow and nonblocking.
4. Verify with `fstat` that it is a regular file with link count exactly one and within the recorded per-file and cumulative byte limits.
5. Enforce those limits again while reading from that descriptor.
6. Copy exactly the verified size, repeat `fstat`, and reject a changed identity, type, link count, or size.
7. For the destination, walk every parent component from the retained artifacts-root descriptor with no-follow directory-relative operations; require each existing component to be a real directory, and create any missing directory exclusively before reopening and verifying it no-follow.
8. Create the leaf exclusively without following links, verify that the opened destination is a regular file with link count exactly one, and copy from the verified source descriptor without reopening either path.
9. Use equivalent race-safe APIs on non-POSIX systems.
10. Never recursively copy or glob scratch, extract an archive into artifacts, or open or promote a symlink, FIFO, socket, device, directory, hard-linked file, changing file, or file that exceeds its bound.
11. If any check is unavailable, cannot be enforced, or fails, discard the scratch entry; if it is decisive evidence, retain `needs_validation` with the exact promotion blocker.

[HUNTING.md](HUNTING.md) and [VALIDATION-AND-REPORTING.md](VALIDATION-AND-REPORTING.md) carry this procedure as one identical fenced block for hunter and verifier prompts; it states the same rules in the same order as this list.

For a reproduced check, record the command, exact test input, sandbox limits, and only the allowlisted environment variable names plus safe non-secret values needed to reproduce it. Never capture or copy the ambient environment, inherited variables, credential values, authentication state, or unrelated host paths. Launch from an empty environment rather than trying to redact one after execution.

Before delegation, the parent writes `run-metadata.json` with at least `run_id`, `repo`, `target`, `source_ref`, `profile`, `scope_paths`, `budget` (null if unset), `execution_policy: "sandboxed-source-and-local-only"`, selected companion files, prior-run paths, shared-file owners, and `run_status: "in_progress"`. Update metadata only when those facts change; candidate state belongs in the coverage ledger and `findings.json`.

## Full audit planning

The coverage, prior-run, profile, and budget requirements in this section apply only in full audit mode.

### Coverage and prior runs

No one pass is complete. Build a deterministic coverage plan before hunting and update it after every agent result. [RECONNAISSANCE.md](RECONNAISSANCE.md) defines the stable coverage units and [HUNTING.md](HUNTING.md) defines coverage-critic waves. The parent alone updates the ledger.

If prior runs exist, read every compatible `coverage-ledger.json` and `findings.json` before planning the current run:

1. Compare the relevant current source with each prior record and unit. A prior source ref alone is not evidence that a path is unchanged.
2. Carry a prior `confirmed` record into the current candidate set only when its relevant source and conditions are unchanged and its evidence still meets the current contract. Link it to a current ledger unit seeded `planned`, preserve its fingerprint, exclude only that carried root cause from hunters, and send the carried record through the current final verification path; the Phase 3 verifier that re-checks it becomes that unit's assignment owner and moves it to `candidate`.
3. When relevant source for a prior `confirmed` record changed, create a current planned revalidation unit. Do not put that record on the hunter exclusion list. It remains confirmed only if current independent validation establishes the current path and result.
4. Make prior `needs_validation`, `deferred`, `blocked`, `out_of_scope`, and any changed-source unit current work. A still-external `needs_validation` record may be carried only after the current source trace is checked and linked by fingerprint to a current `planned` unit whose verifier re-check supplies its owner and evidence; the record keeps the unresolved blocker. These prior states never suppress a current unit.
5. A prior same-source covered unit may inform priority, but it remains visible in the current ledger. A prior `rejected` record suppresses only the unchanged failed claim, not coverage of its unit; changed evidence creates current work.
6. Read the prior profile and scope. A prior `quick` or scoped ledger contributes only its recorded evidence and gaps, never an implied "rest is fine."

If no prior ledger exists, say so in the final coverage statement. Never imply that one run exhausts the target.

### Run profiles and scope

During full audit setup, pick a profile from the user's request or propose one from the target's size and stakes. Record it in `run-metadata.json` (`profile`, `scope_paths`) and state it in the report. The default is `standard`.

- **`quick`** — a bounded pass for small targets, re-runs, or a fast first look. Coarsen ledger units to surface × boundary × attack class (subsystem uses the fixed canonical `profile/quick/all-in-scope-subsystems` identifier), run exactly one hunter wave followed by exactly one final coverage-critic pass, and use one fresh verifier per candidate for both candidate validation and final record verification. Do not launch a follow-up hunter wave: record the critic's accepted discoveries and reassignments as `deferred`.
- **`standard`** — the workflow as written.
- **`deep`** — for high-stakes or large targets. Split ledger units per subsystem and lifecycle mode, run critic waves to a clean pass, keep candidate validation and final record verification as separate fresh agents, and give `prior_covered_same_source` units an independent second pass.

A **scoped run** audits a subset: named paths, one subsystem, one companion domain, or the diff between two source refs. Seed ledger units only for in-scope surfaces and record everything else as `out_of_scope` — never as `covered`. A scoped or `quick` run must present itself as partial coverage.

Profiles change breadth and redundancy, never the evidence bar. Do not scale away the candidate gate, the source/local execution boundary, `needs_validation` discipline, schema validation, or independent verification of `confirmed` records.

#### Cost budget

The ledger makes spend countable: one unit is roughly one hunter assignment, and one surviving candidate is one or two verifier assignments depending on profile. When the user sets a budget — or the parent proposes one for a large target — record `budget` in `run-metadata.json` as a maximum number of agent invocations across all phases.

Apply the strict budget gate before launching any reconnaissance agent. Reserve the four baseline reconnaissance calls, one final post-wave critic for `quick` or one post-wave plus one distinct final-clean critic for `standard`/`deep`, and at least one verifier call. Add focused reconnaissance only after repeating this gate for each extra call. If the requested budget cannot fund that minimum, launch no agent: ask for a larger budget, narrower scope, or different profile. If the request remains unchanged, set `run_status: "incomplete"` with `incomplete_reason: "budget_cannot_fund_reconnaissance_and_reserves"` and report that no audit pass ran.

Spend it in this order:

1. Count reconnaissance, every post-wave critic, and the separate final-clean critic as agent invocations.
2. **Reserve critics and validation before hunting.** For `quick`, reserve its one post-wave final critic. Before every `standard` or `deep` hunter wave, reserve one immediate post-wave critic plus one distinct final-clean critic. Also reserve verifier cost from the profile (about 1 or 2 agents per expected candidate; when in doubt reserve 30% of the balance after critic reservation). Never assign hunters into either reserve.
3. Assign hunters to units in priority order until the hunting allowance is spent. Spend the reserved post-wave critic immediately after that wave; keep the final-clean and validation reserves intact.
4. Before a later wave, reserve its new post-wave critic again. If the remaining budget cannot cover the required critic calls and validation reserve, launch no hunters from that wave, mark its planned units `deferred` with reason `budget_cannot_reserve_critics_and_validation`, and use the retained final-clean critic to record the resulting gap.

Before wave 1, update the pre-recon estimate with seeded units, implied hunter count, mandatory critic calls, validation reserve, and whether the remaining budget covers the plan. If it clearly cannot, say so and propose either a tighter scope or a coarser profile instead of silently thinning evidence. If later facts consume the required final-critic reserve, launch no hunters, mark all planned work deferred, set the run incomplete with reason `critic_budget_exhausted`, and make no complete-coverage claim.

A strict total-agent budget can still be exceeded by an unexpectedly large candidate set or by a material Phase 5 replacement that needs another independent verifier. If the remaining budget cannot validate every candidate, stop hunting, validate candidates in fingerprint order while the budget permits, and set `run_status: "incomplete"` plus `incomplete_reason: "validation_budget_exhausted"`. Keep each unvalidated fingerprint linked to a `candidate` ledger unit with that unresolved reason. Do not put an unvalidated candidate in `findings.json`, relabel it `needs_validation`, or report the run as complete. Phase 6 may produce a partial report only if its first section states that candidate validation is incomplete and lists the affected fingerprints and units. Never exceed a user-set strict budget silently.

## Core principles

### Require a boundary and result

For every candidate, name the lower-trust principal, accepted input or action, intended control, crossed boundary, affected principal or resource, and concrete observed or owner-observable result. Do not elevate a missing best practice, guessed deployment behavior, generic parser crash, or self-impact into a security finding.

### Use bounded local evidence

Static analysis establishes the source path. Sandboxed local tests resolve behavior when all execution controls are available: a minimal function harness, existing unit test, small parser fixture, dummy-tenant integration test, locally rendered configuration, or bounded isolated-loopback client. Stop at a wrong return value, unauthorized dummy record, sanitizer finding, policy difference, or other minimum effect. Do not extend the local check beyond the minimum boundary result or produce persistence, post-fault, or concealment material.

### Respect source visibility

Deployment controls, proxy behavior, provider settings, browser headers, identity policy, broker ACLs, packaging, and topology are real controls. If they are required and absent from the repository, do not assume either presence or absence. Use `needs_validation` with the exact missing fact and a safe owner-observed or local plan.

### Separate priority from certainty

Only `confirmed` records receive severity. Likelihood and impact must reflect the demonstrated conditions and result; overall severity cannot exceed demonstrated impact. `needs_validation` means a specific source-grounded boundary hypothesis is blocked, not a low-confidence confirmed vulnerability, and it has no severity.

Calibrate overall severity with these anchors:

- **critical** — an unauthenticated actor gains code execution, full data-store access, or takeover of arbitrary accounts.
- **high** — an actor fully defeats an explicit security control with real consequences: authentication bypass, cross-tenant read or write, stored script execution affecting other users, authenticated code execution, or an unauthenticated remote stop of a shared service.
- **medium** — a real boundary violation with limited blast radius, uncommon preconditions, or consequences confined to a narrow resource set.
- **low** — disclosure of non-secret internals, or an effect requiring sustained effort for minimal gain.
- **informational** — a confirmed but minimal-impact observation, useful mainly as a prerequisite inside a larger finding.

The high/medium discriminator: does the demonstrated result fully defeat an explicit control for an action with real consequences, or only weaken it? If you cannot state the concrete damage, the severity is lower than it feels.

### Recommend the smallest effective source fix

For each confirmed finding, identify the invariant the code must enforce and the narrowest source change that enforces it at the last trusted decision point. Prefer specific repository-relative changes and regression tests over generic hardening advice. The audit describes fixes; it does not modify target source.

## Full audit workflow

In full audit mode, follow all six phases in order:

1. **Reconnaissance** — map the source, trust boundaries, local build paths, companion selections, prior evidence, and initial deterministic coverage ledger with [RECONNAISSANCE.md](RECONNAISSANCE.md).
2. **Coverage-led hunting waves** — assign isolated hunters from the ledger and collect structured candidate results with [HUNTING.md](HUNTING.md), [ATTACK-CLASSES.md](ATTACK-CLASSES.md), and the selected domain companions.
3. **Candidate validation** — consolidate fingerprints and give every candidate to a fresh source verifier as defined in [VALIDATION-AND-REPORTING.md](VALIDATION-AND-REPORTING.md).
4. **Structured output** — write all final `confirmed`, `needs_validation`, and `rejected` records to `findings.json`; validate it with `report-schema.json` and `validate-findings.cjs`, and validate the coverage claim with `validate-coverage-ledger.cjs`.
5. **Independent record verification** — use fresh agents to verify final source claims and reconcile corrections or state changes.
6. **Target-neutral report** — derive `REPORT.md`, `FINDINGS-DETAIL.md`, and `NEEDS-VALIDATION.md` from the final records, with no live-probe instructions.

Do not end the run before one of exactly two terminal states: (a) all Phase 6 artifacts are written and both validators pass, or (b) `run_status: "incomplete"` is recorded with its exact reason and the gap is disclosed in the report. Never stop mid-phase.

## Anti-patterns

1. Checklist deviations presented as vulnerabilities.
2. Defense-in-depth advice with no reachable boundary violation.
3. Live or shared-environment testing where bounded local evidence is insufficient.
4. Guessing provider, proxy, browser, identity, or deployment behavior not present in source.
5. Treating intended same-principal authority or self-impact as a cross-boundary result.
6. Reporting a parser or runtime effect stronger than the observed effect.
7. Emitting prose-only hunter results that cannot be deduplicated or verified.
8. Re-reporting carried same-source prior confirmed records or using them as exemplars that anchor the hunt.
9. Assigning severity to `needs_validation` records.
10. Writing the report before independent verification or letting prose and JSON disagree.

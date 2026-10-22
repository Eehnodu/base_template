""".claude 하네스가 깨지지 않았는지 검사한다. .claude 를 고친 뒤, /retro 반영 뒤 돌린다.

Harness²(google-research/harness2)의 하네스 검사(tree.validate)를 Claude Code 구조에 옮긴 것.
그쪽에서 "제안을 통째로 버리게 만든" 실수가 여기서도 조용히 기능을 죽인다:
  - 스킬 머리말에 name(폴더 이름과 같음) · description 이 없으면 로드 때 조용히 빠진다
  - 스킬 · 에이전트 · 문서가 가리키는 파일이 없으면 그 절차는 중간에 멈춘다
  - settings.json 이 깨지면 그 파일의 권한 · 훅이 전부 꺼진다
  - 상시 문서(CLAUDE.md, paths 없는 규칙)는 매 턴 읽힌다. 길수록 작업에 쓸 자리가 줄어든다

사용: python .claude/scripts/check_harness.py        (문제가 있으면 exit 1, 경고만 있으면 exit 0)
      python <kit>/claude/scripts/check_harness.py --project <프로젝트 폴더>   (다른 프로젝트를 밖에서 검사)
"""
from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path

for _s in (sys.stdout, sys.stderr):
    try:
        _s.reconfigure(encoding="utf-8")
    except Exception:
        pass

# 이 파일은 <프로젝트>/.claude/scripts/ 에 있다. kit 저장소에서는 <kit>/claude/scripts/ 라 폴더 이름이 다르다.
CLAUDE = Path(__file__).resolve().parent.parent
ROOT = CLAUDE.parent
# Harness² 의 Codex 상시 파일(AGENTS.md) 상한. 넘으면 새 규칙을 넣을 때 다른 것을 빼야 한다.
ALWAYS_ON_MAX = 8_000
AGENT_SUFFIX = r"(?:researcher|builder|reviewer|auditor|modeler|connector|writer)"
# 실행 중에 생기는 파일 — 처음 받은 저장소에는 없는 게 맞다
RUNTIME = {"last-verify.json", "kit-version", "command-log.ndjson"}
LOCAL_REF = re.compile(r"`((?:\.claude/|references/|assets/|scripts/|hooks/|rules/|agents/|skills/)[\w./-]+\.(?:md|py|mjs|js|json|css|html|sh))`")

errors: list[str] = []
warnings: list[str] = []


def front(path: Path) -> dict[str, str]:
    text = path.read_text(encoding="utf-8")
    m = re.match(r"---\r?\n(.*?)\r?\n---", text, re.S)
    if not m:
        return {}
    out = {}
    for line in m.group(1).splitlines():
        k, sep, v = line.partition(":")
        if sep and not line.startswith(" "):
            out[k.strip()] = v.strip().strip('"')
    return out


def refs_exist(path: Path, text: str) -> None:
    for ref in LOCAL_REF.findall(text):
        tpl = CLAUDE / "templates" / "si-base"  # kit 저장소: 개발 바탕 틀 안의 파일
        bases = [path.parent, CLAUDE, ROOT, ROOT / "frontend", ROOT / "backend", tpl / "frontend", tpl / "backend"]
        local = ref[len(".claude/"):] if ref.startswith(".claude/") else ref
        if Path(ref).name in RUNTIME or ignored(ref):
            continue
        if not any((b / ref).exists() or (b / local).exists() for b in bases):
            errors.append(f"{path.relative_to(ROOT)} 가 가리키는 `{ref}` 가 없다")


def ignored(ref: str) -> bool:
    """실행 중에 생기는 파일(.claude/last-verify.json 등)은 .gitignore 에 있고 처음엔 없는 게 맞다."""
    try:
        return subprocess.run(["git", "check-ignore", "-q", ref], cwd=ROOT, timeout=5).returncode == 0
    except Exception:
        return False


def check_skills(always_on: str) -> int:
    chars = 0
    agents = {p.stem for p in (CLAUDE / "agents").glob("*.md")}
    for d in sorted((CLAUDE / "skills").iterdir()) if (CLAUDE / "skills").is_dir() else []:
        f = d / "SKILL.md"
        if not f.is_file():
            continue
        fm = front(f)
        rel = f.relative_to(ROOT)
        if fm.get("name") != d.name:
            errors.append(f"{rel}: 머리말 `name: {d.name}` 이 없거나 폴더 이름과 다르다 (로드 때 조용히 빠진다)")
        desc = fm.get("description", "")
        if not desc:
            errors.append(f"{rel}: 머리말 `description:` 이 없다 (언제 쓰는지 몰라 불리지 않는다)")
        chars += len(desc)
        if always_on and not re.search(rf"/{re.escape(d.name)}\b|`{re.escape(d.name)}`", always_on):
            warnings.append(f"스킬 `{d.name}` 이 상시 문서(CLAUDE.md · paths 없는 규칙)에 한 번도 나오지 않는다 (언제 쓰는지 한 줄 두기)")
        text = f.read_text(encoding="utf-8")
        refs_exist(f, text)
        for name in set(re.findall(rf"\b[a-z]+(?:-[a-z]+)*-{AGENT_SUFFIX}\b|\bverifier\b", text)):
            if name not in agents:
                errors.append(f"{rel}: 에이전트 `{name}` 을 부르는데 .claude/agents/{name}.md 가 없다")
    return chars


def check_agents() -> int:
    chars = 0
    for f in sorted((CLAUDE / "agents").glob("*.md")):
        fm = front(f)
        rel = f.relative_to(ROOT)
        if fm.get("name") != f.stem:
            errors.append(f"{rel}: 머리말 `name: {f.stem}` 이 없거나 파일 이름과 다르다")
        if not fm.get("description"):
            errors.append(f"{rel}: 머리말 `description:` 이 없다")
        chars += len(fm.get("description", ""))
        refs_exist(f, f.read_text(encoding="utf-8"))
    return chars


def check_settings() -> None:
    p = CLAUDE / "settings.json"
    if not p.is_file():
        return
    try:
        data = json.loads(p.read_text(encoding="utf-8"))
    except ValueError as e:
        errors.append(f".claude/settings.json 이 JSON 으로 안 읽힌다 — 권한 · 훅이 전부 꺼진다: {e}")
        return
    for event, groups in (data.get("hooks") or {}).items():
        for g in groups:
            for h in g.get("hooks", []):
                cmd = h.get("command", "")
                for script in re.findall(r"\.claude/[\w./-]+\.py", cmd):
                    if not (CLAUDE / script[len(".claude/"):]).is_file():
                        errors.append(f"settings.json {event} 훅이 부르는 {script} 가 없다")
                if ".claude/" in cmd and "$CLAUDE_PROJECT_DIR" not in cmd:
                    errors.append(f"settings.json {event} 훅 경로가 상대 경로다 — 셸이 cd 하면 훅이 깨진다: {cmd}")


def check_python() -> None:
    for f in sorted(CLAUDE.rglob("*.py")):
        try:  # compile() 은 .pyc 를 남기지 않는다
            compile(f.read_text(encoding="utf-8"), str(f), "exec")
        except SyntaxError as e:
            errors.append(f"{f.relative_to(ROOT)}:{e.lineno} 문법 오류: {e.msg}")


def main() -> int:
    global ROOT, CLAUDE
    if "--project" in sys.argv[1:]:
        ROOT = Path(sys.argv[sys.argv.index("--project") + 1]).resolve()
        CLAUDE = ROOT / ".claude"
    claude_md = ROOT / "CLAUDE.md"
    md = claude_md.read_text(encoding="utf-8") if claude_md.is_file() else ""
    if md:
        refs_exist(claude_md, md)
    rules_text = ""
    for f in sorted((CLAUDE / "rules").rglob("*.md")):
        if "paths" not in front(f):
            rules_text += f.read_text(encoding="utf-8")
            warnings.append(f"{f.relative_to(ROOT)} 에 `paths:` 가 없어 항상 읽힌다")
    rules_on = len(rules_text)
    # 스킬 트리거 검사는 CLAUDE.md 가 있는 프로젝트에서만 (kit 저장소에는 프로젝트 CLAUDE.md 가 없다)
    always_on = md + rules_text if md else ""
    skill_chars = check_skills(always_on)
    agent_chars = check_agents()
    check_settings()
    check_python()

    total = len(md) + rules_on
    print("상시 문서 (매 턴 읽힘)")
    print(f"  CLAUDE.md {len(md):,}자 · paths 없는 규칙 {rules_on:,}자 = {total:,}자 (상한 {ALWAYS_ON_MAX:,})")
    print(f"  스킬 설명 {skill_chars:,}자 · 에이전트 설명 {agent_chars:,}자 (목록으로 항상 보임)")
    if total > ALWAYS_ON_MAX:
        warnings.append(f"상시 문서가 {total:,}자로 상한 {ALWAYS_ON_MAX:,}자를 넘는다 — 넣을 때는 다른 것을 뺀다")
    for w in warnings:
        print(f"[경고] {w}")
    for e in errors:
        print(f"[오류] {e}")
    print(f"결과: 오류 {len(errors)} · 경고 {len(warnings)}")
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())

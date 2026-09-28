"""PreToolUse(Bash | PowerShell): 되돌릴 수 없는 명령은 자동 실행하지 않고 사용자 승인을 받는다.

대상: 강제 삭제, git 이력 파괴 · 강제 푸시, DB 스키마 파괴, 마이그레이션 되돌리기.
걸리면 permissionDecision "ask" 를 돌려줘 그 명령만 승인 프롬프트가 뜬다 (auto 모드에서도).
승인하면 그대로 실행, 거부하면 실행 안 됨. 차단(exit 2)이 아니므로 사용자가 명령을 손으로 옮겨 칠 필요가 없다.
허용 · 확인 명령(migrate.sh, gh pr create 등)은 settings.json 의 permissions 가 맡는다. 여기는 "항상 물어봐야 하는 것"만.
"""
import json
import re
import sys

for _s in (sys.stdout, sys.stderr):
    try:
        _s.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Claude 스크래치(세션 임시 폴더) 아래만 지우는 rm -rf 는 묻지 않는다 — /explore 가 클론을 정리하는 경우.
# 대상이 전부 절대 경로이고 이 루트 아래일 때만. 상대 경로 · 프로젝트 경로가 하나라도 섞이면 승인.
SCRATCH_ROOT = re.compile(r"^(?:[a-z]:)?/(?:.+/)?appdata/local/temp/claude/.+|^/tmp/claude/.+")
RM_RF = re.compile(r"\brm\s+((?:-[a-zA-Z]+\s+)+)([^&|;\n]+)")


def _rm_only_scratch(cmd: str) -> bool:
    found = False
    for flags, rest in RM_RF.findall(cmd):
        if not re.search(r"-[a-zA-Z]*r[a-zA-Z]*f|-[a-zA-Z]*f[a-zA-Z]*r", flags):
            continue
        found = True
        targets = [t.strip("\"'") for t in shlex_split(rest)]
        if not targets:
            return False
        for t in targets:
            norm = t.replace("\\", "/").lower()
            if not SCRATCH_ROOT.match(norm):
                return False
    return found


def shlex_split(s: str) -> list[str]:
    import shlex
    try:
        return shlex.split(s, posix=True)
    except ValueError:
        return s.split()


ASK = [
    (r"\brm\s+(-[a-zA-Z]*r[a-zA-Z]*f|-[a-zA-Z]*f[a-zA-Z]*r)\b", "재귀 강제 삭제"),
    (r"(?i)(\bRemove-Item\b[^\n|;]*-Recurse[^\n|;]*-Force|\bRemove-Item\b[^\n|;]*-Force[^\n|;]*-Recurse)", "재귀 강제 삭제"),
    (r"(?i)(\b(rd|rmdir)\s+/s\b|\bdel\s+/[sq]\b)", "재귀 삭제"),
    (r"\bgit\s+reset\s+--hard\b", "작업 트리 · 사용자 변경을 날린다"),
    (r"\bgit\s+checkout\s+--\s+\.|\bgit\s+restore\s+(\.|--worktree\s+\.)", "작업 트리 전체를 되돌린다"),
    (r"\bgit\s+clean\s+-[a-zA-Z]*[fdx]", "미추적 파일을 삭제한다"),
    (r"\bgit\s+push\b[^\n|;]*(--force\b|-f\b|--force-with-lease\b)", "강제 푸시 — 원격 이력을 덮어쓴다"),
    (r"\bgit\s+branch\s+-D\b", "브랜치 강제 삭제"),
    (r"\balembic\s+downgrade\b", "마이그레이션 되돌리기 — 데이터 손실 가능"),
    (r"(?i)(\bDROP\s+(TABLE|DATABASE|SCHEMA)\b|\bTRUNCATE\s+TABLE\b)", "스키마 · 데이터 파괴"),
    (r"\bnpm\s+audit\s+fix\s+--force\b", "major 업그레이드가 섞일 수 있다"),
]


def main() -> int:
    try:
        data = json.load(sys.stdin)
    except Exception:
        return 0

    cmd = data.get("tool_input", {}).get("command") or ""
    if not cmd:
        return 0

    # 대소문자: git 플래그(-d 와 -D)는 구분해야 하므로 전역 IGNORECASE 를 쓰지 않고, SQL · PowerShell 만 (?i) 로 지정
    hits = [reason for pattern, reason in ASK if re.search(pattern, cmd)]
    if hits == ["재귀 강제 삭제"] and _rm_only_scratch(cmd):
        # "결정 없음"으로 빠지면 Claude Code 분류기가 rm -rf 를 다시 물어본다. 명시적 allow 로 끝낸다.
        print(json.dumps({
            "hookSpecificOutput": {
                "hookEventName": "PreToolUse",
                "permissionDecision": "allow",
                "permissionDecisionReason": "[hook] Claude 스크래치 아래 절대 경로만 지움",
            }
        }, ensure_ascii=False))
        return 0
    if not hits:
        return 0

    reason = "[hook] 되돌릴 수 없는 명령 — 승인 필요: " + " / ".join(dict.fromkeys(hits))
    print(json.dumps({
        "hookSpecificOutput": {
            "hookEventName": "PreToolUse",
            "permissionDecision": "ask",
            "permissionDecisionReason": reason,
        }
    }, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

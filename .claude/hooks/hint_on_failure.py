"""PostToolUseFailure(Bash | PowerShell): 자주 반복된 실패 뒤에 고치는 법 한 줄을 붙인다.

Harness²(google-research/harness2)가 말하는 "반복되는 오류 서명 뒤에 맞춤 힌트" 장치.
상시 문서(CLAUDE.md)에 쓰면 매 턴 읽히는 비용이 들지만, 이 훅은 그 실패가 났을 때만 말한다.
대상은 2026-10 회고(zz_docs/HARNESS.md)에서 여러 세션에 반복된 것만:
  - 셸 따옴표 · heredoc 이 깨져 명령이 통째로 실패 (6세션 28건 + 인라인 파이썬 문법 오류 18건)
  - Windows 콘솔 인코딩(cp949)으로 파이썬 출력이 깨짐 (2세션 10건)
  - 가상환경이 아닌 python 으로 돌려 모듈 없음 (5세션 8건 중 다수)
  - PowerShell 이 경로의 [ ] 를 와일드카드로 읽어 경로 없음 ([my] · [xero] 같은 폴더)
출력은 additionalContext 로만 낸다. 실패해도 조용히 exit 0 (작업을 막지 않는다).
"""
import json
import re
import sys

for _s in (sys.stdout, sys.stderr):
    try:
        _s.reconfigure(encoding="utf-8")
    except Exception:
        pass

BARE_PYTHON = re.compile(r"(?:^|[\s;&|(])python3?(?:\.exe)?\s")

HINTS = [
    (
        lambda err, cmd: "unexpected EOF while looking for matching" in err
        or ("SyntaxError: unterminated" in err and re.search(r"python3?(?:\.exe)?\s+(?:-c|-\s*<<)", cmd)),
        "셸이 따옴표 · heredoc 을 풀지 못했다. 같은 방식으로 다시 시도하지 않는다. 파일 내용은 Write 도구, 부분 수정은 Edit 도구로 한다. "
        "파이썬이 꼭 필요하면 스크립트를 스크래치 폴더에 Write 로 저장한 뒤 `python <파일>` 로 실행한다.",
    ),
    (
        lambda err, cmd: "UnicodeEncodeError" in err or ("UnicodeDecodeError" in err and "cp949" in err),
        "Windows 콘솔 인코딩(cp949) 문제다. 명령 앞에 `PYTHONIOENCODING=utf-8` 을 붙이거나(PowerShell 은 `$env:PYTHONIOENCODING='utf-8';`), "
        "파일은 `encoding='utf-8'` 로 연다.",
    ),
    (
        lambda err, cmd: "ModuleNotFoundError" in err and BARE_PYTHON.search(cmd) and ".venv" not in cmd,
        "가상환경이 아닌 python 으로 실행했다. 셸의 venv 활성화는 다음 명령에 이어지지 않는다. "
        "백엔드 패키지는 `backend/.venv/Scripts/python.exe`(Windows) · `backend/.venv/bin/python` 으로 직접 부른다.",
    ),
    (
        lambda err, cmd: ("PathNotFound" in err or "Cannot find path" in err) and "[" in cmd,
        "PowerShell 은 경로의 `[ ]` 를 와일드카드로 읽는다. `-LiteralPath` 를 쓴다 (예: `Set-Location -LiteralPath '...[my]\\base'`).",
    ),
]


def main() -> int:
    try:
        data = json.load(sys.stdin)
    except Exception:
        return 0
    if data.get("is_interrupt"):
        return 0
    err = str(data.get("error") or data.get("tool_response") or "")
    cmd = str((data.get("tool_input") or {}).get("command") or "")
    hints = [text for match, text in HINTS if match(err, cmd)]
    if not hints:
        return 0
    print(json.dumps({
        "hookSpecificOutput": {
            "hookEventName": "PostToolUseFailure",
            "additionalContext": "[hook] " + " / ".join(hints),
        }
    }, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

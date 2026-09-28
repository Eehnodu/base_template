"""PreToolUse(Bash | PowerShell): 과금되는 외부 생성 API 호출은 사용자 승인을 받는다.

명령 본문과, 명령이 실행하는 스크립트 파일(.py · .js · .mjs · .ts · .sh · .ps1)의 내용을 훑어
유료 생성 API(이미지 · 음악 · 영상 · 음성)를 부르는 코드가 있으면 permissionDecision "ask" 로 멈춘다.
CLAUDE.md 원칙 12("과금되는 외부 API는 허락받은 뒤에만")를 모델이 잊어도 실행 전에 한 번 막는 장치.
모델 목록 조회처럼 무료인 호출은 통과한다.
"""
import json
import re
import shlex
import sys
from pathlib import Path

for _s in (sys.stdout, sys.stderr):
    try:
        _s.reconfigure(encoding="utf-8")
    except Exception:
        pass

SCRIPT_EXT = (".py", ".js", ".mjs", ".cjs", ".ts", ".sh", ".ps1")
MAX_BYTES = 400_000

# (서비스 이름, 모두 만족해야 하는 패턴들)
PAID = [
    ("Gemini 생성(이미지 · 음악 · 영상)", [
        r"generativelanguage\.googleapis\.com|aiplatform\.googleapis\.com|google\.genai|google-genai",
        r"generateContent|generate_content|:predict\b|generate_images|generate_videos",
        r"lyria|imagen|veo-|-image\b|-image[\"'-]|flash-image|pro-image",
    ]),
    ("Stability AI", [r"api\.stability\.ai"]),
    ("ElevenLabs", [r"api\.elevenlabs\.io"]),
    ("OpenAI 이미지 · 오디오 · 영상", [r"api\.openai\.com/v1/(images|audio|videos)"]),
]


def script_texts(cmd: str) -> list[tuple[str, str]]:
    """명령에서 실행 대상 스크립트 파일을 찾아 내용을 읽는다."""
    try:
        tokens = shlex.split(cmd, posix=True)
    except ValueError:
        tokens = cmd.split()
    found = []
    for t in tokens:
        t = t.strip("\"'")
        if not t.lower().endswith(SCRIPT_EXT):
            continue
        if ".claude/hooks/" in t.replace("\\", "/"):
            continue  # 훅 자신은 패턴 문자열을 담고 있어 오인한다
        p = Path(t)
        try:
            if p.is_file() and p.stat().st_size <= MAX_BYTES:
                found.append((t, p.read_text(encoding="utf-8", errors="ignore")))
        except OSError:
            continue
    return found


def detect(text: str) -> list[str]:
    hits = []
    for name, patterns in PAID:
        if all(re.search(pat, text, re.I) for pat in patterns):
            hits.append(name)
    return hits


def main() -> int:
    try:
        data = json.load(sys.stdin)
    except Exception:
        return 0
    cmd = data.get("tool_input", {}).get("command") or ""
    if not cmd:
        return 0

    hits = detect(cmd)
    where = "명령 본문" if hits else ""
    if not hits:
        for path, text in script_texts(cmd):
            hits = detect(text)
            if hits:
                where = path
                break
    if not hits:
        return 0

    reason = (f"[hook] 과금되는 외부 API 호출 — 승인 필요: {' / '.join(dict.fromkeys(hits))} ({where}). "
              "모델 · 횟수 · 예상 금액을 사용자에게 말하고 허락받았는지 확인 (CLAUDE.md 원칙 12)")
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

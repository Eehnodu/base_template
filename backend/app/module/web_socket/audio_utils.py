import os
import tempfile
import wave

from app.core.logging import get_logger

logger = get_logger(__name__)


async def convert_pcm_to_wav(filename: str, pcm_data: bytes, sample_rate: int = 16000) -> None:
    try:
        with wave.open(filename, "wb") as wav_file:
            wav_file.setnchannels(1)      # mono
            wav_file.setsampwidth(2)      # 16-bit
            wav_file.setframerate(sample_rate)
            wav_file.writeframes(pcm_data)  # 16-bit PCM 바이트를 그대로 기록
    except Exception as e:
        logger.error(f"WAV 변환 중 오류: {e}")
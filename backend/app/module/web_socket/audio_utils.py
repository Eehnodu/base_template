# 역할: 브라우저에서 받은 PCM16 원시 바이트를 WAV 로 감싼다 (STT 입력용)
import os
import tempfile
import wave

import numpy as np


# 헤더 없는 raw PCM 은 대부분의 STT API 가 받지 못하므로 WAV 컨테이너를 씌운다
async def convert_pcm_to_wav(filename: str, pcm_data: bytes, sample_rate: int = 16000) -> None:
    try:
        pcm_array = np.frombuffer(pcm_data, dtype=np.int16)
        with wave.open(filename, "wb") as wav_file:
            wav_file.setnchannels(1)      # mono
            wav_file.setsampwidth(2)      # 16-bit
            wav_file.setframerate(sample_rate)
            wav_file.writeframes(pcm_array.tobytes())
    except Exception as e:
        print(f"WAV 변환 중 오류: {e}")
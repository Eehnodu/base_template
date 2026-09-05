# 역할: OpenAI 호출 래퍼. 캐시·상태 저장이 필요하면 주입된 RedisService 를 쓴다

import base64
import json
import os
import tempfile
from typing import Any, List, Optional
import asyncio

import websockets
from openai import AsyncOpenAI
from starlette.datastructures import UploadFile

from app.core.config.settings import settings
from app.module.infra.redis.redis_service import RedisService
from app.module.web_socket.audio_utils import convert_pcm_to_wav

# OpenAI 비동기 클라이언트. 모듈 레벨 하나를 재사용해 커넥션을 공유한다
client = AsyncOpenAI(api_key=settings.openai_api_key)

class GPTService:

    def __init__(self, redis_service: RedisService):
        self.redis_service = redis_service

    # 프로젝트별 프롬프트·스트리밍 메서드는 여기에 추가

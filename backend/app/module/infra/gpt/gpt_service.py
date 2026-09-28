# app/module/infra/gpt/gpt_service.py

from typing import Optional

from openai import AsyncOpenAI

from app.core.config.settings import settings
from app.module.infra.redis.redis_service import RedisService


class GPTService:
    """
    OpenAI 호출 래퍼. 필요한 호출 메서드를 여기에 추가한다.
    클라이언트는 import 시점이 아니라 처음 쓸 때 만든다 — 키가 없어도 앱은 뜬다.
    """

    def __init__(self, redis_service: RedisService):
        self.redis_service = redis_service
        self._client: Optional[AsyncOpenAI] = None

    @property
    def client(self) -> AsyncOpenAI:
        if not self._client:
            self._client = AsyncOpenAI(api_key=settings.openai_api_key)
        return self._client

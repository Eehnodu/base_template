# 역할: 환경변수 기반 공용 Redis 클라이언트
import os

import redis.asyncio as redis

REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", "6379"))
REDIS_DB = int(os.getenv("REDIS_DB", "0"))

# 세션 계열 키의 기본 TTL(초). 영구 저장 용도가 아니므로 항상 만료를 둔다
SESSION_TTL = int(os.getenv("SESSION_TTL", "3600"))

redis_client = redis.Redis(
    host=REDIS_HOST,
    port=REDIS_PORT,
    db=REDIS_DB,
    decode_responses=True,  # bytes 대신 str 로 받는다
)
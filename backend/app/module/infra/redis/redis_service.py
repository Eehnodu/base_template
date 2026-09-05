# 역할: Redis 접근 래퍼. 캐시·상태·락 용도로만 쓰고 DB 대용으로 쓰지 않는다
import redis.asyncio as redis
from app.core.config.settings import settings
from typing import Optional


class RedisService:
    """
    Redis 접근을 단순화하기 위한 공통 서비스 클래스
    - Redis를 DB처럼 쓰지 않고
    - 캐시 / 상태 관리 / 동시성 제어 용도로만 사용
    """

    def __init__(
        self, host: str = None, port: int = None, password: Optional[str] = None
    ):
        self._host = host or settings.redis_host
        self._port = port or settings.redis_port
        self._client: Optional[redis.Redis] = None

    # 연결은 첫 사용 시점에 만든다. 서비스만 생성되고 Redis 를 안 쓰는 요청에서 불필요한 연결을 피한다
    @property
    def client(self) -> redis.Redis:
        if not self._client:
            self._client = redis.Redis(
                host=self._host, port=self._port, decode_responses=True
            )
        return self._client

    # =====================================================
    # Key - Value (String)
    # =====================================================
    # 단일 값 + TTL이 필요한 경우 사용
    #
    # 사용 예:
    # - 인증 코드 / OTP
    # - 토큰
    # - 외부 API 응답 캐시
    # - 임시 플래그
    # =====================================================

    async def set(self, key: str, value: str, expire: int = 300):
        """
        key에 value 저장 + TTL 설정

        expire:
        - 초 단위 TTL
        - 기본값 300초 (5분)
        - 항상 TTL 을 두는 이유: 지우는 코드가 빠져도 키가 영구히 남지 않게
        """
        await self.client.set(key, value, ex=expire)

    async def get(self, key: str):
        """
        key에 저장된 값 조회
        """
        return await self.client.get(key)

    async def delete(self, key: str):
        """
        key 삭제
        """
        await self.client.delete(key)

    async def exists(self, key: str):
        """
        key 존재 여부 확인

        반환:
        - 1: 존재
        - 0: 없음
        """
        return await self.client.exists(key)

    # =====================================================
    # Hash
    # =====================================================
    # 하나의 엔티티에 속한 여러 필드를 묶어서 관리할 때 사용
    #
    # 사용 예:
    # - 유저 상태 캐시
    # - 세션 메타데이터
    # - 작업 상태(progress, status 등)
    #
    # 특징:
    # - 부분 업데이트 가능
    # - 동시성에 비교적 안전
    # =====================================================

    async def hset(self, name: str, mapping: dict):
        """
        Hash에 여러 field/value 저장

        예:
        name = "user:123"
        mapping = {"status": "active", "last_seen": "2024-01-01"}
        """
        await self.client.hset(name, mapping=mapping)

    async def hgetall(self, name: str):
        """
        Hash에 저장된 모든 field/value 조회
        """
        return await self.client.hgetall(name)

    async def hget(self, name: str, field: str):
        """
        Hash의 특정 field 값 조회
        """
        return await self.client.hget(name, field)

    # =====================================================
    # Set
    # =====================================================
    # 중복 없는 집합(상태/소속/처리 여부)을 관리할 때 사용
    #
    # 사용 예:
    # - 온라인 유저 목록
    # - 처리 중인 작업 목록
    # - feature flag 대상
    # - 이미 처리한 ID 기록 (멱등성)
    #
    # 특징:
    # - 중복 자동 제거
    # - add / remove가 안전 (여러 번 호출해도 문제 없음)
    # =====================================================

    async def sadd(self, name: str, member):
        """
        Set에 멤버 추가

        이미 존재하는 경우:
        - 중복 추가되지 않음
        """
        await self.client.sadd(name, member)

    async def srem(self, name: str, member):
        """
        Set에서 멤버 제거

        멤버가 없어도:
        - 에러 없이 그냥 통과
        - finally 블록에서 쓰기 좋음
        """
        await self.client.srem(name, member)

    async def smembers(self, name: str):
        """
        Set에 포함된 모든 멤버 조회

        주의:
        - 멤버 수가 많을 경우 사용 주의
        - 운영/디버깅/소규모 집합용
        """
        return await self.client.smembers(name)

    # =====================================================
    # Lock
    # =====================================================
    # 여러 요청/서버 환경에서
    # "동시에 하나만 실행돼야 하는 코드" 보호용
    #
    # 사용 예:
    # - 중복 실행되면 안 되는 초기화 로직
    # - cache miss 시 단일 채우기
    # =====================================================

    async def lock(self, name: str, timeout: int = 10):
        """
        Redis 기반 분산 락 획득

        주의:
        - 호출한 쪽에서 반드시 release 필요
        - try/finally 패턴 권장

        timeout:
        - 락 유지 시간 (초)
        """
        lock = await self.client.lock(name, timeout=timeout)
        await lock.acquire()
        return lock

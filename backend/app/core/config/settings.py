# 역할: .env 로딩과 local/prod 자동 판별. 나머지 코드는 settings 객체만 바라본다
import os
import socket
from pathlib import Path
from typing import List, Optional
from urllib.parse import quote_plus

from pydantic_settings import BaseSettings, SettingsConfigDict


# .env 를 그대로 옮긴 원본 값. local_/prod_ 접두사로 두 환경 값을 한 파일에 함께 둔다
class RawEnv(BaseSettings):
    # MySQL 설정
    mysql_port: int = 3306

    # LOCAL
    local_mysql_user: str
    local_mysql_password: str
    local_mysql_host: str
    local_mysql_db: str

    # PROD
    prod_mysql_user: str
    prod_mysql_password: str
    prod_mysql_host: str
    prod_mysql_db: str

    jwt_secret: str
    hash_key: str

    # API keys
    openai_api_key: Optional[str] = None

    # KAKAO
    kakao_client_id: Optional[str] = None
    kakao_client_secret: Optional[str] = None
    local_kakao_redirect_uri: Optional[str] = None
    prod_kakao_redirect_uri: Optional[str] = None

    # GOOGLE
    google_client_id: Optional[str] = None
    google_client_secret: Optional[str] = None
    local_google_redirect_uri: Optional[str] = None
    prod_google_redirect_uri: Optional[str] = None

    # REDIS
    local_redis_host: str
    local_redis_port: int
    local_redis_password: Optional[str]

    prod_redis_host: str
    prod_redis_port: int
    prod_redis_password: Optional[str]

    model_config = SettingsConfigDict(env_file=os.path.join(os.path.dirname(__file__), "..", "..", "..", ".env"), env_file_encoding="utf-8")

# env 에 맞는 접두사를 골라 RawEnv 값을 꺼내 주는 얇은 래퍼.
# 호출부는 settings.mysql_host 처럼 환경을 모르고 쓴다
class Settings:
    def __init__(self):
        self.raw = RawEnv()
        self.env = self._detect_env()
        self.BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
        self.APP_DIR = self.BASE_DIR / "app"
        self.MEDIA_ROOT = self.BASE_DIR / "media"                       

    def _detect_env(self) -> str:
        """
        실행 환경 판별

        EC2 인스턴스는 호스트명이 ip-10-0-1-23 / ec2-1-2-3-4 형태로 잡히므로
        별도 설정 없이 배포 서버를 prod 로 인식한다. APP_ENV 를 지정하면 그 값을 우선한다.
        """
        override = os.getenv("APP_ENV")
        if override in ("local", "prod"):
            return override

        hostname = socket.gethostname().lower()
        if hostname.startswith("ip-") or hostname.startswith("ec2-"):
            return "prod"
        return "local"

    # MySQL 설정 — 환경 접두사를 붙여 RawEnv 필드를 찾는다 (local_mysql_user / prod_mysql_user)
    @property
    def mysql_user(self) -> str:
        return getattr(self.raw, f"{self.env}_mysql_user")

    @property
    def mysql_password(self) -> str:
        return getattr(self.raw, f"{self.env}_mysql_password")

    @property
    def mysql_host(self) -> str:
        return getattr(self.raw, f"{self.env}_mysql_host")

    @property
    def mysql_db(self) -> str:
        return getattr(self.raw, f"{self.env}_mysql_db")

    @property
    def mysql_port(self) -> int:
        return self.raw.mysql_port

    # SQLAlchemy용 비동기 DB URL. 비밀번호에 특수문자가 있어도 URL 이 깨지지 않도록 quote_plus
    @property
    def database_url(self) -> str:
        user = quote_plus(self.mysql_user)
        password = quote_plus(self.mysql_password)
        host = self.mysql_host
        return (
            f"mysql+aiomysql://{user}:{password}"
            f"@{host}:{self.mysql_port}/{self.mysql_db}"
        )
    
    @property
    def jwt_secret(self) -> str:
        return self.raw.jwt_secret

    @property
    def hash_key(self) -> str:
        return self.raw.hash_key

    # API Keys
    @property
    def openai_api_key(self) -> Optional[str]:
        return self.raw.openai_api_key
    
    @property
    def kakao_client_id(self) -> Optional[str]:
        return self.raw.kakao_client_id

    @property
    def kakao_client_secret(self) -> Optional[str]:
        return self.raw.kakao_client_secret

    @property
    def kakao_redirect_uri(self) -> Optional[str]:
        return getattr(self.raw, f"{self.env}_kakao_redirect_uri")

    # Redis 도 DB 와 같이 환경 접두사(local_/prod_)로 값을 고른다
    @property
    def redis_host(self) -> str:
        return getattr(self.raw, f"{self.env}_redis_host")

    @property
    def redis_port(self) -> int:
        return getattr(self.raw, f"{self.env}_redis_port")

    @property
    def redis_password(self) -> Optional[str]:
        return getattr(self.raw, f"{self.env}_redis_password")

    @property
    def google_client_id(self) -> Optional[str]:
        return self.raw.google_client_id    
    
    @property
    def google_client_secret(self) -> Optional[str]:
        return self.raw.google_client_secret    
    
    @property
    def google_redirect_uri(self) -> str:
        return getattr(self.raw, f"{self.env}_google_redirect_uri")

# 전역 인스턴스
settings = Settings()
DATABASE_URL = settings.database_url

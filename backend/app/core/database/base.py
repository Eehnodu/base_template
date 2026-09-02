# 역할: 비동기 SQLAlchemy 엔진·세션 팩토리와 모든 모델이 공유하는 Base
from datetime import datetime
from typing import Optional

import pytz
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from app.core.config.settings import DATABASE_URL

# DB 에 저장하는 시각은 모두 KST 기준
KST = pytz.timezone("Asia/Seoul")

# --- DB 엔진/세션 설정 ---
# pool_pre_ping: MySQL 이 유휴 커넥션을 끊어도 죽은 커넥션을 재사용하지 않도록 사용 전 확인
engine = create_async_engine(DATABASE_URL, echo=False, pool_pre_ping=True)

# 커밋 시점은 레포지토리가 명시적으로 제어한다 (autocommit/autoflush 끔)
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    class_=AsyncSession
)

# 요청 단위 세션. Depends(get_session) 으로 주입되고 요청이 끝나면 자동으로 닫힌다
async def get_session():
    async with SessionLocal() as session:
        yield session

def parse_date(d: Optional[str]):
    if not d:
        return None
    d = d.replace(".", "-")
    return datetime.strptime(d, "%Y-%m-%d")

def now_kst():
    return datetime.now(KST)

# --- 전역 단일 Base ---
Base = declarative_base()

def register_base():
    """모든 도메인에서 같은 Base를 사용하도록 고정"""
    return Base

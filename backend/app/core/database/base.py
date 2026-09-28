# app/core/database/base.py
from datetime import datetime

import pytz
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from app.core.config.settings import DATABASE_URL

KST = pytz.timezone("Asia/Seoul")

# --- ✅ DB 엔진/세션 설정 ---
engine = create_async_engine(DATABASE_URL, echo=False, pool_pre_ping=True)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    class_=AsyncSession
)

async def get_session():
    async with SessionLocal() as session:
        yield session

def now_kst():
    return datetime.now(KST)

# --- ✅ 전역 단일 Base ---
Base = declarative_base()

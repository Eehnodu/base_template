# app/main.py
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from app.core.config.settings import settings
from app.core.middleware.register import setup_middlewares
from app.core.exception.handler import setup_exceptions
from app.core.logging import setup_logging, get_logger
from app.module import *

# 로깅 설정
setup_logging()
logger = get_logger(__name__)

# 1. Lifespan 설정: 서버 시작과 종료 시 실행될 로직
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Backend 시작")

    yield
    logger.info("Backend 종료")
    # 예: await ws_manager.close_all()


def create_app() -> FastAPI:
    app = FastAPI(lifespan=lifespan)
    
    # 1. 예외 핸들러 등록 (가장 먼저 혹은 미들웨어 직후에 등록 권장)
    setup_exceptions(app)
    
    # 2. CORS 및 보안 헤더 미들웨어 등록
    setup_middlewares(app)
    
    # 3. 라우터 등록
    setup_routers(app)
    
    return app


# FastAPI 실행 인스턴스
app = create_app()
app.mount("/media", StaticFiles(directory=settings.MEDIA_ROOT), name="media")

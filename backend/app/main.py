# 역할: FastAPI 앱 조립 진입점. 예외 핸들러 → 미들웨어 → 라우터 순으로 등록한다
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

# 서버 시작·종료 시 한 번씩 실행되는 훅. 커넥션 풀, 백그라운드 작업 정리는 yield 뒤에 둔다
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀  Backend 시작 중...")

    yield
    print("🛑  Backend 종료 중...")


def create_app() -> FastAPI:
    app = FastAPI(lifespan=lifespan)
    
    # 1. 예외 핸들러. 미들웨어 안에서 난 예외도 같은 형식으로 응답하도록 먼저 건다
    setup_exceptions(app)
    
    # 2. CORS · 보안 헤더 · 요청 ID 미들웨어
    setup_middlewares(app)
    
    # 3. 라우터 등록
    setup_routers(app)
    
    return app


# FastAPI 실행 인스턴스
app = create_app()
app.mount("/media", StaticFiles(directory=settings.MEDIA_ROOT), name="media")

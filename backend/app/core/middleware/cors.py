# 역할: CORS 설정을 FastAPI 애플리케이션에 적용하는 모듈

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config.settings import settings


# FastAPI 앱에 CORS 설정 미들웨어를 추가
# 허용 주소: local 은 localhost:3000, prod 는 .env 의 PROD_CORS_ORIGINS (쉼표 구분)
def setup_cors(app: FastAPI):
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

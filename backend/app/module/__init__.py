# 역할: 도메인 모듈 조립. 모델을 Base.metadata 에 올리고 라우터를 앱에 붙인다
from fastapi import FastAPI

# --- 라우터 import ---
from app.module.admin import admin_router
from app.module.auth import auth_router
from app.module.user import user_router
from app.module.web_socket import web_socket_router
# --- 모델 등록 ---
# import 자체가 목적. Base.metadata 에 올라가야 relationship 해석과 Alembic 자동 감지가 된다
from app.module.admin.admin import Admin
from app.module.user.user import User


def setup_routers(app: FastAPI):
    """모든 도메인 라우터를 FastAPI 인스턴스에 등록"""
    # 새 도메인 모듈: 위에 모델·라우터 import 를 추가하고 여기서 include_router 한 줄
    app.include_router(auth_router.router, prefix="/api/auth")
    app.include_router(admin_router.router, prefix="/api/admin")
    app.include_router(user_router.router, prefix="/api/user")
    app.include_router(web_socket_router.router, prefix="/api/ws")
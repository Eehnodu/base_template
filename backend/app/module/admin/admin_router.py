# 역할: 관리자 전용 엔드포인트. 새 관리자 API 는 @with_provider + @with_login("admin") 조합으로 추가
from fastapi import APIRouter

from app.core.provider.http.endpoint import with_provider
from app.core.provider.http.login import with_login
from app.core.provider.http.service import ServiceProvider

router = APIRouter()
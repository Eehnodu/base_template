# 역할: 요청 단위 DI 컨테이너. 레포지토리·서비스를 lazy 프로퍼티로 묶어 라우터에 하나로 넘긴다
from fastapi import Depends, Request

from app.core.database.base import get_session


# 모든 의존성을 None 으로 두고 실제로 접근할 때 생성한다.
# 요청마다 필요한 서비스만 만들어지고, 같은 요청 안에서는 같은 인스턴스를 공유한다
class ServiceProvider:
    def __init__(self, request: Request, db):
        self.request = request
        self.db = db
        self._redis_service = None
        self._user_repo = None
        self._admin_repo = None
        self._user_service = None
        self._auth_service = None
        self._admin_service = None
        self._gpt_service = None
        self._kakao_service = None
        self._google_service = None

    @property
    def user_repo(self):
        if not self._user_repo:
            # 함수 안에서 import: module → core → module 순환 import 를 피하기 위해
            from app.module.user.user_repository import UserRepository
            self._user_repo = UserRepository(self.db)
        return self._user_repo

    @property
    def admin_repo(self):
        if not self._admin_repo:
            from app.module.admin.admin_repository import AdminRepository
            self._admin_repo = AdminRepository(self.db)
        return self._admin_repo

    @property
    def user_service(self):
        if not self._user_service:
            from app.module.user.user_service import UserService
            self._user_service = UserService(self.user_repo)
        return self._user_service

    @property
    def admin_service(self):
        if not self._admin_service:
            from app.module.admin.admin_service import AdminService
            self._admin_service = AdminService(self.admin_repo)
        return self._admin_service

    @property
    def auth_service(self):
        if not self._auth_service:
            from app.module.auth.auth_service import AuthService
            self._auth_service = AuthService(self.user_repo, self.admin_repo)
        return self._auth_service

    @property
    def redis_service(self):
        if not self._redis_service:
            from app.module.infra.redis.redis_service import RedisService

            self._redis_service = RedisService()
        return self._redis_service

    @property
    def gpt_service(self):
        if not self._gpt_service:
            from app.module.infra.gpt.gpt_service import GPTService
            self._gpt_service = GPTService(self.redis_service)
        return self._gpt_service
    
    @property
    def google_service(self):
        if not self._google_service:
            from app.module.infra.google.google_service import GoogleService
            self._google_service = GoogleService(self.user_repo)
        return self._google_service

    @property
    def kakao_service(self):
        if not self._kakao_service:
            from app.module.infra.kakao.kakao_service import KakaoService
            self._kakao_service = KakaoService(self.user_repo)
        return self._kakao_service

    # 새 도메인을 추가할 때: __init__ 에 self._xxx = None 을 두고
    # 위와 같은 형식의 lazy 프로퍼티를 하나 더 만든다


# Depends(get_session) 으로 받은 세션을 provider 에 넣는다. 세션 수명 = 요청 수명
async def get_provider(
    request: Request,
    db=Depends(get_session),
):
    return ServiceProvider(request, db)

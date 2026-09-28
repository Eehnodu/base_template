# app/module/user/user_service.py
from app.core.utils.response import fail
from app.module.user.user_repository import UserRepository


class UserService:
    def __init__(self, user_repo: UserRepository):
        self.user_repo = user_repo

    async def get_user_by_id(self, user_id: int):
        return await self.user_repo.get_user_by_id(user_id)

    async def get_me(self, request):
        user = await self.user_repo.get_user_by_id(request.user_id)
        if not user:
            fail("사용자를 찾을 수 없습니다.", "USER_NOT_FOUND", 404)
        # 비밀번호 해시 같은 민감 필드는 빼고, datetime 은 문자열로 바꿔 반환한다
        return {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "profile_image": user.profile_image,
            "active": user.active,
            "created_at": user.created_at.isoformat() if user.created_at else None,
            "last_login_at": user.last_login_at.isoformat() if user.last_login_at else None,
        }

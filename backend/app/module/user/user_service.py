# 역할: 사용자 도메인 비즈니스 로직
from app.module.user.user_repository import UserRepository


class UserService:
    def __init__(self, user_repo: UserRepository):
        self.user_repo = user_repo

    async def get_user_by_id(self, user_id: int):
        return await self.user_repo.get_user_by_id(user_id)

    async def get_me(self, request):
        user_id = request.user_id
        return await self.user_repo.get_user_by_id(user_id)
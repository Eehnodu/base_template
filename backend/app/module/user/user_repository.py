# app/module/user/user_repository.py

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database.base import now_kst
from app.module.user.user import User


class UserRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_user_by_id(self, id: int):
        result = await self.db.execute(select(User).where(User.id == id))
        return result.scalar_one_or_none()

    async def get_user_by_email(self, email: str):
        result = await self.db.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()
    
    async def create_user(self, email, nickname, hashed_password):
        user = User(
            email=email,
            name=nickname,
            password=hashed_password,
            last_login_at=now_kst()
        )

        self.db.add(user)
        await self.db.commit()

    async def get_or_create_user(self, email: str, name: str, picture: str) -> User | None:
        result = await self.db.execute(select(User).filter(User.email == email))
        user = result.unique().scalar_one_or_none()

        if user:
            user.last_login_at=now_kst()
        else:
            user = User(
                email=email,
                name=name,
                profile_image=picture,
                created_at=now_kst(),
                last_login_at=now_kst()
            )

            self.db.add(user)
        
        await self.db.commit()
        await self.db.refresh(user)

        return user
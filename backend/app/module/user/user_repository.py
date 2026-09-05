# 역할: 사용자 DB 쿼리

import os

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

    # 소셜 로그인용 upsert. 같은 이메일이 있으면 마지막 로그인 시각만 갱신하고, 없으면 비밀번호 없이 생성
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
        # DB 가 채운 id·기본값을 다시 읽어 와야 토큰 발급에 바로 쓸 수 있다
        await self.db.refresh(user)

        return user
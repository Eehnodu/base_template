# 역할: Google OAuth 코드 교환 → 사용자 정보 조회 → 회원 upsert. 모델·라우터 없이 외부 호출만 감싼다

import httpx
from fastapi import HTTPException

from app.core.config.settings import settings
from app.core.utils.response import fail
from app.module.user.user_repository import UserRepository


class GoogleService:
    def __init__(self, user_repo: UserRepository):
        self.user_repo = user_repo

    async def google_login(self, request):
        GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
        GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"

        body = await request.json()
        code = body.get("code")

        if not code:
            raise fail("Authorization code not provided", "AUTH_CODE_NOT_PROVIDED", 400)

        # 프론트는 authorization code 만 넘긴다. client_secret 은 서버에만 있어야 하므로 토큰 교환은 여기서
        token_data = {
            "code": code,
            "client_id": settings.google_client_id,
            "client_secret": settings.google_client_secret,
            "redirect_uri": settings.google_redirect_uri,
            "grant_type": "authorization_code",
        }

        async with httpx.AsyncClient() as client:
            token_resp = await client.post(GOOGLE_TOKEN_URL, data=token_data)
            try:
                token_resp.raise_for_status()
            except httpx.HTTPStatusError as e:
                raise HTTPException(status_code=401, detail=f"google token request failed: {e.response.text}")
                
            access_token = token_resp.json().get("access_token")

            if not access_token:
                raise HTTPException(status_code=500, detail="access token missing")
            
            userinfo_resp = await client.get(
                GOOGLE_USERINFO_URL,
                headers={"Authorization": f"Bearer {access_token}"}
            )
            userinfo_resp.raise_for_status()
            userinfo = userinfo_resp.json()

            email = userinfo.get("email")
            name = userinfo.get("name")
            picture = userinfo.get("picture", "")
        
        user = await self.user_repo.get_or_create_user(email, name, picture)
        
        return user 
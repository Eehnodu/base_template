# app/module/infra/google/google_service.py

import httpx

from app.core.config.settings import settings
from app.core.utils.response import fail
from app.module.user.user_repository import UserRepository
from app.core.logging import get_logger


logger = get_logger(__name__)


class GoogleService:
    def __init__(self, user_repo: UserRepository):
        self.user_repo = user_repo

    async def google_login(self, request):
        GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
        GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"

        body = await request.json()
        code = body.get("code")

        if not code:
            fail("인증 코드가 없습니다.", "AUTH_CODE_NOT_PROVIDED", 400)

        token_data = {
            "code": code,
            "client_id": settings.google_client_id,
            "client_secret": settings.google_client_secret,
            "redirect_uri": settings.google_redirect_uri,
            "grant_type": "authorization_code",
        }

        async with httpx.AsyncClient() as client:
            try:
                token_resp = await client.post(GOOGLE_TOKEN_URL, data=token_data)
                token_resp.raise_for_status()
            except httpx.HTTPStatusError as e:
                logger.warning(f"google token request failed: {e.response.status_code} {e.response.text}")
                fail("소셜 로그인에 실패했습니다. 다시 시도해 주세요.", "OAUTH_TOKEN_FAILED", 400)

            access_token = token_resp.json().get("access_token")
            if not access_token:
                fail("소셜 로그인에 실패했습니다. 다시 시도해 주세요.", "OAUTH_TOKEN_MISSING", 400)

            try:
                userinfo_resp = await client.get(
                    GOOGLE_USERINFO_URL,
                    headers={"Authorization": f"Bearer {access_token}"},
                )
                userinfo_resp.raise_for_status()
            except httpx.HTTPStatusError as e:
                logger.warning(f"google userinfo request failed: {e.response.status_code} {e.response.text}")
                fail("소셜 로그인에 실패했습니다. 다시 시도해 주세요.", "OAUTH_USERINFO_FAILED", 400)

            userinfo = userinfo_resp.json()
            email = userinfo.get("email")
            name = userinfo.get("name")
            picture = userinfo.get("picture", "")

        user = await self.user_repo.get_or_create_user(email, name, picture)

        return user

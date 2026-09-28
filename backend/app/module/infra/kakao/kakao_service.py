# app/module/infra/kakao/kakao_service.py

import httpx

from app.core.config.settings import settings
from app.core.utils.response import fail
from app.module.user.user_repository import UserRepository
from app.core.logging import get_logger


logger = get_logger(__name__)


class KakaoService:
    def __init__(self, user_repo: UserRepository):
        self.user_repo = user_repo

    async def kakao_login(self, request):
        KAKAO_TOKEN_URI = "https://kauth.kakao.com/oauth/token"
        KAKAO_USER_INFO_URI = "https://kapi.kakao.com/v2/user/me"

        body = await request.json()
        code = body.get("code")

        if not code:
            fail("인증 코드가 없습니다.", "AUTH_CODE_NOT_PROVIDED", 400)

        token_data = {
            "code": code,
            "client_id": settings.kakao_client_id,
            "redirect_uri": settings.kakao_redirect_uri,
            "grant_type": "authorization_code",
        }

        if settings.kakao_client_secret:
            token_data["client_secret"] = settings.kakao_client_secret

        async with httpx.AsyncClient() as client:
            try:
                token_resp = await client.post(KAKAO_TOKEN_URI, data=token_data)
                token_resp.raise_for_status()
            except httpx.HTTPStatusError as e:
                logger.warning(f"kakao token request failed: {e.response.status_code} {e.response.text}")
                fail("소셜 로그인에 실패했습니다. 다시 시도해 주세요.", "OAUTH_TOKEN_FAILED", 400)

            access_token = token_resp.json().get("access_token")
            if not access_token:
                fail("소셜 로그인에 실패했습니다. 다시 시도해 주세요.", "OAUTH_TOKEN_MISSING", 400)

            try:
                userinfo_resp = await client.get(
                    KAKAO_USER_INFO_URI,
                    headers={"Authorization": f"Bearer {access_token}"},
                )
                userinfo_resp.raise_for_status()
            except httpx.HTTPStatusError as e:
                logger.warning(f"kakao userinfo request failed: {e.response.status_code} {e.response.text}")
                fail("소셜 로그인에 실패했습니다. 다시 시도해 주세요.", "OAUTH_USERINFO_FAILED", 400)

            userinfo = userinfo_resp.json()
            email = userinfo["kakao_account"]["email"]
            name = userinfo["kakao_account"]["profile"]["nickname"]
            picture = userinfo["kakao_account"]["profile"].get("profile_image_url", "")
            picture = picture.replace("http://", "https://")

        user = await self.user_repo.get_or_create_user(email, name, picture)

        return user

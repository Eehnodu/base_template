# 역할: Kakao OAuth 코드 교환 → 사용자 정보 조회 → 회원 upsert

import httpx
from fastapi import HTTPException

from app.core.config.settings import settings
from app.core.utils.response import fail
from app.module.user.user_repository import UserRepository


class KakaoService:
    def __init__(self, user_repo: UserRepository):
        self.user_repo = user_repo

    async def kakao_login(self, request):
        KAKAO_TOKEN_URI = "https://kauth.kakao.com/oauth/token"
        KAKAO_USER_INFO_URI = "https://kapi.kakao.com/v2/user/me"

        body = await request.json()
        code = body.get("code")

        if not code:
            raise fail("Authorization code not provided", "AUTH_CODE_NOT_PROVIDED", 400)
        
        token_data = {
            "code": code,
            "client_id": settings.kakao_client_id,
            "redirect_uri": settings.kakao_redirect_uri,
            "grant_type": "authorization_code",
        }

        # 카카오는 client_secret 이 선택 항목. 콘솔에서 켠 경우에만 보낸다
        if settings.kakao_client_secret:
            token_data["client_secret"] = settings.kakao_client_secret

        async with httpx.AsyncClient() as client:
            token_resp = await client.post(KAKAO_TOKEN_URI, data=token_data)
            try:
                token_resp.raise_for_status()
            except httpx.HTTPStatusError as e:
                # 카카오 오류 본문을 그대로 실어 원인(redirect_uri 불일치 등)을 바로 볼 수 있게 한다
                raise HTTPException(status_code=401, detail=f"kakao token request failed: {e.response.text}")
                
            access_token = token_resp.json().get("access_token")

            if not access_token:
                raise HTTPException(status_code=500, detail="access token missing")
            
            userinfo_resp = await client.get(
                KAKAO_USER_INFO_URI,
                headers={"Authorization": f"Bearer {access_token}"}
            )
            userinfo_resp.raise_for_status()
            userinfo = userinfo_resp.json()

            email = userinfo["kakao_account"]["email"]
            name = userinfo["kakao_account"]["profile"]["nickname"]
            picture = userinfo["kakao_account"]["profile"].get("profile_image_url", "")
            # 프로필 이미지가 http 로 오는 경우가 있어 https 로 바꿔 mixed content 를 막는다
            picture = picture.replace("http://", "https://")
            
        user = await self.user_repo.get_or_create_user(email, name, picture)
        
        return user 
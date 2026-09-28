# app/module/auth/auth_token.py

import base64
import json
import uuid
from datetime import timedelta

import jwt

from app.core.config.settings import settings
from app.core.database.base import now_kst
from app.core.utils.response import fail


class AuthToken:
    def __init__(self):
        self.jwt_secret = settings.jwt_secret
        self.hash_key = settings.hash_key
        self.algorithm = "HS256"
        self.env = settings.env
        self.samesite = "None" if self.env == "prod" else "Lax"
        # 운영 쿠키 도메인은 .env 의 PROD_COOKIE_DOMAIN
        self.domain = settings.cookie_domain
        self.secure = True if self.env == "prod" else False
    
    # --- 쿠키 접두사 생성 ---
    def _cookie_prefix(self, auth_type: str):
        return "admin_" if auth_type == "admin" else "user_"

    # --- 공통 로직 분리 ---
    def _get_user_from_cookies(self, cookies, auth_type: str):
        prefix = self._cookie_prefix(auth_type)

        access_token = cookies.get(f"{prefix}access_token")
        if not access_token:
            fail("로그인이 필요합니다.", "ACCESS_TOKEN_MISSING", 401)

        try:
            payload = jwt.decode(
                access_token,
                self.jwt_secret,
                algorithms=[self.algorithm],
            )
        except jwt.ExpiredSignatureError:
            fail("로그인이 만료되었습니다.", "ACCESS_TOKEN_EXPIRED", 401)
        except jwt.InvalidTokenError:
            fail("로그인 정보가 올바르지 않습니다.", "ACCESS_TOKEN_INVALID", 401)

        if payload.get("type") != "access":
            fail("로그인 정보가 올바르지 않습니다.", "INVALID_TOKEN_TYPE", 401)

        if payload.get("user") != auth_type:
            fail("로그인 정보가 올바르지 않습니다.", "INVALID_TOKEN_TYPE", 401)

        return int(payload["sub"]), payload["user"]

    # --- HTTP용 ---
    async def get_token_info(self, request, auth_type: str):
        """유저 아이디 토큰에서 파싱 (HTTP Request)"""
        return self._get_user_from_cookies(request.cookies, auth_type)

    # --- WebSocket용 ---
    async def get_token_info_ws(self, websocket, auth_type: str):
        """유저 아이디 토큰에서 파싱 (WebSocket)"""
        return self._get_user_from_cookies(websocket.cookies, auth_type)
    
    # --- 토큰 생성 ---
    async def create_jwt_token(self, user, response, type):
        now_kr = now_kst()
        prefix = self._cookie_prefix(type)

        access_payload = {
            "sub": str(user.id),
            "user": type,
            "type": "access",
            "exp": now_kr + timedelta(hours=1),
        }

        refresh_payload = {
            "sub": str(user.id),
            "user": type,
            "type": "refresh",
            "exp": now_kr + timedelta(hours=6),
        }

        access_token = jwt.encode(access_payload, self.jwt_secret, algorithm=self.algorithm)
        refresh_token = jwt.encode(refresh_payload, self.jwt_secret, algorithm=self.algorithm)

        session_info = {
            "auth_type": type,
            "id": user.id,
            "user_nickname": "admin" if type == "admin" else user.name,
            "created_at": user.created_at.isoformat() if user.created_at else None, 
        }

        # 공통 쿠키 설정
        encoded_info = base64.b64encode(
            json.dumps(session_info, ensure_ascii=False).encode("utf-8")
        ).decode("utf-8")

        # 프론트에서 읽어야 하므로 httponly=False
        cookie_common = {
            "secure": self.secure,
            "samesite": self.samesite,
            "path": "/",
        }
        # prod일 때만 domain 붙이기
        if self.domain:
            cookie_common["domain"] = self.domain

        response.set_cookie(
            key=f"{prefix}user_info",
            value=encoded_info,
            httponly=False,
            max_age=3600,
            **cookie_common,
        )

        response.set_cookie(
            key=f"{prefix}access_token",
            value=access_token,
            httponly=True,
            max_age=3600,
            **cookie_common,
        )

        response.set_cookie(
            key=f"{prefix}refresh_token",
            value=refresh_token,
            httponly=True,
            max_age=21600,
            **cookie_common,
        )

        response.set_cookie(
            key=f"{prefix}refresh_exp",
            value=jwt.encode({"uuid": str(uuid.uuid4())}, settings.jwt_secret, algorithm="HS256"),
            **cookie_common,
            max_age=21600,
        )

    async def verify_refresh_by_type(self, request, auth_type: str):
        """
        지정된 auth_type의 refresh_token만 검증한다.
        - auth_type: "user" | "admin"
        """
        if auth_type not in ("user", "admin"):
            fail("잘못된 인증 유형입니다.", "INVALID_AUTH_TYPE", 400)

        prefix = self._cookie_prefix(auth_type)
        refresh_token = request.cookies.get(f"{prefix}refresh_token")
        if not refresh_token:
            fail("다시 로그인해 주세요.", "REFRESH_TOKEN_MISSING", 401)

        try:
            payload = jwt.decode(
                refresh_token,
                self.jwt_secret,
                algorithms=[self.algorithm],
            )
        except jwt.ExpiredSignatureError:
            fail("로그인이 만료되었습니다. 다시 로그인해 주세요.", "REFRESH_TOKEN_EXPIRED", 401)
        except jwt.InvalidTokenError:
            fail("다시 로그인해 주세요.", "INVALID_REFRESH_TOKEN", 401)

        if payload.get("type") != "refresh":
            fail("로그인 정보가 올바르지 않습니다.", "INVALID_TOKEN_TYPE", 401)

        user_id = payload.get("sub")
        token_type = payload.get("user")

        if not user_id or token_type != auth_type:
            fail("다시 로그인해 주세요.", "INVALID_REFRESH_PAYLOAD", 401)

        return int(user_id), auth_type

    async def delete_token(self, response, auth_type: str):
        """토큰 삭제 및 로그아웃 처리"""
        prefix = self._cookie_prefix(auth_type)
        cookie_common = {
            "secure": self.secure,
            "samesite": self.samesite,
            "path": "/",
        }
        # prod일 때만 domain 붙이기
        if self.domain:
            cookie_common["domain"] = self.domain

        response.delete_cookie(f"{prefix}access_token", **cookie_common)
        response.delete_cookie(f"{prefix}refresh_token", **cookie_common)
        response.delete_cookie(f"{prefix}user_info", **cookie_common)
        response.delete_cookie(f"{prefix}refresh_exp", **cookie_common)

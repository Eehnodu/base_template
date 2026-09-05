# 역할: JWT access/refresh 발급·검증과 쿠키 설정. 토큰은 httponly 쿠키로만 오간다

import base64
import json
import uuid
from datetime import timedelta

import jwt
from fastapi import HTTPException

from app.core.config.settings import settings
from app.core.database.base import now_kst


class AuthToken:
    # 클래스 속성은 인스턴스 없이 참조하는 곳을 위한 기본값. __init__ 에서 같은 값으로 다시 설정된다
    env = getattr(settings, "env", "dev")
    samesite = "None" if env == "prod" else "Lax"
    domain = "none.net" if env == "prod" else None

    def __init__(self):
        self.jwt_secret = settings.jwt_secret
        self.hash_key = settings.hash_key
        self.algorithm = "HS256"
        self.env = getattr(settings, "env", "dev")
        # 운영은 프론트와 API 도메인이 달라 크로스사이트 쿠키가 되므로 SameSite=None + secure 가 필요하다 (HTTPS 전제).
        # 로컬은 HTTP 라 secure 를 못 켜므로 Lax 로 두어 같은 사이트 요청에 쿠키가 붙게 한다
        self.samesite = "None" if self.env == "prod" else "Lax"
        # 운영 쿠키 도메인 — 프로젝트마다 교체. None 이면 현재 호스트에만 붙는다
        self.domain = "none.net" if self.env == "prod" else None
        self.secure = True if self.env == "prod" else False
    
    # --- 쿠키 접두사 생성 ---
    # user_/admin_ 을 나눠 한 브라우저에서 사용자·관리자 세션이 공존해도 서로 덮어쓰지 않는다
    def _cookie_prefix(self, auth_type: str):
        return "admin_" if auth_type == "admin" else "user_"

    # --- 공통 로직 분리 ---
    def _get_user_from_cookies(self, cookies, auth_type: str):
        prefix = self._cookie_prefix(auth_type)

        access_token = cookies.get(f"{prefix}access_token")
        if not access_token:
            raise HTTPException(status_code=401, detail="ACCESS_TOKEN_MISSING")

        try:
            payload = jwt.decode(
                access_token,
                self.jwt_secret,
                algorithms=[self.algorithm],
            )
        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="ACCESS_TOKEN_EXPIRED")
        except jwt.InvalidTokenError:
            raise HTTPException(status_code=401, detail="ACCESS_TOKEN_INVALID")

        # refresh 토큰을 access 자리에 넣어 쓰는 것과, 다른 권한의 토큰을 섞어 쓰는 것을 막는다
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="INVALID_TOKEN_TYPE")

        if payload.get("user") != auth_type:
            raise HTTPException(status_code=401, detail="INVALID_TOKEN_TYPE")

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

        # access 1시간 / refresh 6시간. access 가 짧아야 탈취 피해가 작고,
        # 갱신은 프론트가 401 을 받으면 자동으로 하므로 사용자는 체감하지 않는다
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

        # 닉네임 등 비ASCII 값을 쿠키에 안전하게 담기 위해 JSON → base64
        encoded_info = base64.b64encode(
            json.dumps(session_info, ensure_ascii=False).encode("utf-8")
        ).decode("utf-8")

        cookie_common = {
            "secure": self.secure,
            "samesite": self.samesite,
            "path": "/",
        }
        # prod일 때만 domain 붙이기
        if self.domain:
            cookie_common["domain"] = self.domain

        # user_info 는 프론트가 화면 표시용으로 읽어야 하므로 httponly=False.
        # 토큰 두 개는 JS 에서 읽지 못하도록 httponly=True
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

        # refresh_exp: refresh 와 같은 수명의 JS 가독 쿠키. 값은 의미 없고,
        # 프론트는 존재 여부만으로 "아직 갱신 가능한 세션인지" 를 판단한다
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
            raise HTTPException(status_code=400, detail="INVALID_AUTH_TYPE")

        prefix = self._cookie_prefix(auth_type)
        refresh_token = request.cookies.get(f"{prefix}refresh_token")
        if not refresh_token:
            raise HTTPException(status_code=401, detail="REFRESH_TOKEN_MISSING")

        try:
            payload = jwt.decode(
                refresh_token,
                self.jwt_secret,
                algorithms=[self.algorithm],
            )
        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="REFRESH_TOKEN_EXPIRED")
        except jwt.InvalidTokenError:
            raise HTTPException(status_code=401, detail="INVALID_REFRESH_TOKEN")

        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="INVALID_TOKEN_TYPE")

        user_id = payload.get("sub")
        token_type = payload.get("user")

        if not user_id or token_type != auth_type:
            raise HTTPException(status_code=401, detail="INVALID_REFRESH_PAYLOAD")

        return int(user_id), auth_type

    async def delete_token(self, response, auth_type: str):
        """토큰 삭제 및 로그아웃 처리"""
        # 발급 때와 같은 domain/path 를 줘야 브라우저가 같은 쿠키로 인식해 지운다
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

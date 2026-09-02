# 역할: WebSocket 연결용 로그인 데코레이터. 핸드셰이크 쿠키의 토큰을 검증해 websocket 객체에 사용자 정보를 심는다
from functools import wraps

from fastapi import HTTPException, WebSocket

from app.module.auth.auth_token import AuthToken


def with_login_web_socket(type: str = "user"):
    """
    WebSocket용 로그인 필수 (기본: user)
    admin API에서는 with_login_web_socket("admin") 사용

    브라우저 WebSocket 은 커스텀 헤더를 붙일 수 없으므로 핸드셰이크에 실려 오는 쿠키로 인증한다
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(p, websocket: WebSocket, *args, **kwargs):
            token_util = AuthToken()
            try:
                user_id, auth_type = await token_util.get_token_info_ws(
                    websocket,
                    type,
                )
                websocket.user_id = user_id
                websocket.auth_type = auth_type
            except HTTPException as e:
                raise e
            return await func(p, websocket, *args, **kwargs)
        return wrapper
    return decorator


def without_login_web_socket(func):
    """
    로그인이 필요 없는 WebSocket 연결용 데코레이터
    """

    @wraps(func)
    async def wrapper(p, websocket: WebSocket, *args, **kwargs):
        # 비로그인 연결도 서비스에서 같은 속성을 읽을 수 있도록 guest 값을 채운다
        websocket.user_id = "guest_user"
        websocket.auth_type = "guest"

        return await func(p, websocket, *args, **kwargs)

    return wrapper

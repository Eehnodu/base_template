# 역할: @with_login / @without_login. 쿠키의 access_token 을 검증해 request 에 user_id·auth_type 을 심는다
from functools import wraps

from fastapi import HTTPException

from app.module.auth.auth_token import AuthToken


def with_login(type: str = "user"):
    """
    로그인 필수 (기본: user)
    admin API에서는 with_login("admin") 사용

    type 은 어느 접두사(user_/admin_) 쿠키를 볼지 정한다.
    사용자 토큰으로 관리자 API 에 접근하는 것을 여기서 막는다.
    @with_provider 안쪽에 두어 p 가 채워진 뒤 실행된다
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(p, *args, **kwargs):
            token_util = AuthToken()
            try:
                user_id, auth_type = await token_util.get_token_info(
                    p.request,
                    type,
                )
                p.request.user_id = user_id
                p.request.auth_type = auth_type
            except HTTPException as e:
                raise e
            return await func(p, *args, **kwargs)
        return wrapper
    return decorator

def without_login(func):
    """
    로그인이 필요 없는 API용 데코레이터
    (기본 user_id, auth_type 세팅)
    """

    @wraps(func)
    async def wrapper(p, *args, **kwargs):
        request = p.request

        # 비로그인 요청도 서비스 계층에서 request.user_id 를 안전하게 읽을 수 있도록 guest 값을 채운다
        request.user_id = getattr(request, "user_id", "guest_user")
        request.auth_type = getattr(request, "auth_type", "guest")

        return await func(p, *args, **kwargs)

    return wrapper

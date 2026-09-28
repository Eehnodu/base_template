from functools import wraps

from fastapi import HTTPException

from app.module.auth.auth_token import AuthToken


def with_login(type: str = "user"):
    """
    로그인 필수 (기본: user)
    admin API에서는 with_login("admin") 사용
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

        # 기본값 세팅 (로그인 안 한 상태)
        request.user_id = getattr(request, "user_id", "guest_user")
        request.auth_type = getattr(request, "auth_type", "guest")

        return await func(p, *args, **kwargs)

    return wrapper

# 역할: @with_provider. 라우터 함수가 ServiceProvider 하나만 받도록 Depends 주입을 감춘다
from fastapi import Depends

from app.core.provider.http.service import ServiceProvider, get_provider


def with_provider(func):
    """
    라우터에 Depends(get_provider)를 자동 주입하는 데코레이터

    FastAPI 는 wrapper 의 시그니처를 보고 의존성을 해석하므로 functools.wraps 를 쓰지 않는다.
    라우터마다 Depends 를 반복하지 않고 p.user_service 처럼 꺼내 쓰게 하는 것이 목적
    """
    async def wrapper(p: ServiceProvider = Depends(get_provider)):
        return await func(p)
    return wrapper
# 역할: WebSocket 라우터용 @with_provider_web_socket. HTTP 쪽과 같은 DI 패턴을 소켓에 적용
from fastapi import Depends, WebSocket

from app.core.provider.web_socket.service import WebSocketProvider, get_provider_web_socket


def with_provider_web_socket(func):
    """
    WebSocket 요청에 Depends(get_provider_web_socket)를 자동 주입하는 데코레이터

    websocket 인자를 wrapper 시그니처에 남겨 FastAPI 가 소켓 엔드포인트로 인식하게 한다
    """
    async def wrapper(
        websocket: WebSocket,
        p: WebSocketProvider = Depends(get_provider_web_socket),
    ):
        return await func(p, websocket)
    return wrapper

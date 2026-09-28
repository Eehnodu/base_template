from fastapi import Depends, WebSocket

from app.core.provider.web_socket.service import WebSocketProvider, get_provider_web_socket


def with_provider_web_socket(func):
    """WebSocket 요청에 Depends(get_provider_ws)를 자동 주입하는 데코레이터"""
    async def wrapper(
        websocket: WebSocket,
        p: WebSocketProvider = Depends(get_provider_web_socket),
    ):
        return await func(p, websocket)
    return wrapper

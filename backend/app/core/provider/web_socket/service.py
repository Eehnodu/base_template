from fastapi import Depends, WebSocket

from app.core.database.base import get_session


class WebSocketProvider:
    def __init__(self, websocket: WebSocket, db):
        self.websocket = websocket
        self.db = db
        self._redis_service = None
        self._gpt_service = None
        self._web_socket_service = None

    @property
    def redis_service(self):
        if not self._redis_service:
            from app.module.infra.redis.redis_service import RedisService
            self._redis_service = RedisService()
        return self._redis_service

    @property
    def gpt_service(self):
        if not self._gpt_service:
            from app.module.infra.gpt.gpt_service import GPTService
            self._gpt_service = GPTService(self.redis_service)
        return self._gpt_service

    @property
    def web_socket_service(self):
        if not self._web_socket_service:
            from app.module.web_socket.web_socket_service import web_socket_service
            self._web_socket_service = web_socket_service
        return self._web_socket_service


async def get_provider_web_socket(
    websocket: WebSocket,
    db=Depends(get_session),
):
    return WebSocketProvider(websocket, db)

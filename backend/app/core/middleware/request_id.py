# 역할: 요청마다 UUID 를 발급해 로그 컨텍스트와 X-Request-Id 응답 헤더에 싣는 ASGI 미들웨어
import uuid
from fastapi import FastAPI

from app.core.logging.context import set_request_id, get_request_id


# BaseHTTPMiddleware 대신 순수 ASGI 로 작성. WebSocket 스코프에도 ID 를 심어야 하기 때문
class RequestIdMiddleware:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] in ("http", "websocket"):
            set_request_id(str(uuid.uuid4()))

        if scope["type"] == "http":
            # 응답 헤더는 http.response.start 메시지에만 실을 수 있어 send 를 감싼다
            async def send_with_header(message):
                if message["type"] == "http.response.start":
                    headers = list(message.get("headers", []))
                    headers.append((b"x-request-id", get_request_id().encode()))
                    message = {**message, "headers": headers}
                await send(message)

            await self.app(scope, receive, send_with_header)
        else:
            await self.app(scope, receive, send)


def setup_request_id(app: FastAPI):
    app.add_middleware(RequestIdMiddleware)

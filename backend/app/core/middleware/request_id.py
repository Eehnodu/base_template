import uuid
from fastapi import FastAPI

from app.core.logging.context import set_request_id, get_request_id


class RequestIdMiddleware:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] in ("http", "websocket"):
            set_request_id(str(uuid.uuid4()))

        if scope["type"] == "http":
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

# 역할: 모든 응답에 기본 보안 헤더를 붙이는 미들웨어
from fastapi import FastAPI, Request
from starlette.middleware.base import BaseHTTPMiddleware


class Security(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)

        h = response.headers
        # MIME 스니핑 차단, iframe 삽입(클릭재킹) 차단
        h["X-Content-Type-Options"] = "nosniff"
        h["X-Frame-Options"] = "DENY"
        h["X-XSS-Protection"] = "1; mode=block"
        # HTTPS 로 한 번 접속한 브라우저는 1년간 HTTP 요청을 HTTPS 로 바꿔 보낸다 (운영 HTTPS 전제)
        h["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"

        return response


def setup_security(app: FastAPI):
    app.add_middleware(Security)

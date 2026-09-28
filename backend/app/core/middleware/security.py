from fastapi import FastAPI, Request
from starlette.middleware.base import BaseHTTPMiddleware


# 이름 축소: Security
class Security(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)

        h = response.headers
        h["X-Content-Type-Options"] = "nosniff"
        h["X-Frame-Options"] = "DENY"
        h["X-XSS-Protection"] = "1; mode=block"
        h["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"

        return response


# 함수명 축소: setup_security 또는 add_security
def setup_security(app: FastAPI):
    app.add_middleware(Security)

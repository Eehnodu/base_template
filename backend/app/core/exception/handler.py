# 역할: 전역 예외 핸들러. 어떤 예외든 BaseResponse 형태의 JSON 으로 통일해 내려준다
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from app.core.utils.response import BaseResponse
from app.core.logging import get_logger
from starlette.exceptions import HTTPException as StarletteHTTPException

logger = get_logger(__name__)


def setup_exceptions(app: FastAPI) -> None:
    """
    모든 예외 핸들러를 등록하는 함수
    """
    # 404 처럼 Starlette 가 직접 던지는 예외도 같은 형식으로 맞추기 위해 둘 다 등록.
    # fail() 이 던진 HTTPException 도 여기로 와서 detail → message, error_code → errorCode 로 옮겨진다
    @app.exception_handler(StarletteHTTPException)
    @app.exception_handler(HTTPException)
    async def http_handler(request: Request, exc: HTTPException):
        message = exc.detail if isinstance(exc.detail, str) else "HTTP Error"

        body = BaseResponse(
            success=False,
            message=message,
            data=None,
            errorCode=getattr(exc, "error_code", "HTTP_ERROR"),
        )

        return JSONResponse(
            status_code=exc.status_code,
            content=body.model_dump(),
        )

    # 예상 못 한 예외는 내부 정보를 노출하지 않도록 고정 메시지만 내려주고 상세는 로그에 남긴다
    @app.exception_handler(Exception)
    async def unhandled_handler(request: Request, exc: Exception):
        logger.error(f"Unhandled exception: {exc}")
        body = BaseResponse(
            success=False,
            message="Internal Server Error",
            data=None,
            errorCode="INTERNAL_ERROR",
        )

        return JSONResponse(
            status_code=500,
            content=body.model_dump(),
        )

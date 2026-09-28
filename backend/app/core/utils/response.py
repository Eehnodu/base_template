from typing import Any, Optional

from fastapi import HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel


class BaseResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Any] = None
    errorCode: Optional[str] = None


def success(
    data: Any = None,
    message: str = "ok",
    status_code: int = 200,
):
    body = BaseResponse(
        success=True,
        message=message,
        data=data,
        errorCode=None,
    )
    return JSONResponse(
        status_code=status_code,
        content=body.model_dump(),
    )


def fail(
    message: str,
    error_code: Optional[str] = None,
    status_code: int = 400,
):
    """
    어디서든(서비스/라우터) 호출 가능한 공통 실패 헬퍼.
    실제 응답은 exception handler가 BaseResponse로 만들어줌.
    """
    exc = HTTPException(
        status_code=status_code,
        detail=message,
    )
    if error_code is not None:
        setattr(exc, "error_code", error_code)
    raise exc

# 역할: 응답 포맷 통일. 성공은 success(), 실패는 fail() 로 예외를 던져 전역 핸들러가 같은 형식으로 만든다
from typing import Any, Optional

from fastapi import HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel


# 프론트 useAPI 의 BaseResponse<T> 와 필드가 1:1 로 맞는다. errorCode 는 프론트 분기용
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
    # HTTPException 에는 error_code 필드가 없어 동적으로 붙이고, 핸들러가 getattr 로 꺼낸다
    setattr(exc, "error_code", error_code)
    raise exc

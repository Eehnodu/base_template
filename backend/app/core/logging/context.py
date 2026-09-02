# 역할: 요청 ID 를 담는 ContextVar. 비동기 요청이 섞여도 각 요청의 값이 분리된다
from contextvars import ContextVar

request_id_var: ContextVar[str] = ContextVar("request_id", default="-")


def set_request_id(request_id: str) -> None:
    request_id_var.set(request_id)


def get_request_id() -> str:
    return request_id_var.get()

# 역할: 루트 로거 설정. 모든 로그 라인에 요청 ID 를 붙여 한 요청의 흐름을 추적할 수 있게 한다
import logging

from app.core.logging.context import get_request_id

LOG_FORMAT = "[%(asctime)s] [%(levelname)s] [req:%(request_id)s] [%(name)s] %(message)s"


# 포매터가 %(request_id)s 를 쓸 수 있도록 ContextVar 값을 레코드에 주입
class RequestIdFilter(logging.Filter):
    def filter(self, record):
        record.request_id = get_request_id()
        return True


def setup_logging() -> None:
    formatter = logging.Formatter(LOG_FORMAT)

    handler = logging.StreamHandler()
    handler.setFormatter(formatter)
    handler.addFilter(RequestIdFilter())

    root_logger = logging.getLogger()
    root_logger.setLevel(logging.INFO)
    root_logger.handlers.clear()
    root_logger.addHandler(handler)

    # uvicorn 이 따로 붙인 핸들러를 걷어내고 루트로 전파시켜 포맷을 하나로 통일
    for logger_name in ("uvicorn", "uvicorn.error", "uvicorn.access"):
        logger = logging.getLogger(logger_name)
        logger.handlers.clear()
        logger.propagate = True

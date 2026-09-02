# 역할: FastAPI 앱에 모든 공통 미들웨어(CORS, 보안 등)를 일괄 등록

from fastapi import FastAPI

from .cors import setup_cors
from .security import setup_security
from .request_id import setup_request_id


# 새 미들웨어는 여기에 추가한다.
# add_middleware 는 나중에 등록한 것이 바깥을 감싸므로 request_id 가 가장 먼저 실행되어
# CORS·보안 헤더 처리 로그에도 요청 ID 가 붙는다
def setup_middlewares(app: FastAPI):
    setup_cors(app)
    setup_security(app)
    setup_request_id(app)

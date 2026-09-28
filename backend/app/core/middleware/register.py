# 역할: FastAPI 앱에 모든 공통 미들웨어(CORS, 보안 등)를 일괄 등록

from fastapi import FastAPI

from .cors import setup_cors
from .security import setup_security
from .request_id import setup_request_id


# CORS와 보안 헤더 미들웨어를 FastAPI 앱에 등록
def setup_middlewares(app: FastAPI):
    setup_cors(app)
    setup_security(app)
    setup_request_id(app)

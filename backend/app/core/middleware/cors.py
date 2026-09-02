# 역할: CORS 설정을 FastAPI 애플리케이션에 적용하는 모듈

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


# FastAPI 앱에 CORS 설정 미들웨어를 추가
def setup_cors(app: FastAPI):
    # 로컬 개발 주소. 운영 도메인은 프로젝트마다 여기에 추가.
    # 쿠키 인증(allow_credentials)을 쓰므로 와일드카드 "*" 는 쓸 수 없다
    origins = ["http://localhost:3000", "http://127.0.0.1:3000"]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

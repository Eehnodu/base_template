# 역할: 모듈별 로거 획득 헬퍼
import logging


def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(name)

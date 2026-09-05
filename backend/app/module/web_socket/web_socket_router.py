# 역할: WebSocket 엔드포인트. 인증이 필요하면 without_login_web_socket 을 with_login_web_socket() 으로 바꾼다
from fastapi import APIRouter, WebSocket

from app.core.provider.web_socket.endpoint import with_provider_web_socket
from app.core.provider.web_socket.login import without_login_web_socket
from app.core.provider.web_socket.service import WebSocketProvider

router = APIRouter()

@router.websocket("/")
@with_provider_web_socket
@without_login_web_socket
async def stt_ws(p: WebSocketProvider, websocket: WebSocket):
    await p.web_socket_service.init_state(websocket)

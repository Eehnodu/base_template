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

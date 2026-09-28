import json
from fastapi import WebSocket
from typing import Dict, Set, Optional

from app.core.logging.logger import get_logger

logger = get_logger(__name__)


class ConnectionManager:
    def __init__(self):
        # 모든 활성 웹소켓 연결을 저장 (디버깅/전체 관리용)
        self.active_connections: Set[WebSocket] = set()

        # 방 단위 관리: { room_id: {websocket1, websocket2, ...} }
        self.rooms: Dict[str, Set[WebSocket]] = {}

        # 유저 정보 매핑 (필요 시): { websocket: {"user_id": "abc", "type": "user"} }
        self.user_registry: Dict[WebSocket, dict] = {}

        logger.info("✅ ConnectionManager 인스턴스가 메모리에 생성되었습니다.")

    async def connect(
        self,
        websocket: WebSocket,
        room_id: Optional[str] = None,
        user_info: Optional[dict] = None,
    ):
        """
        웹소켓 연결을 수락하고 관리 목록에 추가합니다.
        """
        await websocket.accept()
        self.active_connections.add(websocket)

        # 방 ID가 제공된 경우 해당 방에 배정
        if room_id:
            if room_id not in self.rooms:
                self.rooms[room_id] = set()
            self.rooms[room_id].add(websocket)

        # 유저 정보가 제공된 경우 레지스트리에 등록 (로그인 정보 등)
        if user_info:
            self.user_registry[websocket] = user_info

        logger.info(
            f"🚀 New connection. Total: {len(self.active_connections)} | Room [{room_id}] member: {len(self.rooms.get(room_id, [])) if room_id else 0}"
        )

    def disconnect(self, websocket: WebSocket, room_id: Optional[str] = None):
        """
        연결이 종료된 소켓을 관리 목록에서 제거합니다.
        """
        # 1. 전체 목록에서 제거
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

        # 2. 방 목록에서 제거
        if room_id and room_id in self.rooms:
            self.rooms[room_id].discard(websocket)
            # 방에 아무도 없으면 방 정보 삭제 (메모리 최적화)
            if not self.rooms[room_id]:
                del self.rooms[room_id]

        # 3. 유저 레지스트리 제거
        if websocket in self.user_registry:
            del self.user_registry[websocket]

        logger.info(f"🔌 Connection closed. Active total: {len(self.active_connections)}")

    async def send_personal_message(self, message: dict, websocket: WebSocket):
        """특정 개인에게 메시지 전송 (JSON)"""
        await websocket.send_text(json.dumps(message, ensure_ascii=False))

    async def broadcast_to_room(
        self, room_id: str, message: dict, exclude: Optional[WebSocket] = None
    ):
        """
        특정 방에 있는 모든 사람에게 메시지 전송 (보낸 사람 제외 가능)
        """
        if room_id in self.rooms:
            msg_str = json.dumps(message, ensure_ascii=False)
            for connection in self.rooms[room_id]:
                if connection != exclude:
                    await connection.send_text(msg_str)

    async def broadcast_all(self, message: dict):
        """서버에 접속한 모든 유저에게 공지사항 등을 전송"""
        msg_str = json.dumps(message, ensure_ascii=False)
        for connection in self.active_connections:
            await connection.send_text(msg_str)


# 싱글톤 인스턴스 생성
web_socket_manager = ConnectionManager()

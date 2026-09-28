from __future__ import annotations
import json
from fastapi import WebSocket, WebSocketDisconnect
from app.module.web_socket.manager import web_socket_manager
from app.core.logging.logger import get_logger

logger = get_logger(__name__)


class WebSocketService:
    def __init__(self):
        self.manager = web_socket_manager

    async def init_state(self, websocket: WebSocket):
        # 1. 프론트엔드(Test.tsx)에서 보낸 room_id 추출
        room_id = websocket.query_params.get("room_id", "lobby")

        # 2. with_login_ws 데코레이터에서 주입된 유저 정보 가져오기
        user_id = getattr(websocket, "user_id", "guest")
        auth_type = getattr(websocket, "auth_type", "client")

        # 3. 매니저를 통해 연결 수락 및 방 등록
        user_info = {"user_id": user_id, "role": auth_type}
        await self.manager.connect(websocket, room_id=room_id, user_info=user_info)

        try:
            # 4. 메시지 루프: 연결을 유지하고 데이터를 주고받음
            while True:
                # 클라이언트가 보낸 텍스트 메시지 수신
                data = await websocket.receive_text()

                # [테스트 로직]
                # 내가 속한 방 전체(관리자 포함 참여자들)에게 메시지 브로드캐스트
                broadcast_payload = {
                    "type": "chat",
                    "sender": user_id,
                    "message": data,
                    "room_id": room_id,
                }

                logger.info(f"broadcast_payload {broadcast_payload}")

                await self.manager.broadcast_to_room(
                    room_id=room_id, message=broadcast_payload
                )

                # await self.manager.broadcast_all(broadcast_payload)

        except WebSocketDisconnect:
            # 1005, 1000 등 정상적인 연결 종료는 여기서 처리
            logger.info(f"ℹ️ [WS] User {user_id} left Room: {room_id}")

        except Exception as e:
            # 진짜 예상치 못한 에러만 여기서 처리
            logger.error(f"⚠️ [WS Error] Info: {e}")

        finally:
            # 5. 연결 종료 시 매니저 목록에서 제거
            self.manager.disconnect(websocket, room_id=room_id)


web_socket_service = WebSocketService()

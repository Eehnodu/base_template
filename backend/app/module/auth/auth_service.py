# app/module/auth/auth_service.py

from passlib.context import CryptContext

from app.core.utils.response import fail
from app.module.admin.admin_repository import AdminRepository
from app.module.auth.auth_token import AuthToken
from app.module.user.user_repository import UserRepository

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

class AuthService:
    def __init__(self, user_repo: UserRepository, admin_repo: AdminRepository):
        self.user_repo = user_repo
        self.admin_repo = admin_repo
        self.token_util = AuthToken()

    # -- 회원가입
    async def signup(self, request):
        body = await request.json()
        email = body.get("email")
        password = body.get("password")
        nickname = body.get("nickname")
        
        original = await self.user_repo.get_user_by_email(email)
        if original:
            fail("이미 가입된 이메일입니다.", "USER_ALREADY_EXISTS", 409)
        else:
            hashed_password = hash_password(password)
            await self.user_repo.create_user(email, nickname, hashed_password)

    # -- 일반 로그인
    async def login(self, request):
        body = await request.json()
        email = body.get("email")
        password = body.get("password")
        auth_type = body.get("type")
        
        if auth_type == "user":
            user_obj = await self.user_repo.get_user_by_email(email)
        elif auth_type == "admin":
            user_obj = await self.admin_repo.get_admin_by_email(email)
        else:
            fail("잘못된 로그인 유형입니다.", "INVALID_TYPE", 400)
        # OAuth 로 가입한 사용자는 password 가 없다 — 비밀번호 로그인 불가
        if not user_obj or not user_obj.password or not verify_password(password, user_obj.password):
            # 사용자 없음 · 비밀번호 틀림을 구분하지 않는다 (가입 여부 노출 방지).
            # 401 은 쓰지 않는다 — 프론트가 401 을 받으면 세션 갱신부터 시도한다
            fail("이메일 또는 비밀번호가 올바르지 않습니다.", "INVALID_CREDENTIALS", 400)

        return user_obj, auth_type



    

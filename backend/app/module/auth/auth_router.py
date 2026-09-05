# 역할: 로그인·로그아웃·토큰 갱신·소셜 로그인 엔드포인트

from fastapi import APIRouter, HTTPException

from app.core.provider.http.endpoint import with_provider
from app.core.provider.http.login import with_login
from app.core.provider.http.service import ServiceProvider
from app.core.utils.response import success

router = APIRouter()

@router.post("/login")
@with_provider
async def login(p: ServiceProvider):
    user, auth_type = await p.auth_service.login(p.request)
    # 토큰은 응답 본문이 아니라 httponly 쿠키에 싣는다. success() 로 응답을 먼저 만들고 쿠키를 얹는 순서
    response = success(message="user login successful")
    await p.auth_service.token_util.create_jwt_token(user, response, auth_type)
    return response

# 로그아웃도 로그인 상태를 요구한다. 어느 접두사(user_/admin_) 쿠키를 지울지 auth_type 으로 정하기 위해
@router.post("/logout")
@with_provider
@with_login()
async def logout(p:ServiceProvider):
    auth_type = p.request.auth_type
    response = success(message="user logout successful")
    await p.auth_service.token_util.delete_token(response, auth_type)
    return response

@router.post("/logout_admin")
@with_provider
@with_login("admin")
async def logout_admin(p: ServiceProvider):
    auth_type = p.request.auth_type
    response = success(message="admin logout successful")
    await p.auth_service.token_util.delete_token(response, auth_type)
    return response

# access 만료(401) 시 프론트 useAPI 가 자동 호출한다.
# refresh 검증 → DB 재조회(탈퇴·비활성 반영) → access/refresh 모두 재발급.
# user/admin 은 쿠키 접두사와 조회 테이블이 달라 엔드포인트를 나눈다
@router.post("/refresh_token")
@with_provider
async def refresh_token(p: ServiceProvider):
    id, _ = await p.auth_service.token_util.verify_refresh_by_type(p.request, "user")
    user = await p.user_service.get_user_by_id(id)
    if not user:
        raise HTTPException(status_code=404, detail="user not found")

    response = success(message="user login successful")
    await p.auth_service.token_util.create_jwt_token(user, response, "user")
    return response

@router.post("/refresh_token_admin")
@with_provider
async def refresh_token_admin(p: ServiceProvider):
    id, _ = await p.auth_service.token_util.verify_refresh_by_type(p.request, "admin")
    admin = await p.admin_service.get_admin_by_id(id)
    if not admin:
        raise HTTPException(status_code=404, detail="admin not found")
    response = success(message="admin login successful")
    await p.auth_service.token_util.create_jwt_token(admin, response, "admin")
    return response

# 소셜 로그인: 프론트가 받은 authorization code 를 넘기면 서버가 토큰 교환과 회원 upsert 까지 처리
@router.post("/google")
@with_provider
async def google_login(p: ServiceProvider):
    user = await p.google_service.google_login(p.request)
    response = success(message="user login successful")
    await p.auth_service.token_util.create_jwt_token(user, response, "user")
    return response

@router.post("/kakao")
@with_provider
async def kakao_login(p: ServiceProvider):
    user = await p.kakao_service.kakao_login(p.request)
    response = success(message="user login successful")
    await p.auth_service.token_util.create_jwt_token(user, response, "user")
    return response

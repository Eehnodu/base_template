from fastapi import APIRouter

from app.core.provider.http.endpoint import with_provider
from app.core.provider.http.login import with_login
from app.core.provider.http.service import ServiceProvider
from app.core.utils.response import success

router = APIRouter()

@router.get("/me")
@with_provider
@with_login()
async def get_me(p: ServiceProvider):
    return success(await p.user_service.get_me(p.request))

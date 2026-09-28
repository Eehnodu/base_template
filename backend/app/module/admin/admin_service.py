from app.module.admin.admin import Admin
from app.module.admin.admin_repository import AdminRepository


class AdminService:
    def __init__(self, admin_repo: AdminRepository):
        self.admin_repo = admin_repo

    async def get_admin_by_id(self, id: int) -> Admin:
        return await self.admin_repo.get_admin_by_id(id)
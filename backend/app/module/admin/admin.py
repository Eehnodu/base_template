# app/module/admin/admin.py
from sqlalchemy import Column, DateTime, Integer, String

from app.core.database.base import Base, now_kst


class Admin(Base):
    __tablename__ = "tb_admins"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    email = Column(String(100), unique=True, nullable=False)
    password = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=now_kst)
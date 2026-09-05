import asyncio
from logging.config import fileConfig

from sqlalchemy import pool, text
from sqlalchemy.ext.asyncio import create_async_engine

from alembic import context
from alembic.operations import ops as alembic_ops
from app.core.config.settings import DATABASE_URL
from app.core.database.base import Base
import app.module  # noqa: F401 — module/__init__.py 실행으로 모든 모델이 Base.metadata에 등록됨

config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata

def _inject_fk_drops(migration_context, revision, directives):
    """autogenerate 후처리 — FK가 물고 있는 인덱스/컬럼을 지우는 리비전에
    FK drop을 먼저 끼워 넣는다.

    MySQL은 FK가 쓰는 인덱스를 지울 수 없고(errno 1553, FOREIGN_KEY_CHECKS=0으로도 불가),
    alembic은 MySQL의 자동 생성 FK 이름(tb_xxx_ibfk_N)을 몰라 drop_constraint를 안 만든다.
    그래서 실제 DB에서 FK 이름·컬럼을 조회해 필요한 drop_constraint를 리비전 맨 앞에 넣는다.
    """
    if not directives or directives[0].upgrade_ops is None:
        return
    conn = migration_context.connection
    if conn is None:  # offline 모드
        return

    # 테이블별 FK 목록: {table: [(fk_name, [col, ...]), ...]}
    fk_rows = conn.execute(text("""
        SELECT TABLE_NAME, CONSTRAINT_NAME,
               GROUP_CONCAT(COLUMN_NAME ORDER BY ORDINAL_POSITION) AS cols
        FROM information_schema.KEY_COLUMN_USAGE
        WHERE TABLE_SCHEMA = DATABASE() AND REFERENCED_TABLE_NAME IS NOT NULL
        GROUP BY TABLE_NAME, CONSTRAINT_NAME
    """)).all()
    fks_by_table: dict[str, list[tuple[str, list[str]]]] = {}
    for table, name, cols in fk_rows:
        fks_by_table.setdefault(table, []).append((name, cols.split(",")))

    # 테이블별 인덱스 컬럼: {table: {index_name: [col, ...]}}
    idx_rows = conn.execute(text("""
        SELECT TABLE_NAME, INDEX_NAME,
               GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) AS cols
        FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
        GROUP BY TABLE_NAME, INDEX_NAME
    """)).all()
    idx_by_table: dict[str, dict[str, list[str]]] = {}
    for table, name, cols in idx_rows:
        idx_by_table.setdefault(table, {})[name] = cols.split(",")

    def walk(container):
        """중첩된 ops(ModifyTableOps 등)를 평탄하게 순회"""
        for op in container.ops:
            if hasattr(op, "ops"):
                yield from walk(op)
            else:
                yield op

    upgrade_ops = directives[0].upgrade_ops

    # 이 리비전이 이미 지우는 FK는 중복 주입하지 않는다
    already = {
        (op.table_name, op.constraint_name)
        for op in walk(upgrade_ops)
        if isinstance(op, alembic_ops.DropConstraintOp)
    }

    to_drop: list[tuple[str, str]] = []  # (table, fk_name)

    for op in walk(upgrade_ops):
        if isinstance(op, alembic_ops.DropIndexOp):
            idx_cols = idx_by_table.get(op.table_name, {}).get(op.index_name)
            if not idx_cols:
                continue
            # FK 컬럼이 이 인덱스의 선두 컬럼과 일치하면 그 FK가 인덱스를 물고 있다
            for fk_name, fk_cols in fks_by_table.get(op.table_name, []):
                if idx_cols[: len(fk_cols)] == fk_cols:
                    to_drop.append((op.table_name, fk_name))
        elif isinstance(op, alembic_ops.DropColumnOp):
            for fk_name, fk_cols in fks_by_table.get(op.table_name, []):
                if op.column_name in fk_cols:
                    to_drop.append((op.table_name, fk_name))

    injected = []
    for table, fk_name in to_drop:
        if (table, fk_name) in already:
            continue
        already.add((table, fk_name))
        injected.append(
            alembic_ops.DropConstraintOp(fk_name, table, type_="foreignkey")
        )

    if injected:
        upgrade_ops.ops[:0] = injected  # FK drop을 맨 앞에


def do_run_migrations(connection):
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        compare_type=True,
        compare_server_default=True,
        process_revision_directives=_inject_fk_drops,
    )
    # FK가 걸린 테이블/컬럼을 지우거나 바꿀 때 참조 제약에 막히지 않게
    # 마이그레이션 동안만 검사를 끈다 (이 세션 한정)
    connection.execute(text("SET FOREIGN_KEY_CHECKS=0"))
    try:
        with context.begin_transaction():
            context.run_migrations()
    finally:
        connection.execute(text("SET FOREIGN_KEY_CHECKS=1"))


def run_migrations_offline():
    context.configure(
        url=DATABASE_URL,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
        compare_server_default=True,
    )
    with context.begin_transaction():
        context.run_migrations()


async def run_migrations_online():
    connectable = create_async_engine(DATABASE_URL, poolclass=pool.NullPool)
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)


if context.is_offline_mode():
    run_migrations_offline()
else:
    asyncio.run(run_migrations_online())

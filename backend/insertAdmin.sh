#!/bin/bash
set -e

# mysql 클라이언트가 PATH에 없으면 기본 설치 경로 추가
if ! command -v mysql &> /dev/null; then
  export PATH="$PATH:/c/Program Files/MySQL/MySQL Server 8.0/bin"
fi

# MySQL 관련 변수만 로드
while IFS='=' read -r key value; do
  value="${value%$'\r'}"   # CRLF 줄바꿈 대응
  case "$key" in
    local_mysql_*)
      export "$key=$value"
      ;;
  esac
done < .env

mysql \
  -h "$local_mysql_host" \
  -u "$local_mysql_user" \
  -p"$local_mysql_password" \
  "$local_mysql_db" <<'EOF'
INSERT INTO tb_admins (id, email, password, created_at)
SELECT 1, '1',
       '$argon2id$v=19$m=65536,t=3,p=4$HGMMIURIaU1J6T0nJMTYuw$1dbpr6QsMQcpquaD+Ewd/AsLrtxgYBvlKMOK4R+f8Nc',
       '2025-11-03 09:12:59'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM tb_admins WHERE id = 1
);
EOF

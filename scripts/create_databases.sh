#!/usr/bin/env bash
set -euo pipefail

# Small helper to create kushvjkc_prod and kushvjkc_dev using the system mysql/mariadb client.
# If no client is available, prints SQL for manual use (suitable for cPanel SQL execution).

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SQL_FILE="$SCRIPT_DIR/create_databases.sql"

echo "Kusher Space - Create Databases helper"

if [ ! -f "$SQL_FILE" ]; then
  echo "SQL file not found: $SQL_FILE"
  exit 1
fi

if command -v mariadb >/dev/null 2>&1; then
  SQL_CMD="mariadb"
elif command -v mysql >/dev/null 2>&1; then
  SQL_CMD="mysql"
else
  echo "No mariadb/mysql client found in PATH. Please run the following SQL in your hosting control panel or on the database server:" 
  echo "----- BEGIN SQL -----"
  sed -n '1,200p' "$SQL_FILE"
  echo "-----  END SQL  -----"
  exit 0
fi

echo "Using client: $SQL_CMD"

read -p "Enter DB admin user (has privileges to create DBs) [root]: " DB_ADMIN_USER
DB_ADMIN_USER=${DB_ADMIN_USER:-root}
read -s -p "Enter password for $DB_ADMIN_USER (press ENTER to use blank): " DB_ADMIN_PASS
echo ""

if [ -z "$DB_ADMIN_PASS" ]; then
  "$SQL_CMD" -u"$DB_ADMIN_USER" < "$SQL_FILE"
else
  # pass password via -p without space
  "$SQL_CMD" -u"$DB_ADMIN_USER" -p"$DB_ADMIN_PASS" < "$SQL_FILE"
fi

echo "Databases creation script executed. If there were no errors, databases and user should be created/granted."

#!/data/data/com.termux/files/usr/bin/bash

# WatrBX first-time setup for Termux/Linux.
# Run from the WatrBX project directory or pass the project directory as $1.

if [ -z "${BASH_VERSION:-}" ]; then
    exec bash "$0" "$@"
fi

set -euo pipefail

RESET='\033[0m'; BOLD='\033[1m'; CYAN='\033[36m'; GREEN='\033[32m'; YELLOW='\033[33m'; RED='\033[31m'
info(){ printf "${CYAN}==>${RESET} %s\n" "$*"; }
ok(){ printf "${GREEN}[OK]${RESET} %s\n" "$*"; }
warn(){ printf "${YELLOW}[!]${RESET} %s\n" "$*"; }
die(){ printf "${RED}[ERROR]${RESET} %s\n" "$*" >&2; exit 1; }

# Escape a value for use inside a single-quoted SQL string.
sql_quote(){
    local value="$1"
    value=${value//\\/\\\\}
    value=${value//\'/\'\'}
    printf '%s' "$value"
}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="${1:-$PWD}"
[[ -d "$PROJECT_DIR" ]] || die "Project directory does not exist: $PROJECT_DIR"
PROJECT_DIR="$(cd "$PROJECT_DIR" && pwd)"

printf "\n${BOLD}${CYAN}WatrBX Recontinued First-Time Setup${RESET}\n"
printf "This wizard configures your server easily. If you know what you're doing, you can skip this by pressing CTRL+C, but you'll have to configure everything manually.\n\n"

[[ -f "$PROJECT_DIR/structure.sql" ]] || die "structure.sql was not found in $PROJECT_DIR"
[[ -f "$PROJECT_DIR/.env.example" ]] || die ".env.example was not found in $PROJECT_DIR"

command -v php >/dev/null 2>&1 || die "PHP is not installed. Install it with: sudo apt install php"
command -v openssl >/dev/null 2>&1 || die "OpenSSL is not installed. Install it with: sudo apt install openssl openssl-tools"
DBCLI=""
if command -v mariadb >/dev/null 2>&1; then
    DBCLI="mariadb"
elif command -v mysql >/dev/null 2>&1; then
    DBCLI="mysql"
else
    die "MariaDB client is not installed. Install it with: pkg install mariadb"
fi
ok "PHP: $(php -r 'echo PHP_VERSION;')"
ok "OpenSSL: $(openssl version | head -1)"
ok "Database client: $($DBCLI --version | head -1)"

cd "$PROJECT_DIR"
mkdir -p "$PROJECT_DIR/storage/logs"
DB_LOG="$PROJECT_DIR/storage/logs/watrbx-mysqld.log"
DB_TEST_LOG="$PROJECT_DIR/storage/logs/watrbx-db-test.log"

printf "\n${BOLD}1. Installation${RESET}\n"
read -r -p "Installation name [watrbx]: " INSTALL_NAME
INSTALL_NAME="${INSTALL_NAME:-watrbx}"
read -r -p "Base URL [http://localhost:8080]: " BASE_URL
BASE_URL="${BASE_URL:-http://localhost:8080}"

printf "\n${BOLD}2. Database${RESET}\n"
read -r -p "Database host [127.0.0.1]: " DB_HOST
DB_HOST="${DB_HOST:-127.0.0.1}"
read -r -p "Database port [3306]: " DB_PORT
DB_PORT="${DB_PORT:-3306}"
read -r -p "Database name [watrbx2015]: " DB_NAME
DB_NAME="${DB_NAME:-watrbx2015}"
[[ "$DB_NAME" =~ ^[a-zA-Z0-9_]+$ ]] || die "Invalid database name. Use only letters, numbers, and underscores."
read -r -p "Database user [root]: " DB_USER
DB_USER="${DB_USER:-root}"
read -r -s -p "Database password [empty]: " DB_PASS
printf "\n"

printf "\n${BOLD}2.5 Web RCCService Configuration${RESET}\n"
printf "${BOLD}${CYAN} (This part configures the RCCService instance port and IP for thumbnails, avatar renderers, etc.)${RESET}\n"
read -r -p "RCCService IP [127.0.0.1]: " RCC_IP
RCC_IP="${RCC_IP:-127.0.0.1}"
read -r -p "RCCService Port [64989]: " RCC_PORT
RCC_PORT="${RCC_PORT:-64989}"
printf "\n"

# Test the configured connection first. If it is unavailable, offer to start the local MariaDB server.
DB_SOCKET="${PREFIX:-$HOME}/var/run/mysqld.sock"
DB_DATADIR="${PREFIX:-$HOME}/var/lib/mysql"

# Connect using the configured TCP connection. If the local MariaDB installation
# uses socket authentication for root, fall back to the local socket.
db_test(){
    if [[ -n "$DB_PASS" ]]; then
        "$DBCLI" -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" -e 'SELECT 1' >/dev/null 2>&1
    else
        "$DBCLI" -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -e 'SELECT 1' >/dev/null 2>&1
    fi
}

db_socket_test(){
    [[ -S "$DB_SOCKET" ]] || return 1
    if [[ -n "$DB_PASS" ]]; then
        "$DBCLI" --socket="$DB_SOCKET" -u "$DB_USER" -p"$DB_PASS" -e 'SELECT 1' >/dev/null 2>&1
    else
        "$DBCLI" --socket="$DB_SOCKET" -u "$DB_USER" -e 'SELECT 1' >/dev/null 2>&1
    fi
}

db_exec(){
    if [[ -n "$DB_PASS" ]]; then
        "$DBCLI" -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" "$@"
    else
        "$DBCLI" -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" "$@"
    fi
}

db_socket_exec(){
    if [[ -n "$DB_PASS" ]]; then
        "$DBCLI" --socket="$DB_SOCKET" -u "$DB_USER" -p"$DB_PASS" "$@"
    else
        "$DBCLI" --socket="$DB_SOCKET" -u "$DB_USER" "$@"
    fi
}

if ! db_test; then
    # A Termux MariaDB installation may already be running with socket-only
    # authentication for root. Detect that before attempting to start another
    # mariadbd instance.
    EXISTING_SOCKET=""
    if [[ -n "$DB_PASS" ]]; then
        EXISTING_SOCKET="$($DBCLI -u "$DB_USER" -p"$DB_PASS" -N -s -e 'SELECT @@socket' 2>/dev/null || true)"
    else
        EXISTING_SOCKET="$($DBCLI -u "$DB_USER" -N -s -e 'SELECT @@socket' 2>/dev/null || true)"
    fi

    if [[ -n "$EXISTING_SOCKET" && -S "$EXISTING_SOCKET" ]]; then
        DB_SOCKET="$EXISTING_SOCKET"
        DB_READY=2
        warn "MariaDB is already running through socket $DB_SOCKET."
    else
        DB_READY=0
    fi

    if [[ "$DB_READY" == "0" ]]; then
        warn "MariaDB is not responding on $DB_HOST:$DB_PORT."
    if command -v mariadbd >/dev/null 2>&1 || command -v mysqld >/dev/null 2>&1; then
        read -r -p "Start MariaDB automatically? [Y/n]: " START_DB
        START_DB="${START_DB:-Y}"
        if [[ "$START_DB" =~ ^[Yy]$ ]]; then
            MARIADBD_BIN=""
            if command -v mariadbd >/dev/null 2>&1; then
                MARIADBD_BIN="$(command -v mariadbd)"
            else
                MARIADBD_BIN="$(command -v mysqld)"
            fi

            mkdir -p "$DB_DATADIR" "$(dirname "$DB_SOCKET")"
            if [[ ! -d "$DB_DATADIR/mysql" ]]; then
                info "Initializing MariaDB data directory..."
                mariadb-install-db --datadir="$DB_DATADIR" --auth-root-authentication-method=normal >"$DB_LOG" 2>&1 || {
                    cat "$DB_LOG"
                    die "MariaDB data directory initialization failed."
                }
            fi

            rm -f "$DB_SOCKET"
            info "Starting MariaDB..."
            "$MARIADBD_BIN" \
                --datadir="$DB_DATADIR" \
                --socket="$DB_SOCKET" \
                --port="$DB_PORT" \
                --bind-address="$DB_HOST" \
                --pid-file="$PROJECT_DIR/storage/mariadb.pid" \
                --log-error="$DB_LOG" \
                > /dev/null 2>&1 &
            DB_PID=$!

            DB_READY=0
            for _ in {1..60}; do
                if db_test; then
                    DB_READY=1
                    break
                fi
                if db_socket_test; then
                    DB_READY=2
                    break
                fi
                if ! kill -0 "$DB_PID" 2>/dev/null; then
                    break
                fi
                sleep 1
            done

            if [[ "$DB_READY" == "0" ]]; then
                printf '\n'
                cat "$DB_LOG" 2>/dev/null || true
                die "MariaDB failed to start. Full log: $DB_LOG"
            fi

            ok "MariaDB started."
        else
            die "Start MariaDB first, then run this setup again."
        fi
    else
        die "MariaDB is not running and no MariaDB server binary was found."
    fi
    fi
fi

# If MariaDB was found through a socket, configure the requested local TCP
# account before continuing. This also fixes fresh Termux installs where root
# is initially authenticated only through unix_socket.
if [[ "${DB_READY:-0}" == "2" ]]; then
    if [[ "$DB_HOST" == "127.0.0.1" || "$DB_HOST" == "localhost" ]]; then
        info "Configuring the local database user for TCP access..."
        if [[ -n "$DB_PASS" ]]; then
            SOCKET_PASS_SQL="$(sql_quote "$DB_PASS")"
        else
            SOCKET_PASS_SQL=""
        fi
        db_socket_exec -e "CREATE USER IF NOT EXISTS '$(sql_quote "$DB_USER")'@'127.0.0.1' IDENTIFIED BY '$SOCKET_PASS_SQL'; ALTER USER '$(sql_quote "$DB_USER")'@'127.0.0.1' IDENTIFIED BY '$SOCKET_PASS_SQL'; GRANT ALL PRIVILEGES ON *.* TO '$(sql_quote "$DB_USER")'@'127.0.0.1' WITH GRANT OPTION; FLUSH PRIVILEGES;" >/dev/null
        db_test || die "MariaDB is running, but TCP login for $DB_USER failed."
        ok "MariaDB TCP access is ready."
    else
        die "MariaDB is reachable only through its local socket, but the configured host is $DB_HOST."
    fi
fi

printf "\n${BOLD}3. Database setup${RESET}\n"
info "Checking database credentials..."
db_test || die "Could not connect to MariaDB with the supplied credentials."
ok "Database credentials work."

read -r -p "Create/import database '$DB_NAME'? [Y/n]: " DO_DB
DO_DB="${DO_DB:-Y}"
if [[ "$DO_DB" =~ ^[Yy]$ ]]; then
    info "Creating database if necessary..."
    db_exec -e "CREATE DATABASE IF NOT EXISTS \`$DB_NAME\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

    TABLE_COUNT="$(db_exec -N -s -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='$(sql_quote "$DB_NAME")';" | tr -d '[:space:]')"
    if [[ "$TABLE_COUNT" == "0" ]]; then
        db_exec "$DB_NAME" < "$PROJECT_DIR/structure.sql"
        ok "structure.sql imported."
    else
        warn "Database already contains $TABLE_COUNT table(s). Skipping structure.sql import to avoid overwriting data."
    fi
fi

printf "\n${BOLD}4. Environment${RESET}\n"
if [[ -f .env ]]; then
    read -r -p ".env already exists. Replace it with the values from this wizard? [y/N]: " REPLACE_ENV
    REPLACE_ENV="${REPLACE_ENV:-N}"
else
    REPLACE_ENV="Y"
fi

if [[ "$REPLACE_ENV" =~ ^[Yy]$ ]]; then
    if [[ -f .env ]]; then
        cp .env ".env.backup.$(date +%Y%m%d-%H%M%S)"
    fi

    read -r -p "Use local storage instead of Asteroid? [Y/n]: " USE_LOCAL_STORAGE
    USE_LOCAL_STORAGE="${USE_LOCAL_STORAGE:-Y}"

    if [[ "$USE_LOCAL_STORAGE" =~ ^[Yy]$ ]]; then
        LOCAL_STORAGE=true
        ASSET_CONTAINER_ID="local"
        CONTAINER_URL=""
        CONTAINER_PORT=""
        CONTAINER_ADMIN_KEY=""
    else
        LOCAL_STORAGE=false
        read -r -p "Asteroid container URL: " CONTAINER_URL
        read -r -p "Asteroid container port [9000]: " CONTAINER_PORT
        CONTAINER_PORT="${CONTAINER_PORT:-9000}"
        read -r -s -p "Asteroid admin key: " CONTAINER_ADMIN_KEY
        printf "\n"
        read -r -p "Asset container ID: " ASSET_CONTAINER_ID
    fi

    cat > .env <<ENV
# This file was automatically generated by the WatrBX Recontinued First-Time Setup script.
# It does not contain comments about fields, for help, consult the .env.example file.
APP_NAME="$(printf '%s' "$INSTALL_NAME" | sed 's/"/\\"/g')"
APP_DESC="User-generated MMO gaming site for kids, teens, and adults."
APP_ENV="local"
APP_DEBUG=true

MAIL_USER=""
MAIL_PASS=""

TurnStileKey=""
ROBLOSECURITY=""

MAINTENANCE=false
ACTUAL_MAINTENANCE=false

CAN_PURCHASE=true
CAN_REGISTER=true
CAN_LOGIN=true

DISCORD_BOT_AUTH=""
internalwebhook=""

LOCAL_STORAGE=$LOCAL_STORAGE
ASSETCONTAINERID="$(printf '%s' "$ASSET_CONTAINER_ID" | sed 's/"/\\"/g')"
CONTAINERURL="$(printf '%s' "$CONTAINER_URL" | sed 's/"/\\"/g')"
CONTAINERPORT="$(printf '%s' "$CONTAINER_PORT" | sed 's/"/\\"/g')"
CONTAINERADMINKEY="$(printf '%s' "$CONTAINER_ADMIN_KEY" | sed 's/"/\\"/g')"

DB_HOST="$(printf '%s' "$DB_HOST" | sed 's/"/\\"/g')"
DB_NAME="$(printf '%s' "$DB_NAME" | sed 's/"/\\"/g')"
DB_USER="$(printf '%s' "$DB_USER" | sed 's/"/\\"/g')"
DB_PASS="$(printf '%s' "$DB_PASS" | sed 's/"/\\"/g')"
DB_PORT="$(printf '%s' "$DB_PORT" | sed 's/"/\\"/g')"

BASE_URL="$(printf '%s' "$BASE_URL" | sed 's/"/\\"/g')"
WEBRCC_IP="$(printf '%s' "$RCC_IP" | sed 's/"/\\"/g')"
WEBRCC_PORT="$(printf '%s' "$RCC_PORT" | sed 's/"/\\"/g')"
WEBRCC_URL="roblox.com"
ENV
    ok ".env created."
else
    warn "Keeping the existing .env. Make sure its DB_* values are correct."
fi

printf "\n${BOLD}5. PrivateNut RSA key${RESET}\n"
KEY_FILE="$PROJECT_DIR/storage/PrivateNut.pem"
PUBLIC_KEY_FILE="$PROJECT_DIR/public_key.pem"
mkdir -p "$PROJECT_DIR/storage"

if [[ -f "$KEY_FILE" ]]; then
    warn "Existing key found: $KEY_FILE"
    read -r -p "Keep this existing key? [Y/n]: " KEEP_KEY
    KEEP_KEY="${KEEP_KEY:-Y}"
    if [[ "$KEEP_KEY" =~ ^[Nn]$ ]]; then
        cp "$KEY_FILE" "$KEY_FILE.backup.$(date +%Y%m%d-%H%M%S)"
        read -r -p "RSA key size [2048]: " KEY_BITS
        KEY_BITS="${KEY_BITS:-2048}"
        [[ "$KEY_BITS" =~ ^(2048|3072|4096)$ ]] || die "Use 2048, 3072, or 4096 bits."
        openssl genrsa -out "$KEY_FILE" "$KEY_BITS" >/dev/null 2>&1
        chmod 600 "$KEY_FILE"
        ok "New PrivateNut.pem generated. Old key was backed up."
    else
        chmod 600 "$KEY_FILE"
        ok "Keeping existing PrivateNut.pem."
    fi
else
    read -r -p "RSA key size for PrivateNut.pem [2048]: " KEY_BITS
    KEY_BITS="${KEY_BITS:-2048}"
    [[ "$KEY_BITS" =~ ^(2048|3072|4096)$ ]] || die "Use 2048, 3072, or 4096 bits."
    openssl genrsa -out "$KEY_FILE" "$KEY_BITS" >/dev/null 2>&1
    chmod 600 "$KEY_FILE"
    ok "Generated $KEY_FILE"
fi

openssl rsa -in "$KEY_FILE" -check -noout >/dev/null 2>&1 || die "PrivateNut.pem failed RSA validation."

# Always create a matching public key for the generated/private key.
openssl rsa -in "$KEY_FILE" -pubout -out "$PUBLIC_KEY_FILE" >/dev/null 2>&1
chmod 644 "$PUBLIC_KEY_FILE"
ok "PrivateNut.pem is valid."
ok "Generated matching public_key.pem."

printf "\n${BOLD}6. First administrator${RESET}\n"
read -r -p "Create/promote an administrator now? [Y/n]: " MAKE_ADMIN
MAKE_ADMIN="${MAKE_ADMIN:-Y}"
if [[ "$MAKE_ADMIN" =~ ^[Yy]$ ]]; then
    read -r -p "Admin username: " ADMIN_USER
    [[ "$ADMIN_USER" =~ ^[a-zA-Z0-9[:space:]]{3,20}$ ]] || die "Username must be 3-20 characters and contain only letters, numbers, and spaces."
    read -r -s -p "Admin password: " ADMIN_PASS
    printf "\n"
    [[ ${#ADMIN_PASS} -ge 1 ]] || die "Password cannot be empty."
    read -r -s -p "Confirm admin password: " ADMIN_PASS2
    printf "\n"
    [[ "$ADMIN_PASS" == "$ADMIN_PASS2" ]] || die "Passwords do not match."

    USER_SQL="$(sql_quote "$ADMIN_USER")"
    if [[ -n "$DB_PASS" ]]; then
        EXISTING_ID="$(db_exec -N -s "$DB_NAME" -e "SELECT id FROM users WHERE username='$USER_SQL' LIMIT 1;" || true)"
    else
        EXISTING_ID="$(db_exec -N -s "$DB_NAME" -e "SELECT id FROM users WHERE username='$USER_SQL' LIMIT 1;" || true)"
    fi

    PASSWORD_HASH="$(ADMIN_PASSWORD="$ADMIN_PASS" php -r 'echo password_hash(getenv("ADMIN_PASSWORD"), PASSWORD_DEFAULT);')"
    REGTIME="$(date +%s)"
    HASH_SQL="$(sql_quote "$PASSWORD_HASH")"

    if [[ -n "$EXISTING_ID" ]]; then
        info "User already exists with ID $EXISTING_ID. Promoting it to admin and updating its password."
        SQL="UPDATE users SET password='$HASH_SQL', is_admin=1 WHERE id=$EXISTING_ID;"
    else
        SQL="INSERT INTO users (username,password,gender,regtime,robux,tix,membership,blurb,is_admin) VALUES ('$USER_SQL','$HASH_SQL',NULL,$REGTIME,100,50,'None','',1);"
    fi
    db_exec "$DB_NAME" -e "$SQL"
    ok "Administrator '$ADMIN_USER' is ready."
fi

printf "\n${BOLD}7. WatrBX directories${RESET}\n"
for dir in storage/assets storage/thumbnails storage/logs; do
    mkdir -p "$dir"
    ok "Created/checked $dir"
done

printf "\n${BOLD}8. PHP/project checks${RESET}\n"
php -l init.php >/dev/null && ok "init.php syntax OK"
php -l routes/webhandler.php >/dev/null && ok "routes/webhandler.php syntax OK"
php -l routes/apihandler.php >/dev/null && ok "routes/apihandler.php syntax OK"

if [[ -f .env ]]; then
    if php -r 'require "vendor/autoload.php"; $d=Dotenv\\Dotenv::createImmutable(getcwd()); $d->load(); $pdo=new PDO("mysql:host=".$_ENV["DB_HOST"].";dbname=".$_ENV["DB_NAME"].";charset=utf8mb4",$_ENV["DB_USER"],$_ENV["DB_PASS"],[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]); echo "DB OK";' >"$DB_TEST_LOG" 2>&1; then
        ok "PHP/PDO can connect using .env"
    else
        warn "PHP/PDO database test failed:"
        sed -n '1,8p' "$DB_TEST_LOG" 2>/dev/null || true
    fi
fi

printf "\n${BOLD}${GREEN}Setup complete.${RESET}\n"
printf "Project: %s\n" "$PROJECT_DIR"
printf "URL:     %s\n" "$BASE_URL"
printf "Database: %s\n" "$DB_NAME"
printf "Private key: %s\n" "$KEY_FILE"
printf "Public key:  %s\n" "$PUBLIC_KEY_FILE"
if [[ "$MAKE_ADMIN" =~ ^[Yy]$ ]]; then printf "Admin:    %s\n" "$ADMIN_USER"; fi
printf "\nStart the local server with:\n  cd %q\n  ./server\n\n"
printf "Keep storage/PrivateNut.pem private and do not commit it to Git.\n"
printf "Make sure when starting the server that your web RCCService is running (so you get thumbnails and stuff)\n\n"
ok "Thanks for checking out WatrBX Recontinued!"

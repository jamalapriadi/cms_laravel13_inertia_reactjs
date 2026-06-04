#!/usr/bin/env bash
set -e

PROJECT_ROOT="${1:-/var/www/dashboard.gitatrading-store.com}"

log() {
    printf '[storage-fix] %s\n' "$1"
}

log "Using project root: ${PROJECT_ROOT}"
cd "${PROJECT_ROOT}"

log "Creating required Laravel storage directories"
mkdir -p storage/app/public
mkdir -p storage/framework/cache
mkdir -p storage/framework/sessions
mkdir -p storage/framework/views
mkdir -p bootstrap/cache

log "Setting owner to www-data:www-data"
chown -R www-data:www-data storage bootstrap/cache

log "Setting directory permissions to 775"
find storage bootstrap/cache -type d -exec chmod 775 {} \;

log "Setting file permissions to 664"
find storage bootstrap/cache -type f -exec chmod 664 {} \;

if [ -L public/storage ]; then
    CURRENT_TARGET="$(readlink public/storage)"

    if [ "${CURRENT_TARGET}" != "../storage/app/public" ] && [ "$(readlink -f public/storage)" != "$(readlink -f storage/app/public)" ]; then
        log "Removing invalid public/storage symlink: ${CURRENT_TARGET}"
        rm public/storage
    else
        log "public/storage symlink is valid"
    fi
elif [ -e public/storage ]; then
    log "public/storage exists but is not a symlink. Move it manually before running storage:link."
    exit 1
fi

log "Creating Laravel public storage symlink"
php artisan storage:link

log "Clearing optimized Laravel caches"
php artisan optimize:clear

log "Running storage health check"
php artisan storage:health-check

log "Done"

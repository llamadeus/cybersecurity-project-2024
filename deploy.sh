#!/usr/bin/env bash
# This will build and restart to the production container.
set -e

server=stefan
app_root=/home/amadeus/http/csp
app_storage=/home/amadeus/storage/csp
app_url=https://csp.deer13.dev

echo -e '\033[1mDeploying...\033[0m'
echo $app_url
echo

rsync -vhra \
  . \
  $server:$app_root \
  --include='**.gitignore' \
  --exclude='/.git' \
  --filter=':- .gitignore' \
  --delete-after

ssh $server << EOF
  set -e

  cd $app_root

  # Build images
  docker build -f Dockerfile -t llamadeus/csp .
  docker build -f Dockerfile.migrate -t llamadeus/csp-migrate .

  # Stop container
  docker compose stop

  # Migrate
  docker run --rm -e DATABASE_URL="/app/db/prod.db" -v "/home/amadeus/storage/csp/db":"/app/db" llamadeus/csp-migrate

  # Restart container
  docker compose up -d

  # Clean up cached resources (anything older than 7 days)
  yes | docker image prune -a --filter "until=168h"
  yes | docker builder prune -a --filter "until=168h"
EOF

#! /bin/bash

set -e

echo "STEP 1 : Docker Compose Down, Volume Remove"
docker compose down -v --remove-orphans

echo "Successfully Teared Down!"

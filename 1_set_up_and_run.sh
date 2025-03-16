#! /bin/bash

set -e

echo "STEP 0 : Remove previous containers and volumes"
./tear_down.sh

echo "STEP 1 : env file copy"
cp .env.sample .env
cp patient-service/.env.sample patient-service/.env

echo "STEP 2 : Docker Compose Up"
docker compose up --build -d

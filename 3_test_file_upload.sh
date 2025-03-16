#! /bin/bash

set -e

# first argv is file path
FILE_PATH=$1

if [ -z "$FILE_PATH" ]; then
    echo "Usage: $0 <file_path>"
    exit 1
fi

echo "Docker container 가 실행 중인지 확인합니다..."
if ! docker ps | grep -q "patient-service"
then
    echo "Docker container 가 실행 중이지 않습니다."
    exit 1
fi
echo "Docker container 가 실행 중입니다."

echo "파일 업로드 요청을 보냅니다..."
curl -X POST -F "file=@$FILE_PATH" -kv -w '\n\n* Response time: %{time_total}s\n\n'  http://localhost:3001/patients/upload



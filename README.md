# Patient Service

## 프로젝트 설명

이 프로젝트는 환자 정보를 관리하는 서비스를 제공합니다. 주요 기능은 다음과 같습니다:

- Excel 파일을 통한 대량 환자 데이터 업로드
  - 기존 환자 정보 업데이트 및 신규 환자 등록 자동 처리
  - 주민등록번호 마스킹 처리
- 환자 정보 조회 (페이지네이션 지원)

### 프로젝트 구조

```
database/              # 데이터베이스 초기화 및 설정
├── init/              # 초기화 스크립트 및 SQL 파일
└── config/            # 데이터베이스 설정 파일
patient-service/
├── src/
│   ├── config-factory/       # 설정 관련 팩토리 함수
│   ├── entities/            # 공통 엔티티 정의
│   ├── interceptor/         # 전역 인터셉터
│   ├── patients/           # 환자 관리 모듈
│   │   ├── bulk-create/    # 대량 환자 데이터 업로드 관련
│   │   ├── entities/       # Patient 엔티티 정의
│   │   ├── filters/        # 예외 처리 필터
│   │   ├── interfaces/     # api interface 정의
│   │   ├── pipes/          # 유효성 검증 파이프
│   │   └── scan/          # 환자 조회 관련
│   ├── app.module.ts       # 애플리케이션 루트 모듈
│   └── main.ts            # 애플리케이션 진입점
├── test/                  # 테스트 파일
└── package.json          # 프로젝트 의존성 및 스크립트
docker-compose.yml     # Docker 컴포즈 설정 파일
```

### Service 위계 및 역할

```
PatientsService
├── BulkUpsertService (대량 환자 데이터 처리)
│   ├── XlsxHandlerService (Excel 파일 파싱)
│   ├── RecordValidatorService (데이터 유효성 검증)
│   └── UpsertDecisionService (업데이트/삽입 여부 결정)
└── ScanService (환자 정보 조회)
```

각 서비스의 주요 역할:

1. **PatientsService**

- 환자 정보 관리의 진입점
- 파일 업로드 및 조회 요청 처리

  a. **BulkUpsertService**

  - Excel 파일을 통한 대량 환자 데이터 처리
  - 트랜잭션 관리 및 배치 처리
  - 하위 서비스들의 작업 조율

    i. **XlsxHandlerService**

    - Excel 파일 파싱 및 데이터 추출

    ii. **RecordValidatorService**

    - 추출된 데이터의 유효성 검증
    - 필수 필드 확인 및 데이터 형식 검증
    - 중복 데이터 필터링

    iii. **UpsertDecisionService**

    - 기존 환자 데이터 존재 여부 확인
    - 업데이트 또는 삽입 여부 결정
    - 차트 번호 기반 매칭 로직 처리

  b. **ScanService**

  - 환자 목록 조회 및 페이지네이션 처리
  - 데이터 정렬 및 필터링
  - 응답 데이터 포맷팅

## 설치 및 실행 방법

### 0. 필수 요구사항

- Docker
- Node.js 22 이상

### 1. Docker Compose up 으로 db set up & 서비스 실행

- 프로젝트 root 에서 1_set_up_and_run.sh 실행

```bash
bash ./1_set_up_and_run.sh
```

### 2. test 실행

- 프로젝트 root 에서 2_run_tests.sh 실행

```bash
bash ./2_run_tests.sh
```

### 3. 테스트 데이터 업로드 및 조회 API 테스트

- 1_set_up_and_run.sh 실행이 반드시 선행되어야 함

- 프로젝트 root 에서 3_test_file_upload 실행
  - 첫번째 인자로 업로드 할 파일 path 전달 필수

```bash
bash ./3_test_file_upload.sh ./patient_data.xlsx
```

- upload api response time 확인.
  - 위 command 실행 후 terminal 에 출력되는 response time
  - `docker compose logs patient-service` 실행 시 nestjs 서버 로그로 response time 확인 가능
- http://localhost:3001/api 에서 Swagger 확인 가능 + 조회 API 테스트 가능

### 4. 로컬에서 서버 실행

- docker compose service 들이 실행 중인 상태에서 아래 스텝 순서대로 실행
- patient-service/.env 에서 `MYSQL_URL` 로컬 테스트용으로 수정

```bash
# 디렉토리 이동
cd patient-service

# yarn berry 사용할 수 있도록 설정
corepack enable

# 의존성 설치
yarn install

# 실행
yarn run start
```

### 5. Tear down

- 프로젝트 root 에서 tear_down.sh 실행

```bash
bash ./tear_down.sh
```

## API 문서

- `1_set_up_and_run.sh` 스크립트 실행 후 브라우저에서 http://localhost:3001/api 로 접속

## 데이터베이스 스키마 설명

### patients 테이블

```sql
CREATE TABLE IF NOT EXISTS patients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(16) NOT NULL,
    phone_number VARCHAR(32) NOT NULL,
    chart_number VARCHAR(32) DEFAULT '',
    resident_registration_number CHAR(14) NOT NULL,
    address VARCHAR(255) DEFAULT NULL,
    memo VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

--- 인덱스
CREATE UNIQUE INDEX idx_patients_unique ON patients (name, phone_number, chart_number);
CREATE INDEX idx_patients_name_phone ON patients (name, phone_number);
```

#### 필드 설명

- **id**: 각 환자의 고유 식별자입니다. 자동 증가하는 정수형으로 설정되어 있습니다.
- **name**: 환자의 이름을 저장합니다. 최대 16자까지 허용됩니다.
- **phone_number**: 환자의 전화번호를 저장합니다. 최대 32자까지 허용됩니다.
- **chart_number**: 환자의 차트 번호를 저장합니다. 기본값은 빈 문자열이며, 최대 32자까지 허용됩니다.
  - unique index 에 포함되는 column 이기 때문에 null 대신 빈 문자열을 default 로 설정합니다.
- **resident_registration_number**: 환자의 주민등록번호를 저장합니다. 14자로 고정된 길이를 가집니다.
- **address**: 환자의 주소를 저장합니다. 최대 255자까지 허용되며, 기본값은 NULL입니다.
- **memo**: 환자에 대한 메모를 저장합니다. 최대 255자까지 허용되며, 기본값은 NULL입니다.
- **created_at**: 레코드 생성 시간을 저장합니다. 기본값은 현재 시간입니다.
- **updated_at**: 레코드가 마지막으로 업데이트된 시간을 저장합니다. 기본값은 현재 시간이며, 업데이트 시 자동으로 갱신됩니다.

#### 인덱스 설명:

- **idx_patients_unique**: `name`, `phone_number`, `chart_number` 필드의 조합에 대한 고유 인덱스입니다. 이를 통해 중복된 환자 정보가 저장되는 것을 방지합니다.
- **idx_patients_name_phone**: `name`, `phone_number` 필드의 조합에 대한 인덱스입니다. 조회 속도 최적화를 위한 처리입니다.

## 성능 최적화 방법에 대한 설명

### 1. 효율적인 데이터베이스 쿼리

- (name, phone_number) 인덱스로 환자 검색 쿼리 성능 향상.
- 개별 INSERT/UPDATE 대신 벌크 연산을 사용하여 데이터베이스 및 네트워크 부하 최소화.

  - `INSERT INTO ... VALUES (...)` 문 사용 → 다중 `INSERT` 실행보다 빠름.
  - 업데이트 시 `UPDATE ... CASE ... WHERE id IN (...)` 패턴 사용 → 여러 `UPDATE를` 하나의 쿼리로 처리.

- INSERT/UPDATE 시 한 쿼리에 500 record 씩 배치로 처리.

  - 전체 데이터셋을 하나의 query 로 INSERT/UPDATE 할 경우 아래 지점들에서 과부화가 생김.
    - 메모리 & 버퍼 과부하
      - MySQL은 COMMIT이 실행되기 전까지 모든 데이터를 메모리에 보관, 너무 많은 데이터를 한번에 삽입하면 메모리가 부족해져서 디스크 스와핑이 발생할 수 있음.
    - 긴 트랜잭션 대기 시간
      - INSERT가 완료될 때까지 트랜잭션이 유지됨 → COMMIT이 오래 걸림.
      - 트랜잭션 중간에 에러가 나면 전체가 롤백(rollback) 되며, 처리 시간이 낭비됨.
  - 배치로 실행 시 효과.
    - 각 배치가 작은 단위로 실행되어 메모리 부담 감소.
    - 빠른 커밋(COMMIT) 가능, 트랜잭션이 길어지지 않음.
  - 결과 비교
    - 50,000 record 를 한번에 `INSERT INTO ... VALUES (...)` 로 저장하는 방식의 소요시간 : ~60s
    - 배치로 저장 : ~1s

- 데이터 조회 요청 처리 시, 페이지네이션 적용으로 대량 데이터 조회 시 메모리 사용량 제한.

### 2. 파일 핸들링 및 데이터 검증 최적화

- file 을 하드 디스크에 저장 후, 다시 읽어서 처리하는 방식이 아니라, xlsx 라이브러리의 Stream API를 사용하여 메모리 상에서 바로 데이터 처리.
- 중복 데이터 처리를 위한 효율적인 Map 자료구조 활용.
- Excel 파일 데이터 파싱 단계에서 기본적인 유효성 검사 수행 (필수 필드, 데이터 형식 등).
- 데이터베이스 작업 전 모든 레코드의 유효성을 검증하여 불필요한 트랜잭션 방지.
- 검증된 데이터만 트랜잭션에 포함시켜 롤백 가능성 최소화.

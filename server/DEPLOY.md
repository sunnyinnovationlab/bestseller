# Google Cloud Run 배포 가이드

이 가이드는 Google Cloud Run에 Bestseller 서버를 배포하는 방법을 설명합니다.

## 사전 준비

1. **Google Cloud 계정 생성**
   - https://cloud.google.com/ 에서 새 계정 생성
   - 무료 체험 크레딧 $300 제공 (90일)

2. **Google Cloud SDK 설치**
   - Windows: https://cloud.google.com/sdk/docs/install
   - 또는 Cloud Shell 사용 (브라우저에서 바로 사용 가능)

## 배포 단계

### 1. Google Cloud 프로젝트 생성

```bash
# Google Cloud Console에서 프로젝트 생성
# 또는 gcloud CLI 사용:
gcloud projects create bestseller-api --name="Bestseller API"
gcloud config set project bestseller-api
```

### 2. Google Cloud API 활성화

```bash
# Cloud Run API 활성화
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable containerregistry.googleapis.com
```

### 3. Docker 이미지 빌드 및 배포

#### 방법 1: gcloud CLI 사용 (권장)

```bash
# 프로젝트 루트에서 실행
cd server

# Docker 이미지 빌드 및 Cloud Run에 배포
gcloud run deploy bestseller-server \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2 \
  --timeout 300 \
  --max-instances 10 \
  --min-instances 0
```

#### 방법 2: 수동 빌드 및 배포

```bash
# 1. 프로젝트 ID 확인
PROJECT_ID=$(gcloud config get-value project)

# 2. Docker 이미지 빌드
docker build -t gcr.io/${PROJECT_ID}/bestseller-server:latest .

# 3. Google Container Registry에 푸시
docker push gcr.io/${PROJECT_ID}/bestseller-server:latest

# 4. Cloud Run에 배포
gcloud run deploy bestseller-server \
  --image gcr.io/${PROJECT_ID}/bestseller-server:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2 \
  --timeout 300 \
  --max-instances 10 \
  --min-instances 0
```

### 4. 배포 확인

배포가 완료되면 서비스 URL이 출력됩니다:
```
Service [bestseller-server] revision [bestseller-server-xxxxx] has been deployed and is serving 100 percent of traffic.
Service URL: https://bestseller-server-xxxxx-uc.a.run.app
```

### 5. 헬스 체크

```bash
# 서비스 URL 확인
SERVICE_URL=$(gcloud run services describe bestseller-server --region us-central1 --format 'value(status.url)')

# 헬스 체크
curl ${SERVICE_URL}/health

# API 테스트
curl ${SERVICE_URL}/kr-books
```

## 환경 변수 설정 (필요시)

```bash
gcloud run services update bestseller-server \
  --region us-central1 \
  --set-env-vars "NODE_ENV=production"
```

## 무료 티어 제한

Google Cloud Run 무료 티어:
- **월 200만 요청** 무료
- **월 360,000 vCPU 초** 무료
- **월 2GB 메모리 초** 무료
- **항상 무료**: 월 2개 인스턴스 (CPU 할당 없음, 요청 시에만 활성화)

### 비용 최적화 팁

1. **최소 인스턴스 0으로 설정** (기본값)
   - 트래픽이 없을 때 인스턴스가 종료되어 비용 절감

2. **메모리 최적화**
   - Puppeteer 사용 시 최소 2GB 권장
   - 필요시 1GB로 시작하여 모니터링

3. **타임아웃 설정**
   - 기본 300초 (5분)로 설정
   - 크롤링 작업에 충분한 시간 확보

## 업데이트 배포

코드 변경 후 재배포:

```bash
cd server
gcloud run deploy bestseller-server \
  --source . \
  --platform managed \
  --region us-central1
```

## 로그 확인

```bash
# 실시간 로그 확인
gcloud run services logs read bestseller-server --region us-central1 --tail

# 최근 로그 확인
gcloud run services logs read bestseller-server --region us-central1 --limit 50
```

## 트러블슈팅

### Puppeteer 오류

Puppeteer가 Chrome을 찾지 못하는 경우:
- Dockerfile에서 Chrome 설치 확인
- 환경 변수 `PUPPETEER_EXECUTABLE_PATH` 확인

### 메모리 부족

메모리 부족 오류 발생 시:
```bash
gcloud run services update bestseller-server \
  --region us-central1 \
  --memory 4Gi
```

### 타임아웃 오류

타임아웃 발생 시:
```bash
gcloud run services update bestseller-server \
  --region us-central1 \
  --timeout 600
```

## 모바일 앱 연동

배포 완료 후 `mobile/config/api.js`의 프로덕션 URL을 업데이트:

```javascript
const API_BASE_URL = __DEV__
  ? 'http://10.0.2.2:4000' // 개발
  : 'https://bestseller-server-xxxxx-uc.a.run.app'; // 프로덕션 (실제 URL로 변경)
```

## 참고 자료

- [Google Cloud Run 문서](https://cloud.google.com/run/docs)
- [Cloud Run 가격](https://cloud.google.com/run/pricing)
- [Dockerfile 모범 사례](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/)


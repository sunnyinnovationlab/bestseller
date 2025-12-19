#!/bin/bash

# Google Cloud Run 배포 스크립트

set -e

echo "🚀 Bestseller Server 배포 시작..."

# 프로젝트 ID 확인
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)

if [ -z "$PROJECT_ID" ]; then
    echo "❌ Google Cloud 프로젝트가 설정되지 않았습니다."
    echo "다음 명령어로 프로젝트를 설정하세요:"
    echo "  gcloud config set project YOUR_PROJECT_ID"
    exit 1
fi

echo "📦 프로젝트 ID: $PROJECT_ID"

# Cloud Run API 활성화 확인
echo "🔧 필요한 API 활성화 확인 중..."
gcloud services enable run.googleapis.com --quiet || true
gcloud services enable cloudbuild.googleapis.com --quiet || true
gcloud services enable containerregistry.googleapis.com --quiet || true

# 배포 실행
echo "📤 Cloud Run에 배포 중..."
gcloud run deploy bestseller-server \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2 \
  --timeout 300 \
  --max-instances 10 \
  --min-instances 0 \
  --project "$PROJECT_ID"

# 서비스 URL 가져오기
SERVICE_URL=$(gcloud run services describe bestseller-server \
  --region us-central1 \
  --format 'value(status.url)' \
  --project "$PROJECT_ID")

echo ""
echo "✅ 배포 완료!"
echo "🌐 서비스 URL: $SERVICE_URL"
echo ""
echo "🧪 헬스 체크:"
curl -s "$SERVICE_URL/health" | jq '.' || echo "jq가 설치되지 않았습니다. 직접 확인하세요: $SERVICE_URL/health"
echo ""
echo "📝 모바일 앱의 mobile/config/api.js에서 프로덕션 URL을 업데이트하세요:"
echo "   $SERVICE_URL"


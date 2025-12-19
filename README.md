# Book Bestsellers

**Book Bestsellers** is a mobile application that provides weekly bestseller lists from multiple countries. The app displays book information in both original and Korean languages, with support for dark mode and comprehensive book details.

---

## Key Features

- **Multi-Country Bestseller Lists**  
  View weekly bestseller lists for South Korea (KR), United States (US), Japan (JP), United Kingdom (UK), China (CH), Taiwan (TW), France (FR), and Spain (ES).

- **Bilingual Support**  
  Toggle between original language and Korean translations for book titles, authors, descriptions, and more.

- **Dark Mode**  
  Full dark mode theme support with custom color palette.

- **Book Details**  
  Access detailed book information including summaries, author biographies, and additional information.

- **Bookmarking**  
  Save your favorite books for quick access later.

- **Settings & Credits**  
  Customize app language, theme, and view credits and open source information.

---

## 📁 프로젝트 구조

```
bestseller/
├── mobile/                    # React Native 모바일 앱
│   ├── android/               # Android 네이티브 코드
│   ├── ios/                   # iOS 네이티브 코드
│   ├── assets/                # 이미지 및 리소스
│   ├── components/            # 재사용 가능한 컴포넌트
│   ├── config/               # 설정 파일 (API, 버전)
│   ├── App.js                # 앱 진입점
│   ├── MainScreen.js         # 메인 화면 (국가별 탭, 북마크, 설정)
│   ├── BookDetail.js         # 책 상세 정보 화면
│   ├── Bookmark.js           # 북마크 화면
│   ├── SettingsPage.js       # 설정 화면
│   ├── CreditsPage.js        # 크레딧 페이지
│   ├── OpenSourceInfoPage.js # 오픈소스 정보 페이지
│   ├── SplashPage.js         # 스플래시 화면
│   ├── ThemeContext.js       # 다크 모드 테마 컨텍스트
│   ├── LanguageContext.js    # 언어 컨텍스트
│   └── BookmarkContext.js    # 북마크 컨텍스트
│
├── server/                    # Express API 서버
│   ├── index.js              # 서버 진입점
│   ├── routes/               # API 라우트
│   │   ├── books.js          # 책 목록 API
│   │   └── bookDetail.js     # 책 상세 정보 API
│   ├── services/             # 서비스 레이어
│   │   └── cache.js          # 구글 시트 캐시 서비스
│   └── start-server.bat      # 서버 시작 스크립트 (Windows)
│
└── backend/                  # 배치 크롤러 (선택사항)
    ├── scrappers/           # Puppeteer 크롤러
    └── json_results/        # 크롤링 결과 JSON 파일
```

---

## ✨ 주요 기능

### 📚 국가별 베스트셀러
- **한국 (KOR)**: Google Sheets 데이터
- **일본 (JPN)**: Google Sheets 데이터
- **미국 (USA)**: Google Sheets 데이터
- **영국 (GBR)**: Google Sheets 데이터
- **중국 (CHN)**: Google Sheets 데이터
- **대만 (TPE)**: Google Sheets 데이터
- **프랑스 (FRA)**: Google Sheets 데이터
- **스페인 (ESP)**: Google Sheets 데이터

### 📖 책 상세 정보
- 책 소개, 줄거리, 저자 정보
- 목차 (Table of Contents)
- 출판사 리뷰
- 원본 사이트 링크
- 이미지 확대 기능
- 위키피디아 연동

### 🔖 북마크
- 관심 있는 책을 북마크로 저장
- AsyncStorage를 사용한 로컬 저장
- 북마크 화면에서 관리 및 정렬

### ⚙️ 설정
- 다국어 지원 (한국어, 영어, 일본어, 중국어, 대만어, 프랑스어, 스페인어)
- 다크 모드 / 라이트 모드 전환
- 소셜 미디어 링크 (Instagram, X/Twitter)
- 앱 버전 정보
- 크레딧 및 오픈소스 정보

---

## 🚀 시작하기

### 사전 요구사항
- Node.js >= 20
- React Native 개발 환경
- Android Studio (Android 개발용)
- Xcode (iOS 개발용, macOS만)

### 1. 서버 실행

#### 로컬 개발

```bash
cd server
npm install
npm start
```

서버는 `http://localhost:4000`에서 실행됩니다.

#### Google Cloud Run 배포

자세한 배포 가이드는 `server/DEPLOY.md`를 참고하세요.

**빠른 배포:**
```bash
cd server

# Windows
deploy.bat

# macOS/Linux
chmod +x deploy.sh
./deploy.sh
```

**수동 배포:**
```bash
cd server
gcloud run deploy bestseller-server \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2
```

**API 엔드포인트:**
- `GET /kr-books` - 한국 베스트셀러
- `GET /us-books` - 미국 베스트셀러
- `GET /jp-books` - 일본 베스트셀러
- `GET /uk-books` - 영국 베스트셀러
- `GET /ch-books` - 중국 베스트셀러
- `GET /tw-books` - 대만 베스트셀러
- `GET /fr-books` - 프랑스 베스트셀러
- `GET /es-books` - 스페인 베스트셀러
- `GET /kr-book-detail?url=...` - 책 상세 정보 (각 국가별)

### 2. 모바일 앱 실행

```bash
cd mobile
npm install
npm run android  # Android
# 또는
npm run ios      # iOS
```

**Android 디바이스 연결 시:**
```bash
adb devices  # 연결된 디바이스 확인
adb reverse tcp:8081 tcp:8081  # Metro 번들러 포트 포워딩
```

### 3. APK 빌드

```bash
cd mobile/android
./gradlew.bat assembleRelease  # Windows
# 또는
./gradlew assembleRelease      # macOS/Linux
```

APK 파일은 `mobile/android/app/build/outputs/apk/release/app-release.apk`에 생성됩니다.

---

## 🛠 기술 스택

### Mobile
- **React Native** 0.82.1
- **React Navigation** - 화면 네비게이션
- **React Native Vector Icons** - 아이콘
- **AsyncStorage** - 로컬 데이터 저장
- **React Native WebView** - 웹 콘텐츠 표시
- **React Native Google Mobile Ads** - 광고 통합

### Server
- **Express** 5.1.0 - REST API 서버
- **Axios** - HTTP 클라이언트
- **csv-parse** - CSV/TSV 파싱
- **Puppeteer** - 책 상세 정보 크롤링 (선택사항)

### Data Source
- **Google Sheets** - 메인 데이터 소스
- **24시간 메모리 캐시** - 성능 최적화

---

## 📊 데이터 흐름

1. **Google Sheets**: 메인 데이터 소스로 Google Sheets에서 TSV 형식으로 데이터 가져오기
2. **메모리 캐시**: 24시간 TTL을 가진 메모리 캐시로 성능 최적화
3. **API 요청**: 모바일 앱이 `server/`의 Express API 호출
4. **책 상세 정보**: 필요 시 Puppeteer를 사용하여 실시간 크롤링 (선택사항)

---

## 📝 참고사항

- 서버는 Google Sheets에서 데이터를 읽어옵니다
- 24시간 메모리 캐시를 사용하여 성능을 최적화합니다
- 모바일 앱은 Android 에뮬레이터에서 `10.0.2.2:4000`으로 서버에 접속합니다
- 북마크 데이터는 AsyncStorage에 로컬로 저장됩니다
- 다크 모드는 앱 전체에 적용됩니다
- 한국어 토글은 모든 국가 탭에서 유지됩니다
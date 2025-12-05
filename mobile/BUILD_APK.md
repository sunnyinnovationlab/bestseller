# Android APK 빌드 가이드

## 사전 요구사항
- Node.js (>=20)
- Java JDK 11 이상
- Android Studio 및 Android SDK 설치

## APK 빌드 방법

### 방법 1: npm 스크립트 사용 (권장)
```bash
# 클린 빌드
npm run build:android:clean

# 또는 일반 빌드
npm run build:android
```

### 방법 2: Gradle 직접 사용
```bash
cd android
./gradlew clean
./gradlew assembleRelease
```

## APK 파일 위치
빌드가 완료되면 APK 파일은 다음 위치에 생성됩니다:
```
android/app/build/outputs/apk/release/app-release.apk
```

## Release Keystore 설정 (프로덕션 배포용)

현재는 debug keystore를 사용하고 있습니다. 프로덕션 배포를 위해서는 release keystore를 생성해야 합니다.

### 1. Keystore 생성
```bash
cd android/app
keytool -genkeypair -v -storetype PKCS12 -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

### 2. build.gradle 수정
`android/app/build.gradle` 파일의 `signingConfigs` 섹션을 다음과 같이 수정:

```gradle
signingConfigs {
    debug {
        storeFile file('debug.keystore')
        storePassword 'android'
        keyAlias 'androiddebugkey'
        keyPassword 'android'
    }
    release {
        if (project.hasProperty('MYAPP_RELEASE_STORE_FILE')) {
            storeFile file(MYAPP_RELEASE_STORE_FILE)
            storePassword MYAPP_RELEASE_STORE_PASSWORD
            keyAlias MYAPP_RELEASE_KEY_ALIAS
            keyPassword MYAPP_RELEASE_KEY_PASSWORD
        }
    }
}
```

### 3. gradle.properties에 추가
`android/gradle.properties` 파일에 다음을 추가:

```
MYAPP_RELEASE_STORE_FILE=my-release-key.keystore
MYAPP_RELEASE_STORE_PASSWORD=*****
MYAPP_RELEASE_KEY_ALIAS=my-key-alias
MYAPP_RELEASE_KEY_PASSWORD=*****
```

## 문제 해결

### 빌드 오류 발생 시
1. `cd android && ./gradlew clean` 실행
2. `node_modules` 삭제 후 `npm install` 재실행
3. `android/.gradle` 폴더 삭제 후 재빌드

### 메모리 부족 오류
`android/gradle.properties`에서 메모리 설정 증가:
```
org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=1024m
```

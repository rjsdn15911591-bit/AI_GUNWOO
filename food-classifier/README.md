# 🍽️ AI 음식 분류기

> MobileNetV2 기반 딥러닝 음식 인식 SaaS — [ai-gunwoo.vercel.app](https://ai-gunwoo.vercel.app)

---

## 개요

스마트폰 카메라 또는 이미지 파일로 음식 사진을 업로드하면, 브라우저 내 딥러닝 모델이 실시간으로 음식 종류를 분류하고 신뢰도와 함께 한국어로 결과를 출력하는 웹 애플리케이션입니다.

---

## 핵심 기술

### 딥러닝 모델
- **MobileNetV2** (α=1.0) — TensorFlow.js를 통해 브라우저에서 직접 추론 (서버 전송 없음)
- **TTA (Test-Time Augmentation)** — 5-crop 앙상블로 단일 추론 대비 정확도 향상
  - Center crop, 4-corner crop을 평균 앙상블
  - 무료 사용자: 3-crop / 프리미엄: 5-crop
- **WebGL 하드웨어 가속** — GPU 백엔드 우선 사용, WASM → CPU 자동 폴백
- **Top-20 예측 풀링** — 각 crop에서 상위 20개 클래스를 추출 후 확률 평균 집계
- **음식 필터링** — 300+ 음식 키워드 DB로 비음식 결과 자동 제거

### Grad-CAM (프리미엄)
- CNN 마지막 컨볼루션 레이어의 그래디언트를 역전파하여 모델이 주목한 영역을 히트맵으로 시각화
- 모델의 판단 근거를 직관적으로 확인 가능

### 불확실도 추정 (프리미엄)
- TTA 앙상블 예측값의 표준편차(σ)로 모델 신뢰도 정량화
- σ가 높을수록 예측이 불안정함을 의미

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| 프레임워크 | Next.js 16 (App Router) |
| 언어 | TypeScript |
| 스타일 | Tailwind CSS v4 |
| 딥러닝 | TensorFlow.js, @tensorflow-models/mobilenet |
| 인증 | Supabase Auth (이메일 + Google OAuth) |
| DB | Supabase PostgreSQL (RLS 적용) |
| 결제 | Polar.sh (구독 결제) |
| 배포 | Vercel |

---

## 주요 기능

| 기능 | 무료 | 프리미엄 |
|------|------|----------|
| 이미지 업로드 / 카메라 촬영 | ✅ | ✅ |
| 음식 분류 (Top-5 결과 + 한글) | ✅ | ✅ |
| 신뢰도 확률 표시 | ✅ | ✅ |
| TTA 3-crop 앙상블 | ✅ | ✅ |
| 일일 사용 횟수 | 5회 | 무제한 |
| TTA 5-crop 앙상블 | ❌ | ✅ |
| Grad-CAM 히트맵 | ❌ | ✅ |
| 불확실도 배지 (σ) | ❌ | ✅ |
| 분류 히스토리 저장 | ❌ | ✅ |

---

## 프로젝트 구조

```
food-classifier/
├── app/
│   ├── app/                  # 분류기 메인 페이지
│   │   ├── page.tsx          # 서버 컴포넌트 (인증 + 플랜 확인)
│   │   └── ClassifierClient.tsx  # 클라이언트 분류기 UI
│   ├── api/
│   │   ├── auth/             # 로그인 / 로그아웃 / OAuth 콜백
│   │   └── polar/
│   │       ├── checkout/     # 결제 세션 생성
│   │       └── webhook/      # 결제 이벤트 수신 → 플랜 업데이트
│   ├── pricing/              # 요금제 페이지
│   └── dashboard/            # 분류 히스토리
├── components/
│   ├── ImageUploader.tsx     # 파일 업로드 (드래그앤드롭)
│   ├── CameraCapture.tsx     # 카메라 촬영
│   ├── ResultPanel.tsx       # 분류 결과 패널
│   ├── ConfidenceBar.tsx     # 신뢰도 바 (한글 레이블)
│   ├── GradCAMOverlay.tsx    # Grad-CAM 히트맵 오버레이
│   ├── AugPreview.tsx        # TTA crop 미리보기
│   ├── ModelLoader.tsx       # 모델 로딩 + 백엔드 초기화
│   └── PlanGate.tsx          # 프리미엄 기능 잠금 컴포넌트
└── lib/
    ├── ml/
    │   ├── classifier.ts     # TTA 추론 + 앙상블 로직
    │   ├── foodLabels.ts     # 음식 키워드 DB + 한글 번역
    │   ├── gradcam.ts        # Grad-CAM 구현
    │   └── uncertainty.ts    # 불확실도 계산
    └── supabase/
        ├── client.ts         # 클라이언트 Supabase
        ├── server.ts         # 서버 Supabase (SSR)
        └── usage.ts          # 사용량 체크 + 저장
```

---

## 로컬 실행

```bash
# 의존성 설치
npm install

# 환경변수 설정 (.env.local)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
POLAR_ACCESS_TOKEN=...
POLAR_PRODUCT_ID=...
POLAR_WEBHOOK_SECRET=...

# 개발 서버 시작
npm run dev
```

---

## 라이선스

MIT

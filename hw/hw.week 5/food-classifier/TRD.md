# TRD — AI 음식 분류기 (Technical Requirements Document)

**버전:** 1.0  
**작성일:** 2026-04-15  
**서비스 URL:** https://ai-gunwoo.vercel.app

---

## 1. 시스템 아키텍처

```
┌─────────────────────────────────────────────────┐
│                  사용자 브라우저                   │
│                                                  │
│  ┌──────────────┐    ┌─────────────────────────┐ │
│  │  Next.js UI  │    │   TensorFlow.js Runtime  │ │
│  │  (React)     │    │   MobileNetV2 모델       │ │
│  │              │◄──►│   WebGL / WASM / CPU     │ │
│  └──────┬───────┘    └─────────────────────────┘ │
│         │ 이미지 픽셀 (서버 미전송)                │
└─────────┼───────────────────────────────────────┘
          │ API 요청 (인증, 사용량, 결제)
          ▼
┌─────────────────────┐    ┌──────────────────────┐
│   Vercel Serverless  │    │   Supabase            │
│   Functions          │◄──►│   - PostgreSQL (RLS)  │
│   (Next.js API)      │    │   - Auth (OAuth)      │
└──────────┬──────────┘    └──────────────────────┘
           │
           ▼
┌──────────────────────┐
│   Polar.sh           │
│   (구독 결제 + Webhook)│
└──────────────────────┘
```

---

## 2. 딥러닝 기술 상세

### 2.1 모델: MobileNetV2

| 항목 | 내용 |
|------|------|
| 아키텍처 | MobileNetV2 (α=1.0) |
| 입력 크기 | 224×224×3 |
| 출력 | 1,000개 ImageNet 클래스 확률 분포 |
| 파라미터 수 | 약 3.4M |
| 추론 환경 | TensorFlow.js (브라우저 내) |
| 백엔드 우선순위 | WebGL → WASM → CPU |

**MobileNetV2 핵심 구조:**
- Inverted Residual Block: 채널을 먼저 확장(expand)한 후 Depthwise Separable Convolution 적용
- Linear Bottleneck: 비선형 활성화 없이 정보 손실 최소화
- Depthwise Separable Conv: 채널별 독립 컨볼루션으로 연산량을 기존 대비 8~9배 감소
- ReLU6 활성화 함수: 저정밀도 연산 환경에서 수치 안정성 확보

### 2.2 TTA (Test-Time Augmentation)

단일 이미지를 여러 방식으로 크롭하여 앙상블 추론하는 기법. 모델의 편향(bias)을 줄이고 분산(variance)을 낮춰 정확도를 향상시킨다.

**구현 방식:**

```
원본 이미지 → 256×256 리사이즈
                    │
        ┌───────────┼───────────┐
        │           │           │
   224×224 crop (5가지 위치)
   ┌─────────┬─────────┬─────────┐
   │ top-left│  top-   │top-right│
   │         │  center │         │
   ├─────────┼─────────┼─────────┤
   │         │ center  │         │
   │         │ (중앙)  │         │
   └─────────┴─────────┴─────────┘
        각 crop → MobileNetV2 추론
              ↓
        확률값 평균 앙상블
              ↓
         최종 Top-5 결과
```

- 무료 사용자: center + top-left + bottom-right (3-crop)
- 프리미엄 사용자: 5-crop 전체

**정규화:** TensorFlow.js의 `browser.fromPixels()`로 픽셀 읽기 → `resizeBilinear()`로 256×256 리사이즈 → 224×224 슬라이스 → `toFloat()` (값 범위 [0, 255] 유지 — MobileNet 내부에서 [0,255]→[-1,1] 정규화 처리)

### 2.3 Grad-CAM (Gradient-weighted Class Activation Mapping)

CNN의 마지막 컨볼루션 레이어에서 특정 클래스에 대한 그래디언트를 역전파하여, 모델이 해당 예측을 내릴 때 이미지의 어느 영역에 주목했는지를 히트맵으로 시각화하는 기법.

**수식:**

```
α_k^c = (1/Z) Σ_i Σ_j (∂y^c / ∂A^k_ij)   ← 클래스 c에 대한 특징맵 k의 중요도

L^c_Grad-CAM = ReLU(Σ_k α_k^c · A^k)        ← 가중합 후 음수 제거
```

- `y^c`: 클래스 c의 예측 점수
- `A^k`: k번째 특징맵
- `α_k^c`: 특징맵 k가 클래스 c 예측에 기여하는 가중치

**구현:** TensorFlow.js `tf.GradientTape()`로 그래디언트 계산 → 히트맵을 원본 이미지 크기로 리사이즈 → 컬러맵(jet) 적용 → 원본 이미지에 반투명 오버레이

### 2.4 불확실도 추정 (Predictive Uncertainty)

TTA 앙상블의 예측 분산으로 모델 신뢰도를 정량화. 베이지안 딥러닝의 Monte Carlo Dropout과 유사한 접근.

```
σ = √( (1/N) Σ_i (p_i - p̄)² )

p_i: i번째 crop의 Top-1 확률
p̄:  평균 확률
N:  crop 수
```

σ값이 낮을수록 앙상블 예측이 일관적 (신뢰도 높음), 높을수록 예측이 불안정함을 의미.

### 2.5 음식 분류 필터링

MobileNetV2는 ImageNet 1,000개 클래스로 훈련되어 있어 비음식 클래스도 포함된다. 300+ 음식 키워드 DB로 비음식 결과를 필터링하고 음식 결과만 표시한다.

```typescript
// 음식 키워드 매칭 후 필터링
const foodOnly = predictions.filter(p =>
  FOOD_KEYWORDS.some(kw => p.className.toLowerCase().includes(kw))
)
```

한글 번역은 국립국어원 표준국어대사전 기준 300+ 항목 매핑.

---

## 3. 백엔드 설계

### 3.1 데이터베이스 스키마 (Supabase PostgreSQL)

```sql
-- 사용자 플랜 및 사용량
CREATE TABLE users (
  id       UUID PRIMARY KEY REFERENCES auth.users,
  plan     TEXT DEFAULT 'free',    -- 'free' | 'premium'
  daily_count INT DEFAULT 0,
  reset_at TIMESTAMPTZ DEFAULT NOW()
);

-- 분류 히스토리 (프리미엄)
CREATE TABLE classifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES users(id),
  image_url  TEXT,
  top1_label TEXT,
  top1_conf  FLOAT,
  results    JSONB,
  sigma      FLOAT,
  backend    TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.2 API 엔드포인트

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/auth/login` | Google OAuth 시작 |
| GET | `/api/auth/callback` | OAuth 콜백 처리 |
| GET | `/api/auth/logout` | 로그아웃 + 홈 리다이렉트 |
| GET | `/api/polar/checkout` | Polar.sh 결제 세션 생성 |
| POST | `/api/polar/webhook` | 결제 이벤트 수신 → 플랜 업데이트 |

### 3.3 결제 플로우 (Polar.sh)

```
사용자 클릭
    ↓
GET /api/polar/checkout
    ↓ Polar SDK로 checkout 세션 생성 (이메일 pre-fill)
    ↓
Polar.sh 결제 페이지
    ↓ 결제 완료
POST /api/polar/webhook  (Polar → 서버)
    ↓ Standard Webhooks 서명 검증 (HMAC-SHA256)
    ↓ subscription.created / subscription.updated 이벤트
    ↓
Supabase users.plan = 'premium' 업데이트
```

**Webhook 서명 검증 (Standard Webhooks 규격):**
```
서명 검증 = HMAC-SHA256( "{webhook-id}.{webhook-timestamp}.{body}", secret )
```
5분 이상 오래된 요청은 재전송 공격(replay attack) 방지를 위해 거부.

---

## 4. 프론트엔드 설계

### 4.1 렌더링 전략

| 페이지 | 전략 | 이유 |
|--------|------|------|
| `/` | SSR | 로그인 상태 확인 |
| `/app` | SSR + Client | 인증 체크 후 TF.js 분류기 클라이언트 실행 |
| `/pricing` | Client | 결제 버튼 인터랙션 |
| `/dashboard` | SSR | Supabase 히스토리 조회 |

### 4.2 TensorFlow.js 백엔드 초기화

```typescript
// 백엔드 우선순위: WebGL > WASM > CPU
for (const backend of ['webgl', 'wasm', 'cpu']) {
  try {
    await tf.setBackend(backend)
    await tf.ready()
    break
  } catch { continue }
}
```

### 4.3 이미지 전처리 파이프라인

```
HTMLImageElement
    │
    ▼ tf.browser.fromPixels()
Tensor3D [H, W, 3] (uint8, 0~255)
    │
    ▼ resizeBilinear([256, 256])
Tensor3D [256, 256, 3] (float32, 0~255)
    │
    ▼ slice([y, x, 0], [224, 224, 3])  × N crops
Tensor3D [224, 224, 3] (0~255 유지)
    │
    ▼ MobileNet.classify()  ← 내부에서 /127 - 1 정규화 → [-1, 1]
Array<{className, probability}>
```

---

## 5. 보안

| 항목 | 구현 |
|------|------|
| 인증 | Supabase JWT, HttpOnly 쿠키 |
| DB 접근 | Row Level Security (RLS) — 본인 데이터만 접근 |
| Webhook 위변조 방지 | HMAC-SHA256 서명 검증 + 타임스탬프 검증 |
| 이미지 프라이버시 | 브라우저 내 추론 — 이미지 서버 미전송 |
| 환경변수 | Vercel 서버 전용 환경변수로 클라이언트 미노출 |

---

## 6. 성능

| 항목 | 수치 |
|------|------|
| 모델 로딩 (초기) | WebGL 기준 약 2~4초 |
| 추론 속도 (3-crop) | WebGL 기준 약 1~2초 |
| 추론 속도 (5-crop) | WebGL 기준 약 2~3초 |
| 모델 파라미터 | 3.4M (경량 모델) |
| 번들 크기 영향 | TF.js 동적 로드 (초기 번들 제외) |

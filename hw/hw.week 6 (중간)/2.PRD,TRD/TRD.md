# Prigio (프리지오) — 냉장고 AI 식재료 관리 & 레시피 추천 서비스
## TRD (기술 요구사항 문서)

> 버전 2.0 | 내부 배포용 기밀 문서  
> 본 문서는 **현재 구현 코드를 기준**으로 최신화된 Single Source of Truth입니다.  
> 마지막 업데이트: 2026-04

---

## 목차

- [A. 기술 개요](#a-기술-개요)
- [B. 확정 기술 스택](#b-확정-기술-스택)
- [C. 아키텍처 설계](#c-아키텍처-설계)
- [D. 데이터 모델 / DB 스키마](#d-데이터-모델--db-스키마)
- [E. API 설계](#e-api-설계)
- [F. 인증 설계](#f-인증-설계)
- [G. 사용 쿼터 로직](#g-사용-쿼터-로직)
- [H. 결제 통합 설계 (Polar.sh)](#h-결제-통합-설계-polarsh)
- [I. 외부 AI API 통합 설계](#i-외부-ai-api-통합-설계)
- [J. 레시피 추천 설계](#j-레시피-추천-설계)
- [K. 인프라 / 배포 설계](#k-인프라--배포-설계)
- [L. 보안 요구사항](#l-보안-요구사항)
- [M. 안정성 / 운영 안정성](#m-안정성--운영-안정성)
- [N. 테스트 전략](#n-테스트-전략)
- [O. 프로젝트 폴더 구조](#o-프로젝트-폴더-구조)
- [P. .env.example](#p-envexample)
- [Q. MVP 배포 계획](#q-mvp-배포-계획)
- [가정 사항](#가정-사항)
- [최종 결정 요약](#최종-결정-요약)

---

## A. 기술 개요

### A1. 고수준 아키텍처

```
┌──────────────────────────────────────────────────────────────┐
│  브라우저 (React SPA on Vercel)                               │
│    ↕ HTTPS REST API (axios + withCredentials)                 │
│  백엔드 (FastAPI on Railway — Docker)                         │
│    ↕ PostgreSQL (Supabase)                                    │
│    ↕ 외부 AI API (OpenAI GPT-4o Vision)                       │
│    ↕ Polar.sh (구독 결제 웹훅)                                │
│    ↕ Google OAuth 2.0                                         │
└──────────────────────────────────────────────────────────────┘
```

### A2. 시스템 경계 및 책임

| 컴포넌트 | 기술 | 책임 |
|---------|------|------|
| 프론트엔드 | React 18 + Vite + TypeScript + Tailwind | UI 렌더링, 상태 관리, API 호출 |
| 백엔드 | FastAPI (Python 3.11) | 비즈니스 로직, 인증, 쿼터, AI 오케스트레이션 |
| 데이터베이스 | PostgreSQL (Supabase) | 영구 데이터 저장, 트랜잭션 |
| 외부 AI API | OpenAI GPT-4o Vision | 이미지 분석(식재료 인식), 레시피 생성 |
| 결제 | Polar.sh | 구독 관리, 결제 처리, 웹훅 |
| 인증 | Google OAuth 2.0 | 사용자 신원 확인 |
| 프론트 배포 | Vercel | 정적 자산 CDN 배포 |
| 백엔드 배포 | Railway (Docker) | FastAPI 컨테이너 호스팅 |

---

## B. 확정 기술 스택

| 영역 | 기술 선택 | 선택 이유 |
|------|---------|---------|
| 프론트엔드 프레임워크 | React 18 + Vite + TypeScript | 빠른 HMR, 타입 안전성, 생태계 |
| 스타일링 | Tailwind CSS + inline style | 유틸리티 클래스, 빠른 프로토타이핑 |
| 상태 관리 | Zustand + React Query | 가벼운 전역 상태 + 서버 상태 캐싱 |
| 라우터 | React Router v7 | SPA 클라이언트 라우팅 |
| 백엔드 프레임워크 | FastAPI + Python 3.11 | 타입 힌트, 비동기, OpenAPI 자동 생성 |
| 데이터베이스 | PostgreSQL (Supabase) | 안정성, JSON 지원, 무료 티어 충분 |
| ORM | SQLAlchemy 2.0 + Alembic | 마이그레이션 관리, 비동기 지원 |
| 인증 토큰 | JWT (RS256) + HttpOnly Cookie | 보안성, XSS 방어 |
| AI API | OpenAI GPT-4o Vision | 식재료 인식 + 레시피 생성 통합, API 안정성 |
| 레시피 소스 | OpenAI GPT-4o (AI 직접 생성) | Spoonacular 미사용, 한국 요리 전문성, 재료 기반 맞춤 생성 |
| 결제 | Polar.sh | 구독 관리, 웹훅 HMAC 검증 |
| 프론트 배포 | Vercel | GitHub 자동 배포, CDN |
| 백엔드 배포 | Railway | Docker 지원, GitHub 연동, 합리적 가격 |
| API 통신 | axios (withCredentials: true) | CORS 쿠키 전송, 인터셉터 |
| 파일 임시 처리 | 메모리 내 처리 | 이미지 영구 저장 안 함 |

> **Railway 백엔드 배포 선택 이유**
> - Docker 컨테이너 네이티브 지원 → FastAPI 그대로 배포 가능
> - GitHub 연동 자동 배포 (push → 자동 빌드/배포, railway.toml 설정)
> - 합리적인 가격
> - 환경변수 UI 관리 편리
> - `railway.toml`에 `[build] builder = "dockerfile"` 설정으로 커스텀 Dockerfile 사용

---

## C. 아키텍처 설계

### C1. 인증 흐름 (Google OAuth + JWT)

1. 사용자 → 프론트엔드: "Google로 로그인" 클릭 (랜딩 페이지 또는 대시보드 리다이렉트 시)
2. 프론트엔드 → 백엔드: `GET /auth/google/login` → Google OAuth URL 반환
3. 브라우저 → Google: OAuth 동의 화면
4. Google → 백엔드: Authorization Code 전달 (`redirect_uri`)
5. 백엔드 → Google: code 교환 → `access_token`, `id_token` 수신
6. 백엔드: `id_token` 검증 → 사용자 조회/생성 → JWT(Access + Refresh) 발급 (RS256)
7. 백엔드 → 브라우저: **HttpOnly Secure SameSite=None Cookie**에 토큰 저장  
   _(Vercel 프론트 + Railway 백엔드 간 크로스 도메인 구조이므로 SameSite=None 필수)_
8. 이후 모든 API 요청: axios `withCredentials: true` → Cookie 자동 포함

### C2. AI 분석 흐름 (최대 이미지 2장)

1. 프론트엔드: 이미지 파일 1~2장 선택 및 FormData 생성
2. `POST /api/v1/analysis/upload` → 백엔드 수신
3. 백엔드: 쿼터 확인 (`feature='analysis'`, `usage_count < limit`)
4. 백엔드: 각 이미지 base64 변환 → **asyncio.gather**로 병렬 GPT-4o Vision API 호출
5. OpenAI: 이미지별 식재료 목록 JSON 반환 (90초 타임아웃)
6. 백엔드: 결과 병합 → **이름 기반 중복 제거** (`ingredient_normalizer.normalize_name()`)
7. 백엔드: 성공 시에만 `usage_count + 1` 증가 (실패/타임아웃 시 차감 없음)
8. 백엔드: 정규화된 재료 목록 반환
9. 프론트엔드: 수정 가능한 결과 UI 표시 (인라인 텍스트 편집)
10. 사용자 확인 → `POST /api/v1/fridge/ingredients/bulk` → 냉장고 저장

### C3. 레시피 생성 흐름 (AI 2단계)

1. 사용자: 음식 유형, 맛 선택
2. `POST /api/v1/recipes/ai/candidates` → GPT-4o가 냉장고 재료 기반 요리 후보 3개 제안
3. 사용자: 후보 중 1개 선택
4. `POST /api/v1/recipes/ai/generate` → GPT-4o가 선택한 요리의 상세 레시피 생성
5. 프론트엔드: 상세 레시피 표시

### C4. 결제/구독 흐름

1. 사용자: 구독 관리 페이지에서 업그레이드 버튼 클릭
2. 프론트엔드 → 백엔드: `POST /api/v1/billing/checkout`
3. 백엔드 → Polar.sh: 체크아웃 세션 생성 (`user_id` 메타데이터 포함)
4. 백엔드 → 프론트엔드: Polar.sh 체크아웃 URL 반환
5. 브라우저: Polar.sh 결제 페이지로 이동
6. 결제 완료 → Polar.sh: 백엔드 웹훅 엔드포인트로 이벤트 전송
7. 백엔드: 웹훅 HMAC 서명 검증 → `subscription` 상태 DB 업데이트
8. 사용자: 다음 API 요청부터 유료 혜택 적용 (analysis 30회 + recipe 30회)

---

## D. 데이터 모델 / DB 스키마

### D1. users 테이블

```sql
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) UNIQUE NOT NULL,
    google_id       VARCHAR(255) UNIQUE NOT NULL,
    display_name    VARCHAR(255),
    avatar_url      TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_google_id ON users(google_id);
CREATE INDEX idx_users_email ON users(email);
```

### D2. refresh_tokens 테이블

```sql
CREATE TABLE refresh_tokens (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash      VARCHAR(255) NOT NULL,  -- SHA-256 해시 저장
    expires_at      TIMESTAMPTZ NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked         BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);
```

### D3. subscriptions 테이블

```sql
CREATE TABLE subscriptions (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    polar_subscription_id   VARCHAR(255) UNIQUE,
    polar_customer_id       VARCHAR(255),
    status                  VARCHAR(50) NOT NULL,   -- active, canceled, past_due, expired
    plan_type               VARCHAR(50) NOT NULL DEFAULT 'free',  -- free, premium
    current_period_start    TIMESTAMPTZ,
    current_period_end      TIMESTAMPTZ,
    canceled_at             TIMESTAMPTZ,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_polar_subscription_id ON subscriptions(polar_subscription_id);
```

### D4. monthly_usage 테이블

```sql
CREATE TABLE monthly_usage (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    year_month      VARCHAR(7) NOT NULL,          -- 'YYYY-MM' (KST 기준)
    feature         VARCHAR(50) NOT NULL,          -- 'analysis' | 'recipe'
    usage_count     INTEGER NOT NULL DEFAULT 0,
    limit_count     INTEGER NOT NULL DEFAULT 5,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT unique_user_year_month_feature UNIQUE (user_id, year_month, feature)
);

CREATE INDEX idx_monthly_usage_user_year_month ON monthly_usage(user_id, year_month);

-- 플랜별 limit_count
-- Free:    analysis=5,  recipe=10
-- Premium: analysis=30, recipe=30
-- Admin:   analysis=99999, recipe=99999 (ADMIN_UNLIMITED)
-- 예시: year_month = '2025-01' (KST 기준 달 계산)
```

### D5. refrigerators 테이블

```sql
CREATE TABLE refrigerators (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    name            VARCHAR(255) NOT NULL DEFAULT '내 냉장고',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- user_id UNIQUE → 사용자당 냉장고 1개 보장
```

### D6. ingredients 테이블

```sql
CREATE TABLE ingredients (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    refrigerator_id UUID NOT NULL REFERENCES refrigerators(id) ON DELETE CASCADE,
    name            VARCHAR(255) NOT NULL,   -- 정규화된 재료명
    original_name   VARCHAR(255),            -- AI 인식 원본명
    quantity        DECIMAL(10,2),
    unit            VARCHAR(50),             -- kg, g, 개, 봉지 등
    expiry_date     DATE,
    category        VARCHAR(50),             -- vegetable, fruit, meat_fish, dairy, cooked, egg_convenience, ready_made, sauce, beverage, grain, other
    source          VARCHAR(50) NOT NULL DEFAULT 'manual',  -- manual, ai_analysis
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ingredients_refrigerator_id ON ingredients(refrigerator_id);
CREATE INDEX idx_ingredients_expiry_date ON ingredients(expiry_date);
```

> **식재료 카테고리 11종**  
> `vegetable`(채소), `fruit`(과일), `meat_fish`(육류·수산), `dairy`(유제품), `cooked`(조리식품), `egg_convenience`(달걀·간편식), `ready_made`(즉석·통조림), `sauce`(소스·양념), `beverage`(음료), `grain`(곡물·면), `other`(기타)

### D7. webhook_events 테이블

```sql
CREATE TABLE webhook_events (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider        VARCHAR(50) NOT NULL,    -- 'polar'
    event_type      VARCHAR(100) NOT NULL,   -- 'subscription.created' 등
    polar_event_id  VARCHAR(255) UNIQUE,     -- 멱등성 보장
    payload         JSONB NOT NULL,
    processed       BOOLEAN NOT NULL DEFAULT FALSE,
    processed_at    TIMESTAMPTZ,
    error_message   TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_webhook_events_provider_type ON webhook_events(provider, event_type);
CREATE INDEX idx_webhook_events_processed ON webhook_events(processed);
```

> **참고**: `analysis_history` 테이블은 스키마 정의는 있으나 현재 API에서 이력 저장 기능은 미구현 상태.

---

## E. API 설계

### E1. 인증 API

| Method | 경로 | 설명 | 인증 필요 |
|--------|------|------|---------|
| GET | `/auth/google/login` | Google OAuth URL 반환 | 아니오 |
| GET | `/auth/google/callback` | OAuth 콜백 처리, JWT 발급 | 아니오 |
| POST | `/auth/refresh` | Access Token 갱신 | 아니오 (Refresh Cookie) |
| POST | `/auth/logout` | 로그아웃, 토큰 무효화 | 예 |
| GET | `/auth/me` | 현재 사용자 정보 조회 | 예 |

### E2. 냉장고/식재료 API

| Method | 경로 | 설명 | 인증 |
|--------|------|------|------|
| GET | `/api/v1/fridge` | 내 냉장고 + 재료 목록 조회 | 예 |
| POST | `/api/v1/fridge/ingredients` | 재료 단건 추가 | 예 |
| POST | `/api/v1/fridge/ingredients/bulk` | 재료 일괄 추가 (AI 결과 반영) | 예 |
| PATCH | `/api/v1/fridge/ingredients/:id` | 재료 수정 | 예 |
| DELETE | `/api/v1/fridge/ingredients/:id` | 재료 삭제 | 예 |
| POST | `/api/v1/fridge/ingredients/classify` | AI로 'other' 재료 카테고리 재분류 (최대 30개) | 예 |

> **일괄 삭제 구현 방식**: 별도 bulk DELETE API 없음. 프론트엔드에서 `Promise.all(ids.map(id => DELETE /api/v1/fridge/ingredients/:id))`로 병렬 개별 삭제 처리. 낙관적 즉시 UI 제거 후 실패 시 서버 상태로 복원.

### E3. AI 분석 API

| Method | 경로 | 설명 | 인증 |
|--------|------|------|------|
| POST | `/api/v1/analysis/upload` | 이미지 업로드 및 AI 분석 실행 (최대 2장) | 예 |
| GET | `/api/v1/analysis/history` | 분석 이력 조회 (미구현) | 예 |

#### `POST /api/v1/analysis/upload` 상세 명세

```
요청: multipart/form-data
  - images: File[] (JPEG/PNG/WEBP, max 10MB 각, 최대 2장)

성공 응답 (200):
{
  "detected_ingredients": [
    { "name": "당근", "quantity": 2, "unit": "개", "confidence": 0.95 }
  ],
  "analysis": {
    "analysis_usage": N, "analysis_limit": N, "analysis_remaining": N,
    "recipe_usage": N, "recipe_limit": N, "recipe_remaining": N
  }
}

오류 응답:
  402 - 쿼터 초과:    { "error": "quota_exceeded", ... }
  400 - 파일 오류:    { "error": "invalid_file", "detail": "..." }
  408 - 타임아웃:     { "error": "analysis_timeout" }
  422 - 파싱 실패:    { "error": "parsing_failed" }
  500 - 서버 오류:    { "error": "internal_error" }

※ 402 / 408 / 422 / 500 발생 시 usage_count 차감 없음
※ 이미지 2장 병렬 처리 (asyncio.gather), 90초 타임아웃
```

### E4. 쿼터 API

| Method | 경로 | 설명 | 인증 |
|--------|------|------|------|
| GET | `/api/v1/quota/status` | 현재 월 분석·레시피 사용량 조회 | 예 |

```
응답 (200) — feature별 분리:
{
  "year_month": "2025-01",
  "analysis_usage": 3,
  "analysis_limit": 5,
  "analysis_remaining": 2,
  "recipe_usage": 7,
  "recipe_limit": 10,
  "recipe_remaining": 3,
  "plan_type": "free",
  "reset_date": "2025-02-01T00:00:00+09:00"
}
```

### E5. 레시피 API

| Method | 경로 | 설명 | 인증 |
|--------|------|------|------|
| POST | `/api/v1/recipes/ai/candidates` | AI 요리 후보 3개 생성 (냉장고 기반) | 예 |
| POST | `/api/v1/recipes/ai/generate` | 선택한 요리의 상세 레시피 AI 생성 | 예 |
| GET | `/api/v1/recipes/curated` | 큐레이션 레시피 목록 조회 | 예 |

> **북마크**: 서버 API 없음. 클라이언트 localStorage 기반으로만 관리.

#### `POST /api/v1/recipes/ai/candidates` 요청

```json
{
  "ingredients": ["당근", "계란", "두부"],
  "food_types": ["한식", "양식"],
  "custom_type": "",
  "tastes": ["담백한", "간단한"]
}
```

> **지원 맛 필터 (tastes)**: `매운음식` / `단음식` / `짠음식` / `다이어트`  
> `다이어트` 선택 시 GPT-4o 프롬프트에 저칼로리·고단백 지침이 추가되어 식단 친화적 레시피 후보가 생성됩니다.

#### `POST /api/v1/recipes/ai/generate` 요청

```json
{
  "ingredients": ["당근", "계란", "두부"],
  "food_types": ["한식"],
  "custom_type": "",
  "tastes": ["담백한"],
  "selected_dish": "계란두부찜"
}
```

### E6. 구독/결제 API

| Method | 경로 | 설명 | 인증 |
|--------|------|------|------|
| GET | `/api/v1/billing/status` | 현재 구독 상태 조회 | 예 |
| POST | `/api/v1/billing/checkout` | Polar.sh 체크아웃 세션 생성 | 예 |
| POST | `/api/v1/billing/cancel` | 구독 취소 요청 | 예 |
| POST | `/webhooks/polar` | Polar.sh 웹훅 수신 (HMAC 서명 검증) | 아니오 |

### E7. 관리자 API

| Method | 경로 | 설명 | 인증 |
|--------|------|------|------|
| GET | `/api/v1/admin/users` | 전체 사용자 목록 조회 | 어드민 전용 |
| GET | `/api/v1/admin/stats` | 서비스 통계 | 어드민 전용 |
| PATCH | `/api/v1/admin/users/:id/plan` | 사용자 플랜 강제 변경 | 어드민 전용 |

> **어드민 식별**: `monthly_usage.limit_count = 99999` (ADMIN_UNLIMITED) 또는 별도 admin 플래그로 구별.

### E8. 이미지 프록시 API

| Method | 경로 | 설명 | 인증 |
|--------|------|------|------|
| GET | `/api/v1/image-proxy` | 외부 이미지 URL 프록시 (CORS 우회) | 아니오 |

```
쿼리 파라미터: ?url=<외부 이미지 URL>
캐시: 메모리 LRU 200 엔트리
동시 요청 제한: asyncio.Semaphore(4)
```

---

## F. 인증 설계

### F1. JWT 전략

| 항목 | 설정값 | 이유 |
|------|-------|------|
| 알고리즘 | RS256 | 비대칭키, 공개키 검증 가능 |
| Access Token 만료 | 15분 | 보안: 탈취 시 피해 최소화 |
| Refresh Token 만료 | 30일 | 사용 편의성 |
| 저장 방식 | **HttpOnly Secure SameSite=None Cookie** | XSS 방어, 크로스 도메인 전송 |
| Refresh Token 저장 | DB SHA-256 해시 저장 | 강제 만료/로그아웃 지원 |

### F2. 토큰 갱신 전략

- Access Token 만료 시: 프론트엔드가 `/auth/refresh` 자동 호출 (axios 인터셉터)
- Refresh Token 만료 시: 랜딩 페이지(`/`)로 리다이렉트
- 보안 이벤트 발생 시: 해당 사용자의 모든 Refresh Token 일괄 무효화

### F3. Cookie 설정 (실제 구현)

```
Set-Cookie: access_token=...; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=900
Set-Cookie: refresh_token=...; HttpOnly; Secure; SameSite=None; Path=/auth/refresh; Max-Age=2592000
```

> **SameSite=None 필수 이유**  
> 프론트엔드는 Vercel(`*.vercel.app`) 도메인, 백엔드는 Railway 도메인으로  
> **서로 다른 최상위 도메인**을 사용하는 크로스 도메인 구조.  
> SameSite=Strict 또는 Lax 사용 시 Cookie가 전달되지 않음.  
> 반드시 `SameSite=None; Secure` 조합 필요.

---

## G. 사용 쿼터 로직

### G1. 플랜별 쿼터

| 플랜 | 분석(analysis) | 레시피(recipe) | 비고 |
|------|--------------|--------------|------|
| Free | 월 5회 | 월 10회 | limit_count = 5 / 10 |
| Premium | 월 30회 | 월 30회 | limit_count = 30 / 30 |
| Admin | 99999회 | 99999회 | ADMIN_UNLIMITED |

### G2. 타임존 기준

```
모든 year_month 계산은 KST(UTC+9) 기준.

예시:
  2025-01-31 23:59 KST → year_month = '2025-01'
  2025-02-01 00:00 KST → year_month = '2025-02' (새 월, 자동 초기화)

이유: 한국 서비스이므로 사용자 체감 시간 = KST

서버 구현:
  from zoneinfo import ZoneInfo
  from datetime import datetime
  year_month = datetime.now(ZoneInfo('Asia/Seoul')).strftime('%Y-%m')
```

### G3. 쿼터 확인 및 차감 로직

```python
async def check_and_increment_quota(
    user_id: str, db: AsyncSession, feature: str = 'analysis'
) -> None:
    """
    쿼터 확인 + 성공 후 차감을 원자적으로 처리.
    feature: 'analysis' | 'recipe'
    한도 초과 시 QuotaExceededException 발생.
    """
    year_month = datetime.now(ZoneInfo('Asia/Seoul')).strftime('%Y-%m')

    async with db.begin():
        result = await db.execute(
            select(MonthlyUsage)
            .where(
                MonthlyUsage.user_id == user_id,
                MonthlyUsage.year_month == year_month,
                MonthlyUsage.feature == feature  # feature별 별도 행
            )
            .with_for_update()  # 행 수준 잠금 → 레이스 컨디션 방지
        )
        usage = result.scalar_one_or_none()

        if not usage:
            # 신규 월/feature: 레코드 생성
            default_limit = FREE_LIMITS[feature]  # 'analysis': 5, 'recipe': 10
            usage = MonthlyUsage(
                user_id=user_id,
                year_month=year_month,
                feature=feature,
                limit_count=default_limit
            )
            db.add(usage)
            await db.flush()

        if usage.usage_count >= usage.limit_count:
            raise QuotaExceededException(...)

        usage.usage_count += 1
```

### G4. 레이스 컨디션 방지 전략

- `SELECT ... FOR UPDATE` 를 통한 행 수준 잠금
- 트랜잭션 내 확인-증가 원자적 처리
- AI API 성공 응답 수신 **이후에만** `check_and_increment_quota` 호출

---

## H. 결제 통합 설계 (Polar.sh)

### H0. ⚠️ 현재 구현 제한사항 — 실결제 미완성

> Polar.sh 및 Stripe는 **해외 계좌(또는 해외 법인) 보유자**만 실제 수납이 가능합니다.
>
> | 항목 | 상태 |
> |------|------|
> | 결제창(체크아웃 페이지) 진입 | ✅ 정상 동작 |
> | 카드 정보 입력 UI | ✅ Polar.sh 페이지 표시 |
> | 실제 결제 완료 및 웹훅 수신 | ❌ 해외 계좌 미보유로 불가 |
> | 프리미엄 플랜 부여 방식 | 관리자 수동 부여(`/api/v1/admin`) |
>
> **해결 방안 (Phase 2)**
> - 국내 PG사(토스페이먼츠, NHN KCP 등) SDK 연동
> - 또는 해외 법인 계좌 확보 후 Polar.sh/Stripe 실결제 활성화

### H1. 웹훅 처리 흐름

1. `POST /webhooks/polar` 수신
2. `X-Polar-Signature` 헤더 HMAC 검증 (비밀 키 대조)
3. `webhook_events` 테이블에 이벤트 저장 (`polar_event_id` 중복 체크로 멱등성 보장)
4. 이벤트 유형별 처리:
   - `subscription.created` → `subscriptions` 레코드 생성, `plan_type='premium'`, `limit_count=30`으로 갱신
   - `subscription.updated` → 상태 동기화
   - `subscription.canceled` → `canceled_at` 기록, 기간 종료까지 유료 유지
   - `subscription.revoked` → 즉시 `free`로 다운그레이드, `limit_count=5/10` 복원
   - `payment.failed` → `status='past_due'` 기록
5. **200 응답 반환** (처리 실패 시에도 200 반환 후 내부 에러 로깅 → Polar.sh 재전송 방지)

### H2. 구독 상태 매핑

| Polar.sh 이벤트 | DB status | 사용자 플랜 |
|---------------|---------|----------|
| `subscription.created` | `active` | premium (analysis 30 / recipe 30) |
| `subscription.updated` (active) | `active` | premium |
| `subscription.canceled` | `canceled` | premium (기간 내) |
| `subscription.revoked` | `expired` | free (analysis 5 / recipe 10 복원) |
| `payment.failed` | `past_due` | premium (유예) |
| `payment.succeeded` (재결제) | `active` | premium |

### H3. 멱등성 보장

```python
async def handle_polar_webhook(event_id: str, ...):
    existing = await db.execute(
        select(WebhookEvent).where(WebhookEvent.polar_event_id == event_id)
    )
    if existing.scalar_one_or_none():
        return  # 중복 처리 방지
    ...
```

---

## I. 외부 AI API 통합 설계

### I1. 백엔드 중개 필수 이유

- API 키를 클라이언트에 노출하면 키 탈취 → 무제한 API 호출 → **비용 폭발**
- 쿼터 차감 로직은 반드시 서버에서 처리해야 함 (클라이언트 조작 방지)
- 이미지 전처리, 결과 정규화, 오류 처리를 서버에서 통제

### I2. OpenAI Vision API 호출 전략

```python
OPENAI_MODEL = "gpt-4o"
OPENAI_TIMEOUT_SECONDS = 90   # 90초 타임아웃 (이미지 복잡도에 따라 시간 소요)
OPENAI_MAX_RETRIES = 1

SYSTEM_PROMPT = """
당신은 냉장고 이미지에서 식재료를 인식하는 전문가입니다.
이미지에서 보이는 모든 식재료를 JSON으로만 반환하세요.
형식: {"ingredients": [{"name": "재료명(한국어)", "quantity": 숫자, "unit": "단위", "confidence": 0~1}]}
재료가 없으면 {"ingredients": []} 반환.
JSON 외 다른 텍스트 출력 절대 금지.
"""

async def analyze_image(image_bytes: bytes) -> list[dict]:
    b64 = base64.b64encode(image_bytes).decode('utf-8')
    response = await openai_client.chat.completions.create(
        model=OPENAI_MODEL,
        max_tokens=2000,
        timeout=OPENAI_TIMEOUT_SECONDS,
        messages=[{
            "role": "system", "content": SYSTEM_PROMPT
        }, {
            "role": "user",
            "content": [
                {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{b64}"}},
            ]
        }],
        response_format={"type": "json_object"}
    )
    return parse_ai_response(response.choices[0].message.content)

# 2장 병렬 처리
results = await asyncio.gather(*[analyze_image(img) for img in images])
```

### I3. 재시도 정책

```
최대 재시도: 1회 (OPENAI_MAX_RETRIES = 1)
전체 타임아웃: 90초
재시도 제외: 400, 401, 402, 422 (클라이언트 오류)
```

### I4. 결과 정규화

- `ingredient_normalizer.py`: 동의어 정규화 (예: `"토마토"` = `"방울토마토"` = `"토마테"`)
- 이름 기반 중복 제거: 2장 이미지 결과 병합 시 같은 재료 중복 제거
- 신뢰도(`confidence`) 낮은 항목도 반환 (프론트에서 사용자가 직접 편집 가능)
- 빈 응답 또는 JSON 파싱 실패 → 오류 반환, 횟수 미차감

---

## J. 레시피 추천 설계

### J1. AI 레시피 생성 전략 (GPT-4o 2단계)

> **Spoonacular API 미사용** — 전량 OpenAI GPT-4o로 생성.  
> 한국 요리 커버리지 및 냉장고 재료 맞춤 생성에 최적화.

**1단계 — 요리 후보 생성**

```python
CANDIDATE_SYSTEM_PROMPT = """
당신은 한국 요리 전문 AI입니다.
주어진 냉장고 재료로 만들 수 있는 요리 3가지를 추천하세요.
형식: {"candidates": [{"dish": "요리명", "description": "간단 설명", "difficulty": "쉬움/보통/어려움"}]}
JSON만 반환하세요.
"""
```

**2단계 — 상세 레시피 생성**

```python
RECIPE_SYSTEM_PROMPT = """
당신은 요리 레시피 전문가입니다.
선택된 요리의 상세 레시피를 생성하세요.
형식: {"title": "...", "ingredients": [...], "steps": [...], "tips": "..."}
JSON만 반환하세요.
"""
```

### J2. 큐레이션 레시피 (CURATED_RECIPES)

- `recipe_service.py`에 하드코딩된 한국 요리 기본 레시피 목록 보유
- AI 생성 레시피 외 보조 레시피로 활용

### J3. 매칭률 표현 (큐레이션 레시피)

| 매칭률 | UI 표시 | 색상 |
|-------|---------|------|
| ≥ 80% | "지금 바로 만들 수 있어요!" | Green |
| 50~79% | "재료 N개만 더 있으면" | Amber |
| < 50% | "재료 일부 필요" | Gray |

### J4. 영양 정보 표시 (RecipeDetail)

- AI 생성 레시피 응답에 `nutrition` 필드가 포함될 경우 레시피 상세 페이지 하단에 2×2 그리드 카드로 표시
- 표시 항목: 칼로리(kcal) · 단백질(g) · 탄수화물(g) · 지방(g) — 1인분 기준
- 조건부 렌더링: `nutrition` 필드 자체가 없거나 모든 값이 `null`이면 섹션 숨김
- 프론트엔드 TypeScript 타입: `nutrition?: { calories?: number; protein?: number; carbs?: number; fat?: number }`
- 백엔드 레시피 생성 프롬프트에서 `nutrition` 필드 반환 시 자동 표시 (현재 AI가 반환하는 경우에만 표시)

---

## K. 인프라 / 배포 설계

### K1. CI/CD 파이프라인

```
프론트엔드 (Vercel):
  - main 브랜치 push → Vercel 자동 빌드/배포
  - PR → 미리보기 URL 자동 생성 (ai-gunwoo-*.vercel.app 패턴)
  - 환경변수: Vercel 대시보드에서 관리

백엔드 (Railway):
  - main 브랜치 push → Railway 자동 Docker 빌드/배포
  - railway.toml 설정: [build] builder = "dockerfile"
  - 환경변수: Railway 대시보드에서 관리

DB 마이그레이션:
  - 배포 시 Alembic migrate 자동 실행
  - Dockerfile CMD: ["sh", "-c", "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT"]
```

### K2. Dockerfile (백엔드)

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["sh", "-c", "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
```

### K3. 도메인 / CORS / HTTPS

- 프론트엔드 도메인: `ai-gunwoo-*.vercel.app` (Vercel 자동 배포 도메인)
- 백엔드 도메인: Railway 제공 도메인
- HTTPS: Vercel/Railway 모두 자동 SSL 인증서 발급

```python
# FastAPI CORS 설정 (실제 구현)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "https://ai-gunwoo.vercel.app",
        # 추가 명시 도메인들...
    ],
    allow_origin_regex=r"https://ai-gunwoo-.*\.vercel\.app",  # PR 미리보기 URL 패턴
    allow_credentials=True,  # Cookie 전송 허용
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "Cookie"],
)
```

> **allow_origin_regex 필요 이유**  
> Vercel은 PR마다 `https://ai-gunwoo-<hash>.vercel.app` 형태의 미리보기 URL을 자동 생성함.  
> 정규식으로 이 패턴 전체를 허용하지 않으면 개발 중 CORS 에러 발생.

---

## L. 보안 요구사항

| 항목 | 구현 방법 |
|------|---------|
| XSS 방어 | HttpOnly Cookie로 토큰 저장, React 기본 HTML 이스케이핑 |
| CSRF 방어 | SameSite=None + HTTPS 전용 (Secure 플래그) |
| SQL 인젝션 | SQLAlchemy ORM 파라미터 바인딩 (Raw SQL 지양) |
| 파일 업로드 검증 | MIME 타입 확인, 파일 크기 제한 (10MB), 이미지 헤더 검증 |
| API 키 보호 | 환경변수 저장, `.gitignore`에 `.env` 포함, 코드베이스 노출 금지 |
| 웹훅 검증 | Polar.sh HMAC 서명 검증 (`X-Polar-Signature` 헤더) |
| 쿼터 어뷰징 | 서버 측 트랜잭션 처리, 클라이언트 전달 값 신뢰 안 함 |
| 이미지 보안 | 분석 후 즉시 삭제, 영구 저장 없음 |
| 이미지 프록시 | Semaphore(4)로 동시 요청 제한, LRU 캐시(200 엔트리) |

---

## M. 안정성 / 운영 안정성

### M1. 예상 실패 지점 및 대응

| 위험 지점 | 대응 전략 |
|---------|---------|
| AI API 타임아웃 | **90초** 타임아웃 설정, 재시도 1회, 실패 시 graceful error + 횟수 미차감 |
| DB 연결 풀 고갈 | SQLAlchemy `pool_size=10, max_overflow=20` 설정 |
| Polar.sh 웹훅 실패 | `webhook_events` 테이블 저장 후 재처리, 멱등성 보장 |
| Railway 배포 실패 | 이전 버전 롤백 (Railway 배포 이력 보존) |
| 메모리 누수 (이미지) | 메모리 내 처리, 컨텍스트 종료 시 자동 GC |
| 인증 토큰 탈취 | 단기 Access Token (15분) + HttpOnly Cookie + HTTPS 전송 |
| CORS 미리보기 URL | `allow_origin_regex` 패턴으로 Vercel 미리보기 도메인 전체 허용 |

### M2. 모니터링 권장

- **Railway 대시보드**: CPU/메모리/네트워크 기본 모니터링
- **Polar.sh 대시보드**: 구독/결제 이벤트 모니터링
- **OpenAI 대시보드**: 월별 비용 한도 알림 설정 (비용 폭발 방지)

---

## N. 테스트 전략

| 테스트 유형 | 도구 | 커버리지 목표 |
|-----------|------|------------|
| 백엔드 단위 테스트 | pytest + pytest-asyncio | 핵심 비즈니스 로직 80%+ |
| API 통합 테스트 | pytest + httpx TestClient | 모든 엔드포인트 |
| 쿼터 로직 테스트 | pytest + DB 트랜잭션 | 경계값, 동시 요청, feature 분리 |
| 웹훅 처리 테스트 | pytest + 시그니처 모킹 | 모든 Polar.sh 이벤트 유형 |
| AI API 모킹 | pytest-mock | 성공/실패/타임아웃 3가지 시나리오 |
| 프론트엔드 컴포넌트 | Vitest + React Testing Library | 핵심 UI 컴포넌트 |

### 핵심 테스트 케이스

```python
class TestQuotaLogic:
    async def test_free_analysis_limit_is_5(self): ...
    async def test_free_recipe_limit_is_10(self): ...
    async def test_premium_analysis_limit_is_30(self): ...
    async def test_quota_not_decremented_on_ai_failure(self): ...
    async def test_quota_not_decremented_on_timeout(self): ...
    async def test_concurrent_requests_not_exceed_limit(self): ...
    async def test_analysis_and_recipe_quotas_are_independent(self): ...
    async def test_monthly_reset_on_new_month(self): ...
```

---

## O. 프로젝트 폴더 구조

### O1. 프론트엔드 (fridgeai-frontend/)

```
fridgeai-frontend/
├── public/
│   └── images/
│       ├── bg-market.jpg       # 배경 슬라이드쇼 이미지 1
│       └── bg-seafood.jpg      # 배경 슬라이드쇼 이미지 2
├── src/
│   ├── api/                    # API 클라이언트 (axios 래퍼)
│   │   ├── auth.ts
│   │   ├── fridge.ts
│   │   ├── analysis.ts
│   │   ├── recipes.ts
│   │   ├── quota.ts
│   │   └── billing.ts
│   ├── components/
│   │   ├── AdminPanel.tsx       # 관리자용 플로팅 패널 컴포넌트
│   │   └── BackgroundSlideshow.tsx  # 배경 이미지 슬라이드쇼 (6s 간격)
│   ├── pages/
│   │   ├── Landing.tsx         # / — 랜딩 페이지
│   │   ├── Dashboard.tsx       # /dashboard — 2×2 퀵액션 그리드
│   │   ├── Fridge.tsx          # /fridge — 11종 카테고리 재료 관리
│   │   ├── Analyze.tsx         # /analyze — 최대 2장 이미지 분석
│   │   ├── Recipes.tsx         # /recipes — AI 2단계 레시피 추천
│   │   ├── RecipeDetail.tsx    # /recipes/:id
│   │   └── Subscription.tsx    # /subscription — 구독 관리
│   ├── store/                  # Zustand 전역 상태
│   │   ├── authStore.ts
│   │   └── quotaStore.ts
│   ├── types/
│   │   └── index.ts            # TypeScript 타입 정의 (QuotaStatus, Ingredient 등)
│   ├── utils/
│   ├── App.tsx                 # 라우터 + BackgroundSlideshow + AdminPanel
│   └── main.tsx
├── PRD.md
├── TRD.md
├── CLAUDE.md
├── Prigio_Design_Spec_v1.0.md
├── .env.example
├── vite.config.ts
├── tailwind.config.ts
└── package.json
```

> **라우트 목록**: `/`, `/dashboard`, `/fridge`, `/analyze`, `/recipes`, `/recipes/:id`, `/subscription`  
> **없는 라우트**: `/login`, `/settings` (별도 페이지 없음)

### O2. 백엔드 (fridgeai-backend/)

```
fridgeai-backend/
├── app/
│   ├── api/
│   │   └── v1/
│   │       ├── admin.py              # 관리자 API
│   │       ├── analysis.py           # AI 이미지 분석 (MAX_IMAGES=2)
│   │       ├── auth.py               # Google OAuth + JWT
│   │       ├── billing.py            # Polar.sh 결제
│   │       ├── fridge.py             # 냉장고/식재료 CRUD + /classify
│   │       ├── quota.py              # 사용량 조회
│   │       └── recipes.py            # AI 2단계 레시피
│   ├── core/
│   │   ├── config.py                 # 환경변수 (OPENAI_TIMEOUT_SECONDS=90)
│   │   ├── security.py               # JWT RS256 유틸
│   │   ├── database.py               # SQLAlchemy 비동기 설정
│   │   └── dependencies.py           # FastAPI Depends 공통 의존성
│   ├── models/                       # SQLAlchemy ORM 모델
│   │   ├── user.py
│   │   ├── subscription.py
│   │   ├── fridge.py
│   │   ├── usage.py
│   │   └── webhook.py
│   ├── schemas/                      # Pydantic 요청/응답 스키마
│   │   ├── auth.py
│   │   ├── fridge.py
│   │   ├── analysis.py
│   │   ├── recipe.py
│   │   └── billing.py
│   ├── services/                     # 비즈니스 로직
│   │   ├── ai_service.py             # GPT-4o Vision 호출 (90s timeout)
│   │   ├── billing_service.py
│   │   ├── ingredient_normalizer.py  # 재료명 동의어 정규화
│   │   ├── quota_service.py          # feature별 쿼터 관리
│   │   └── recipe_service.py         # 큐레이션 레시피 + AI 생성
│   ├── webhooks/
│   │   └── polar.py                  # Polar.sh 웹훅 HMAC 검증
│   └── main.py                       # CORS, 라우터 등록, 이미지 프록시
├── alembic/
│   ├── env.py
│   └── versions/
├── Dockerfile
├── railway.toml                      # [build] builder = "dockerfile"
├── requirements.txt
└── .env.example
```

---

## P. .env.example

### P1. 프론트엔드 (`fridgeai-frontend/.env.example`)

```env
# ─── 백엔드 API ──────────────────────────────────────────────
VITE_API_BASE_URL=https://your-backend.railway.app

# ─── Polar.sh ─────────────────────────────────────────────────
VITE_POLAR_CHECKOUT_URL=https://buy.polar.sh/your-product-id

# ─── 환경 ──────────────────────────────────────────────────────
VITE_APP_ENV=development
```

### P2. 백엔드 (`fridgeai-backend/.env.example`)

```env
# ─── 앱 기본 ──────────────────────────────────────────────────
APP_ENV=development
APP_NAME=Prigio
DEBUG=true

# ─── 데이터베이스 ────────────────────────────────────────────
DATABASE_URL=postgresql+asyncpg://user:password@host:5432/prigio

# ─── JWT (RS256 비대칭키) ────────────────────────────────────
JWT_PRIVATE_KEY_PATH=./keys/private.pem
JWT_PUBLIC_KEY_PATH=./keys/public.pem
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=30

# ─── Google OAuth ─────────────────────────────────────────────
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=https://your-backend.railway.app/auth/google/callback

# ─── OpenAI ──────────────────────────────────────────────────
OPENAI_API_KEY=sk-your-openai-api-key
OPENAI_MODEL=gpt-4o
OPENAI_TIMEOUT_SECONDS=90
OPENAI_MAX_RETRIES=1

# ─── Polar.sh ─────────────────────────────────────────────────
POLAR_API_KEY=your-polar-api-key
POLAR_WEBHOOK_SECRET=your-polar-webhook-secret
POLAR_PRODUCT_ID=your-polar-product-id

# ─── CORS ────────────────────────────────────────────────────
ALLOWED_ORIGINS=https://ai-gunwoo.vercel.app,http://localhost:5173

# ─── 쿼터 ────────────────────────────────────────────────────
FREE_PLAN_MONTHLY_LIMIT=5
# (analysis=5, recipe=10 — quota_service.py에 하드코딩된 FREE_LIMITS 사용)
```

---

## Q. MVP 배포 계획

### Q1. 마일스톤 및 빌드 순서

| 단계 | 작업 | 상태 |
|------|------|------|
| M1: 기반 인프라 | DB 스키마, 마이그레이션, Railway + Vercel 배포 파이프라인 | ✅ 완료 |
| M2: 인증 | Google OAuth, JWT, 로그인/로그아웃, 세션 관리 | ✅ 완료 |
| M3: 냉장고 CRUD | 식재료 추가/수정/삭제/조회 API + UI, 11종 카테고리 | ✅ 완료 |
| M4: AI 분석 | 이미지 업로드(2장), GPT-4o 통합, 쿼터 로직, 결과 UI | ✅ 완료 |
| M5: 레시피 추천 | AI 2단계 생성(후보→상세), 큐레이션 레시피 | ✅ 완료 |
| M6: 구독/결제 | Polar.sh 체크아웃, 웹훅 처리, 구독 상태 UI | ⚠️ UI 완료 (실결제 불가) |
| M7: 관리자 | AdminPanel, /api/v1/admin, ADMIN_UNLIMITED | ✅ 완료 |
| M8: Phase 2 | 분석 이력, ML/DL 기능 고도화 | 🔜 예정 |

### Q2. 의존성 순서

```
1. DB 스키마 & 마이그레이션    ← 모든 것의 기반
2. Google OAuth + JWT          ← 모든 보호된 API의 전제
3. 냉장고/식재료 CRUD          ← AI 결과 저장처
4. 쿼터 시스템(feature별)     ← AI 분석·레시피의 전제
5. AI 이미지 분석              ← 레시피 추천의 데이터 소스
6. AI 레시피 2단계 생성        ← 식재료 데이터 필요
7. Polar.sh 결제               ← 독립적, 병렬 개발 가능
```

### Q3. Phase 2 이후 로드맵

- 분석 이력 저장 및 조회 기능 구현
- ML 기반 유통기한 신선도 감지
- 협업 필터링 기반 레시피 개인화 추천
- 장보기 목록 자동 생성
- 모바일 PWA 최적화

---

## 가정 사항

| ID | 가정 내용 | 근거 |
|----|---------|------|
| A01 | 레시피는 GPT-4o로 AI 직접 생성 (Spoonacular 미사용) | 한국 요리 전문성, 재료 맞춤 생성 |
| A02 | AI API는 OpenAI GPT-4o Vision 사용 | 식재료 인식 + 레시피 생성 통합 |
| A03 | 백엔드 배포는 Railway 사용 | Docker 네이티브, GitHub 연동, 합리적 가격 |
| A04 | DB는 Supabase PostgreSQL 사용 | 무료 티어 충분, 관리형 서비스 |
| A05 | 월간 초기화는 KST(UTC+9) 기준 | 한국 서비스, 사용자 체감 시간 기준 |
| A06 | 이미지 영구 저장 없음, 분석 후 즉시 메모리에서 해제 | 개인정보 보호, 스토리지 비용 절감 |
| A07 | SameSite=None 쿠키 필수 | Vercel + Railway 크로스 도메인 구조 |
| A08 | 북마크는 localStorage 기반 (서버 미저장) | MVP 단계 구현 용이성 |

---

## 최종 결정 요약

| 영역 | 결정 내용 |
|------|---------|
| 프론트엔드 | React 18 + Vite + TypeScript + Tailwind CSS + Zustand + React Query |
| 백엔드 | FastAPI + Python 3.11 + SQLAlchemy 2.0 + Alembic |
| 데이터베이스 | PostgreSQL (Supabase 관리형) |
| 인증 | Google OAuth 2.0 + JWT RS256 + HttpOnly **SameSite=None** Cookie |
| AI 분석 | OpenAI GPT-4o Vision (최대 2장 병렬, 90초 타임아웃) |
| 레시피 | GPT-4o AI 직접 생성 — 2단계 (후보 3개 → 상세 레시피) |
| 쿼터 | feature별 분리: analysis(Free 5 / Pro 30), recipe(Free 10 / Pro 30) |
| 결제 | Polar.sh 월정액 구독 + HMAC 웹훅 검증 |
| 프론트 배포 | Vercel (GitHub 자동 배포, allow_origin_regex로 PR 미리보기 허용) |
| 백엔드 배포 | Railway (Docker, railway.toml) |
| 쿼터 초기화 기준 | KST(UTC+9) 매월 1일 00:00 |
| 이미지 정책 | 분석 후 즉시 메모리 해제, 영구 저장 없음 |
| 북마크 | localStorage 기반 (서버 API 없음) |
| 관리자 | ADMIN_UNLIMITED=99999, AdminPanel 플로팅 컴포넌트 |

---

*본 문서는 내부 배포용 기밀 문서입니다. 무단 외부 공유를 금지합니다.*

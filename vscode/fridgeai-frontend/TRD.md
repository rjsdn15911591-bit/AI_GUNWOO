# 🧊 냉장고 AI 식재료 관리 & 레시피 추천 서비스
## TRD (기술 요구사항 문서)

> 버전 1.0 | 내부 배포용 기밀 문서  
> 본 문서는 프론트엔드·백엔드·AI 엔지니어·DevOps가 실무 기준으로 활용하는 Single Source of Truth입니다.

---

## 목차

- [A. 기술 개요](#a-기술-개요)
- [B. 추천 최종 기술 스택](#b-추천-최종-기술-스택)
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
│    ↕ HTTPS REST API                                          │
│  백엔드 (FastAPI on Railway)                                  │
│    ↕ PostgreSQL (Supabase)                                   │
│    ↕ 외부 AI API (OpenAI GPT-4o Vision)                      │
│    ↕ Polar.sh (구독 결제 웹훅)                                │
│    ↕ Google OAuth 2.0                                        │
└──────────────────────────────────────────────────────────────┘
```

### A2. 시스템 경계 및 책임

| 컴포넌트 | 기술 | 책임 |
|---------|------|------|
| 프론트엔드 | React + Vite + TS + Tailwind | UI 렌더링, 상태 관리, API 호출 |
| 백엔드 | FastAPI (Python) | 비즈니스 로직, 인증, 쿼터, AI 오케스트레이션 |
| 데이터베이스 | PostgreSQL (Supabase 권장) | 영구 데이터 저장, 트랜잭션 |
| 외부 AI API | OpenAI GPT-4o Vision (권장) | 이미지 분석, 식재료 인식 |
| 결제 | Polar.sh | 구독 관리, 결제 처리, 웹훅 |
| 인증 | Google OAuth 2.0 | 사용자 신원 확인 |
| 프론트 배포 | Vercel | 정적 자산 CDN 배포 |
| 백엔드 배포 | Railway (권장) | FastAPI 컨테이너 호스팅 |

---

## B. 추천 최종 기술 스택

| 영역 | 기술 선택 | 선택 이유 |
|------|---------|---------|
| 프론트엔드 프레임워크 | React 18 + Vite + TypeScript | 빠른 HMR, 타입 안전성, 생태계 |
| 스타일링 | Tailwind CSS v3 | 유틸리티 클래스, 빠른 프로토타이핑 |
| 상태 관리 | Zustand + React Query | 가벼운 전역 상태 + 서버 상태 캐싱 |
| 백엔드 프레임워크 | FastAPI + Python 3.11+ | 타입 힌트, 비동기, OpenAPI 자동 생성 |
| 데이터베이스 | PostgreSQL 15 (Supabase) | 안정성, JSON 지원, 무료 티어 충분 |
| ORM | SQLAlchemy 2.0 + Alembic | 마이그레이션 관리, 비동기 지원 |
| 인증 토큰 | JWT (RS256) + HttpOnly Cookie | 보안성, CSRF 방어 |
| 외부 AI API | OpenAI GPT-4o Vision | 식재료 인식 정확도 최고, API 안정성 |
| 레시피 소스 | Spoonacular API + 자체 큐레이션 DB | 검증된 레시피, 상업적 허용 |
| 결제 | Polar.sh | 요구사항 확정 |
| 프론트 배포 | Vercel | 요구사항 확정 |
| 백엔드 배포 | Railway | Docker 지원, 저렴, GitHub 연동 용이 |
| 파일 임시 처리 | 메모리 내 처리 (tmpfile) | 이미지 영구 저장 안 함 |
| 모니터링 | Sentry + Logfire | 오류 추적, APM |

> **Railway 백엔드 배포 선택 이유**
> - Docker 컨테이너 네이티브 지원 → FastAPI 그대로 배포 가능
> - GitHub 연동 자동 배포 (push → 자동 빌드/배포)
> - 월 $5 정도의 합리적인 가격
> - 환경변수 UI 관리 편리
> - 대안: Render.com (유사 기능, 콜드 스타트 있음), Fly.io (더 복잡)

---

## C. 아키텍처 설계

### C1. 인증 흐름 (Google OAuth + JWT)

1. 사용자 → 프론트엔드: "Google로 로그인" 클릭
2. 프론트엔드 → 백엔드: `GET /auth/google/login` → Google OAuth URL 반환
3. 브라우저 → Google: OAuth 동의 화면
4. Google → 백엔드: Authorization Code 전달 (`redirect_uri`)
5. 백엔드 → Google: code 교환 → `access_token`, `id_token` 수신
6. 백엔드: `id_token` 검증 → 사용자 조회/생성 → JWT(Access + Refresh) 발급
7. 백엔드 → 브라우저: HttpOnly Secure Cookie에 토큰 저장
8. 이후 모든 API 요청: Cookie의 Access Token으로 인증

### C2. AI 분석 흐름

1. 프론트엔드: 이미지 파일 선택 및 FormData 생성
2. `POST /api/v1/analysis/upload` → 백엔드 수신
3. 백엔드: 쿼터 확인 (`usage_count < limit`)
4. 백엔드: 이미지 임시 처리 → OpenAI Vision API 호출
5. OpenAI: 식재료 목록 JSON 반환
6. 백엔드: 결과 정규화 (표준 재료명 매핑)
7. 백엔드: DB에 `usage_count + 1` (트랜잭션)
8. 백엔드: 정규화된 재료 목록 반환
9. 프론트엔드: 수정 가능한 결과 UI 표시
10. 사용자 확인 → `POST /api/v1/fridge/ingredients/bulk` → 냉장고 저장

### C3. 결제/구독 흐름

1. 사용자: 업그레이드 버튼 클릭
2. 프론트엔드 → 백엔드: `POST /api/v1/billing/checkout`
3. 백엔드 → Polar.sh: 체크아웃 세션 생성 (`user_id` 메타데이터 포함)
4. 백엔드 → 프론트엔드: Polar.sh 체크아웃 URL 반환
5. 브라우저: Polar.sh 결제 페이지로 이동
6. 결제 완료 → Polar.sh: 백엔드 웹훅 엔드포인트로 이벤트 전송
7. 백엔드: 웹훅 서명 검증 → `subscription` 상태 DB 업데이트
8. 사용자: 다음 API 요청부터 유료 혜택 적용

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
    year_month      VARCHAR(7) NOT NULL,   -- 'YYYY-MM' (KST 기준)
    usage_count     INTEGER NOT NULL DEFAULT 0,
    limit_count     INTEGER NOT NULL DEFAULT 5,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT unique_user_year_month UNIQUE (user_id, year_month)
);

CREATE INDEX idx_monthly_usage_user_year_month ON monthly_usage(user_id, year_month);

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
    source          VARCHAR(50) NOT NULL DEFAULT 'manual',  -- manual, ai_analysis
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ingredients_refrigerator_id ON ingredients(refrigerator_id);
CREATE INDEX idx_ingredients_expiry_date ON ingredients(expiry_date);
```

### D7. analysis_history 테이블

```sql
CREATE TABLE analysis_history (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    detected_ingredients    JSONB NOT NULL,   -- 인식된 재료 목록 (이미지 비저장)
    ai_raw_response         JSONB,            -- AI 원본 응답 (디버깅용)
    status                  VARCHAR(50) NOT NULL,  -- success, failed, timeout
    processing_time_ms      INTEGER,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_analysis_history_user_id ON analysis_history(user_id);
-- ※ 원본 이미지는 저장하지 않음 (개인정보 보호)
```

### D8. webhook_events 테이블

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

### E3. AI 분석 API

| Method | 경로 | 설명 | 인증 |
|--------|------|------|------|
| POST | `/api/v1/analysis/upload` | 이미지 업로드 및 AI 분석 실행 | 예 |
| GET | `/api/v1/analysis/history` | 분석 이력 조회 | 예 |

#### `POST /api/v1/analysis/upload` 상세 명세

```
요청: multipart/form-data
  - image: File (JPEG/PNG/WEBP, max 10MB)

성공 응답 (200):
{
  "analysis_id": "uuid",
  "detected_ingredients": [
    { "name": "당근", "quantity": 2, "unit": "개", "confidence": 0.95 }
  ],
  "usage_remaining": 3
}

오류 응답:
  402 - 쿼터 초과:    { "error": "quota_exceeded", "usage_count": 5, "limit": 5, "reset_date": "2025-02-01" }
  400 - 파일 오류:    { "error": "invalid_file", "detail": "..." }
  408 - 타임아웃:     { "error": "analysis_timeout" }
  422 - 파싱 실패:    { "error": "parsing_failed" }
  500 - 서버 오류:    { "error": "internal_error" }

※ 402 / 408 / 422 / 500 발생 시 usage_count 차감 없음
```

### E4. 쿼터 API

| Method | 경로 | 설명 | 인증 |
|--------|------|------|------|
| GET | `/api/v1/quota/status` | 현재 월 사용량 및 한도 조회 | 예 |

```
응답 (200):
{
  "year_month": "2025-01",
  "usage_count": 3,
  "limit_count": 5,
  "remaining": 2,
  "plan_type": "free",
  "reset_date": "2025-02-01T00:00:00+09:00"
}
```

### E5. 레시피 API

| Method | 경로 | 설명 | 인증 |
|--------|------|------|------|
| GET | `/api/v1/recipes/recommend` | 현재 냉장고 기반 레시피 추천 | 예 |
| GET | `/api/v1/recipes/:id` | 레시피 상세 조회 | 예 |
| POST | `/api/v1/recipes/:id/bookmark` | 레시피 북마크 | 예 |
| GET | `/api/v1/recipes/bookmarks` | 북마크 목록 조회 | 예 |

### E6. 구독/결제 API

| Method | 경로 | 설명 | 인증 |
|--------|------|------|------|
| GET | `/api/v1/billing/status` | 현재 구독 상태 조회 | 예 |
| POST | `/api/v1/billing/checkout` | Polar.sh 체크아웃 세션 생성 | 예 |
| POST | `/api/v1/billing/cancel` | 구독 취소 요청 | 예 |
| POST | `/webhooks/polar` | Polar.sh 웹훅 수신 (서명 검증) | 아니오 |

---

## F. 인증 설계

### F1. JWT 전략

| 항목 | 설정값 | 이유 |
|------|-------|------|
| 알고리즘 | RS256 | 비대칭키, 공개키 검증 가능 |
| Access Token 만료 | 15분 | 보안: 탈취 시 피해 최소화 |
| Refresh Token 만료 | 30일 | 사용 편의성 |
| 저장 방식 | HttpOnly Secure SameSite=Strict Cookie | XSS 방어 |
| Refresh Token 저장 | DB SHA-256 해시 저장 | 강제 만료/로그아웃 지원 |

### F2. 토큰 갱신 전략

- Access Token 만료 시: 프론트엔드가 `/auth/refresh` 자동 호출
- Refresh Token 만료 시: 로그인 페이지 리다이렉트
- 보안 이벤트 발생 시: 해당 사용자의 모든 Refresh Token 일괄 무효화

### F3. Cookie 설정

```
Set-Cookie: access_token=...; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=900
Set-Cookie: refresh_token=...; HttpOnly; Secure; SameSite=Strict; Path=/auth/refresh; Max-Age=2592000
```

> **SameSite=Strict vs None 트레이드오프**  
> 프론트(yourdomain.com)와 백엔드(api.yourdomain.com)가 같은 도메인일 경우 Strict 사용 가능.  
> 서브도메인이 다를 경우 `SameSite=None; Secure` 필요 → 설계 시 도메인 구조 사전 결정 필수.

---

## G. 사용 쿼터 로직

### G1. 타임존 기준

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

### G2. 쿼터 확인 및 차감 로직

```python
async def check_and_increment_quota(user_id: str, db: AsyncSession) -> None:
    """
    쿼터 확인 + AI 분석 성공 후 차감을 원자적으로 처리.
    한도 초과 시 QuotaExceededException 발생.
    """
    year_month = datetime.now(ZoneInfo('Asia/Seoul')).strftime('%Y-%m')

    async with db.begin():
        # FOR UPDATE: 행 수준 잠금 → 레이스 컨디션 방지
        result = await db.execute(
            select(MonthlyUsage)
            .where(
                MonthlyUsage.user_id == user_id,
                MonthlyUsage.year_month == year_month
            )
            .with_for_update()
        )
        usage = result.scalar_one_or_none()

        if not usage:
            # 신규 월: UPSERT
            usage = MonthlyUsage(user_id=user_id, year_month=year_month)
            db.add(usage)
            await db.flush()

        # 유료 사용자는 무제한
        subscription = await get_active_subscription(user_id, db)
        if subscription and subscription.plan_type == 'premium':
            return

        if usage.usage_count >= usage.limit_count:
            raise QuotaExceededException(
                usage_count=usage.usage_count,
                limit=usage.limit_count,
                reset_date=get_next_month_reset(year_month)
            )

        # AI 성공 후에만 이 함수 호출됨 → 바로 증가
        usage.usage_count += 1
        usage.updated_at = datetime.now(timezone.utc)
```

### G3. 레이스 컨디션 방지 전략

- `SELECT ... FOR UPDATE` 를 통한 행 수준 잠금
- 트랜잭션 내 확인-증가 원자적 처리
- 동시 요청 시 먼저 잠금 획득한 요청만 처리, 나머지는 대기 후 재확인
- `check_and_increment_quota`는 AI API 성공 응답 수신 **이후에만** 호출

---

## H. 결제 통합 설계 (Polar.sh)

### H1. 웹훅 처리 흐름

1. `POST /webhooks/polar` 수신
2. `X-Polar-Signature` 헤더 HMAC 검증 (비밀 키 대조)
3. `webhook_events` 테이블에 이벤트 저장 (`polar_event_id` 중복 체크로 멱등성 보장)
4. 이벤트 유형별 처리:
   - `subscription.created` → `subscriptions` 레코드 생성, `plan_type='premium'`
   - `subscription.updated` → 상태 동기화
   - `subscription.canceled` → `canceled_at` 기록, 기간 종료까지 유료 유지
   - `subscription.revoked` → 즉시 `free`로 다운그레이드
   - `payment.failed` → `status='past_due'` 기록
5. **200 응답 반환** (처리 실패 시에도 200 반환 후 내부 에러 로깅 → Polar.sh 재전송 방지)

### H2. 구독 상태 매핑

| Polar.sh 이벤트 | DB status | 사용자 플랜 |
|---------------|---------|----------|
| `subscription.created` | `active` | premium |
| `subscription.updated` (active) | `active` | premium |
| `subscription.canceled` | `canceled` | premium (기간 내) |
| `subscription.revoked` | `expired` | free |
| `payment.failed` | `past_due` | premium (3일 유예) |
| `payment.succeeded` (재결제) | `active` | premium |

### H3. 멱등성 보장

```python
async def handle_polar_webhook(event_id: str, event_type: str, payload: dict, db: AsyncSession):
    # 이미 처리된 이벤트인지 확인
    existing = await db.execute(
        select(WebhookEvent).where(WebhookEvent.polar_event_id == event_id)
    )
    if existing.scalar_one_or_none():
        return  # 중복 처리 방지

    # 이벤트 저장 후 처리
    ...
```

---

## I. 외부 AI API 통합 설계

### I1. 백엔드 중개 필수 이유

- API 키를 클라이언트에 노출하면 키 탈취 → 무제한 API 호출 가능 → **비용 폭발**
- 쿼터 차감 로직은 반드시 서버에서 처리해야 함 (클라이언트 조작 방지)
- 이미지 전처리, 결과 정규화, 오류 처리를 서버에서 통제

### I2. OpenAI Vision API 호출 전략

```python
SYSTEM_PROMPT = """
당신은 식재료 인식 전문가입니다.
이미지에서 보이는 모든 식재료를 JSON 배열로만 반환하세요.
각 항목 형식: {"name": "재료명(한국어)", "quantity": 숫자, "unit": "단위", "confidence": 0~1}
재료가 없으면 빈 배열 [] 반환.
JSON 외 다른 텍스트 출력 절대 금지.
"""

async def analyze_image(image_bytes: bytes) -> list[dict]:
    response = await openai_client.chat.completions.create(
        model="gpt-4o",
        max_tokens=1000,
        timeout=30,  # 30초 타임아웃
        messages=[{
            "role": "user",
            "content": [
                {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{b64}"}},
                {"type": "text", "text": "이 이미지의 식재료를 분석해주세요."}
            ]
        }],
        response_format={"type": "json_object"}
    )
    return parse_ai_response(response.choices[0].message.content)
```

### I3. 재시도 정책

```
최대 재시도: 2회
백오프: 1초 → 2초 (exponential)
재시도 조건: 타임아웃, 5xx 오류
재시도 제외: 400, 401, 402, 422 (클라이언트 오류)
전체 타임아웃: 30초
```

### I4. 결과 정규화

- AI 응답 재료명 → 표준 재료명 매핑 테이블 적용 (예: `"토마토" = "방울토마토" = "토마테"`)
- 신뢰도(`confidence`) 0.3 미만 항목 필터링
- 빈 응답 또는 JSON 파싱 실패 → `AnalysisFailedException` 발생, 횟수 미차감

---

## J. 레시피 추천 설계

### J1. MVP 레시피 소스 전략

**권장: Spoonacular API + 자체 한국 요리 큐레이션 혼합**

| 소스 | 장점 | 단점 |
|------|------|------|
| Spoonacular API | 재료 매칭 내장, 상업적 허용, 대규모 DB | 한국 요리 커버리지 부족, 유료 한도 있음 |
| 자체 큐레이션 DB | 한국 요리 전문, API 의존성 없음, 비용 예측 가능 | 초기 구축 비용 |
| AI 생성 레시피 | 유연성 높음 | **신뢰도 불명확, 재료 분량 오류 위험, 법적 책임 이슈** |

> ※ AI 완전 생성 레시피는 MVP에서 사용하지 않음.  
> AI는 식재료 인식, 재료명 정규화, 레시피 매칭·랭킹 보조에만 활용.

### J2. 재료 매칭 알고리즘

1. 사용자 냉장고 재료 목록 조회
2. 재료명 정규화 (동의어 처리: `"대파" = "파" = "쪽파"`)
3. Spoonacular API 또는 내부 DB에서 후보 레시피 조회
4. 각 레시피별 매칭률 계산:

```
match_ratio = (보유_재료_수 / 레시피_총_재료_수) × 100
```

5. 정렬: 매칭률 높은 순 → 조리 시간 짧은 순
6. 표시: "보유 재료 N개 / 부족 재료 M개" 배지

### J3. 부분 매칭 표현

| 매칭률 | UI 표시 | 추천 여부 |
|-------|---------|---------|
| 100% | "지금 바로 만들 수 있어요! ✅" | 최우선 |
| 70~99% | "재료 N개만 더 있으면" | 추천 |
| 40~69% | "재료 일부 필요" | 추천 (하단) |
| < 40% | 표시 안 함 (또는 별도 섹션) | 기본 미표시 |

---

## K. 인프라 / 배포 설계

### K1. CI/CD 파이프라인

```
프론트엔드 (Vercel):
  - main 브랜치 push → Vercel 자동 빌드/배포
  - PR → 미리보기 URL 자동 생성
  - 환경변수: Vercel 대시보드에서 관리

백엔드 (Railway):
  - main 브랜치 push → Railway 자동 Docker 빌드/배포
  - 환경변수: Railway 대시보드에서 관리

DB 마이그레이션:
  - 배포 전 Alembic migrate 자동 실행
  - Dockerfile CMD: ["sh", "-c", "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000"]
```

### K2. Dockerfile (백엔드)

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["sh", "-c", "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 2"]
```

### K3. 도메인 / CORS / HTTPS

- 프론트엔드 도메인: `yourdomain.com` (Vercel Custom Domain)
- 백엔드 도메인: `api.yourdomain.com` (Railway Custom Domain)
- CORS: FastAPI에서 `ALLOW_ORIGINS`에 프론트엔드 도메인만 허용
- HTTPS: Vercel/Railway 모두 자동 SSL 인증서 발급
- Cookie: `SameSite=Strict; Secure` (프론트/백엔드가 같은 최상위 도메인)

```python
# FastAPI CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,  # ["https://yourdomain.com"]
    allow_credentials=True,  # Cookie 전송 허용
    allow_methods=["GET", "POST", "PATCH", "DELETE"],
    allow_headers=["Content-Type", "Authorization"],
)
```

---

## L. 보안 요구사항

| 항목 | 구현 방법 |
|------|---------|
| XSS 방어 | HttpOnly Cookie로 토큰 저장, React는 기본적으로 HTML 이스케이핑 |
| CSRF 방어 | SameSite=Strict Cookie (+ 필요 시 CSRF 토큰 추가) |
| SQL 인젝션 | SQLAlchemy ORM 파라미터 바인딩 (Raw SQL 지양) |
| 파일 업로드 검증 | MIME 타입 확인, 파일 크기 제한 (10MB), 이미지 헤더 magic bytes 검증 |
| API 키 보호 | 환경변수 저장, `.gitignore`에 `.env` 포함, 코드베이스 노출 금지 |
| 웹훅 검증 | Polar.sh HMAC 서명 검증 (`X-Polar-Signature` 헤더) |
| Rate Limiting | SlowAPI 미들웨어: 분석 API 분당 10회, 로그인 분당 5회 |
| 쿼터 어뷰징 | 서버 측 트랜잭션 처리, 클라이언트 전달 값 신뢰 안 함 |
| 로그 개인정보 | 로그에 이메일 마스킹, 토큰 전체 기록 금지 |
| 이미지 보안 | 분석 후 즉시 삭제, URL 기반 접근 차단 |

---

## M. 안정성 / 운영 안정성

### M1. 예상 실패 지점 및 대응

| 위험 지점 | 대응 전략 |
|---------|---------|
| AI API 타임아웃 | 30초 타임아웃 설정, 재시도 2회, 실패 시 graceful error |
| DB 연결 풀 고갈 | SQLAlchemy `pool_size=10, max_overflow=20` 설정 |
| Polar.sh 웹훅 실패 | `webhook_events` 테이블 저장 후 재처리, 멱등성 보장 |
| Railway 배포 실패 | 이전 버전 롤백 (Railway 배포 이력 보존) |
| 메모리 누수 (이미지) | `tmpfile` 컨텍스트 매니저로 자동 삭제 보장 |
| 인증 토큰 탈취 | 단기 Access Token (15분) + HttpOnly Cookie + HTTPS 전송 |

### M2. 모니터링 권장

- **Sentry**: 백엔드/프론트엔드 오류 추적, 슬랙 알림 연동
- **Logfire** (Pydantic 팀): FastAPI APM + 구조화된 로깅
- **Railway 대시보드**: CPU/메모리/네트워크 기본 모니터링
- **Polar.sh 대시보드**: 구독/결제 이벤트 모니터링
- **OpenAI 대시보드**: 월별 비용 한도 알림 설정 (비용 폭발 방지)

---

## N. 테스트 전략

| 테스트 유형 | 도구 | 커버리지 목표 |
|-----------|------|------------|
| 백엔드 단위 테스트 | pytest + pytest-asyncio | 핵심 비즈니스 로직 80%+ |
| API 통합 테스트 | pytest + httpx TestClient | 모든 엔드포인트 |
| 쿼터 로직 테스트 | pytest + DB 트랜잭션 | 경계값, 동시 요청 시뮬레이션 |
| 웹훅 처리 테스트 | pytest + 시그니처 모킹 | 모든 Polar.sh 이벤트 유형 |
| AI API 모킹 | pytest-mock | 성공/실패/타임아웃 3가지 시나리오 |
| 프론트엔드 컴포넌트 | Vitest + React Testing Library | 핵심 UI 컴포넌트 |
| E2E 테스트 | Playwright (Phase 2) | 핵심 사용자 플로우 |
| 레시피 추천 테스트 | pytest + 샘플 냉장고 데이터 | 매칭 알고리즘 정확도 |

### 핵심 테스트 케이스

```python
# 쿼터 로직 경계값 테스트
class TestQuotaLogic:
    async def test_free_user_can_analyze_at_limit_minus_1(self): ...
    async def test_free_user_blocked_at_limit(self): ...
    async def test_quota_not_decremented_on_ai_failure(self): ...
    async def test_quota_not_decremented_on_timeout(self): ...
    async def test_concurrent_requests_not_exceed_limit(self): ...  # 레이스 컨디션
    async def test_monthly_reset_on_new_month(self): ...
    async def test_premium_user_always_allowed(self): ...
```

---

## O. 프로젝트 폴더 구조

### O1. 프론트엔드

```
frontend/
├── public/
├── src/
│   ├── api/                # API 클라이언트 (axios/fetch 래퍼)
│   │   ├── auth.ts
│   │   ├── fridge.ts
│   │   ├── analysis.ts
│   │   ├── recipes.ts
│   │   └── billing.ts
│   ├── components/
│   │   ├── ui/             # Button, Input, Modal, Badge 등 기본 요소
│   │   └── feature/        # FridgeCard, RecipeCard, AnalysisResult 등
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── Fridge.tsx
│   │   ├── Analyze.tsx
│   │   ├── Recipes.tsx
│   │   ├── RecipeDetail.tsx
│   │   ├── Subscription.tsx
│   │   └── Settings.tsx
│   ├── store/              # Zustand 전역 상태
│   │   ├── authStore.ts
│   │   └── quotaStore.ts
│   ├── hooks/              # 커스텀 훅
│   │   ├── useAuth.ts
│   │   ├── useQuota.ts
│   │   └── useFridge.ts
│   ├── types/              # TypeScript 타입 정의
│   │   └── index.ts
│   ├── utils/              # 유틸리티 함수
│   ├── App.tsx
│   └── main.tsx
├── .env.example
├── vite.config.ts
├── tailwind.config.ts
└── package.json
```

### O2. 백엔드

```
backend/
├── app/
│   ├── api/
│   │   └── v1/
│   │       ├── auth.py
│   │       ├── fridge.py
│   │       ├── analysis.py
│   │       ├── recipes.py
│   │       ├── billing.py
│   │       └── quota.py
│   ├── core/
│   │   ├── config.py       # 환경변수 설정 (Pydantic Settings)
│   │   ├── security.py     # JWT 유틸, 비밀번호 해시
│   │   ├── database.py     # SQLAlchemy 비동기 설정
│   │   └── dependencies.py # FastAPI Depends 공통 의존성
│   ├── models/             # SQLAlchemy ORM 모델
│   │   ├── user.py
│   │   ├── subscription.py
│   │   ├── fridge.py
│   │   ├── usage.py
│   │   └── webhook.py
│   ├── schemas/            # Pydantic 요청/응답 스키마
│   │   ├── auth.py
│   │   ├── fridge.py
│   │   ├── analysis.py
│   │   ├── recipe.py
│   │   └── billing.py
│   ├── services/           # 비즈니스 로직
│   │   ├── ai_service.py
│   │   ├── quota_service.py
│   │   ├── recipe_service.py
│   │   └── billing_service.py
│   ├── webhooks/
│   │   └── polar.py
│   └── main.py
├── alembic/                # DB 마이그레이션
│   ├── env.py
│   └── versions/
├── tests/
│   ├── test_quota.py
│   ├── test_auth.py
│   ├── test_analysis.py
│   └── test_webhooks.py
├── Dockerfile
├── requirements.txt
└── .env.example
```

---

## P. .env.example

### P1. 프론트엔드 (`frontend/.env.example`)

```env
# ─── 백엔드 API ──────────────────────────────────────────────
VITE_API_BASE_URL=https://api.yourdomain.com

# ─── Polar.sh ─────────────────────────────────────────────────
VITE_POLAR_CHECKOUT_URL=https://buy.polar.sh/your-product-id

# ─── 환경 ──────────────────────────────────────────────────────
VITE_APP_ENV=development
```

### P2. 백엔드 (`backend/.env.example`)

```env
# ─── 앱 기본 ──────────────────────────────────────────────────
APP_ENV=development
APP_NAME=FridgeAI
DEBUG=true
SECRET_KEY=your-secret-key-at-least-32-chars-replace-in-production

# ─── 데이터베이스 ────────────────────────────────────────────
DATABASE_URL=postgresql+asyncpg://user:password@host:5432/fridgeai

# ─── JWT ─────────────────────────────────────────────────────
JWT_PRIVATE_KEY_PATH=./keys/private.pem
JWT_PUBLIC_KEY_PATH=./keys/public.pem
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=30

# ─── Google OAuth ─────────────────────────────────────────────
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=https://api.yourdomain.com/auth/google/callback

# ─── OpenAI ──────────────────────────────────────────────────
OPENAI_API_KEY=sk-your-openai-api-key
OPENAI_MODEL=gpt-4o
OPENAI_TIMEOUT_SECONDS=30
OPENAI_MAX_RETRIES=2

# ─── Polar.sh ─────────────────────────────────────────────────
POLAR_API_KEY=your-polar-api-key
POLAR_WEBHOOK_SECRET=your-polar-webhook-secret
POLAR_PRODUCT_ID=your-polar-product-id

# ─── 레시피 API ───────────────────────────────────────────────
SPOONACULAR_API_KEY=your-spoonacular-api-key

# ─── CORS ────────────────────────────────────────────────────
ALLOWED_ORIGINS=https://yourdomain.com,http://localhost:5173

# ─── 쿼터 ────────────────────────────────────────────────────
FREE_PLAN_MONTHLY_LIMIT=5

# ─── Sentry (모니터링) ────────────────────────────────────────
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
```

---

## Q. MVP 배포 계획

### Q1. 마일스톤 및 빌드 순서

| 단계 | 작업 | 예상 기간 |
|------|------|---------|
| M1: 기반 인프라 | DB 스키마, 마이그레이션, 환경 설정, 배포 파이프라인 (Railway + Vercel) | 1주 |
| M2: 인증 | Google OAuth, JWT, 로그인/로그아웃, 세션 관리 | 1주 |
| M3: 냉장고 CRUD | 식재료 추가/수정/삭제/조회 API + UI | 1주 |
| M4: AI 분석 | 이미지 업로드, OpenAI 통합, 쿼터 로직, 결과 UI | 1.5주 |
| M5: 레시피 추천 | Spoonacular 연동, 매칭 알고리즘, 추천 UI | 1주 |
| M6: 구독/결제 | Polar.sh 체크아웃, 웹훅 처리, 구독 상태 UI | 1주 |
| M7: 통합/QA | E2E 테스트, 오류 처리 개선, 모니터링 설정, 프로덕션 배포 | 1주 |

**총 예상: 약 7.5주**

### Q2. 의존성 순서

```
1. DB 스키마 & 마이그레이션    ← 모든 것의 기반
2. Google OAuth + JWT          ← 모든 보호된 API의 전제
3. 냉장고/식재료 CRUD          ← AI 결과 저장처
4. 쿼터 시스템                 ← AI 분석의 전제
5. AI 이미지 분석              ← 레시피 추천의 데이터 소스
6. 레시피 추천                 ← 식재료 데이터 필요
7. Polar.sh 결제               ← 쿼터 시스템과 독립적으로 병렬 개발 가능
```

### Q3. Phase 2 이후 로드맵

- 유통기한 OCR 자동 인식
- 영양 정보 및 칼로리 분석
- 장보기 목록 자동 생성
- 모바일 PWA 최적화
- 소셜 레시피 공유 기능
- 이메일 기반 회원가입 추가

---

## 가정 사항

| ID | 가정 내용 | 근거 |
|----|---------|------|
| A01 | 레시피 API는 Spoonacular를 기본으로 사용 | 상업적 허용, 한국 음식 포함, 재료 매칭 내장 |
| A02 | AI API는 OpenAI GPT-4o Vision을 사용 | 식재료 인식 정확도, API 안정성 최상 |
| A03 | 백엔드 배포는 Railway를 사용 | Docker 네이티브, GitHub 연동, 합리적 가격 |
| A04 | DB는 Supabase PostgreSQL 사용 | 무료 티어 충분, 관리형 서비스 |
| A05 | 월간 초기화는 KST(UTC+9) 기준 | 한국 서비스, 사용자 체감 시간 기준 |
| A06 | 이미지 영구 저장 없음, 분석 후 즉시 삭제 | 개인정보 보호, 스토리지 비용 절감 |
| A07 | 유료 플랜 가격은 별도 A/B 테스트 후 결정 | 초기 MVP에서 가격 최종 미정 |
| A08 | 자체 큐레이션 한국 요리 DB 초기 50개 확보 | 한국 음식 전문성 강화 목적 |

---

## 최종 결정 요약

| 영역 | 결정 내용 |
|------|---------|
| 프론트엔드 | React 18 + Vite + TypeScript + Tailwind CSS + Zustand + React Query |
| 백엔드 | FastAPI + Python 3.11 + SQLAlchemy 2.0 + Alembic |
| 데이터베이스 | PostgreSQL 15 (Supabase 관리형) |
| 인증 | Google OAuth 2.0 + JWT RS256 + HttpOnly Secure Cookie |
| AI 분석 | OpenAI GPT-4o Vision API (백엔드 중개 필수) |
| 레시피 | Spoonacular API + 자체 한국 요리 큐레이션 DB |
| 결제 | Polar.sh 월정액 구독 |
| 프론트 배포 | Vercel (GitHub 자동 배포) |
| 백엔드 배포 | Railway (Docker 컨테이너) |
| 모니터링 | Sentry + Logfire |
| 쿼터 초기화 기준 | KST(UTC+9) 매월 1일 00:00 |
| 이미지 정책 | 임시 처리 후 즉시 삭제, 영구 저장 없음 |
| 무료 한도 | 월 5회 AI 분석 |

---

*본 문서는 내부 배포용 기밀 문서입니다. 무단 외부 공유를 금지합니다.*

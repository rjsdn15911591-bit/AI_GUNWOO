# Prigio. — Design Specification v2.0

> **AI · Fridge · Recipe** | 프리지오 | 내부배포용 기밀문서  
> Version 2.0 · 2026-04 · 현재 구현 코드 기준 최신화

---

## 목차

1. [브랜드 개요](#01-브랜드-개요)
2. [컬러 시스템](#02-컬러-시스템)
3. [타이포그래피](#03-타이포그래피)
4. [레이아웃 & 그리드 시스템](#04-레이아웃--그리드-시스템)
5. [컴포넌트 디자인 시스템](#05-컴포넌트-디자인-시스템)
6. [페이지별 디자인 명세](#06-페이지별-디자인-명세)
7. [아이콘 & 일러스트레이션](#07-아이콘--일러스트레이션)
8. [모션 & 인터랙션 원칙](#08-모션--인터랙션-원칙)
9. [다크 모드](#09-다크-모드)
10. [반응형 & 접근성](#10-반응형--접근성)
11. [AI 구현 프롬프트 가이드](#11-ai-구현-프롬프트-가이드)
12. [기술 구현 명세](#12-기술-구현-명세)

---

## 01. 브랜드 개요

> Prigio(프리지오)는 냉장고 사진 한 장으로 식재료를 AI가 자동 인식하고, 검증된 레시피를 추천하는 웹 서비스입니다. 이탈리아어 감성의 어감과 딥 그린 컬러 시스템으로 신선함·신뢰·고급스러움을 동시에 전달합니다.

### 이름 구성

```
Pri  (fridge, 냉장고)
+
gio  (AI 접미사 · 이탈리아어 감성)
=
Prigio — 냉장고 · AI · 레시피 3요소 압축
```

발음: **프리지오** — P 시작으로 또렷하고 기억에 남음. 영어권·한국어권 모두 발음 쉬움.

### 브랜드 아이덴티티

| 항목 | 내용 |
|------|------|
| 서비스명 | Prigio (프리지오) |
| 이름 구성 | Pri(fridge, 냉장고) + gio(AI 접미사) — 냉장고·AI·레시피 3요소 압축 |
| 슬로건 | "찍으면, 요리가 된다" |
| 서브 카피 | 냉장고 사진 한 장으로 오늘 저녁 완성 |
| 글로벌 카피 | Your fridge, your recipe — powered by AI |
| 도메인 | prigio.app / prigio.kr / @prigio_app |
| 포지셔닝 | 세련된 AI 요리 도우미 — 1인 가구·맞벌이·건강 관심층 타깃 |

---

## 02. 컬러 시스템

> 딥 그린 베이스 위에 민트 포인트와 앰버 강조색을 조합하여 신선함·자연·신뢰를 표현합니다.

### 팔레트

| 이름 | HEX | 용도 |
|------|-----|------|
| Deep Night | `#0D1F1A` | 히어로 섹션, 다크 카드, 네비게이션 배경 |
| Prigio Green | `#1D9E75` | 메인 브랜드 컬러, CTA 버튼, 강조 텍스트 |
| Mint | `#5DCAA5` | 포인트 색상, 아이콘, 다크 모드 Primary |
| Ice | `#E1F5EE` | 카드 배경, 뱃지 배경, 섹션 배경 |
| Warm Amber | `#FAC775` | 경고, 유통기한 임박, 주의 표시 |
| Cream | `#F1EFE8` | 다크 모드 텍스트, 밝은 배경 |
| White | `#FFFFFF` | 기본 배경, 카드 배경 |
| Gray 300 | `#D3D1C7` | 테두리, 구분선 |
| Gray 500 | `#888780` | Disabled 텍스트, 보조 정보 |
| Text Primary | `#1A1A1A` | 기본 본문 텍스트 |
| Text Secondary | `#5F5E5A` | 보조 텍스트, 설명 |

### 컬러 사용 원칙

| 역할 | 컬러 | 사용처 |
|------|------|--------|
| Primary | Prigio Green `#1D9E75` | CTA 버튼, 강조 텍스트, 로고 포인트 |
| Background | White + Ice `#E1F5EE` | 카드·컨테이너 배경 |
| Dark Hero | Deep Night `#0D1F1A` | 히어로 섹션, 다크 카드, 네비게이션 |
| Accent | Warm Amber `#FAC775` | 경고·유통기한 임박·주의 표시 |
| Text | Primary `#1A1A1A` / Secondary `#5F5E5A` / Disabled `#888780` | 텍스트 계층 |
| Border | Gray `#D3D1C7` (0.5px) | 카드 테두리, 구분선 |

---

## 03. 타이포그래피

> 영문: **Inter** — 세련되고 현대적인 기하학적 산세리프  
> 한글: **Pretendard** — Inter와 시각적 무게감이 가장 일치하는 한글 폰트

### 타입 스케일

| 레벨 | 크기 | 굵기 | 용도 |
|------|------|------|------|
| Display 1 | 52px | Bold | 히어로 서비스명 |
| Display 2 | 36px | Bold | 랜딩 메인 헤드라인 |
| Heading 1 | 28px | SemiBold | 페이지 타이틀 |
| Heading 2 | 22px | SemiBold | 섹션 서브타이틀 |
| Heading 3 | 18px | Medium | 카드 타이틀 |
| Body L | 16px | Regular | 본문 주요 텍스트 |
| Body M | 14px | Regular | 설명 텍스트, 레이블 |
| Caption | 12px | Regular | 보조 정보, 타임스탬프 |
| Mono | 13px | Regular | 도메인, 코드, 배지 텍스트 (JetBrains Mono) |

### 행간 & 자간 규칙

| 항목 | 값 |
|------|-----|
| 행간 (Line Height) | Display 1.1 / Heading 1.3 / Body 1.7 / Caption 1.5 |
| 자간 (Letter Spacing) | Display -0.02em / Heading -0.01em / Body 0 / Caps +0.08em |
| 단락 간격 | 섹션 간 48px / 컴포넌트 간 24px / 요소 간 12px |
| 최소 폰트 | 12px — 이하 사용 금지 (접근성 기준) |

---

## 04. 레이아웃 & 그리드 시스템

### 그리드 구조

| 항목 | 값 |
|------|-----|
| 최대 너비 | 1280px (콘텐츠 컨테이너) / 1920px (전체 배경) |
| 컬럼 수 | Desktop 12col / Tablet 8col / Mobile 4col |
| 거터 (Gutter) | Desktop 24px / Tablet 20px / Mobile 16px |
| 마진 | Desktop 80px / Tablet 40px / Mobile 20px |
| 브레이크포인트 | Mobile < 768px / Tablet 768–1024px / Desktop > 1024px |

### 간격 토큰 (Spacing Tokens)

```css
--space-1:  4px;   /* 아이콘 내부 미세 간격 */
--space-2:  8px;   /* 태그·뱃지 내부 패딩 */
--space-3:  12px;  /* 인라인 요소 간격 */
--space-4:  16px;  /* 카드 내부 기본 패딩 */
--space-5:  24px;  /* 카드 간격, 섹션 내 컴포넌트 */
--space-6:  32px;  /* 섹션 상하 패딩 */
--space-8:  48px;  /* 주요 섹션 간격 */
--space-10: 64px;  /* 랜딩 섹션 상하 여백 */
--space-12: 80px;  /* 히어로 섹션 상하 여백 */
```

### Border Radius 토큰

```css
--radius-sm:   6px;    /* 태그, 인풋, 소형 뱃지 */
--radius-md:   10px;   /* 버튼, 아이콘 컨테이너 */
--radius-lg:   16px;   /* 카드, 모달, 드롭다운 */
--radius-xl:   24px;   /* 히어로 카드, 주요 컨테이너 */
--radius-full: 9999px; /* 알약형 뱃지, 토글, 아바타 */
```

---

## 05. 컴포넌트 디자인 시스템

### 버튼 (Button)

| 종류 | 스펙 |
|------|------|
| Primary | bg: Prigio Green / text: White / radius: 10px / padding: 12px 24px / font: 15px SemiBold |
| Secondary | bg: Transparent / border: 1px Green / text: Green / hover: bg Ice |
| Ghost | bg: Transparent / text: Primary / hover: bg Gray100 |
| Danger | bg: `#E24B4A` / text: White / 유통기한 초과·삭제 액션 |
| 상태 | Default → Hover (opacity 0.9, scale 1.01) → Active (scale 0.98) → Disabled (opacity 0.4) |
| 아이콘 버튼 | width: 40px / height: 40px / radius: 10px / 아이콘 16px |

### 카드 (Card)

| 종류 | 스펙 |
|------|------|
| 기본 카드 | bg: White / border: 0.5px `#D3D1C7` / radius: 16px / padding: 20px / shadow: none |
| 재료 카드 | 아이콘(36px) + 이름(14px Bold) + 수량(13px) + 유통기한 뱃지 / 그리드 3열 배치 |
| 레시피 카드 | 썸네일 이미지(16:9) + 제목 + 매칭률 바 + 부족 재료 수 / hover: border-color Green |
| 히어로 카드 | bg: Deep Night / radius: 20px / padding: 48px / 텍스트 Cream계열 |
| 플랜 카드 | Free: Ice bg / Pro: Green bg + White text / border: 2px Green (Pro) |

### 인풋 & 폼

| 항목 | 스펙 |
|------|------|
| 기본 인풋 | height: 44px / border: 1px `#D3D1C7` / radius: 10px / focus: border 2px Green |
| 라벨 | 14px Medium / color: `#444441` / margin-bottom: 6px |
| 에러 상태 | border: `#E24B4A` / 에러 메시지 12px Red / 아이콘 추가 |
| 파일 업로드 | 점선 테두리 카드 / 드래그앤드롭 + 클릭 / hover: bg Ice / 아이콘 48px |

### 뱃지 & 태그

| 종류 | 스펙 |
|------|------|
| 매칭률 뱃지 | Green 계열 / "80% 일치" / radius: full / 12px |
| 부족 재료 뱃지 | Amber 계열 / "재료 2개 부족" / radius: full |
| 유통기한 임박 | Red 계열 / "D-2" / Amber bg / 카드 우상단 배치 |
| 플랜 뱃지 | Free: Gray / Pro: Green + 별표 아이콘 |
| 카테고리 태그 | Ice bg + Green text / radius: 6px / 12px / 한식·양식·중식 등 |

---

## 06. 페이지별 디자인 명세

### 6-1. 랜딩 페이지 `/`

> 첫 인상에서 '세련된 AI 서비스'임을 즉시 전달. 스크롤 없이 핵심 가치를 이해할 수 있도록 히어로 섹션에 집중.

| 구성 요소 | 스펙 |
|-----------|------|
| 배경 슬라이드쇼 | `bg-market.jpg` / `bg-seafood.jpg` 2장 순환 / **6초 간격**, 3.75초 크로스페이드 전환 / 전체 화면 blur 처리 |
| 내비게이션 | 고정 상단바 / bg: Deep Night (반투명) / 로고 좌 / CTA 버튼 우 |
| 히어로 섹션 | 전체 너비 / bg: Deep Night (반투명 오버레이 + 배경 슬라이드쇼) / 중앙 정렬 |
| 로고 | "Prigio." 52px Bold / **Pri=Cream** / **gio.=Mint** — 두 파트 색상 구분 필수 |
| 슬로건 | "찍으면, 요리가 된다" 20px Cream |
| CTA 버튼 | Primary Green "시작하기" + Secondary outline White "더 알아보기" |
| 기능 소개 | 3열 그리드 / 아이콘(48px Teal) + 제목 + 설명 / bg: White / 섹션 패딩 80px |
| 요금 섹션 | 2열 카드 (Free / Pro) / Free: Ice bg / Pro: Green bg + White text + border 2px Green |
| 요금 — Free | 월 5회 분석 + 10회 레시피 / 무료 |
| 요금 — Pro | 월 30회 분석 + 30회 레시피 / 유료 (Polar.sh 구독) |
| 푸터 | bg: Deep Night / Cream 텍스트 |

### 6-2. 대시보드 `/dashboard`

> **사이드바 없음.** 전체 너비 단일 컬럼 레이아웃.

| 구성 요소 | 스펙 |
|-----------|------|
| 레이아웃 | 사이드바 없음 / 최대 너비 1280px / 단일 컬럼 |
| 상단 요약 | 쿼터 카드 1개 (AI 분석 잔여 횟수 + 레시피 잔여 횟수 / 프로그레스 바) |
| 쿼터 프로그레스 바 | analysis 사용량 / recipe 사용량 각각 표시 / 잔여 적을수록 Green→Amber 전환 |
| 퀵 액션 | **2×2 그리드** — ① 냉장고 관리 ② AI 사진 분석(Primary, Green bg) ③ 레시피 추천 ④ 구독 관리 |
| 퀵 액션 스펙 | 각 카드: 아이콘(24px) + 레이블 / AI 사진 분석 카드 = Primary Green bg |
| 환영 메시지 | 상단에 사용자 이름 표시 |

### 6-3. 사진 분석 페이지 `/analyze`

| 구성 요소 | 스펙 |
|-----------|------|
| 업로드 존 | 중앙 카드 / 점선 테두리 2px dashed `#D3D1C7` / 드래그앤드롭 영역 / 아이콘 + 안내 텍스트 |
| 이미지 수 | **최대 2장** 동시 업로드 가능 (MAX_IMAGES = 2) |
| 드래그 오버 | border → Green + bg → Ice 전환 200ms |
| 로딩 상태 | Spinner (Green) / "분석 중..." Pulse 애니메이션 / 90초 타임아웃 안내 |
| 결과 화면 | 인식 재료 카드 그리드 / 각 재료: 이름(인라인 텍스트 편집) + 수량(텍스트 인풋) + 삭제 버튼 |
| 편집 UX | **인라인 텍스트 인풋** (± 버튼 없음) / 재료명 직접 수정 가능 / 재료 추가 버튼 |
| 확정 버튼 | Primary CTA "냉장고에 반영" 하단 고정 / 선택 개수 실시간 표시 |
| 실패 상태 | 에러 아이콘 + 메시지 + "다시 시도" 버튼 / **횟수 차감 없음** 안내 |
| 쿼터 표시 | 분석 전 잔여 횟수 표시 / 0회 시 업로드 비활성화 + 업그레이드 안내 |

### 6-4. 냉장고 관리 `/fridge`

| 구성 요소 | 스펙 |
|-----------|------|
| 레이아웃 | **카테고리별 섹션 리스트** (그리드 아님) / 11종 카테고리 순서대로 표시 |
| 카테고리 11종 | 채소·과일·육류수산·유제품·조리식품·달걀간편식·즉석통조림·소스양념·음료·곡물면·기타 |
| 재료 표시 | 카테고리 헤더 + 해당 카테고리 재료 목록 / 각 재료: 이름 + 수량 + 유통기한 뱃지 |
| 유통기한 경고 | **D-7** 이내: Amber 뱃지 `🚨 D-N` / 만료됨: `⚠️ 만료` 표시 (D-3 아님) |
| 만료 뱃지 색상 | Warm Amber `#FAC775` bg + 어두운 텍스트 |
| 수동 추가 | 하단 플로팅 버튼 (+ 아이콘, Green, radius full) / 모달 / 인풋 폼 |
| AI 분류 캐시 | 'other' 카테고리 재료 → AI 재분류 결과 `localStorage` 캐시 (`fridgeai_classify_cache_v2`) |
| 검색 | 재료명 검색 인풋 |

### 6-5. 레시피 추천 `/recipes`

> AI 2단계 생성 플로우: 후보 선택 → 상세 레시피 생성

| 구성 요소 | 스펙 |
|-----------|------|
| 음식 유형 선택 | 한식·양식·중식·일식·기타 + 직접 입력 / 복수 선택 가능 |
| 맛 선택 | 담백한·매운·달콤한·짭짤한·간단한 등 / 복수 선택 |
| 1단계: 후보 카드 | GPT-4o가 생성한 요리 후보 3개 / 카드: 요리명 + 간단 설명 + 난이도 |
| 후보 카드 hover | border-color Green 전환 200ms + translateY(-2px) |
| 2단계: 상세 레시피 | 선택한 요리의 재료 목록 + 단계별 조리법 + 팁 |
| 매칭률 바 | 큐레이션 레시피에 적용 / Green 채움 + 숫자 % / 80%↑ Green / 50~80% Amber / 50%↓ Gray |
| 매칭률 카운트업 | 숫자 카운트업 500ms ease-out |
| 북마크 | 카드 우상단 북마크 아이콘 / **localStorage 저장** (서버 API 없음) / 저장 시 Green 채움 애니메이션 |
| 레시피 쿼터 | recipe 잔여 횟수 표시 / 0회 시 생성 버튼 비활성화 + 업그레이드 안내 |

---

## 07. 아이콘 & 일러스트레이션

| 항목 | 스펙 |
|------|------|
| 아이콘 라이브러리 | Lucide Icons — 2px 스트로크, 선형, 단순한 기하학적 형태 |
| 기본 크기 | 16px (인라인) / 20px (버튼 내) / 24px (메뉴·리스트) / 48px (피처 카드) |
| 색상 규칙 | bg에 따라 Green / White / Gray 중 선택 / Disabled: `#888780` |
| 커스텀 아이콘 | 냉장고 로고 아이콘: 직사각형 + 상단 구분선 + 원형 + 잎 패스 (SVG) |
| 일러스트 | 필요 시 Flat 스타일 / Green·Teal·Cream 팔레트 / 그라디언트 금지 |
| AI 로딩 애니메이션 | 냉장고 아이콘 내부에서 스파클 이펙트 / CSS keyframes / 1.5s loop |

### 로고 사용 규칙

| 항목 | 규칙 |
|------|------|
| 최소 크기 | 디지털 24px 높이 / 인쇄 10mm 이하 사용 금지 |
| 여백 | 로고 높이의 50% 이상 클리어 존 확보 |
| 변형 금지 | 비율 변경·색상 임의 변경·회전·그림자 추가 금지 |
| 라이트 버전 | White/Ice bg 위 사용 / 로고 텍스트: Deep Night + Green 점 |
| 다크 버전 | Deep Night bg 위 사용 / 로고 텍스트: Cream + Mint 점 |
| 그린 버전 | Green bg 위 사용 / 로고 텍스트: White + Mint 점 / 마케팅 한정 |

---

## 08. 모션 & 인터랙션 원칙

> 모든 애니메이션은 **"빠르고 자연스럽게"** — 사용자 흐름을 방해하지 않으며, 상태 변화를 명확하게 전달하는 것을 목적으로 합니다.

### 타이밍 토큰

```css
/* Easing */
--ease-default: cubic-bezier(0.4, 0, 0.2, 1);
--ease-out:     ease-out;   /* 등장 */
--ease-in-out:  ease-in-out; /* 전환 */

/* Duration */
--duration-micro:  100ms;  /* 즉각적 피드백 */
--duration-short:  200ms;  /* 버튼·hover */
--duration-medium: 300ms;  /* 페이지 전환·모달 */
--duration-long:   500ms;  /* 숫자 카운트업 */
```

### 인터랙션 명세

| 요소 | 애니메이션 |
|------|-----------|
| 버튼 hover | bg 전환 150ms ease-out / scale(1.01) 100ms |
| 카드 hover | border-color 전환 200ms / translateY(-2px) 200ms ease-out |
| 페이지 전환 | Fade + Slide Up / 300ms / opacity 0→1 + translateY 8px→0 |
| 모달 등장 | Fade + Scale / 200ms / scale(0.96)→1 + opacity 0→1 |
| AI 로딩 | Pulse 애니메이션 / Green 색상 / 1.5s infinite |
| 숫자 카운트업 | 잔여 횟수, 매칭률 등 / 500ms ease-out / requestAnimationFrame 기반 |
| Toast 알림 | 우상단 슬라이드인 / 250ms / 3초 후 fadeout / 스택 최대 3개 |

---

## 09. 다크 모드

### 배경 계층

```css
--bg-l0: #0A0A0A;  /* 최하단 페이지 배경 */
--bg-l1: #141414;  /* 주요 컨테이너 배경 */
--bg-l2: #1E1E1E;  /* 카드 배경 */
--bg-l3: #282828;  /* 인풋, 드롭다운 */
```

### 다크 모드 색상 매핑

| 항목 | Light | Dark |
|------|-------|------|
| Primary | `#1D9E75` | `#5DCAA5` (Mint — 대비비 유지) |
| 배경 | `#FFFFFF` | `#141414` |
| 텍스트 Primary | `#1A1A1A` | `#F1EFE8` |
| 텍스트 Secondary | `#5F5E5A` | `#9FE1CB` |
| 카드 테두리 | `0.5px #D3D1C7` | `0.5px #333333` / hover: `1px #5DCAA5` |
| 인풋 | `bg: White` | `bg: #1E1E1E / border: #333333 / focus: #5DCAA5` |

### CSS 변수 구조

```css
:root {
  --color-primary:    #1D9E75;
  --color-bg:         #FFFFFF;
  --color-bg-card:    #FFFFFF;
  --color-text:       #1A1A1A;
  --color-text-sub:   #5F5E5A;
  --color-border:     #D3D1C7;
}

[data-theme="dark"] {
  --color-primary:    #5DCAA5;
  --color-bg:         #141414;
  --color-bg-card:    #1E1E1E;
  --color-text:       #F1EFE8;
  --color-text-sub:   #9FE1CB;
  --color-border:     #333333;
}
```

전환 방식: `CSS prefers-color-scheme` + 수동 토글 (`localStorage` 저장)  
전환 애니메이션: `background-color` / `color` transition 200ms

---

## 10. 반응형 & 접근성

### 반응형 규칙

| 브레이크포인트 | 레이아웃 |
|---------------|---------|
| Mobile (< 768px) | 단일 컬럼 / 카드 전체 너비 / 터치 타깃 최소 44px |
| Tablet (768–1024px) | 2열 그리드 / 카드 2열 |
| Desktop (> 1024px) | 12열 그리드 / 카드 3–4열 |
| 터치 인터랙션 | 버튼·카드 최소 44×44px / 스와이프로 재료 삭제 / 롱프레스로 다중 선택 |
| 이미지 | `srcset` + WebP / lazy loading / 비율 유지 `object-fit: cover` |

### 접근성 (WCAG 2.1 AA)

| 항목 | 기준 |
|------|------|
| 색상 대비 | 텍스트: 최소 4.5:1 / UI 컴포넌트: 최소 3:1 / Prigio Green on White: 4.56:1 ✓ |
| 키보드 내비 | 모든 인터랙티브 요소 Tab 접근 가능 / focus ring: 2px Green |
| 스크린 리더 | `aria-label` 필수 제공 / `img alt` 텍스트 / `role` 명시 |
| 폰트 크기 | 최소 12px / 사용자 브라우저 폰트 크기 설정 존중 (`rem` 단위 사용) |
| 에러 안내 | 색상만으로 에러 표시 금지 / 아이콘 + 텍스트 병용 |

---

## 11. AI 구현 프롬프트 가이드

> 본 섹션은 AI 도구(Claude, ChatGPT, Cursor 등)로 Prigio UI를 구현할 때 활용하는 프롬프트 템플릿입니다.  
> **아래 시스템 프롬프트를 항상 첫 줄에 붙여넣고 사용하세요.**

### 시스템 컨텍스트 프롬프트 (복사해서 사용)

```
당신은 Prigio(프리지오) 서비스의 프론트엔드 UI를 구현하는 전문가입니다.
다음 디자인 시스템을 반드시 준수하세요:

[브랜드]
- 서비스명: Prigio (프리지오) — AI 냉장고 레시피 추천 서비스
- 슬로건: "찍으면, 요리가 된다"

[컬러]
- Primary:    Prigio Green  #1D9E75
- Dark bg:    Deep Night    #0D1F1A
- Mint:       Mint          #5DCAA5
- Light bg:   Ice           #E1F5EE
- Accent:     Warm Amber    #FAC775
- Text:       #1A1A1A (primary) / #5F5E5A (secondary)
- Border:     #D3D1C7 (0.5px)
- Dark mode Primary: #5DCAA5

[폰트]
- 영문: Inter / 한글: Pretendard
- Display 52px Bold / Heading 28px SemiBold / Body 16px Regular / Caption 12px
- 최소 폰트: 12px

[컴포넌트]
- 카드: radius 16px, border 0.5px #D3D1C7, padding 20px, shadow 없음
- 버튼(Primary): radius 10px, bg #1D9E75, text White, padding 12px 24px, 15px SemiBold
- 버튼(Secondary): transparent bg, 1px border Green, hover bg Ice
- 인풋: height 44px, radius 10px, border 1px #D3D1C7, focus border 2px #1D9E75
- 플로팅 버튼: 하단 우측 고정, radius full, bg Green, 아이콘 White

[레이아웃]
- 최대 너비: 1280px
- 그리드: Desktop 12열 / Tablet 8열 / Mobile 4열
- 사이드바: 없음 (대시보드는 단일 컬럼 + 2×2 퀵액션 그리드)
- 반응형: Mobile < 768px 단일 컬럼

[애니메이션]
- Easing: cubic-bezier(0.4, 0, 0.2, 1)
- Hover 전환: 150–200ms
- 페이지 전환: Fade + Slide Up, 300ms
- 모달: scale(0.96)→1 + opacity, 200ms
- 그라디언트·그림자·블러 효과 금지

[다크 모드]
- CSS 변수 기반: [data-theme="dark"]
- prefers-color-scheme 지원
- Dark Primary: #5DCAA5 / Dark bg: #141414 / Dark text: #F1EFE8

[접근성]
- WCAG 2.1 AA 준수
- 터치 타깃 최소 44×44px
- focus ring: 2px solid #1D9E75
- aria-label 및 alt 텍스트 필수
```

### 컴포넌트별 구현 프롬프트

| 컴포넌트 | 프롬프트 |
|----------|---------|
| 히어로 섹션 | bg Deep Night 전체 너비 히어로 섹션. 중앙 정렬, "Prigio." 52px Bold (Pri는 Cream, gio.는 Mint), 슬로건 20px Cream, CTA 버튼 2개 (Primary Green + Secondary outline White), 반응형 |
| 재료 카드 | 식재료 카드 컴포넌트 React. 아이콘(48px 원형 Ice bg), 이름(14px Bold), 수량(13px Gray), 유통기한 뱃지(D-N, Amber). hover border Green. 삭제·수정 인라인 버튼 |
| 매칭률 바 | 레시피 매칭률 프로그레스 바. 80% 이상 Green, 50~80% Amber, 이하 Gray. 숫자 카운트업 500ms 애니메이션. radius full |
| AI 업로드 존 | 파일 드래그앤드롭 영역. 점선 테두리 2px dashed #D3D1C7. 중앙 냉장고 아이콘 48px. 드래그 오버 시 border Green + bg Ice 전환 200ms |
| 구독 카드 | Free/Pro 플랜 비교 카드. Free: Ice bg. Pro: Green bg White text border 2px Green. 기능 체크리스트 16px. CTA 버튼 하단 고정 |

---

## 12. 기술 구현 명세 (현재 구현 기준)

### 프론트엔드 스택

| 항목 | 기술 | 이유 |
|------|------|------|
| 프레임워크 | **React 18 + Vite + TypeScript** | 빠른 HMR, 타입 안전성 |
| 스타일링 | **Tailwind CSS + inline style** | 유틸리티 클래스, CSS Variables 미적용 |
| 아이콘 | **Lucide Icons** (2px stroke) | 경량 SVG 아이콘 |
| 상태 관리 | **Zustand** (auth, quota) + **React Query** | 전역 상태 + 서버 상태 캐싱 |
| 라우터 | **React Router v7** | SPA 클라이언트 라우팅 |
| API 통신 | **axios** (`withCredentials: true`, `baseURL = VITE_API_BASE_URL`) | CORS 쿠키 전송 |
| 배포 | **Vercel** | GitHub 자동 배포, CDN |

### 백엔드 스택

| 항목 | 기술 | 이유 |
|------|------|------|
| API 서버 | **FastAPI** (Python 3.11) | 비동기, OpenAPI 자동 생성 |
| DB | **PostgreSQL** (Supabase) | 안정성, 관리형 서비스 |
| ORM | **SQLAlchemy 2.0** + Alembic | 비동기 지원, 마이그레이션 |
| AI API | **OpenAI GPT-4o Vision** | 식재료 인식 + 레시피 생성 통합 |
| 인증 | **Google OAuth 2.0** + JWT RS256 + HttpOnly SameSite=None Cookie | 크로스 도메인 쿠키 |
| 결제 | **Polar.sh** | 구독 관리, HMAC 웹훅 검증 |
| 배포 | **Railway** (Docker, railway.toml) | GitHub 연동, 컨테이너 네이티브 |
| 이미지 처리 | **메모리 내 처리 후 즉시 해제** | 영구 저장 없음, 개인정보 보호 |
| 이미지 프록시 | **LRU 메모리 캐시** (200 엔트리) + Semaphore(4) | 외부 이미지 CORS 우회 |

---

> **본 문서는 Prigio 서비스의 모든 디자인 의사결정의 Single Source of Truth입니다.**  
> UI 구현 시 반드시 본 기획안을 참조하고, 변경이 필요한 경우 디자인 시스템 담당자와 협의 후 진행하세요.

---

**Prigio.** Design Specification v1.0 · © 2025 · Confidential

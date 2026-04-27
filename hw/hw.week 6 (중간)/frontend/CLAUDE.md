# Prigio (프리지오) — 프론트엔드 구현 가이드

> AI 냉장고 레시피 추천 서비스 | 디자인 스펙 v1.0 기준
> UI 구현 시 반드시 본 문서를 참조할 것.

---

## 브랜드

| 항목 | 내용 |
|------|------|
| 서비스명 | **Prigio** (프리지오) — FridgeAI·FridgeAI 등 다른 이름 사용 금지 |
| 슬로건 | "찍으면, 요리가 된다" |
| 서브 카피 | 냉장고 사진 한 장으로 오늘 저녁 완성 |
| 로고 표기 | `Pri`는 Cream, `gio.`는 Mint — 두 파트 색상 구분 필수 |

---

## 컬러 시스템

```
Deep Night    #0D1F1A  — 히어로 섹션, 다크 카드, 네비게이션 배경
Prigio Green  #1D9E75  — 메인 브랜드, CTA 버튼, 강조 (Primary)
Mint          #5DCAA5  — 포인트, 아이콘, 다크 모드 Primary
Ice           #E1F5EE  — 카드 배경, 뱃지, 섹션 배경
Warm Amber    #FAC775  — 경고, 유통기한 임박, 주의
Cream         #F1EFE8  — 다크 모드 텍스트, 밝은 배경
White         #FFFFFF  — 기본 배경, 카드
Gray 300      #D3D1C7  — 테두리, 구분선 (0.5px 사용)
Gray 500      #888780  — Disabled, 보조 정보
Text Primary  #1A1A1A  — 기본 본문
Text Secondary #5F5E5A — 보조 텍스트
```

**절대 금지**: 그라디언트, 그림자(box-shadow), 블러 효과

---

## 타이포그래피

- **영문**: Inter / **한글**: Pretendard
- Display: 52px Bold | Heading 1: 28px SemiBold | Body: 16px Regular | Caption: 12px
- 최소 폰트: **12px** (이하 사용 금지)
- 자간: Display `-0.02em` / Heading `-0.01em` / Caps `+0.08em`

---

## 컴포넌트 스펙

### 카드
```
bg: #FFFFFF | border: 0.5px #D3D1C7 | radius: 16px | padding: 20px | shadow: 없음
hover: border-color #1D9E75 전환 200ms + translateY(-2px)
```

### 버튼
```
Primary  : bg #1D9E75 / text White / radius 10px / padding 12px 24px / 15px SemiBold
Secondary: bg transparent / border 1px #1D9E75 / text #1D9E75 / hover bg #E1F5EE
Danger   : bg #E24B4A / text White
Disabled : opacity 0.4
hover    : opacity 0.9 + scale(1.01) 150ms
active   : scale(0.98)
```

### 인풋
```
height: 44px | border: 1px #D3D1C7 | radius: 10px
focus: border 2px #1D9E75
error: border #E24B4A + 아이콘 + 에러 텍스트 (색상만으로 에러 표시 금지)
```

### 뱃지 & 태그
```
매칭률  : Green 계열 / radius full / 12px
부족재료: Amber 계열 / radius full
유통기한: Amber bg / 카드 우상단 / "D-N" 표기
플랜    : Free=Gray / Pro=Green+★
```

---

## 레이아웃

```
최대 너비 : 1280px
그리드    : Desktop 12열(gutter 24px) / Tablet 8열(20px) / Mobile 4열(16px)
사이드바  : 240px, bg #0D1F1A
브레이크  : Mobile <768px / Tablet 768–1024px / Desktop >1024px
터치타깃  : 최소 44×44px
```

---

## 애니메이션

```css
--ease-default: cubic-bezier(0.4, 0, 0.2, 1);

버튼 hover   : 150ms ease-out
카드 hover   : 200ms (border + translateY)
페이지 전환  : Fade + Slide Up 300ms (opacity 0→1 + translateY 8px→0)
모달 등장    : scale(0.96)→1 + opacity 0→1, 200ms
AI 로딩      : Pulse, Green, 1.5s infinite
Toast        : 우상단 슬라이드인 250ms, 3초 후 fadeout
숫자 카운트업: 500ms ease-out
```

---

## 다크 모드

```css
/* 라이트 (기본) */
--color-primary:  #1D9E75;
--color-bg:       #FFFFFF;
--color-bg-card:  #FFFFFF;
--color-text:     #1A1A1A;
--color-text-sub: #5F5E5A;
--color-border:   #D3D1C7;

/* 다크 [data-theme="dark"] */
--color-primary:  #5DCAA5;
--color-bg:       #141414;
--color-bg-card:  #1E1E1E;
--color-text:     #F1EFE8;
--color-text-sub: #9FE1CB;
--color-border:   #333333;
```

전환: `prefers-color-scheme` + localStorage 수동 토글, 200ms transition

---

## 페이지별 핵심 스펙

### 랜딩 `/`
- 히어로: `#0D1F1A` 전체 너비, 로고 52px Bold (Pri=Cream / gio.=Mint), 슬로건 20px Cream
- CTA 2개: Primary Green + Secondary outline White
- 기능 소개: 3열 그리드, 아이콘 48px Teal
- 요금: 2열 카드 (Free=Ice bg / Pro=Green bg+White text+border 2px Green)
- 푸터: `#0D1F1A` bg, Cream 텍스트

### 대시보드 `/dashboard`
- 사이드바 240px Deep Night + 메인 콘텐츠 영역
- 상단 메트릭 카드 4개 (식재료 수·AI 잔여·레시피·유통기한 임박)
- AI 잔여 횟수: 원형 프로그레스 바, Green→Amber→Red

### 사진 분석 `/analyze`
- 업로드 존: 점선 테두리 2px dashed `#D3D1C7`, 드래그 오버 시 border Green + bg Ice
- 로딩: Spinner Green + "분석 중..." Pulse 애니메이션
- 결과: 재료 카드 그리드, 인라인 수량 편집

### 냉장고 `/fridge`
- 재료 그리드: 3열(데스크탑) / 2열(모바일)
- 유통기한 D-3: Amber 뱃지 + 카드 테두리 Amber 강조
- 플로팅 추가 버튼: 하단 우측 고정, radius full, bg Green

### 레시피 `/recipes`
- 레시피 카드: 썸네일 16:9 + 제목 16px Bold + 매칭률 바
- 매칭률 바: ≥80% Green / 50~80% Amber / <50% Gray, 카운트업 500ms
- 북마크: 우상단 아이콘, 저장 시 Green 채움 애니메이션

---

## 접근성 (WCAG 2.1 AA)

- 색상 대비: 텍스트 최소 4.5:1 / UI 컴포넌트 최소 3:1
- focus ring: `2px solid #1D9E75`
- 에러: 색상 단독 사용 금지 — 아이콘 + 텍스트 병용 필수
- `aria-label`, `img alt` 필수

---

## 아이콘

- 라이브러리: **Lucide Icons** (2px stroke, 선형)
- 크기: 16px(인라인) / 20px(버튼) / 24px(메뉴) / 48px(피처 카드)
- 커스텀 냉장고 로고: 직사각형 + 상단 구분선 + 원형 + 잎 패스 (SVG)

---

## 기술 스택 (현재 구현)

| 영역 | 기술 |
|------|------|
| 프레임워크 | React 18 + Vite + TypeScript |
| 스타일링 | Tailwind CSS + inline style (CSS Variables 미적용 상태) |
| 상태 관리 | Zustand + React Query |
| 라우터 | React Router v7 |
| API | axios (withCredentials, baseURL = VITE_API_BASE_URL) |
| 백엔드 | FastAPI (Railway 배포) |
| 인증 | Google OAuth + JWT HttpOnly Cookie |
| 결제 | Polar.sh 구독 |

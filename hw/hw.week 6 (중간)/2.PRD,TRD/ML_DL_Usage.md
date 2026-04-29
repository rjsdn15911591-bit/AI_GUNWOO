# Prigio (프리지오) — AI·머신러닝·딥러닝 기술 활용 보고서

> AI/머신러닝 대학 강의 과제용 기술 문서  
> 현재 구현 코드(`fridgeai-frontend` / `fridgeai-backend`) 기준  
> 작성일: 2026-04

---

## 개요

Prigio는 냉장고 식재료를 AI로 자동 인식하고, 보유 재료 기반 레시피를 AI가 직접 생성하는 서비스입니다.  
본 문서는 현재 구현된 코드에서 **딥러닝·머신러닝 기술이 어떻게 활용되고 있는지** 구체적으로 설명합니다.

---

## 1. 핵심 AI/DL 기술: GPT-4o Vision 기반 이미지 인식

### 1-1. 기술 분류

| 구분 | 내용 |
|------|------|
| 기술 유형 | **대규모 언어 모델 (LLM) + 비전 트랜스포머 (ViT)** |
| 모델 | OpenAI GPT-4o (Vision 멀티모달) |
| ML 패러다임 | **지도 학습(Supervised Learning) 기반 사전 훈련 + 프롬프트 튜닝(Prompt Engineering)** |
| 구현 위치 | `fridgeai-backend/app/services/ai_service.py` |

### 1-2. 작동 원리

GPT-4o Vision은 수억 장의 이미지-텍스트 쌍 데이터로 사전 훈련(pre-training)된 **멀티모달 딥러닝 모델**입니다.

```
냉장고 이미지 입력
    ↓
[Vision Encoder — ViT 기반 CNN/Transformer]
이미지를 패치(patch) 단위로 분할 → 시각적 특징 벡터 추출
    ↓
[Cross-Attention (멀티모달 Fusion)]
시각적 특징 + 언어 컨텍스트(프롬프트) 결합
    ↓
[Language Decoder — Transformer]
식재료 목록을 JSON 형태로 자연어 생성
    ↓
결과: {"ingredients": [{"name": "당근", "quantity": 2, "unit": "개"}, ...]}
```

### 1-3. 실제 코드에서의 구현

```python
# fridgeai-backend/app/services/ai_service.py

OPENAI_MODEL = "gpt-4o"
OPENAI_TIMEOUT_SECONDS = 90

SYSTEM_PROMPT = """
당신은 냉장고 이미지에서 식재료를 인식하는 전문가입니다.
이미지에서 보이는 모든 식재료를 JSON으로만 반환하세요.
형식: {"ingredients": [{"name": "재료명(한국어)", "quantity": 숫자, "unit": "단위", "confidence": 0~1}]}
"""

async def analyze_image(image_bytes: bytes) -> list[dict]:
    b64 = base64.b64encode(image_bytes).decode('utf-8')
    response = await openai_client.chat.completions.create(
        model=OPENAI_MODEL,
        max_tokens=2000,
        timeout=OPENAI_TIMEOUT_SECONDS,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": [
                {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{b64}"}}
            ]}
        ],
        response_format={"type": "json_object"}  # 구조화된 출력 강제
    )
    return parse_ai_response(response.choices[0].message.content)
```

**핵심 ML/DL 개념 적용:**
- `response_format={"type": "json_object"}`: 모델의 출력을 구조화된 형식으로 제어 (structured output)
- `SYSTEM_PROMPT`: Few-shot / Zero-shot prompting으로 모델의 행동 방향 설정
- `confidence` 점수: 모델의 예측 불확실성(uncertainty) 수치화

---

## 2. 병렬 추론: asyncio.gather 기반 멀티-이미지 처리

### 2-1. 기술 분류

| 구분 | 내용 |
|------|------|
| 기술 유형 | **비동기 병렬 추론 (Parallel Inference)** |
| 구현 위치 | `fridgeai-backend/app/api/v1/analysis.py` |

### 2-2. 설명

최대 2장의 이미지를 동시에 GPT-4o에 요청하여 처리 시간을 단축합니다.  
이는 딥러닝 모델의 **배치 추론(batch inference)** 개념을 API 수준에서 구현한 것입니다.

```python
# fridgeai-backend/app/api/v1/analysis.py

MAX_IMAGES = 2

# 2장 이미지를 병렬로 GPT-4o에 요청 (직렬 대비 처리 시간 ~50% 단축)
results = await asyncio.gather(*[
    analyze_image(image_bytes) for image_bytes in images
])

# 이름 기반 중복 제거 (두 이미지에서 동일 재료가 감지된 경우)
merged = deduplicate_by_name(results)
```

**ML 개념:** 배치 추론(batch inference) — 여러 입력을 동시에 모델에 공급하여 처리량(throughput) 극대화

---

## 3. 자연어 처리(NLP): AI 레시피 생성 — 2단계 생성 파이프라인

### 3-1. 기술 분류

| 구분 | 내용 |
|------|------|
| 기술 유형 | **대규모 언어 모델 (LLM) + 프롬프트 체이닝 (Prompt Chaining)** |
| 패러다임 | **In-Context Learning (ICL)** / Chain-of-Thought 유도 |
| 구현 위치 | `fridgeai-backend/app/api/v1/recipes.py`, `app/services/recipe_service.py` |

### 3-2. 2단계 생성 파이프라인

프롬프트 체이닝(Prompt Chaining)은 복잡한 작업을 여러 단계로 분해하는 LLM 기법입니다.  
Prigio는 이를 레시피 생성에 적용합니다.

```
[Step 1 — 후보 생성]
입력: 냉장고 재료 목록 + 사용자 선호(음식 유형, 맛)
      ↓ GPT-4o (CANDIDATE_SYSTEM_PROMPT)
출력: 요리 후보 3개 {"candidates": [{"dish": "...", "description": "...", "difficulty": "..."}]}

          사용자가 1개 선택
                ↓

[Step 2 — 상세 레시피 생성]
입력: Step 1 결과 + 선택한 요리명 (selected_dish)
      ↓ GPT-4o (RECIPE_SYSTEM_PROMPT)
출력: 상세 레시피 {"title": "...", "ingredients": [...], "steps": [...], "tips": "..."}
```

**적용된 ML/NLP 기법:**
- **Prompt Chaining**: 복잡한 작업을 단계별로 분해하여 각 단계 품질 향상
- **In-Context Learning**: 시스템 프롬프트에 역할과 출력 형식을 명시하여 zero-shot으로 높은 품질 달성
- **Structured Output**: `response_format={"type": "json_object"}`로 파싱 가능한 구조 강제

---

## 4. 자연어 처리(NLP): 식재료명 정규화 — 동의어 매핑

### 4-1. 기술 분류

| 구분 | 내용 |
|------|------|
| 기술 유형 | **규칙 기반 NLP (Rule-based NLP) + 동의어 정규화 (Synonym Normalization)** |
| 구현 위치 | `fridgeai-backend/app/services/ingredient_normalizer.py` |

### 4-2. 설명

AI가 이미지에서 인식한 재료명은 표기가 다양합니다 (예: "토마토" / "방울토마토" / "토마테").  
`ingredient_normalizer.py`는 이를 표준 재료명으로 통합하는 정규화 모듈입니다.

```python
# 동의어 테이블 (규칙 기반 NLP)
SYNONYM_MAP = {
    "대파": ["파", "쪽파", "실파"],
    "돼지고기": ["삼겹살", "목살", "항정살"],
    "닭고기": ["닭", "닭가슴살", "닭다리"],
    # ...
}

def normalize_name(name: str) -> str:
    """입력 재료명을 표준명으로 정규화"""
    for standard, synonyms in SYNONYM_MAP.items():
        if name in synonyms:
            return standard
    return name
```

**ML 개념:**
- 텍스트 전처리(Text Preprocessing): 원시 AI 출력을 정제하여 DB 저장 품질 향상
- 개체명 인식(Named Entity Recognition) 후처리: AI 인식 결과의 일관성 보장

---

## 5. 카테고리 분류: AI 기반 식재료 카테고리 자동 분류

### 5-1. 기술 분류

| 구분 | 내용 |
|------|------|
| 기술 유형 | **LLM 기반 텍스트 분류 (Text Classification)** |
| 분류 클래스 | 11종 카테고리 (vegetable, fruit, meat_fish, dairy, cooked, egg_convenience, ready_made, sauce, beverage, grain, other) |
| 구현 위치 | `fridgeai-backend/app/api/v1/fridge.py` (`POST /fridge/ingredients/classify`) |
| 프론트 캐시 | `fridgeai-frontend/src/pages/Fridge.tsx` (`localStorage: fridgeai_classify_cache_v2`) |

### 5-2. 설명

'other' 카테고리로 분류된 재료를 GPT-4o가 11가지 카테고리 중 하나로 재분류합니다.  
이는 **다중 클래스 분류(Multi-class Classification)** 문제를 LLM으로 해결하는 접근법입니다.

```python
# 최대 30개 재료명을 한 번에 카테고리 분류 (배치 처리)
POST /api/v1/fridge/ingredients/classify
Request: {"names": ["참치캔", "라면", "고추장"]}
Response: {
    "참치캔": "ready_made",
    "라면": "grain",
    "고추장": "sauce"
}
```

**프론트엔드 캐싱 (ML 추론 비용 최적화):**
```javascript
// 한 번 분류한 재료는 localStorage에 캐시 → API 재호출 방지
const cache = JSON.parse(localStorage.getItem('fridgeai_classify_cache_v2') || '{}');
if (cache[ingredientName]) {
    return cache[ingredientName]; // 캐시 히트: API 호출 없음
}
// 캐시 미스: API 호출 후 결과 캐시 저장
```

**ML 개념:**
- 다중 클래스 분류(Multi-class Classification): N개 클래스 중 1개 선택
- 배치 추론 최적화: 30개 재료를 한 번에 분류하여 API 호출 횟수 최소화
- 추론 캐싱(Inference Caching): 동일 입력에 대한 반복 추론 제거

---

## 6. 프론트엔드 ML 보조 기능: 규칙 기반 카테고리 분류

### 6-1. 기술 분류

| 구분 | 내용 |
|------|------|
| 기술 유형 | **규칙 기반 분류 (Rule-based Classification)** + 정규식(Regex) 패턴 매칭 |
| 구현 위치 | `fridgeai-frontend/src/pages/Fridge.tsx` (`getIngredientMeta()`) |

### 6-2. 설명

API 호출 없이 재료명 키워드로 즉시 카테고리와 저장 방법을 추정합니다.  
이는 **결정 트리(Decision Tree)** 분류기의 간소화 버전입니다.

```typescript
function getIngredientMeta(name: string): IngredientMeta {
    const lower = name.toLowerCase();
    
    // 규칙 기반 분류 (정규식 패턴 매칭)
    if (/당근|배추|시금치|파|마늘|양파/.test(lower))
        return { category: 'vegetable', storage: '냉장', shortShelf: 7 };
    if (/소고기|돼지고기|닭고기|연어|참치/.test(lower))
        return { category: 'meat_fish', storage: '냉동', shortShelf: 3 };
    if (/우유|치즈|요거트/.test(lower))
        return { category: 'dairy', storage: '냉장', shortShelf: 5 };
    // ... 11개 카테고리 규칙
    
    return { category: 'other', storage: '냉장', shortShelf: 7 };
}
```

**ML 개념:**
- 규칙 기반 분류기(Rule-based Classifier): 전통적 ML 접근법으로, 도메인 지식을 직접 인코딩
- 특징 추출(Feature Extraction): 재료명 텍스트에서 키워드 패턴 추출
- 하이브리드 접근: 규칙 기반(즉시, 무비용) + LLM(정확하지만 유료) 조합으로 비용-정확도 균형

---

## 7. 추천 시스템 보조: 매칭률 기반 레시피 랭킹

### 7-1. 기술 분류

| 구분 | 내용 |
|------|------|
| 기술 유형 | **콘텐츠 기반 필터링 (Content-Based Filtering)** |
| 구현 위치 | `fridgeai-backend/app/services/recipe_service.py` |

### 7-2. 설명

사용자의 냉장고 재료와 큐레이션 레시피 재료를 비교하여 매칭률을 계산합니다.  
이는 **콘텐츠 기반 추천 시스템**의 핵심 알고리즘입니다.

```python
def calculate_match_ratio(user_ingredients: list[str], recipe_ingredients: list[str]) -> float:
    """
    Jaccard 유사도 변형: 보유 재료 / 레시피 전체 재료
    Content-Based Filtering 매칭 스코어
    """
    normalized_user = set(normalize_name(i) for i in user_ingredients)
    normalized_recipe = set(normalize_name(i) for i in recipe_ingredients)
    
    matched = normalized_user & normalized_recipe  # 교집합
    
    match_ratio = len(matched) / len(normalized_recipe) * 100
    return match_ratio

# 정렬: 매칭률 높은 순 → 조리 시간 짧은 순
sorted_recipes = sorted(candidates, key=lambda r: (-r.match_ratio, r.ready_in_minutes))
```

**ML 개념:**
- 콘텐츠 기반 필터링(Content-Based Filtering): 아이템 속성(재료) 유사도 기반 추천
- Jaccard 유사도 변형: 두 집합의 교집합/전체 비율로 유사도 측정
- 다중 기준 정렬(Multi-criteria Ranking): 매칭률 + 조리 시간 복합 점수

---

## 8. 쿼터 관리: 통계적 사용량 추적 및 이상 감지

### 8-1. 기술 분류

| 구분 | 내용 |
|------|------|
| 기술 유형 | **통계 기반 모니터링 (Statistical Monitoring)** |
| 구현 위치 | `fridgeai-backend/app/services/quota_service.py` |

### 8-2. 설명

feature별(`analysis`, `recipe`) 사용량을 통계적으로 추적하여 이상 사용 패턴을 감지합니다.

```python
FREE_LIMITS = {'analysis': 5, 'recipe': 10}
PRO_LIMITS  = {'analysis': 30, 'recipe': 30}
ADMIN_UNLIMITED = 99999

async def check_and_increment_quota(user_id, db, feature='analysis'):
    """
    사용량 임계값(threshold) 기반 이상 감지 + 제한
    - SELECT ... FOR UPDATE: 동시성 제어 (Race Condition 방지)
    - KST 기준 월별 초기화: 시간 시계열 슬라이딩 윈도우
    """
    ...
```

**ML/통계 개념:**
- 임계값 기반 이상 감지(Threshold-based Anomaly Detection): 사용량이 한도를 초과하면 차단
- 시계열 슬라이딩 윈도우(Sliding Window): KST 기준 매월 초기화하여 월별 사용 추이 관리
- 동시성 제어(Concurrency Control): FOR UPDATE 잠금으로 Race Condition 방지

---

## 9. LRU 캐시: 메모리 기반 이미지 프록시 캐싱

### 9-1. 기술 분류

| 구분 | 내용 |
|------|------|
| 기술 유형 | **캐싱 알고리즘 — LRU (Least Recently Used)** |
| 구현 위치 | `fridgeai-backend/app/main.py` (image-proxy 엔드포인트) |

### 9-2. 설명

외부 이미지 URL을 프록시할 때 LRU(Least Recently Used) 캐시를 사용하여  
반복 요청 시 네트워크 호출을 줄입니다.

```python
# LRU 캐시: 200 엔트리 메모리 캐시
# 가장 오래 전에 사용된 항목을 제거 (캐시 교체 정책)
image_cache = LRUCache(maxsize=200)
semaphore = asyncio.Semaphore(4)  # 동시 요청 수 제한

@app.get("/api/v1/image-proxy")
async def image_proxy(url: str):
    if url in image_cache:
        return image_cache[url]  # 캐시 히트
    
    async with semaphore:
        response = await fetch_image(url)
        image_cache[url] = response  # 캐시 저장
    return response
```

**알고리즘 개념:**
- LRU(Least Recently Used): 시간 지역성(temporal locality) 활용 캐시 교체 전략
- Semaphore 기반 Rate Limiting: 동시 추론 요청 수 제한으로 자원 보호

---

## 10. 전체 AI/ML 기술 활용 요약

| 번호 | 기능 | 기술 유형 | 구현 파일 |
|------|------|---------|---------|
| 1 | 냉장고 이미지 식재료 인식 | **딥러닝** — GPT-4o Vision (멀티모달 Transformer) | `ai_service.py` |
| 2 | 멀티 이미지 병렬 추론 | **배치 추론** — asyncio.gather | `analysis.py` |
| 3 | AI 레시피 생성 (2단계) | **LLM + 프롬프트 체이닝** (In-Context Learning) | `recipes.py`, `recipe_service.py` |
| 4 | 식재료명 동의어 정규화 | **규칙 기반 NLP** (텍스트 전처리) | `ingredient_normalizer.py` |
| 5 | 식재료 카테고리 AI 분류 | **LLM 기반 다중 클래스 분류** (Text Classification) | `fridge.py` |
| 6 | 즉시 카테고리 추정 | **규칙 기반 분류기** (키워드 패턴 매칭) | `Fridge.tsx` |
| 7 | 레시피 매칭률 계산 | **콘텐츠 기반 필터링** (Jaccard 유사도 변형) | `recipe_service.py` |
| 8 | 사용량 추적·제한 | **통계 기반 이상 감지** (임계값 모니터링) | `quota_service.py` |
| 9 | 이미지 프록시 캐싱 | **LRU 캐시 알고리즘** | `main.py` |

---

## 11. 딥러닝 모델 구조 심화 설명 (GPT-4o Vision)

### 11-1. Vision Encoder

GPT-4o의 이미지 처리는 **ViT(Vision Transformer)** 기반 인코더를 사용합니다.

```
이미지 (예: 640×480 px)
    ↓ 패치 분할 (16×16 px 단위)
각 패치 → Linear Projection → 임베딩 벡터
    ↓ Positional Encoding (위치 정보 추가)
Multi-Head Self-Attention
    ↓ 시각적 특징 벡터 추출
```

이 과정에서 모델은:
- 냉장고 선반 위치, 빛 반사, 포장지 텍스트 등 **다양한 시각적 특징**을 학습
- 냉장고 내부라는 **컨텍스트(context)**를 이해하여 식재료에 집중

### 11-2. Cross-Attention (Multimodal Fusion)

```
시각적 특징 벡터 (Vision Encoder 출력)
    +
텍스트 프롬프트 임베딩 ("식재료를 JSON으로 인식하세요")
    ↓ Cross-Attention Layer
멀티모달 결합 표현 (Multimodal Representation)
    ↓ Language Decoder
"당근", "계란", "두부" → JSON 출력
```

### 11-3. 프롬프트 엔지니어링의 ML적 의의

프롬프트 엔지니어링은 모델의 가중치(weight)를 변경하지 않고 **입력 분포(input distribution)**를 조정하여 원하는 출력을 유도하는 기법입니다.

```python
SYSTEM_PROMPT = """
당신은 냉장고 이미지에서 식재료를 인식하는 전문가입니다.
...JSON 외 다른 텍스트 출력 절대 금지.
"""
```

이는 **소프트 프롬프트(soft prompt)** 없이 자연어 프롬프트만으로 모델의 행동을 제어하는 **Zero-shot / Few-shot Prompting** 기법입니다.

---

## 12. 하이브리드 AI 아키텍처 (Rule-based + Deep Learning)

Prigio는 두 가지 접근법을 **목적에 맞게 조합**한 하이브리드 구조를 채택합니다.

```
        ┌─────────────────────────────────────────────┐
        │           입력 처리 파이프라인               │
        └─────────────────────────────────────────────┘
                        ↓
        ┌───────────────────────────────────┐
        │  규칙 기반 (Rule-based)            │  ← 빠름, 무비용, 확정적
        │  - 재료명 동의어 정규화            │
        │  - 프론트엔드 즉시 카테고리 추정   │
        │  - 쿼터 임계값 체크                │
        └───────────────────────────────────┘
                        ↓ (규칙으로 처리 안 되는 케이스)
        ┌───────────────────────────────────┐
        │  딥러닝 기반 (Deep Learning)       │  ← 정확, 유연, 유료
        │  - GPT-4o Vision 이미지 인식       │
        │  - LLM 레시피 생성 (2단계)         │
        │  - LLM 카테고리 재분류             │
        └───────────────────────────────────┘
```

**설계 원칙:**
- 단순하고 반복적인 작업 → 규칙 기반 (비용 절감)
- 복잡하고 유연성이 필요한 작업 → 딥러닝 (품질 극대화)
- 추론 결과 캐싱 → 동일 입력 반복 처리 방지 (비용 최적화)

---

## 13. 향후 추가 가능한 ML/DL 기능 (Phase 2 로드맵)

| 기능 | 기술 | 기대 효과 |
|------|------|---------|
| 유통기한 신선도 감지 | CNN(ResNet) 기반 이미지 분류 Transfer Learning | 시각적 신선도 자동 평가 |
| 협업 필터링 레시피 추천 | Matrix Factorization / Neural Collaborative Filtering | 사용자 취향 개인화 |
| 칼로리 자동 추정 | 회귀 모델(Random Forest / DNN) | 식단 관리 기능 |
| 식재료 소비 예측 | 시계열 예측 (LSTM / Prophet) | 장보기 목록 자동 생성 |

---

*본 문서는 AI/머신러닝 대학 강의 과제 제출용 기술 보고서입니다.*  
*구현 코드: `fridgeai-frontend/` + `fridgeai-backend/` 디렉토리 참조*

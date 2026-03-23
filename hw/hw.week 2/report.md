# Week 2 실습 리포트: AI와 머신러닝 기초

> **작성일**: 2026-03-23  
> **환경**: Python 3.12, TensorFlow 2.21.0, NumPy, Matplotlib

---

## 목차

1. [실험 1: 지도 학습 — 선형 회귀 (훅의 법칙)](#실험-1-지도-학습--선형-회귀-훅의-법칙)
2. [실험 2: 비지도 학습 — K-Means 군집화](#실험-2-비지도-학습--k-means-군집화)
3. [실험 3: 데이터 전처리 — 정규화 (Min-Max Scaling)](#실험-3-데이터-전처리--정규화-min-max-scaling)
4. [실험 4: 최적화 — 경사 하강법 (Gradient Descent)](#실험-4-최적화--경사-하강법-gradient-descent)
5. [종합 정리](#종합-정리)

---

## 실험 1: 지도 학습 — 선형 회귀 (훅의 법칙)

### 개요

훅의 법칙(Hooke's Law)을 활용하여, 용수철에 매단 추의 무게로부터 용수철의 길이를 예측하는 **지도 학습(Supervised Learning)** 모델을 구현하였다.

- **실제 법칙**: `길이 = 2 × 무게 + 10`
- **데이터**: 0~10kg의 추 11개, 표준편차 1.5cm의 측정 오차(노이즈) 포함
- **모델**: TensorFlow `Dense(1)` 단일 뉴런 (선형 모델)

### 코드

```python
import tensorflow as tf
import numpy as np
import matplotlib.pyplot as plt
import os

output_dir = 'outputs'
if not os.path.exists(output_dir):
    os.makedirs(output_dir)

# 데이터 준비
weights = np.array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10], dtype=float)
true_lengths = 2 * weights + 10

np.random.seed(42)
noise = np.random.normal(loc=0.0, scale=1.5, size=len(weights))
measured_lengths = true_lengths + noise

# 모델 구성 및 학습
model = tf.keras.Sequential([
    tf.keras.layers.Dense(units=1, input_shape=[1])
])
model.compile(optimizer=tf.keras.optimizers.SGD(learning_rate=0.01),
              loss='mean_squared_error')
history = model.fit(weights, measured_lengths, epochs=500, verbose=0)

# 결과 확인
learned_w = float(model.layers[0].get_weights()[0][0])
learned_b = float(model.layers[0].get_weights()[1][0])
```

### 실행 결과

| 항목 | 실제 법칙 | AI 예측 |
|------|-----------|---------|
| 기울기 (1kg당 늘어남) | 2.00 | 2.02 |
| 절편 (초기 길이) | 10.00 | 10.27 |

```
[예측 테스트]
15kg 추를 매달았을 때 예측 길이: 40.57 cm
이론상 실제 길이: 40.00 cm
```

### 분석

- 모델은 노이즈가 포함된 데이터에서 원래 법칙(`y = 2x + 10`)에 매우 가까운 관계식(`y = 2.02x + 10.27`)을 스스로 찾아냈다.
- 15kg에 대한 예측 오차는 약 **1.4%** 수준으로 매우 정확하다.
- **핵심 포인트**: AI에게 "훅의 법칙"이라는 사전 지식을 전혀 알려주지 않았음에도, 데이터만으로 법칙을 발견했다.

---

## 실험 2: 비지도 학습 — K-Means 군집화

### 개요

정답 라벨이 없는 데이터를 AI가 스스로 그룹으로 분류하는 **비지도 학습(Unsupervised Learning)** 실험이다. K-Means 알고리즘을 직접 구현하였다.

- **데이터**: 3개 그룹 × 30개 = 총 90개 2차원 데이터 포인트
- **원래 그룹 중심**: (2, 2), (8, 3), (5, 8)
- **알고리즘**: K-Means (k=3, 최대 10회 반복)

### 코드

```python
import numpy as np
import matplotlib.pyplot as plt
import os

output_dir = 'outputs'
if not os.path.exists(output_dir):
    os.makedirs(output_dir)

np.random.seed(42)

# 3개 그룹 데이터 생성
group1 = np.random.normal(loc=[2, 2], scale=0.5, size=(30, 2))
group2 = np.random.normal(loc=[8, 3], scale=0.5, size=(30, 2))
group3 = np.random.normal(loc=[5, 8], scale=0.5, size=(30, 2))
X = np.vstack([group1, group2, group3])

# K-Means 알고리즘
k = 3
centers = X[np.random.choice(len(X), k, replace=False)]

for i in range(10):
    distances = np.sqrt(((X - centers[:, np.newaxis])**2).sum(axis=2))
    closest_cluster = np.argmin(distances, axis=0)
    new_centers = np.array([X[closest_cluster == j].mean(axis=0) for j in range(k)])
    if np.all(centers == new_centers):
        break
    centers = new_centers
```

### 실행 결과

| 그룹 | 원래 중심 | AI가 찾은 중심 |
|------|-----------|----------------|
| 그룹 1 | (5, 8) | (5.20, 8.63) |
| 그룹 2 | (5, 8) | (4.83, 7.84) |
| 그룹 3 | (2, 2) + (8, 3) | (4.94, 2.48) |

### 분석

- **문제 발생**: 그룹 1과 2가 둘 다 (5, 8) 근처에 몰렸고, (8, 3) 그룹을 제대로 분리하지 못했다.
- **원인**: 초기 중심점 3개가 모두 (5, 8) 근처에서 랜덤 선택됨. K-Means는 초기값에 매우 민감한 알고리즘이다.
- **개선 방향**: K-Means++ 초기화를 사용하면 초기 중심점을 서로 멀리 배치하여 이 문제를 줄일 수 있다.
- **교훈**: 비지도 학습은 정답이 없기 때문에, 결과가 항상 완벽하지는 않으며 알고리즘의 한계를 이해하는 것이 중요하다.

---

## 실험 3: 데이터 전처리 — 정규화 (Min-Max Scaling)

### 개요

단위가 크게 다른 데이터(연봉 vs 나이)를 동일한 스케일(0~1)로 변환하는 **Min-Max 정규화**를 구현하였다.

- **변환 공식**: `정규화 값 = (원래 값 - 최솟값) / (최댓값 - 최솟값)`
- **목적**: 머신러닝 알고리즘에서 특성 간 공정한 비교를 가능하게 함

### 코드

```python
import numpy as np
import matplotlib.pyplot as plt
import os

output_dir = 'outputs'
if not os.path.exists(output_dir):
    os.makedirs(output_dir)

np.random.seed(42)
n_samples = 50

salary = np.random.uniform(30000000, 100000000, n_samples)
age = np.random.uniform(20, 60, n_samples)

# Min-Max 정규화
salary_normalized = (salary - salary.min()) / (salary.max() - salary.min())
age_normalized = (age - age.min()) / (age.max() - age.min())
```

### 실행 결과

| 특성 | 원본 범위 | 정규화 후 |
|------|-----------|-----------|
| 연봉 (원) | 31,440,915 ~ 97,893,690 | 0.0 ~ 1.0 |
| 나이 (세) | 20 ~ 59 | 0.0 ~ 1.0 |

### 분석

- 정규화 전에는 연봉의 숫자가 나이보다 약 **100만 배** 크기 때문에, 거리 기반 알고리즘(K-Means 등)에서 연봉이 결과를 지배하게 된다.
- 정규화 후에는 두 특성이 동일한 0~1 범위를 갖게 되어 **공평하게** 반영된다.
- **실무 중요성**: 대부분의 머신러닝 모델은 학습 전에 정규화(또는 표준화)를 거치는 것이 일반적이다.

---

## 실험 4: 최적화 — 경사 하강법 (Gradient Descent)

### 개요

손실 함수 `y = x²`에서 최솟값을 찾아가는 **경사 하강법(Gradient Descent)**을 시각적으로 구현하였다. 이는 실험 1에서 `model.fit()` 내부에서 실제로 일어나는 최적화 과정이다.

- **손실 함수**: `y = x²` (최솟값: x=0에서 y=0)
- **기울기(미분)**: `dy/dx = 2x`
- **업데이트 규칙**: `x_new = x_old - learning_rate × gradient`
- **설정**: 시작점 x = -4.0, learning_rate = 0.1, 20회 반복

### 코드

```python
import numpy as np
import matplotlib.pyplot as plt
import os

output_dir = 'outputs'
if not os.path.exists(output_dir):
    os.makedirs(output_dir)

def loss_function(x):
    return x**2

def gradient(x):
    return 2 * x

current_x = -4.0
learning_rate = 0.1
steps = []

for i in range(20):
    current_loss = loss_function(current_x)
    steps.append((current_x, current_loss))
    grad = gradient(current_x)
    current_x = current_x - learning_rate * grad
```

### 실행 결과 (주요 스텝)

| Step | x 위치 | Loss (손실) |
|------|--------|-------------|
| 1 | -3.2000 | 16.0000 |
| 5 | -1.3107 | 2.6844 |
| 10 | -0.4295 | 0.2882 |
| 15 | -0.1407 | 0.0309 |
| 20 | -0.0461 | 0.0033 |

최종 위치: **x = -0.0461** (목표 0.0에 매우 근접)

### 분석

- 경사 하강법은 기울기(미분값)를 이용해 손실이 줄어드는 방향으로 파라미터를 조금씩 이동시킨다.
- **이동 폭이 점점 줄어드는 이유**: 최저점에 가까워질수록 기울기(= 2x)가 0에 가까워지기 때문이다.
- **learning_rate의 역할**:
  - 너무 크면 (예: 1.5) → 최저점을 넘어서 발산 (overshooting)
  - 너무 작으면 (예: 0.001) → 수렴이 매우 느림
  - 적절하면 (0.1) → 20스텝 만에 거의 바닥 도달
- **실험 1과의 연결**: `model.fit(epochs=500)`에서 내부적으로 기울기와 절편에 대해 이 과정을 500회 반복하여 최적 파라미터를 찾은 것이다.

---

## 종합 정리

### 머신러닝의 기본 흐름

```
[데이터 수집] → [전처리 (실험 3)] → [모델 학습 (실험 1, 2)] → [예측]
                                          ↑
                                    최적화 반복 (실험 4)
```

### 핵심 개념 비교

| 구분 | 지도 학습 (실험 1) | 비지도 학습 (실험 2) |
|------|---------------------|----------------------|
| 정답 유무 | 있음 (무게 → 길이) | 없음 (그룹만 찾기) |
| 비유 | 선생님이 답을 알려주고 공부 | 혼자서 패턴 찾기 |
| 예시 | 회귀, 분류 | 군집화, 차원 축소 |

### 배운 점

1. **지도 학습**: 데이터만으로 물리 법칙(훅의 법칙)을 발견할 수 있다.
2. **비지도 학습**: 정답 없이도 패턴을 찾을 수 있지만, 초기 조건에 민감할 수 있다.
3. **전처리**: 단위가 다른 데이터는 정규화하지 않으면 모델이 왜곡된 결과를 낼 수 있다.
4. **경사 하강법**: 모든 학습의 핵심 엔진이며, learning rate 선택이 중요하다.

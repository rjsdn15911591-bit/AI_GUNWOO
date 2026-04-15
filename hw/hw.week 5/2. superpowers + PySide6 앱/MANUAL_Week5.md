# Week 5 딥러닝 핵심 개념 실습 — 앱 사용 설명서

## 개요

이 앱은 Week 5에서 학습한 5가지 딥러닝 핵심 개념을 **PySide6 GUI** 환경에서 인터랙티브하게 실습할 수 있도록 구성된 멀티탭 애플리케이션입니다.

---

## 실행 방법

### 요구 사항

```
Python 3.9 이상
PySide6
tensorflow >= 2.12
matplotlib
numpy
```

### 설치

```bash
pip install PySide6 tensorflow matplotlib numpy
```

### 실행

```bash
cd "2. superpowers + PySide6 앱"
python main_app.py
```

실행 시 `outputs/` 폴더가 자동으로 생성되며, 각 Lab 실행 후 결과 이미지가 저장됩니다.

---

## 탭별 사용법

### Lab 1: 정규화 기법 비교 (Regularization)

**목적:** L2, Dropout, BatchNormalization 등 정규화 기법이 과적합 방지에 미치는 효과를 비교합니다.

**사용법:**

1. **정규화 기법 선택** — 비교할 기법을 체크박스로 선택합니다.
   - `None`: 정규화 없음 (기준선)
   - `L2`: L2 가중치 규제 (λ=0.01)
   - `Dropout`: Dropout (rate=0.5)
   - `BatchNorm`: Batch Normalization
2. **에포크 수** — 스핀박스에서 1~50 사이 값을 설정합니다 (기본: 10).
3. **학습 시작** 버튼을 클릭합니다.
4. 학습이 완료되면 검증 손실(Val Loss) 곡선 비교 그래프가 표시됩니다.

**결과 저장:** `outputs/01_regularization_plot.png`

---

### Lab 2: Overfitting vs Underfitting

**목적:** 모델 복잡도에 따른 과적합/과소적합 현상을 시각적으로 확인합니다.

**사용법:**

1. **학습 시작** 버튼을 클릭합니다.
2. 3가지 모델(underfit / balanced / overfit)이 sin(x) 데이터에 대해 자동으로 학습됩니다.

| 모델 | 구조 |
|------|------|
| underfit | Dense(1) — 선형 모델 |
| balanced | Dense(16)×2 |
| overfit | Dense(128)×3 |

3. 학습 완료 후 두 개의 그래프가 표시됩니다:
   - **Model Predictions**: 각 모델의 예측 곡선 vs 실제 데이터
   - **Validation Loss**: 에포크별 검증 손실 비교

**결과 저장:** `outputs/02_overfitting_underfitting.png`

---

### Lab 3: 데이터 증강 (Data Augmentation)

**목적:** RandomFlip, RandomRotation, RandomZoom 파라미터를 조절하며 증강 효과를 확인합니다.

**사용법:**

1. **Rotation 슬라이더** — 0.00~0.50 범위에서 회전 강도를 설정합니다 (기본: 0.20).
2. **Zoom 슬라이더** — 0.00~0.50 범위에서 확대/축소 강도를 설정합니다 (기본: 0.20).
3. **증강 이미지 생성** 버튼을 클릭합니다.
4. MNIST 첫 번째 이미지에 증강을 9번 적용한 3×3 그리드가 표시됩니다.

> **참고:** RandomFlip은 항상 horizontal_and_vertical로 고정됩니다.

**결과 저장:** `outputs/03_augmentation_examples.png`

---

### Lab 4: 전이 학습 (Transfer Learning)

**목적:** ImageNet으로 사전학습된 MobileNetV2를 기반 모델로 사용하는 전이 학습 구조를 탐구합니다.

**사용법:**

1. **출력 클래스** 선택 — Dense 헤드의 출력 뉴런 수를 설정합니다.
   - `1 (Binary)`: 이진 분류
   - `10 (MNIST)`: 10-class 분류
   - `100 (CIFAR-100)`: 100-class 분류
2. **파인튜닝 레이어** 선택 — 기반 모델(MobileNetV2)의 마지막 N개 레이어 동결 해제 여부를 설정합니다.
   - `0 (전부 동결)`: 기반 모델 완전 동결
   - `10개 해제`: 마지막 10개 레이어 학습 가능
   - `30개 해제`: 마지막 30개 레이어 학습 가능
3. **모델 로드** 버튼을 클릭합니다.
4. 왼쪽에 모델 구조 요약, 오른쪽에 학습 가능 파라미터 비율 차트가 표시됩니다.

**결과 저장:** `outputs/04_transfer_learning_summary.txt`

---

### Lab 5: CNN — MNIST 분류

**목적:** Conv2D 계층으로 구성된 CNN 모델을 MNIST 데이터셋에 학습시키고 성능을 평가합니다.

**CNN 구조:**

```
Conv2D(32, 3×3) → MaxPool(2×2)
Conv2D(64, 3×3) → MaxPool(2×2)
Conv2D(64, 3×3)
Flatten → Dense(64) → Dense(10, softmax)
```

**사용법:**

1. **에포크 수** — 스핀박스에서 1~10 사이 값을 설정합니다 (기본: 3).
2. **학습 시작** 버튼을 클릭합니다.
3. 전체 MNIST 데이터(60,000장)로 학습이 진행됩니다.
4. 학습 완료 후:
   - **좌측**: 에포크별 Train/Val 정확도 곡선
   - **우측**: 테스트 이미지 9장에 대한 예측 결과 (초록=정답, 빨강=오답)

**결과 저장:** `outputs/05_mnist_cnn_result.png`

---

## outputs/ 폴더

| 파일명 | 생성 탭 | 설명 |
|--------|---------|------|
| `01_regularization_plot.png` | Lab 1 | 정규화 기법별 Val Loss 비교 |
| `02_overfitting_underfitting.png` | Lab 2 | 모델 복잡도별 예측 및 손실 |
| `03_augmentation_examples.png` | Lab 3 | 데이터 증강 3×3 그리드 |
| `04_transfer_learning_summary.txt` | Lab 4 | MobileNetV2 모델 구조 요약 |
| `05_mnist_cnn_result.png` | Lab 5 | CNN 정확도 곡선 + 예측 그리드 |

---

## 주의사항

- Lab 4, 5는 데이터/모델 다운로드가 필요하므로 **첫 실행 시 인터넷 연결**이 필요합니다.
- Lab 5는 전체 MNIST(60,000장) 학습으로 수 분이 소요될 수 있습니다.
- 학습 중에는 버튼이 비활성화되며, 완료 후 자동으로 활성화됩니다.

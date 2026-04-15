# TRD (Technical Requirements Document)
## Week 5 딥러닝 핵심 개념 실습 앱

**버전:** 1.0  
**작성일:** 2026-04-15

---

## 1. 기술 스택

| 분류 | 기술 | 버전 | 용도 |
|------|------|------|------|
| GUI 프레임워크 | PySide6 | 6.x | 윈도우, 위젯, 이벤트 루프 |
| ML 프레임워크 | TensorFlow / Keras | 2.12+ | 모델 학습 및 추론 |
| 시각화 | matplotlib | 3.7+ | 그래프, 이미지 렌더링 |
| 수치 연산 | NumPy | 1.24+ | 배열 처리 |
| matplotlib ↔ Qt 브릿지 | FigureCanvasQTAgg | (matplotlib 내장) | Qt 위젯에 그래프 임베드 |

---

## 2. 아키텍처

### 2.1 모듈 구조

```
2. superpowers + PySide6 앱/
├── main_app.py          # QMainWindow + QTabWidget 진입점
├── lab1_widget.py       # Lab 1: 정규화 비교
├── lab2_widget.py       # Lab 2: 과적합 vs 과소적합
├── lab3_widget.py       # Lab 3: 데이터 증강
├── lab4_widget.py       # Lab 4: 전이 학습
├── lab5_widget.py       # Lab 5: CNN
├── MANUAL_Week5.md      # 사용 설명서
└── outputs/             # 결과 이미지/텍스트 자동 저장
```

### 2.2 스레드 설계

각 Lab의 TensorFlow 학습은 **QThread 서브클래스**로 분리하여 메인 UI 스레드와 독립적으로 실행한다.

```
메인 스레드 (Qt Event Loop)
    ↓ thread.start()
TrainThread (QThread)
    ├── TensorFlow 학습
    ├── progress.emit(int)   →  QProgressBar.setValue()
    └── finished.emit(data)  →  on_finished() → FigureCanvas 업데이트
```

**시그널 타입:**

| 위젯 | finished 시그널 타입 | 비고 |
|------|---------------------|------|
| Lab1 | `Signal(dict)` | `{cfg: [val_loss]}` |
| Lab2 | `Signal(dict, dict)` | `(models_dict, histories)` |
| Lab4 | `Signal(dict)` | `{summary, total, trainable, non_trainable}` |
| Lab5 | `Signal(dict, object, object, object)` | `(history, imgs, true_labels, pred_labels)` |

### 2.3 matplotlib 백엔드

```python
matplotlib.use('Agg')  # 비대화형 PNG 렌더링 백엔드
```

Qt 위젯 임베드는 `FigureCanvasQTAgg`를 사용하고, `canvas.draw()`로 갱신한다.

---

## 3. Lab별 기술 명세

### 3.1 Lab 1 — 정규화 비교

**데이터:** MNIST, 훈련 1,000개 / 검증 200개 (float32/255, reshape(-1, 784))

**모델 구성:**

```python
# None
Dense(128, relu) → Dense(128, relu) → Dense(10, softmax)

# L2
Dense(128, relu) → Dense(128, relu, kernel_regularizer=L2(0.01)) → Dense(10, softmax)

# Dropout
Dense(128, relu) → Dropout(0.5) → Dense(128, relu) → Dense(10, softmax)

# BatchNorm
Dense(128, relu) → BatchNormalization() → Dense(128, relu) → Dense(10, softmax)
```

**컴파일:** optimizer=adam, loss=sparse_categorical_crossentropy, metrics=[accuracy]

**출력:** `outputs/01_regularization_plot.png` — 구성별 val_loss 곡선

---

### 3.2 Lab 2 — 과적합 vs 과소적합

**데이터:** `np.linspace(-3, 3, 20)` + `sin(x) + N(0, 0.1)` (seed=42)

**모델 구성:**

```python
underfit:  Dense(1, input_shape=(1,))
balanced:  Dense(16, relu) → Dense(16, relu) → Dense(1)
overfit:   Dense(128, relu) × 3 → Dense(1)
```

**학습:** epochs=200, optimizer=adam, loss=mse

**출력:** `outputs/02_overfitting_underfitting.png` — 2-panel (예측 + val_loss)

---

### 3.3 Lab 3 — 데이터 증강

**데이터:** MNIST `x_train[0]` → grayscale_to_rgb → resize(100,100) → /255.0

**증강 파이프라인:**

```python
tf.keras.Sequential([
    layers.RandomFlip("horizontal_and_vertical"),
    layers.RandomRotation(rotation),   # 슬라이더 값 / 100
    layers.RandomZoom(zoom),           # 슬라이더 값 / 100
])
```

**출력:** `outputs/03_augmentation_examples.png` — 3×3 그리드

---

### 3.4 Lab 4 — 전이 학습

**기반 모델:** `MobileNetV2(input_shape=(160,160,3), include_top=False, weights='imagenet')`

**헤드:** `GlobalAveragePooling2D → Dense(N, activation)`
- N=1 → sigmoid, N>1 → softmax

**파인튜닝:** `base_model.layers[-K:]`의 `trainable = True` (K = 0, 10, 30)

**파라미터 계산:**
```python
total_params     = model.count_params()
trainable_params = sum(tf.size(w).numpy() for w in model.trainable_weights)
```

**출력:** `outputs/04_transfer_learning_summary.txt`

---

### 3.5 Lab 5 — CNN

**데이터:** 전체 MNIST (훈련 60,000 / 테스트 10,000), reshape(-1,28,28,1), /255.0

**모델:**

```python
Conv2D(32, (3,3), relu, input_shape=(28,28,1))
MaxPooling2D((2,2))
Conv2D(64, (3,3), relu)
MaxPooling2D((2,2))
Conv2D(64, (3,3), relu)
Flatten()
Dense(64, relu)
Dense(10, softmax)
```

**컴파일:** optimizer=adam, loss=sparse_categorical_crossentropy, metrics=[accuracy]

**진행률 콜백:**

```python
class ProgressCB(tf.keras.callbacks.Callback):
    def on_epoch_end(self, epoch, logs=None):
        self.signal.emit(int((epoch + 1) / self.total * 100))
```

**출력:** `outputs/05_mnist_cnn_result.png` — 정확도 곡선 + 3×3 예측 그리드

---

## 4. UI 컴포넌트 명세

### 4.1 공통 스타일 (main_app.py)

```python
setStyleSheet("""
    QMainWindow { background-color: #f0f7f0; }
    QTabBar::tab:selected { background: #1a6b3a; color: white; }
    QPushButton { background-color: #1a6b3a; color: white; ... }
""")
```

### 4.2 폰트

```python
QFont("Malgun Gothic", 10)  # Windows 한글 폰트
```

---

## 5. 의존성 설치

```bash
pip install PySide6 tensorflow matplotlib numpy
```

**최소 버전 요구사항:**

| 패키지 | 최소 버전 |
|--------|----------|
| Python | 3.9 |
| PySide6 | 6.4 |
| tensorflow | 2.12 |
| matplotlib | 3.5 |
| numpy | 1.22 |

---

## 6. 알려진 제약사항

| 항목 | 내용 |
|------|------|
| Lab 4, 5 첫 실행 | MNIST/MobileNetV2 다운로드로 초기 지연 발생 |
| Lab 5 학습 시간 | 전체 MNIST 60,000장, CPU 기준 에포크당 약 1~3분 |
| GPU 가속 | CUDA 설치 시 자동 활용, 미설치 시 CPU로 자동 폴백 |
| matplotlib Agg | 비대화형 백엔드 — 별도 창으로 그래프 표시 불가 (QWidget 내 표시만 지원) |

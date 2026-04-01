# TRD (Technical Requirements Document)

## Week 3: 신경망 기초 — PySide6 GUI 애플리케이션

**작성자:** 이건우 (202512131)
**과목:** AI와 머신러닝 2-1학기
**작성일:** 2026년 4월 1일

---

## 1. 기술 스택

| 구분 | 기술 | 버전 | 설명 |
|------|------|------|------|
| 언어 | Python | 3.12 | 메인 개발 언어 |
| GUI 프레임워크 | PySide6 | 6.11.0 | Qt6 Python 바인딩, 크로스플랫폼 |
| 수치 연산 | NumPy | - | 행렬 연산, 신경망 구현 핵심 |
| 시각화 | Matplotlib | - | FigureCanvasQTAgg로 PySide6 내부 통합 |

**설치:**
```bash
pip install PySide6 numpy matplotlib
```

---

## 2. 아키텍처

### 2.1 전체 구조

단일 파일(`week3_app.py`) 내에 모든 클래스를 포함하는 모놀리식 구조입니다.

```
week3_app.py
├── 공통 유틸리티
│   └── make_canvas()          # matplotlib Figure → Qt 위젯 변환
├── 모델 클래스
│   ├── Perceptron             # 단일 퍼셉트론 (Lab 1)
│   ├── MLP                    # Multi-Layer Perceptron (Lab 4)
│   └── UniversalApproximator  # 단일 은닉층 함수 근사기 (Lab 5)
├── UI 탭 클래스
│   ├── Lab1Tab(QWidget)       # Perceptron 탭
│   ├── Lab2Tab(QWidget)       # Activation Functions 탭
│   ├── Lab3Tab(QWidget)       # Forward Propagation 탭
│   ├── Lab4Tab(QWidget)       # MLP (XOR) 탭
│   └── Lab5Tab(QWidget)       # Universal Approximation 탭
└── MainWindow(QMainWindow)    # 메인 윈도우 (QTabWidget으로 탭 관리)
```

### 2.2 클래스 상세

| 클래스 | 상속 | 역할 |
|--------|------|------|
| MainWindow | QMainWindow | 메인 창, QTabWidget으로 5개 Lab 탭 관리 |
| Lab1Tab ~ Lab5Tab | QWidget | 각 Lab의 UI + 로직 캡슐화 |
| Perceptron | (없음) | 단일 퍼셉트론 모델 (계단 함수 활성화) |
| MLP | (없음) | 2-Layer MLP + Sigmoid + Backpropagation |
| UniversalApproximator | (없음) | 단일 은닉층 + Tanh + 경사하강법 |

### 2.3 데이터 흐름

각 Lab 탭은 동일한 패턴을 따릅니다:

```
1. 사용자가 컨트롤 패널에서 파라미터 설정 (학습률, 뉴런 수, epochs 등)
2. 버튼 클릭 → Model 클래스에서 연산 수행 (numpy)
3. matplotlib Figure에 결과 시각화
4. FigureCanvasQTAgg로 Qt 위젯으로 렌더링
5. QTextEdit 로그에 수치 계산 과정 출력
```

---

## 3. 핵심 알고리즘

### 3.1 Perceptron 학습 규칙 (Lab 1)

```
activation(x) = 1 if x >= 0 else 0   (계단 함수)
predict(x) = activation(w·x + b)

학습:
  error = label - prediction
  w_new = w_old + lr × error × input
  b_new = b_old + lr × error
```

### 3.2 Forward Propagation (Lab 3)

```
Layer 1 (Input → Hidden):
  z1 = X @ W1 + b1        # 선형 결합
  a1 = ReLU(z1)            # 활성화 (음수 → 0)

Layer 2 (Hidden → Output):
  z2 = a1 @ W2 + b2        # 선형 결합
  a2 = Sigmoid(z2)          # 활성화 (0~1로 압축)
```

### 3.3 Backpropagation (Lab 4)

```
Forward:
  z1 = X @ W1 + b1,  a1 = σ(z1)
  z2 = a1 @ W2 + b2, a2 = σ(z2)

Loss:
  L = MSE = mean((a2 - y)²)

Backward (Chain Rule):
  δ2 = (a2 - y)                        # 출력층 에러
  dW2 = (1/m) × a1ᵀ @ δ2              # 출력 가중치 기울기
  db2 = (1/m) × Σ δ2                  # 출력 편향 기울기
  δ1 = (δ2 @ W2ᵀ) ⊙ σ'(z1)           # 은닉층 에러
  dW1 = (1/m) × Xᵀ @ δ1              # 은닉 가중치 기울기
  db1 = (1/m) × Σ δ1                  # 은닉 편향 기울기

Update:
  W -= lr × dW
  b -= lr × db
```

### 3.4 Xavier Initialization

```
W ~ N(0, sqrt(2/n_in))
```

활성화 값의 분산을 일정하게 유지하여 학습 안정성 확보합니다.

### 3.5 Universal Approximation (Lab 5)

```
은닉층: z1 = x @ W1 + b1, a1 = tanh(z1)
출력층: output = a1 @ W2 + b2  (활성화 없음 = 선형)

학습: MSE Loss + 경사하강법
뉴런 수가 많을수록 → 학습률 낮춰야 안정적
```

---

## 4. 파일 구조

| 파일 | 설명 |
|------|------|
| `week3_app.py` | PySide6 GUI 메인 앱 (전체 코드, ~830줄) |
| `01_perceptron.py` | 교수님 원본 Lab 1 코드 |
| `02_activation_functions.py` | 교수님 원본 Lab 2 코드 |
| `03_forward_propagation.py` | 교수님 원본 Lab 3 코드 |
| `04_mlp_numpy.py` | 교수님 원본 Lab 4 코드 |
| `05_universal_approximation.py` | 교수님 원본 Lab 5 코드 |
| `check_fonts.py` | 한글 폰트 확인 유틸리티 |
| `PRD_Week3.md` | Product Requirements Document |
| `TRD_Week3.md` | Technical Requirements Document (이 파일) |
| `report.md` | 실행 결과 분석 보고서 |
| `outputs/` | 그래프 이미지 저장 폴더 |

---

## 5. 실행 방법

```bash
# 1. 패키지 설치
pip install PySide6 numpy matplotlib

# 2. PySide6 GUI 앱 실행
python week3_app.py

# 3. 교수님 원본 코드 실행 (개별)
mkdir outputs
python 01_perceptron.py
python 02_activation_functions.py
python 03_forward_propagation.py
python 04_mlp_numpy.py
python 05_universal_approximation.py
```

---

## 6. 주요 구현 세부사항

### 6.1 matplotlib + PySide6 통합

```python
from matplotlib.backends.backend_qtagg import FigureCanvasQTAgg as FigureCanvas
from matplotlib.figure import Figure

fig = Figure(figsize=(12, 4))
canvas = FigureCanvas(fig)  # Qt 위젯으로 변환
layout.addWidget(canvas)     # PySide6 레이아웃에 추가
```

교수님 원본 코드는 `plt.show()`로 별도 창을 띄우지만, GUI 앱에서는 `FigureCanvasQTAgg`로 탭 내부에 직접 렌더링합니다.

### 6.2 결정 경계 시각화 (Lab 1, 4)

```python
# 2D 격자 생성
xx, yy = np.meshgrid(np.linspace(-0.5, 1.5, 200), np.linspace(-0.5, 1.5, 200))

# 모든 격자점에 대해 예측
Z = model.forward(np.c_[xx.ravel(), yy.ravel()])
Z = Z.reshape(xx.shape)

# 등고선으로 영역 색칠
ax.contourf(xx, yy, Z, levels=20, cmap="RdYlBu", alpha=0.8)
```

### 6.3 Sigmoid 오버플로우 방지

```python
def sigmoid(x):
    return 1 / (1 + np.exp(-np.clip(x, -500, 500)))
```

`np.clip`으로 입력 범위를 제한하여 `exp()` 오버플로우를 방지합니다.

---

## 7. 테스트 항목

| ID | 테스트 항목 | 예상 결과 | 결과 | 비고 |
|----|-----------|----------|------|------|
| T-01 | AND/OR 학습 | 오류 0/4, 결정경계 직선 | PASS | |
| T-02 | XOR Perceptron | 오류 ≥ 1/4 (불가능 증명) | PASS | 랜덤 시드로 2~3개 |
| T-03 | 활성화 함수 토글 | 체크박스 on/off에 따라 그래프 갱신 | PASS | |
| T-04 | Forward Prop 입력 변경 | x1, x2 변경 시 뉴런 값 변화 | PASS | |
| T-05 | MLP XOR 학습 | 정확도 100%, Loss 감소 그래프 | PASS | |
| T-06 | UAT 3 vs 10 vs 50 | 뉴런 수 증가 → MSE 감소 (일반적) | PASS | 50개는 학습률 조절 필요 |
| T-07 | 앱 실행 | 5개 탭 정상 표시, 버튼 작동 | PASS | |

---

## 8. 알려진 이슈 및 향후 개선

| 이슈 | 설명 | 개선 방안 |
|------|------|----------|
| UI 블로킹 | MLP 학습(10000 epochs) 중 UI가 멈춤 | QThread 또는 QTimer로 비동기 처리 |
| 한글 폰트 | matplotlib 그래프에서 한글 깨짐 가능 | `set_korean_font()` 함수로 자동 감지 |
| 50뉴런 학습 실패 | UAT에서 50개 뉴런이 오히려 못함 | 학습률 자동 조절 로직 추가 |
| Hidden Activations x축 | 창이 좁으면 라벨 잘림 | 라벨 축약 완료 (괄호 제거) |

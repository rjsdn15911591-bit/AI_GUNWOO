# TRD (Technical Requirements Document)
## Week 4: Neural Network으로 물리 데이터 학습하기

---

## 1. 기술 스택

| 구분 | 기술 | 버전 | 용도 |
|------|------|------|------|
| 언어 | Python | 3.12 | 전체 |
| GUI | PySide6 | 최신 | QMainWindow, QTabWidget, QThread |
| 딥러닝 | TensorFlow / Keras | 최신 | Sequential, Dense, Adam, Callbacks |
| 시각화 | Matplotlib | 최신 | FigureCanvasQTAgg 임베드 |
| 수치 계산 | NumPy | 최신 | 배열 연산, 정규화 |

---

## 2. 시스템 아키텍처

```
main_app.py (QMainWindow)
│
├── QTabWidget
│   ├── Lab1Widget ─ TrainThread ─ TensorFlow (tanh 네트워크)
│   ├── Lab2Widget ─ TrainThread ─ TensorFlow + RK4 (drag 옵션)
│   ├── Lab3Widget ─ TrainThread ─ TensorFlow × 3모델 + 정규화
│   ├── Lab4Widget ─ TrainThread ─ TensorFlow + RK4 (감쇠 옵션)
│   ├── Lab5Widget ─ TrainThread ─ TensorFlow + rk4_spring()
│   ├── Lab6Widget ─ TrainThread ─ metropolis_ising() + TensorFlow
│   ├── Lab7Widget ─ TrainThread ─ TensorFlow + hermite() + psi_n()
│   └── Lab8Widget ─ TrainThread ─ TensorFlow + kepler_orbit()
│
├── Signal/Slot 연결
│   ├── progress (int) → QProgressBar
│   ├── log_message (str) → QTextEdit
│   ├── finished_result (dict) → plot()
│   └── error_occurred (str) → 로그 출력
│
└── Matplotlib FigureCanvasQTAgg (각 Widget 내)
```

### 데이터 흐름

```
물리 파라미터 생성 (NumPy)
    → 정규화 (X_norm = (X - mean) / std)
    → TensorFlow 학습 (백그라운드 QThread)
    → 역정규화 (Y_pred = Y_pred_norm * std + mean)
    → Matplotlib 시각화
    → PNG 저장 (150 DPI)
```

---

## 3. 컴포넌트 명세

### 3.1 main_app.py

- `MainWindow(QMainWindow)`: 앱 진입점, 8개 탭 조합, 전역 스타일시트
- 한글 폰트: OS 감지 후 자동 설정 (Malgun Gothic / AppleGothic / NanumGothic)
- `outputs/` 폴더 자동 생성 (`os.makedirs`)

### 3.2 TrainThread (각 lab*_widget.py 내)

공통 구조:

```python
class TrainThread(QThread):
    progress = Signal(int)           # 진행률 (0~100)
    log_message = Signal(str)        # 학습 로그
    finished_result = Signal(dict)   # 완료 결과
    error_occurred = Signal(str)     # 오류 메시지

    def run(self):
        # 1. 데이터 생성 (NumPy)
        # 2. 정규화
        # 3. keras.Sequential 모델 정의
        # 4. model.fit() (Callback으로 progress emit)
        # 5. 테스트 및 역정규화
        # 6. finished_result.emit(dict)
```

### 3.3 Callback (공통 패턴)

```python
class CB(keras.callbacks.Callback):
    def on_epoch_end(self, epoch, logs=None):
        self.thread.progress.emit(int((epoch+1)/total_epochs*100))
        if (epoch+1) % 200 == 0:
            self.thread.log_message.emit(f"Epoch {epoch+1} - loss: {logs['loss']:.6f}")
```

---

## 4. 신경망 구성 명세

| Lab | 입력 차원 | 출력 차원 | 레이어 구성 | 활성화 | 옵티마이저 | Loss |
|-----|---------|---------|-----------|------|----------|------|
| Lab 1 | 1 | 1 | [32~128, 128, 64] | tanh | Adam(0.001) | MSE |
| Lab 2 | 3 (v₀,θ,t) | 2 (x,y) | [128,64,32,2]+Dropout | relu/linear | Adam(0.001) | MSE |
| Lab 3 Underfit | 1 | 1 | [4,1] | relu/linear | Adam(0.001) | MSE |
| Lab 3 Good Fit | 1 | 1 | [32,16,1]+Dropout(0.2) | relu/linear | Adam(0.001) | MSE |
| Lab 3 Overfit | 1 | 1 | [256,128,64,32,1] | relu/linear | Adam(0.001) | MSE |
| Lab 4 | 2 (L,θ₀) | 1 (T) | [64,32,16,1] | relu/linear | Adam(0.001) | MSE |
| Lab 5 | 2 (k,m) | 1 (f) | [64,32,16,1] | relu/linear | Adam(0.001) | MSE |
| Lab 6 | 1 (T) | 1 (|M|) | [32,16,1] | tanh/linear | Adam(0.001) | MSE |
| Lab 7 | 2 (ω,n) | 1 (E_n) | [32,16,1] | relu/linear | Adam(0.001) | MSE |
| Lab 8 | 3 (a,e,θ) | 2 (x,y) | [128,64,32,2] | relu/linear | Adam(0.001) | MSE |

---

## 5. 물리 모델 구현 명세

### 5.1 RK4 수치적분 (Lab 2, 4, 5)

```python
def rk4_step(deriv, state, dt):
    k1 = deriv(state)
    k2 = deriv(state + 0.5 * dt * k1)
    k3 = deriv(state + 0.5 * dt * k2)
    k4 = deriv(state + dt * k3)
    return state + (dt / 6) * (k1 + 2*k2 + 2*k3 + k4)
```

| 적용 | 상태 변수 | 운동 방정식 |
|------|---------|-----------|
| Lab 2 (공기저항) | (x, y, vx, vy) | dvx/dt = -k·v·vx/m, dvy/dt = -g - k·v·vy/m |
| Lab 4 (진자) | (θ, ω) | dω/dt = -(g/L)sinθ - γω |
| Lab 5 (스프링) | (x, v) | dv/dt = -(k/m)x |

### 5.2 Metropolis 알고리즘 (Lab 6)

```python
def metropolis_ising(N, T, n_steps=2000, J=1.0):
    # 랜덤 스핀 초기화
    # 각 스텝: 랜덤 스핀 선택 → ΔE 계산 → Boltzmann 확률로 flip
    # dE = 2·J·s[i,j]·(주변 4개 스핀 합)
    # 조건: dE < 0 또는 rand < exp(-β·dE) 이면 flip
```

### 5.3 Hermite 다항식 (Lab 7)

```python
def hermite(n, x):
    if n == 0: return ones
    if n == 1: return 2*x
    return 2*x*hermite(n-1,x) - 2*(n-1)*hermite(n-2,x)

def psi_n(n, x):
    norm = 1/sqrt(2^n * n! * sqrt(π))
    return norm * hermite(n, x) * exp(-x²/2)
```

### 5.4 케플러 궤도 (Lab 8)

```python
def kepler_orbit(a, e, theta):
    r = a * (1 - e**2) / (1 + e * np.cos(theta))
    x = r * np.cos(theta)
    y = r * np.sin(theta)
    return x, y
```

---

## 6. 데이터 정규화 전략

모든 Lab에서 Z-score 정규화 적용:

```python
X_mean, X_std = X.mean(axis=0), X.std(axis=0)
X_norm = (X - X_mean) / X_std

# 예측 후 역정규화
Y_pred = Y_pred_norm * Y_std + Y_mean
```

- 정규화 통계량(mean, std)은 학습 데이터 기준으로 계산
- 테스트 데이터에 동일한 통계량 적용 (데이터 누수 방지)

---

## 7. 심화 기능 기술 명세

### 7.1 Lab 1 - 추가 함수

```python
funcs = {
    "tanh(x)":    lambda x: np.tanh(x),
    "x³":         lambda x: x**3 / 20,      # 스케일 조정
    "x²·sin(x)":  lambda x: x**2 * np.sin(x) / 10,
}
```

### 7.2 Lab 2 - 공기저항 RK4

```python
def deriv_drag(state, k, m=1.0, g=9.8):
    x, y, vx, vy = state
    v = np.sqrt(vx**2 + vy**2)
    return [vx, vy, -(k/m)*v*vx, -g - (k/m)*v*vy]
```

### 7.3 Lab 3 - L1/L2 정규화

```python
reg_map = {
    "없음":    None,
    "L1":     keras.regularizers.l1(lam),
    "L2":     keras.regularizers.l2(lam),
    "L1+L2":  keras.regularizers.l1_l2(l1=lam, l2=lam),
}
# Good Fit 모델의 Dense 레이어에 kernel_regularizer=reg 적용
```

### 7.4 Lab 4 - 감쇠 진자

```python
def deriv_damped(state, L, g=9.8, gamma=0.0):
    theta, omega = state
    return [omega, -(g/L)*np.sin(theta) - gamma*omega]
```

---

## 8. 오류 처리

| 상황 | 처리 방법 |
|------|---------|
| TensorFlow 미설치 | `ImportError` 캐치 → `error_occurred` Signal 발생 → UI 로그 출력 |
| 학습 중 예외 | `Exception` 캐치 → `error_occurred` Signal 발생 |
| 저장 전 클릭 | `save_btn.setEnabled(False)` → 학습 완료 후 활성화 |
| 마이너스 기호 경고 | `matplotlib.rcParams['axes.unicode_minus'] = False` 전체 적용 |
| 빈 outputs 폴더 | `os.makedirs("outputs", exist_ok=True)` 자동 생성 |

---

## 9. 파일 명세

| 파일 | 크기 기준 | 주요 클래스/함수 |
|------|---------|----------------|
| `main_app.py` | ~170줄 | `MainWindow`, `main()` |
| `lab1_widget.py` | ~250줄 | `Lab1Widget`, `TrainThread` |
| `lab2_widget.py` | ~310줄 | `Lab2Widget`, `TrainThread`, `rk4_drag()` |
| `lab3_widget.py` | ~300줄 | `Lab3Widget`, `TrainThread` |
| `lab4_widget.py` | ~320줄 | `Lab4Widget`, `TrainThread`, `rk4_pendulum()` |
| `lab5_widget.py` | ~270줄 | `Lab5Widget`, `TrainThread`, `rk4_spring()` |
| `lab6_widget.py` | ~240줄 | `Lab6Widget`, `TrainThread`, `metropolis_ising()` |
| `lab7_widget.py` | ~260줄 | `Lab7Widget`, `TrainThread`, `hermite()`, `psi_n()` |
| `lab8_widget.py` | ~245줄 | `Lab8Widget`, `TrainThread`, `kepler_orbit()` |

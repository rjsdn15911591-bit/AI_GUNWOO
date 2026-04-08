# Week 4 Advanced Tasks Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Lab 1~4에 심화 기능(새 함수, 공기 저항, regularization, 감쇠 진자)을 추가한다.

**Architecture:** 각 Lab 파일을 독립적으로 수정한다. 기존 동작을 깨지 않으면서 UI 컨트롤과 학습 로직을 확장한다. TrainThread에 새 파라미터를 추가하고 plot 메서드를 업데이트한다.

**Tech Stack:** Python 3.12, TensorFlow/Keras, PySide6, NumPy, Matplotlib

---

## File Map

| 파일 | 변경 내용 |
|------|----------|
| `hw/hw.week 4/lab1_widget.py` | funcs 딕셔너리 + 콤보박스에 3개 함수 추가 |
| `hw/hw.week 4/lab2_widget.py` | 공기저항 체크박스/스핀박스 + TrainThread 분기 + plot 수정 |
| `hw/hw.week 4/lab3_widget.py` | regularization 콤보박스/스핀박스 + Good Fit 모델 수정 |
| `hw/hw.week 4/lab4_widget.py` | 감쇠계수 스핀박스 + rk4_pendulum 감쇠 항 + plot 수정 |

---

## Task 1: Lab 1 — 함수 3개 추가

**Files:**
- Modify: `C:/Desktop/문서/2-1 AI와 머신러닝/hw/hw.week 4/lab1_widget.py:40-46` (funcs dict)
- Modify: `C:/Desktop/문서/2-1 AI와 머신러닝/hw/hw.week 4/lab1_widget.py:141` (addItems)

- [ ] **Step 1: funcs 딕셔너리에 3개 함수 추가 (line 40-46)**

```python
            funcs = {
                "sin(x)": lambda x: np.sin(x),
                "cos(x) + 0.5sin(2x)": lambda x: np.cos(x) + 0.5 * np.sin(2 * x),
                "x·sin(x)": lambda x: x * np.sin(x),
                "극한 복잡도": lambda x: (np.sin(x) + 0.5 * np.sin(2 * x) +
                    0.3 * np.cos(3 * x) + 0.2 * np.sin(5 * x) + 0.1 * x * np.cos(x)),
                "tanh(x)": lambda x: np.tanh(x),
                "x³": lambda x: x**3 / 20,
                "x²·sin(x)": lambda x: x**2 * np.sin(x) / 10,
            }
```

- [ ] **Step 2: 콤보박스 addItems에 3개 추가 (line 141)**

```python
        self.func_combo.addItems([
            "sin(x)", "cos(x) + 0.5sin(2x)", "x·sin(x)", "극한 복잡도",
            "tanh(x)", "x³", "x²·sin(x)"
        ])
```

- [ ] **Step 3: 앱 실행해서 Lab 1 콤보박스에 7개 항목 표시 확인**

```bash
cd "C:/Desktop/문서/2-1 AI와 머신러닝/hw/hw.week 4"
python main_app.py
```

Expected: 함수 콤보박스에 tanh(x), x³, x²·sin(x) 추가됨

- [ ] **Step 4: Commit**

```bash
cd "C:/Desktop/문서/2-1 AI와 머신러닝/hw/hw.week 4"
git add lab1_widget.py
git commit -m "feat(lab1): add tanh(x), x³, x²·sin(x) functions"
```

---

## Task 2: Lab 2 — 공기 저항 모델

**Files:**
- Modify: `C:/Desktop/문서/2-1 AI와 머신러닝/hw/hw.week 4/lab2_widget.py`

- [ ] **Step 1: TrainThread.__init__에 use_drag, drag_k 파라미터 추가 (line 22-25)**

```python
    def __init__(self, epochs, n_samples, use_drag=False, drag_k=0.1):
        super().__init__()
        self.epochs = epochs
        self.n_samples = n_samples
        self.use_drag = use_drag
        self.drag_k = drag_k
```

- [ ] **Step 2: run()의 데이터 생성 부분을 분기 처리 (line 36-44 교체)**

```python
            g = 9.8
            self.log_message.emit("포물선 운동 데이터 생성 중...")
            v0 = np.random.uniform(10, 50, self.n_samples)
            theta = np.random.uniform(np.radians(10), np.radians(80), self.n_samples)
            t_flight = 2 * v0 * np.sin(theta) / g
            t = np.random.uniform(0, 1, self.n_samples) * t_flight

            if self.use_drag:
                # RK4로 공기저항 궤적 계산
                def rk4_drag(v0_, th_, t_end, k, dt=0.01):
                    state = np.array([0.0, 0.0, v0_*np.cos(th_), v0_*np.sin(th_)])
                    t_cur = 0.0
                    while t_cur < t_end:
                        def deriv(s):
                            return np.array([s[2], s[3], -k*s[2], -g - k*s[3]])
                        k1 = deriv(state)
                        k2 = deriv(state + 0.5*dt*k1)
                        k3 = deriv(state + 0.5*dt*k2)
                        k4 = deriv(state + dt*k3)
                        state = state + (dt/6)*(k1 + 2*k2 + 2*k3 + k4)
                        t_cur += dt
                    return state[0], max(state[1], 0)
                xy = np.array([rk4_drag(v0[i], theta[i], t[i], self.drag_k) for i in range(self.n_samples)])
                x_data = xy[:, 0] + np.random.normal(0, 0.5, self.n_samples)
                y_data = np.maximum(xy[:, 1] + np.random.normal(0, 0.5, self.n_samples), 0)
            else:
                x_data = v0 * np.cos(theta) * t + np.random.normal(0, 0.5, self.n_samples)
                y_data = v0 * np.sin(theta) * t - 0.5 * g * t**2 + np.random.normal(0, 0.5, self.n_samples)
                y_data = np.maximum(y_data, 0)

            X = np.column_stack([v0, theta, t])
            Y = np.column_stack([x_data, y_data])
```

- [ ] **Step 3: finished_result emit에 use_drag, drag_k 추가**

기존:
```python
            self.finished_result.emit({
                'trajectories': trajectories,
                'history': history.history,
            })
```
변경:
```python
            self.finished_result.emit({
                'trajectories': trajectories,
                'history': history.history,
                'use_drag': self.use_drag,
                'drag_k': self.drag_k,
            })
```

- [ ] **Step 4: UI init_ui()에 공기저항 컨트롤 추가 — info QLabel 아래에 삽입**

```python
        # 공기 저항 설정 (info 위젯 다음에 추가)
        self.drag_check = QCheckBox("공기 저항 포함")
        s.addWidget(self.drag_check)

        drag_row = QHBoxLayout()
        drag_row.addWidget(QLabel("항력 계수 k:"))
        self.drag_spin = QDoubleSpinBox()
        self.drag_spin.setRange(0.01, 1.0)
        self.drag_spin.setValue(0.1)
        self.drag_spin.setSingleStep(0.05)
        self.drag_spin.setEnabled(False)
        drag_row.addWidget(self.drag_spin)
        s.addLayout(drag_row)
        self.drag_check.toggled.connect(self.drag_spin.setEnabled)
```

또한 import에 `QCheckBox, QDoubleSpinBox` 추가:
```python
from PySide6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QPushButton, QLabel,
    QProgressBar, QGroupBox, QSpinBox, QTextEdit,
    QCheckBox, QDoubleSpinBox
)
```

- [ ] **Step 5: start_training()에서 TrainThread 생성 시 파라미터 전달**

```python
        self.thread = TrainThread(
            self.epoch_spin.value(),
            self.sample_spin.value(),
            use_drag=self.drag_check.isChecked(),
            drag_k=self.drag_spin.value()
        )
```

- [ ] **Step 6: plot()에서 use_drag일 때 제목에 표시**

plot() 메서드의 `ax1.set_title` 라인 변경:
```python
        drag_label = f" (공기저항 k={r['drag_k']})" if r.get('use_drag') else ""
        ax1.set_title(f"포물선 운동 궤적{drag_label}", fontsize=13)
```

- [ ] **Step 7: 앱 실행, 공기저항 체크박스 동작 확인**

Expected: 체크 시 k 스핀박스 활성화, 학습 후 제목에 "(공기저항 k=0.1)" 표시

- [ ] **Step 8: Commit**

```bash
git add lab2_widget.py
git commit -m "feat(lab2): add air resistance model with RK4 drag simulation"
```

---

## Task 3: Lab 3 — L1/L2 Regularization

**Files:**
- Modify: `C:/Desktop/문서/2-1 AI와 머신러닝/hw/hw.week 4/lab3_widget.py`

- [ ] **Step 1: TrainThread.__init__에 reg_type, reg_lambda 추가 (line 22-25)**

```python
    def __init__(self, epochs, n_samples, reg_type='없음', reg_lambda=0.001):
        super().__init__()
        self.epochs = epochs
        self.n_samples = n_samples
        self.reg_type = reg_type
        self.reg_lambda = reg_lambda
```

- [ ] **Step 2: run()의 Good Fit 모델 빌드 시 regularizer 적용**

기존 configs (line 48-52) 변경 없음. 모델 빌드 루프(line 59-68) 내에서 Good Fit일 때만 적용:

```python
            for name, layers, dropout, color in configs:
                self.log_message.emit(f"\n{name} 모델 학습 중...")

                # regularizer 결정 (Good Fit 모델에만 적용)
                if "Good Fit" in name and self.reg_type != '없음':
                    lam = self.reg_lambda
                    reg_map = {
                        'L1': keras.regularizers.l1(lam),
                        'L2': keras.regularizers.l2(lam),
                        'L1+L2': keras.regularizers.l1_l2(l1=lam, l2=lam),
                    }
                    regularizer = reg_map[self.reg_type]
                else:
                    regularizer = None

                model = keras.Sequential()
                for units in layers:
                    model.add(keras.layers.Dense(units, activation='relu',
                                                 kernel_regularizer=regularizer))
                    if dropout > 0:
                        model.add(keras.layers.Dropout(dropout))
                model.add(keras.layers.Dense(1, activation='linear'))
                model.compile(optimizer=keras.optimizers.Adam(0.001), loss='mse')
```

- [ ] **Step 3: finished_result emit에 reg_type 추가**

```python
            self.finished_result.emit({
                'results': results,
                'x_test': x_test.flatten(),
                'y_test_clean': y_test_clean.flatten(),
                'x_train': x.flatten(),
                'y_train': y.flatten(),
                'reg_type': self.reg_type,
            })
```

- [ ] **Step 4: UI에 regularization 컨트롤 추가 — epoch_spin 아래에 삽입**

```python
        s.addWidget(QLabel("Regularization:"))
        self.reg_combo = QComboBox()
        self.reg_combo.addItems(['없음', 'L1', 'L2', 'L1+L2'])
        s.addWidget(self.reg_combo)

        reg_row = QHBoxLayout()
        reg_row.addWidget(QLabel("λ:"))
        self.reg_spin = QDoubleSpinBox()
        self.reg_spin.setRange(0.0001, 0.1)
        self.reg_spin.setValue(0.001)
        self.reg_spin.setSingleStep(0.001)
        self.reg_spin.setDecimals(4)
        reg_row.addWidget(self.reg_spin)
        s.addLayout(reg_row)
```

import에 `QComboBox, QDoubleSpinBox` 추가:
```python
from PySide6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QPushButton, QLabel,
    QProgressBar, QGroupBox, QSpinBox, QTextEdit,
    QComboBox, QDoubleSpinBox
)
```

- [ ] **Step 5: start_training()에 reg 파라미터 전달**

```python
        self.thread = TrainThread(
            self.epoch_spin.value(),
            self.sample_spin.value(),
            reg_type=self.reg_combo.currentText(),
            reg_lambda=self.reg_spin.value()
        )
```

- [ ] **Step 6: plot()에서 Good Fit 서브플롯 제목에 regularizer 표시**

plot() 메서드 내 상단 루프에서:
```python
        for i, res in enumerate(r['results']):
            ax = self.figure.add_subplot(2, 3, i + 1)
            ax.scatter(r['x_train'], r['y_train'], s=10, alpha=0.3, c='gray', label='데이터')
            ax.plot(r['x_test'], r['y_test_clean'], 'k-', linewidth=1.5, label='실제 함수')
            ax.plot(r['x_test'], res['y_pred'], '--', color=res['color'], linewidth=2, label='NN 예측')
            title = res['name']
            if 'Good Fit' in res['name'] and r.get('reg_type', '없음') != '없음':
                title += f"\n({r['reg_type']} λ={r.get('reg_lambda', '')})"
            ax.set_title(title, fontsize=11, color=res['color'])
            ax.legend(fontsize=7)
            ax.grid(True, alpha=0.3)
```

finished_result emit에 reg_lambda도 추가:
```python
            self.finished_result.emit({
                'results': results,
                'x_test': x_test.flatten(),
                'y_test_clean': y_test_clean.flatten(),
                'x_train': x.flatten(),
                'y_train': y.flatten(),
                'reg_type': self.reg_type,
                'reg_lambda': self.reg_lambda,
            })
```

- [ ] **Step 7: 앱 실행, L2 선택 후 학습해서 Good Fit 제목에 표시 확인**

Expected: Good Fit 서브플롯 제목에 "(L2 λ=0.001)" 표시

- [ ] **Step 8: Commit**

```bash
git add lab3_widget.py
git commit -m "feat(lab3): add L1/L2/ElasticNet regularization to Good Fit model"
```

---

## Task 4: Lab 4 — 감쇠 진자

**Files:**
- Modify: `C:/Desktop/문서/2-1 AI와 머신러닝/hw/hw.week 4/lab4_widget.py`

- [ ] **Step 1: rk4_pendulum 함수에 gamma 파라미터 추가 (line 25)**

```python
def rk4_pendulum(L, theta0, omega0=0, t_max=None, dt=0.001, g=9.8, gamma=0.0):
    """RK4로 진자 운동 시뮬레이션 (gamma: 감쇠 계수)"""
    if t_max is None:
        t_max = 4 * pendulum_period(L, theta0, g)

    def deriv(state):
        theta, omega = state
        return np.array([omega, -(g / L) * np.sin(theta) - gamma * omega])

    t_arr = [0]
    state = np.array([theta0, omega0])
    states = [state.copy()]

    t = 0
    while t < t_max:
        k1 = deriv(state)
        k2 = deriv(state + 0.5 * dt * k1)
        k3 = deriv(state + 0.5 * dt * k2)
        k4 = deriv(state + dt * k3)
        state = state + (dt / 6) * (k1 + 2 * k2 + 2 * k3 + k4)
        t += dt
        t_arr.append(t)
        states.append(state.copy())

    states = np.array(states)
    return np.array(t_arr), states[:, 0], states[:, 1]
```

- [ ] **Step 2: TrainThread.__init__에 gamma 추가**

```python
    def __init__(self, epochs, gamma=0.0):
        super().__init__()
        self.epochs = epochs
        self.gamma = gamma
```

- [ ] **Step 3: run()의 RK4 시뮬레이션 호출에 gamma 전달 + 비감쇠 비교용 추가**

기존:
```python
            sim_L, sim_theta = 1.0, np.radians(30)
            t_sim, theta_sim, omega_sim = rk4_pendulum(sim_L, sim_theta)
```
변경:
```python
            sim_L, sim_theta = 1.0, np.radians(30)
            t_sim, theta_sim, omega_sim = rk4_pendulum(sim_L, sim_theta, gamma=self.gamma)
            # 비교용 비감쇠 (gamma=0)
            _, theta_undamped, _ = rk4_pendulum(sim_L, sim_theta, gamma=0.0)
```

- [ ] **Step 4: finished_result emit에 theta_undamped, gamma 추가**

```python
            self.finished_result.emit({
                'predictions': predictions,
                'test_angles': np.degrees(test_angles),
                'history': history.history,
                't_sim': t_sim,
                'theta_sim': theta_sim,
                'omega_sim': omega_sim,
                'theta_undamped': theta_undamped,
                'gamma': self.gamma,
            })
```

- [ ] **Step 5: UI에 감쇠 계수 스핀박스 추가 — epoch_spin 아래**

```python
        s.addWidget(QLabel("감쇠 계수 γ:"))
        self.gamma_spin = QDoubleSpinBox()
        self.gamma_spin.setRange(0.0, 2.0)
        self.gamma_spin.setValue(0.0)
        self.gamma_spin.setSingleStep(0.1)
        self.gamma_spin.setDecimals(2)
        s.addWidget(self.gamma_spin)
```

- [ ] **Step 6: start_training()에 gamma 전달**

```python
        self.thread = TrainThread(
            self.epoch_spin.value(),
            gamma=self.gamma_spin.value()
        )
```

- [ ] **Step 7: plot()의 좌하단 시뮬레이션 그래프 수정**

기존:
```python
        ax3 = self.figure.add_subplot(223)
        ax3.plot(r['t_sim'], np.degrees(r['theta_sim']), color='#9b59b6', linewidth=1)
        ax3.set_title("진자 운동 시뮬레이션 (L=1m, θ0=30°)", fontsize=11)
        ax3.set_xlabel("시간 (s)")
        ax3.set_ylabel("각도 (°)")
        ax3.grid(True, alpha=0.3)
```
변경:
```python
        ax3 = self.figure.add_subplot(223)
        if r['gamma'] > 0:
            ax3.plot(r['t_sim'], np.degrees(r['theta_undamped']),
                     color='#9b59b6', linewidth=1, linestyle='--', label='비감쇠 (γ=0)', alpha=0.6)
            ax3.plot(r['t_sim'], np.degrees(r['theta_sim']),
                     color='#e74c3c', linewidth=1.5, label=f'감쇠 (γ={r["gamma"]})')
            ax3.legend(fontsize=8)
            ax3.set_title(f"감쇠 진자 시뮬레이션 (γ={r['gamma']})", fontsize=11)
        else:
            ax3.plot(r['t_sim'], np.degrees(r['theta_sim']), color='#9b59b6', linewidth=1)
            ax3.set_title("진자 운동 시뮬레이션 (L=1m, θ0=30°)", fontsize=11)
        ax3.set_xlabel("시간 (s)")
        ax3.set_ylabel("각도 (°)")
        ax3.grid(True, alpha=0.3)
```

- [ ] **Step 8: 앱 실행, γ=0.5 설정 후 학습 → 감쇠 곡선 vs 비감쇠 비교 그래프 확인**

Expected: 좌하단 그래프에 점선(비감쇠)과 실선(감쇠) 두 곡선 표시

- [ ] **Step 9: Commit**

```bash
git add lab4_widget.py
git commit -m "feat(lab4): add damped pendulum with gamma parameter and comparison plot"
```

---

## Task 5: AI_GUNWOO 레포 동기화 및 GitHub Push

**Files:**
- Modify: `C:/Desktop/문서/AI_GUNWOO/hw/hw.week 4/2. superpowers + PySide6 앱/` (전체 sync)

- [ ] **Step 1: 수정된 파일 4개를 AI_GUNWOO 레포로 복사**

```bash
cp "C:/Desktop/문서/2-1 AI와 머신러닝/hw/hw.week 4/lab1_widget.py" "C:/Desktop/문서/AI_GUNWOO/hw/hw.week 4/2. superpowers + PySide6 앱/"
cp "C:/Desktop/문서/2-1 AI와 머신러닝/hw/hw.week 4/lab2_widget.py" "C:/Desktop/문서/AI_GUNWOO/hw/hw.week 4/2. superpowers + PySide6 앱/"
cp "C:/Desktop/문서/2-1 AI와 머신러닝/hw/hw.week 4/lab3_widget.py" "C:/Desktop/문서/AI_GUNWOO/hw/hw.week 4/2. superpowers + PySide6 앱/"
cp "C:/Desktop/문서/2-1 AI와 머신러닝/hw/hw.week 4/lab4_widget.py" "C:/Desktop/문서/AI_GUNWOO/hw/hw.week 4/2. superpowers + PySide6 앱/"
```

- [ ] **Step 2: Commit and push**

```bash
cd "C:/Desktop/문서/AI_GUNWOO"
git add "hw/hw.week 4/2. superpowers + PySide6 앱/"
git commit -m "feat: sync advanced task implementations (lab1~4 enhancements)"
git push origin main
```

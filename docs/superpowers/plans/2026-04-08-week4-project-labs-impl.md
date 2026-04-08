# Week 4 Project Labs (Lab 5~8) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Lab 5~8 (스프링-질량, Ising Model, 양자 진동자, Kepler 궤도) 4개의 새 Lab을 기존 패턴으로 구현하고 main_app.py에 탭으로 추가한다.

**Architecture:** 각 Lab은 독립적인 `labN_widget.py` 파일로 구현된다. 기존 Lab 1~4의 패턴(TrainThread + FigureCanvas + PNG 저장)을 그대로 따른다. 모든 파일은 `C:/Desktop/문서/2-1 AI와 머신러닝/hw/hw.week 4/`에 생성하고, 완료 후 AI_GUNWOO 레포에 동기화한다.

**Tech Stack:** Python 3.12, TensorFlow/Keras, PySide6, Matplotlib, NumPy, SciPy(Lab 7)

---

## File Map

| 파일 | 작업 |
|------|------|
| `lab5_widget.py` | 신규 생성 |
| `lab6_widget.py` | 신규 생성 |
| `lab7_widget.py` | 신규 생성 |
| `lab8_widget.py` | 신규 생성 |
| `main_app.py` | Lab 5~8 import + 탭 추가 |

---

## Task 1: Lab 5 — 스프링-질량 고유 진동수 예측

**Files:**
- Create: `C:/Desktop/문서/2-1 AI와 머신러닝/hw/hw.week 4/lab5_widget.py`

- [ ] **Step 1: lab5_widget.py 전체 작성**

```python
"""Lab 5: 스프링-질량 시스템의 고유 진동수 예측"""

import numpy as np
import os

from PySide6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QPushButton, QLabel,
    QProgressBar, QGroupBox, QSpinBox, QTextEdit, QDoubleSpinBox
)
from PySide6.QtCore import QThread, Signal

from matplotlib.backends.backend_qtagg import FigureCanvasQTAgg as FigureCanvas
from matplotlib.figure import Figure


def rk4_spring(k, m, x0=1.0, v0=0.0, t_max=10.0, dt=0.01):
    """RK4로 스프링-질량 운동 시뮬레이션"""
    def deriv(state):
        x, v = state
        return np.array([v, -(k / m) * x])

    t_arr, states = [0.0], [np.array([x0, v0])]
    state = np.array([x0, v0])
    t = 0.0
    while t < t_max:
        k1 = deriv(state)
        k2 = deriv(state + 0.5 * dt * k1)
        k3 = deriv(state + 0.5 * dt * k2)
        k4 = deriv(state + dt * k3)
        state = state + (dt / 6) * (k1 + 2*k2 + 2*k3 + k4)
        t += dt
        t_arr.append(t)
        states.append(state.copy())
    states = np.array(states)
    return np.array(t_arr), states[:, 0]


class TrainThread(QThread):
    progress = Signal(int)
    log_message = Signal(str)
    finished_result = Signal(dict)
    error_occurred = Signal(str)

    def __init__(self, epochs, n_samples):
        super().__init__()
        self.epochs = epochs
        self.n_samples = n_samples

    def run(self):
        try:
            import tensorflow as tf
            from tensorflow import keras
            tf.get_logger().setLevel('ERROR')

            self.log_message.emit("스프링-질량 데이터 생성 중...")
            k_arr = np.random.uniform(1.0, 100.0, self.n_samples)
            m_arr = np.random.uniform(0.1, 10.0, self.n_samples)
            f_arr = (1 / (2 * np.pi)) * np.sqrt(k_arr / m_arr)

            X = np.column_stack([k_arr, m_arr])
            Y = f_arr.reshape(-1, 1)

            X_mean, X_std = X.mean(axis=0), X.std(axis=0)
            Y_mean, Y_std = Y.mean(), Y.std()
            X_norm = (X - X_mean) / X_std
            Y_norm = (Y - Y_mean) / Y_std

            perm = np.random.permutation(self.n_samples)
            X_norm, Y_norm = X_norm[perm], Y_norm[perm]

            model = keras.Sequential([
                keras.layers.Dense(64, activation='relu'),
                keras.layers.Dense(32, activation='relu'),
                keras.layers.Dense(16, activation='relu'),
                keras.layers.Dense(1, activation='linear')
            ])
            model.compile(optimizer=keras.optimizers.Adam(0.001), loss='mse')

            class CB(keras.callbacks.Callback):
                def __init__(self, thread):
                    super().__init__()
                    self.thread = thread
                def on_epoch_end(self, epoch, logs=None):
                    self.thread.progress.emit(int((epoch+1)/self.thread.epochs*100))
                    if (epoch+1) % 200 == 0:
                        self.thread.log_message.emit(f"  Epoch {epoch+1} - loss: {logs['loss']:.6f}")

            self.log_message.emit(f"학습 시작 ({self.epochs} epochs)...")
            history = model.fit(X_norm, Y_norm, epochs=self.epochs, batch_size=32,
                                validation_split=0.2, verbose=0, callbacks=[CB(self)])

            # 테스트: m 고정, k 변화
            m_fixed = 1.0
            k_test = np.linspace(1, 100, 100)
            X_test = np.column_stack([k_test, np.full_like(k_test, m_fixed)])
            X_test_norm = (X_test - X_mean) / X_std
            f_pred_norm = model.predict(X_test_norm, verbose=0)
            f_pred = f_pred_norm * Y_std + Y_mean
            f_true = (1 / (2 * np.pi)) * np.sqrt(k_test / m_fixed)

            # scatter: 전체 예측 vs 실제
            X_all = np.column_stack([k_arr[:200], m_arr[:200]])
            X_all_norm = (X_all - X_mean) / X_std
            f_pred_all_norm = model.predict(X_all_norm, verbose=0)
            f_pred_all = f_pred_all_norm * Y_std + Y_mean
            f_true_all = f_arr[:200]

            # RK4 시뮬레이션
            t_sim, x_sim = rk4_spring(k=10.0, m=1.0)

            mse = np.mean((f_true - f_pred.flatten())**2)
            self.log_message.emit(f"학습 완료! MSE: {mse:.6f}")

            self.finished_result.emit({
                'k_test': k_test, 'f_true': f_true, 'f_pred': f_pred.flatten(),
                'f_true_all': f_true_all, 'f_pred_all': f_pred_all.flatten(),
                't_sim': t_sim, 'x_sim': x_sim,
                'history': history.history,
            })
        except ImportError:
            self.error_occurred.emit("TensorFlow가 설치되지 않았습니다.")
        except Exception as e:
            self.error_occurred.emit(f"학습 오류: {str(e)}")


class Lab5Widget(QWidget):
    def __init__(self):
        super().__init__()
        self.init_ui()

    def init_ui(self):
        layout = QHBoxLayout(self)

        left = QVBoxLayout()
        settings = QGroupBox("실험 설정")
        s = QVBoxLayout(settings)

        s.addWidget(QLabel("학습 샘플 수:"))
        self.sample_spin = QSpinBox()
        self.sample_spin.setRange(500, 5000)
        self.sample_spin.setValue(2000)
        self.sample_spin.setSingleStep(500)
        s.addWidget(self.sample_spin)

        s.addWidget(QLabel("Epochs:"))
        self.epoch_spin = QSpinBox()
        self.epoch_spin.setRange(100, 5000)
        self.epoch_spin.setValue(1000)
        self.epoch_spin.setSingleStep(200)
        s.addWidget(self.epoch_spin)

        info = QLabel("물리:\n• f = (1/2π)√(k/m)\n• k: 1~100 N/m\n• m: 0.1~10 kg\n\nRK4 시뮬레이션: k=10, m=1")
        info.setStyleSheet("color: #555; padding: 8px; background: #f0f0f0; border-radius: 4px;")
        s.addWidget(info)
        left.addWidget(settings)

        self.run_btn = QPushButton("학습 시작")
        self.run_btn.setObjectName("runBtn")
        self.run_btn.clicked.connect(self.start_training)
        left.addWidget(self.run_btn)

        self.progress = QProgressBar()
        left.addWidget(self.progress)

        self.save_btn = QPushButton("그래프 PNG 저장")
        self.save_btn.setObjectName("saveBtn")
        self.save_btn.clicked.connect(self.save_graph)
        self.save_btn.setEnabled(False)
        left.addWidget(self.save_btn)

        log_group = QGroupBox("학습 로그")
        ll = QVBoxLayout(log_group)
        self.log_text = QTextEdit()
        self.log_text.setReadOnly(True)
        self.log_text.setMaximumHeight(200)
        ll.addWidget(self.log_text)
        left.addWidget(log_group)
        left.addStretch()

        lw = QWidget()
        lw.setLayout(left)
        lw.setMaximumWidth(320)

        right = QVBoxLayout()
        self.figure = Figure(figsize=(10, 8))
        self.canvas = FigureCanvas(self.figure)
        right.addWidget(self.canvas)
        rw = QWidget()
        rw.setLayout(right)

        layout.addWidget(lw)
        layout.addWidget(rw, 1)

    def start_training(self):
        self.run_btn.setEnabled(False)
        self.save_btn.setEnabled(False)
        self.progress.setValue(0)
        self.log_text.clear()
        self.thread = TrainThread(self.epoch_spin.value(), self.sample_spin.value())
        self.thread.progress.connect(self.progress.setValue)
        self.thread.log_message.connect(lambda m: self.log_text.append(m))
        self.thread.finished_result.connect(self.on_done)
        self.thread.error_occurred.connect(self.on_error)
        self.thread.start()

    def on_done(self, result):
        self.run_btn.setEnabled(True)
        self.save_btn.setEnabled(True)
        self.last_result = result
        self.plot(result)

    def on_error(self, msg):
        self.run_btn.setEnabled(True)
        self.log_text.append(f"[오류] {msg}")

    def plot(self, r):
        self.figure.clear()

        ax1 = self.figure.add_subplot(221)
        ax1.scatter(r['f_true_all'], r['f_pred_all'], s=10, alpha=0.5, color='#3498db')
        lim = [min(r['f_true_all'].min(), r['f_pred_all'].min()),
               max(r['f_true_all'].max(), r['f_pred_all'].max())]
        ax1.plot(lim, lim, 'r--', linewidth=1.5, label='이상적 예측')
        ax1.set_title("NN 예측 vs 실제 f", fontsize=12)
        ax1.set_xlabel("실제 f (Hz)")
        ax1.set_ylabel("예측 f (Hz)")
        ax1.legend(fontsize=8)
        ax1.grid(True, alpha=0.3)

        ax2 = self.figure.add_subplot(222)
        ax2.plot(r['history']['loss'], label='Train Loss')
        if 'val_loss' in r['history']:
            ax2.plot(r['history']['val_loss'], label='Val Loss')
        ax2.set_title("학습 곡선", fontsize=12)
        ax2.set_xlabel("Epoch")
        ax2.set_ylabel("MSE Loss")
        ax2.set_yscale('log')
        ax2.legend()
        ax2.grid(True, alpha=0.3)

        ax3 = self.figure.add_subplot(223)
        ax3.plot(r['k_test'], r['f_true'], 'b-', linewidth=2, label='실제 f (m=1kg)')
        ax3.plot(r['k_test'], r['f_pred'], 'r--', linewidth=2, label='NN 예측')
        ax3.set_title("k 변화에 따른 고유 진동수 (m=1kg)", fontsize=11)
        ax3.set_xlabel("스프링 상수 k (N/m)")
        ax3.set_ylabel("고유 진동수 f (Hz)")
        ax3.legend()
        ax3.grid(True, alpha=0.3)

        ax4 = self.figure.add_subplot(224)
        ax4.plot(r['t_sim'], r['x_sim'], color='#9b59b6', linewidth=1.5)
        ax4.set_title("RK4 진동 시뮬레이션 (k=10, m=1)", fontsize=11)
        ax4.set_xlabel("시간 (s)")
        ax4.set_ylabel("변위 x (m)")
        ax4.axhline(0, color='gray', linewidth=0.5)
        ax4.grid(True, alpha=0.3)

        self.figure.suptitle("Lab 5: 스프링-질량 고유 진동수 예측", fontsize=13, fontweight='bold')
        self.figure.tight_layout()
        self.canvas.draw()

    def save_graph(self):
        if hasattr(self, 'last_result'):
            path = os.path.join("outputs", "05_spring_mass_frequency.png")
            self.figure.savefig(path, dpi=150, bbox_inches='tight')
            self.log_text.append(f"저장 완료: {path}")
```

- [ ] **Step 2: Commit**

```bash
cd "C:/Desktop/문서/2-1 AI와 머신러닝/hw/hw.week 4"
git add lab5_widget.py
git commit -m "feat(lab5): add spring-mass natural frequency prediction"
```

---

## Task 2: Lab 6 — 2D Ising Model 상전이

**Files:**
- Create: `C:/Desktop/문서/2-1 AI와 머신러닝/hw/hw.week 4/lab6_widget.py`

- [ ] **Step 1: lab6_widget.py 전체 작성**

```python
"""Lab 6: 2D Ising Model 상전이 예측"""

import numpy as np
import os

from PySide6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QPushButton, QLabel,
    QProgressBar, QGroupBox, QSpinBox, QTextEdit
)
from PySide6.QtCore import QThread, Signal

from matplotlib.backends.backend_qtagg import FigureCanvasQTAgg as FigureCanvas
from matplotlib.figure import Figure


def metropolis_ising(N, T, n_steps=2000, J=1.0):
    """Metropolis 알고리즘으로 2D Ising 모델 시뮬레이션"""
    spin = np.random.choice([-1, 1], size=(N, N))
    beta = 1.0 / T if T > 0 else 1e10

    for _ in range(n_steps):
        i, j = np.random.randint(0, N, size=2)
        neighbors = (spin[(i+1) % N, j] + spin[(i-1) % N, j] +
                     spin[i, (j+1) % N] + spin[i, (j-1) % N])
        dE = 2 * J * spin[i, j] * neighbors
        if dE < 0 or np.random.rand() < np.exp(-beta * dE):
            spin[i, j] *= -1

    return spin, abs(spin.mean())


class TrainThread(QThread):
    progress = Signal(int)
    log_message = Signal(str)
    finished_result = Signal(dict)
    error_occurred = Signal(str)

    def __init__(self, epochs, grid_size):
        super().__init__()
        self.epochs = epochs
        self.grid_size = grid_size

    def run(self):
        try:
            import tensorflow as tf
            from tensorflow import keras
            tf.get_logger().setLevel('ERROR')

            N = self.grid_size
            T_arr = np.linspace(0.5, 5.0, 80)
            self.log_message.emit(f"Ising 데이터 생성 중 (격자 {N}×{N})...")

            M_arr = []
            for idx, T in enumerate(T_arr):
                _, M = metropolis_ising(N, T, n_steps=3000)
                M_arr.append(M)
                if (idx + 1) % 20 == 0:
                    self.log_message.emit(f"  T={T:.2f} → |M|={M:.3f}")

            M_arr = np.array(M_arr)

            X = T_arr.reshape(-1, 1)
            Y = M_arr.reshape(-1, 1)
            X_mean, X_std = X.mean(), X.std()
            Y_mean, Y_std = Y.mean(), max(Y.std(), 1e-8)
            X_norm = (X - X_mean) / X_std
            Y_norm = (Y - Y_mean) / Y_std

            model = keras.Sequential([
                keras.layers.Dense(32, activation='tanh'),
                keras.layers.Dense(16, activation='tanh'),
                keras.layers.Dense(1, activation='linear')
            ])
            model.compile(optimizer=keras.optimizers.Adam(0.001), loss='mse')

            class CB(keras.callbacks.Callback):
                def __init__(self, thread):
                    super().__init__()
                    self.thread = thread
                def on_epoch_end(self, epoch, logs=None):
                    self.thread.progress.emit(int((epoch+1)/self.thread.epochs*100))

            self.log_message.emit(f"학습 시작 ({self.epochs} epochs)...")
            history = model.fit(X_norm, Y_norm, epochs=self.epochs, batch_size=16,
                                verbose=0, callbacks=[CB(self)])

            T_test = np.linspace(0.5, 5.0, 200).reshape(-1, 1)
            T_test_norm = (T_test - X_mean) / X_std
            M_pred_norm = model.predict(T_test_norm, verbose=0)
            M_pred = np.clip(M_pred_norm * Y_std + Y_mean, 0, 1)

            # 격자 스냅샷
            snapshots = {}
            for T_snap in [1.0, 2.27, 4.0]:
                grid, _ = metropolis_ising(N, T_snap, n_steps=5000)
                snapshots[T_snap] = grid

            self.log_message.emit("학습 완료!")
            self.finished_result.emit({
                'T_data': T_arr, 'M_data': M_arr,
                'T_test': T_test.flatten(), 'M_pred': M_pred.flatten(),
                'history': history.history,
                'snapshots': snapshots,
            })
        except ImportError:
            self.error_occurred.emit("TensorFlow가 설치되지 않았습니다.")
        except Exception as e:
            self.error_occurred.emit(f"학습 오류: {str(e)}")


class Lab6Widget(QWidget):
    def __init__(self):
        super().__init__()
        self.init_ui()

    def init_ui(self):
        layout = QHBoxLayout(self)

        left = QVBoxLayout()
        settings = QGroupBox("실험 설정")
        s = QVBoxLayout(settings)

        s.addWidget(QLabel("격자 크기 N (N×N):"))
        self.grid_spin = QSpinBox()
        self.grid_spin.setRange(5, 20)
        self.grid_spin.setValue(10)
        s.addWidget(self.grid_spin)

        s.addWidget(QLabel("Epochs:"))
        self.epoch_spin = QSpinBox()
        self.epoch_spin.setRange(100, 3000)
        self.epoch_spin.setValue(500)
        self.epoch_spin.setSingleStep(100)
        s.addWidget(self.epoch_spin)

        info = QLabel("물리:\n• H = -J Σ sᵢsⱼ\n• Tc ≈ 2.269 (J=1)\n• Metropolis 알고리즘")
        info.setStyleSheet("color: #555; padding: 8px; background: #f0f0f0; border-radius: 4px;")
        s.addWidget(info)
        left.addWidget(settings)

        self.run_btn = QPushButton("학습 시작")
        self.run_btn.setObjectName("runBtn")
        self.run_btn.clicked.connect(self.start_training)
        left.addWidget(self.run_btn)

        self.progress = QProgressBar()
        left.addWidget(self.progress)

        self.save_btn = QPushButton("그래프 PNG 저장")
        self.save_btn.setObjectName("saveBtn")
        self.save_btn.clicked.connect(self.save_graph)
        self.save_btn.setEnabled(False)
        left.addWidget(self.save_btn)

        log_group = QGroupBox("학습 로그")
        ll = QVBoxLayout(log_group)
        self.log_text = QTextEdit()
        self.log_text.setReadOnly(True)
        self.log_text.setMaximumHeight(200)
        ll.addWidget(self.log_text)
        left.addWidget(log_group)
        left.addStretch()

        lw = QWidget()
        lw.setLayout(left)
        lw.setMaximumWidth(320)

        right = QVBoxLayout()
        self.figure = Figure(figsize=(10, 8))
        self.canvas = FigureCanvas(self.figure)
        right.addWidget(self.canvas)
        rw = QWidget()
        rw.setLayout(right)

        layout.addWidget(lw)
        layout.addWidget(rw, 1)

    def start_training(self):
        self.run_btn.setEnabled(False)
        self.save_btn.setEnabled(False)
        self.progress.setValue(0)
        self.log_text.clear()
        self.thread = TrainThread(self.epoch_spin.value(), self.grid_spin.value())
        self.thread.progress.connect(self.progress.setValue)
        self.thread.log_message.connect(lambda m: self.log_text.append(m))
        self.thread.finished_result.connect(self.on_done)
        self.thread.error_occurred.connect(self.on_error)
        self.thread.start()

    def on_done(self, result):
        self.run_btn.setEnabled(True)
        self.save_btn.setEnabled(True)
        self.last_result = result
        self.plot(result)

    def on_error(self, msg):
        self.run_btn.setEnabled(True)
        self.log_text.append(f"[오류] {msg}")

    def plot(self, r):
        self.figure.clear()

        ax1 = self.figure.add_subplot(221)
        ax1.scatter(r['T_data'], r['M_data'], s=20, color='#3498db', label='Monte Carlo', zorder=3)
        ax1.plot(r['T_test'], r['M_pred'], 'r-', linewidth=2, label='NN 예측')
        ax1.axvline(x=2.269, color='gray', linestyle='--', linewidth=1, label='Tc≈2.27')
        ax1.set_title("|M| vs 온도 T", fontsize=12)
        ax1.set_xlabel("온도 T (J/k_B 단위)")
        ax1.set_ylabel("|자화율 M|")
        ax1.legend(fontsize=8)
        ax1.grid(True, alpha=0.3)

        ax2 = self.figure.add_subplot(222)
        ax2.plot(r['history']['loss'], label='Train Loss', color='#e74c3c')
        ax2.set_title("학습 곡선", fontsize=12)
        ax2.set_xlabel("Epoch")
        ax2.set_ylabel("MSE Loss")
        ax2.set_yscale('log')
        ax2.legend()
        ax2.grid(True, alpha=0.3)

        titles = {1.0: "저온 T=1.0\n(강자성)", 2.27: "임계 T=2.27\n(상전이)", 4.0: "고온 T=4.0\n(상자성)"}
        for idx, (T_snap, grid) in enumerate(r['snapshots'].items()):
            ax = self.figure.add_subplot(2, 3, idx + 4)
            ax.imshow(grid, cmap='RdBu', vmin=-1, vmax=1, interpolation='nearest')
            ax.set_title(titles[T_snap], fontsize=9)
            ax.axis('off')

        self.figure.suptitle("Lab 6: 2D Ising Model 상전이 예측", fontsize=13, fontweight='bold')
        self.figure.tight_layout()
        self.canvas.draw()

    def save_graph(self):
        if hasattr(self, 'last_result'):
            path = os.path.join("outputs", "06_ising_phase_transition.png")
            self.figure.savefig(path, dpi=150, bbox_inches='tight')
            self.log_text.append(f"저장 완료: {path}")
```

- [ ] **Step 2: Commit**

```bash
git add lab6_widget.py
git commit -m "feat(lab6): add 2D Ising model phase transition prediction"
```

---

## Task 3: Lab 7 — 양자 조화 진동자 에너지 준위

**Files:**
- Create: `C:/Desktop/문서/2-1 AI와 머신러닝/hw/hw.week 4/lab7_widget.py`

- [ ] **Step 1: lab7_widget.py 전체 작성**

```python
"""Lab 7: 단순 조화 진동자의 에너지 준위 예측"""

import numpy as np
import os
from math import factorial

from PySide6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QPushButton, QLabel,
    QProgressBar, QGroupBox, QSpinBox, QTextEdit
)
from PySide6.QtCore import QThread, Signal

from matplotlib.backends.backend_qtagg import FigureCanvasQTAgg as FigureCanvas
from matplotlib.figure import Figure


def hermite(n, x):
    """n차 Hermite 다항식 H_n(x) 재귀 계산"""
    if n == 0:
        return np.ones_like(x)
    elif n == 1:
        return 2 * x
    else:
        return 2 * x * hermite(n-1, x) - 2 * (n-1) * hermite(n-2, x)


def psi_n(n, x):
    """양자 조화 진동자 파동함수 (ℏ=m=ω=1 단위)"""
    norm = 1.0 / np.sqrt(2**n * factorial(n) * np.sqrt(np.pi))
    return norm * hermite(n, x) * np.exp(-x**2 / 2)


class TrainThread(QThread):
    progress = Signal(int)
    log_message = Signal(str)
    finished_result = Signal(dict)
    error_occurred = Signal(str)

    def __init__(self, epochs):
        super().__init__()
        self.epochs = epochs

    def run(self):
        try:
            import tensorflow as tf
            from tensorflow import keras
            tf.get_logger().setLevel('ERROR')

            self.log_message.emit("양자 진동자 데이터 생성 중...")
            n_samples = 3000
            omega_arr = np.random.uniform(0.5, 5.0, n_samples)
            n_arr = np.random.randint(0, 10, n_samples).astype(float)
            # E_n = ℏω(n + 0.5),  ℏ=1 단위
            E_arr = omega_arr * (n_arr + 0.5)

            X = np.column_stack([omega_arr, n_arr])
            Y = E_arr.reshape(-1, 1)

            X_mean, X_std = X.mean(axis=0), X.std(axis=0)
            Y_mean, Y_std = Y.mean(), Y.std()
            X_norm = (X - X_mean) / X_std
            Y_norm = (Y - Y_mean) / Y_std

            perm = np.random.permutation(n_samples)
            X_norm, Y_norm = X_norm[perm], Y_norm[perm]

            model = keras.Sequential([
                keras.layers.Dense(32, activation='relu'),
                keras.layers.Dense(16, activation='relu'),
                keras.layers.Dense(1, activation='linear')
            ])
            model.compile(optimizer=keras.optimizers.Adam(0.001), loss='mse')

            class CB(keras.callbacks.Callback):
                def __init__(self, thread):
                    super().__init__()
                    self.thread = thread
                def on_epoch_end(self, epoch, logs=None):
                    self.thread.progress.emit(int((epoch+1)/self.thread.epochs*100))
                    if (epoch+1) % 200 == 0:
                        self.thread.log_message.emit(f"  Epoch {epoch+1} - loss: {logs['loss']:.6f}")

            self.log_message.emit(f"학습 시작 ({self.epochs} epochs)...")
            history = model.fit(X_norm, Y_norm, epochs=self.epochs, batch_size=64,
                                validation_split=0.2, verbose=0, callbacks=[CB(self)])

            # 테스트: ω=1, n=0~9
            omega_test = 1.0
            n_levels = np.arange(0, 10)
            X_test = np.column_stack([np.full(10, omega_test), n_levels.astype(float)])
            X_test_norm = (X_test - X_mean) / X_std
            E_pred_norm = model.predict(X_test_norm, verbose=0)
            E_pred = E_pred_norm * Y_std + Y_mean
            E_true = omega_test * (n_levels + 0.5)

            # scatter
            X_sc = np.column_stack([omega_arr[:300], n_arr[:300]])
            X_sc_norm = (X_sc - X_mean) / X_std
            E_sc_pred_norm = model.predict(X_sc_norm, verbose=0)
            E_sc_pred = E_sc_pred_norm * Y_std + Y_mean
            E_sc_true = E_arr[:300]

            # 파동함수
            x_psi = np.linspace(-5, 5, 300)
            psi_list = [psi_n(n, x_psi) for n in range(5)]

            mape = np.mean(np.abs((E_true - E_pred.flatten()) / E_true)) * 100
            self.log_message.emit(f"학습 완료! MAPE: {mape:.2f}%")

            self.finished_result.emit({
                'n_levels': n_levels, 'E_true': E_true, 'E_pred': E_pred.flatten(),
                'E_sc_true': E_sc_true, 'E_sc_pred': E_sc_pred.flatten(),
                'x_psi': x_psi, 'psi_list': psi_list,
                'history': history.history,
            })
        except ImportError:
            self.error_occurred.emit("TensorFlow가 설치되지 않았습니다.")
        except Exception as e:
            self.error_occurred.emit(f"학습 오류: {str(e)}")


class Lab7Widget(QWidget):
    def __init__(self):
        super().__init__()
        self.init_ui()

    def init_ui(self):
        layout = QHBoxLayout(self)

        left = QVBoxLayout()
        settings = QGroupBox("실험 설정")
        s = QVBoxLayout(settings)

        s.addWidget(QLabel("Epochs:"))
        self.epoch_spin = QSpinBox()
        self.epoch_spin.setRange(200, 5000)
        self.epoch_spin.setValue(1000)
        self.epoch_spin.setSingleStep(200)
        s.addWidget(self.epoch_spin)

        info = QLabel("물리 (ℏ=1 단위):\n• E_n = ω(n + 1/2)\n• ω: 0.5~5.0\n• n: 0~9\n\n파동함수: n=0~4")
        info.setStyleSheet("color: #555; padding: 8px; background: #f0f0f0; border-radius: 4px;")
        s.addWidget(info)
        left.addWidget(settings)

        self.run_btn = QPushButton("학습 시작")
        self.run_btn.setObjectName("runBtn")
        self.run_btn.clicked.connect(self.start_training)
        left.addWidget(self.run_btn)

        self.progress = QProgressBar()
        left.addWidget(self.progress)

        self.save_btn = QPushButton("그래프 PNG 저장")
        self.save_btn.setObjectName("saveBtn")
        self.save_btn.clicked.connect(self.save_graph)
        self.save_btn.setEnabled(False)
        left.addWidget(self.save_btn)

        log_group = QGroupBox("학습 로그")
        ll = QVBoxLayout(log_group)
        self.log_text = QTextEdit()
        self.log_text.setReadOnly(True)
        self.log_text.setMaximumHeight(200)
        ll.addWidget(self.log_text)
        left.addWidget(log_group)
        left.addStretch()

        lw = QWidget()
        lw.setLayout(left)
        lw.setMaximumWidth(320)

        right = QVBoxLayout()
        self.figure = Figure(figsize=(10, 8))
        self.canvas = FigureCanvas(self.figure)
        right.addWidget(self.canvas)
        rw = QWidget()
        rw.setLayout(right)

        layout.addWidget(lw)
        layout.addWidget(rw, 1)

    def start_training(self):
        self.run_btn.setEnabled(False)
        self.save_btn.setEnabled(False)
        self.progress.setValue(0)
        self.log_text.clear()
        self.thread = TrainThread(self.epoch_spin.value())
        self.thread.progress.connect(self.progress.setValue)
        self.thread.log_message.connect(lambda m: self.log_text.append(m))
        self.thread.finished_result.connect(self.on_done)
        self.thread.error_occurred.connect(self.on_error)
        self.thread.start()

    def on_done(self, result):
        self.run_btn.setEnabled(True)
        self.save_btn.setEnabled(True)
        self.last_result = result
        self.plot(result)

    def on_error(self, msg):
        self.run_btn.setEnabled(True)
        self.log_text.append(f"[오류] {msg}")

    def plot(self, r):
        self.figure.clear()
        colors = ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6']

        ax1 = self.figure.add_subplot(221)
        for n in r['n_levels']:
            E = r['E_true'][n]
            ax1.axhline(y=E, color=colors[n % 5], linewidth=2, alpha=0.8)
            ax1.text(0.05, E + 0.05, f"n={n}, E={E:.2f}", fontsize=7, color=colors[n % 5])
        ax1.set_title("에너지 준위 다이어그램 (ω=1)", fontsize=11)
        ax1.set_ylabel("에너지 E (ℏ 단위)")
        ax1.set_xlim(0, 1)
        ax1.set_xticks([])
        ax1.grid(True, alpha=0.2)

        ax2 = self.figure.add_subplot(222)
        for n in range(5):
            offset = r['E_true'][n]
            ax2.plot(r['x_psi'], r['psi_list'][n] * 0.8 + offset,
                     color=colors[n], linewidth=1.5, label=f"n={n}")
            ax2.axhline(y=offset, color=colors[n], linewidth=0.5, linestyle='--', alpha=0.4)
        ax2.set_title("파동함수 ψ_n(x)", fontsize=11)
        ax2.set_xlabel("x")
        ax2.set_ylabel("ψ_n(x) + E_n")
        ax2.legend(fontsize=7, loc='upper right')
        ax2.grid(True, alpha=0.3)

        ax3 = self.figure.add_subplot(223)
        ax3.scatter(r['E_sc_true'], r['E_sc_pred'], s=8, alpha=0.4, color='#3498db')
        lim = [r['E_sc_true'].min(), r['E_sc_true'].max()]
        ax3.plot(lim, lim, 'r--', linewidth=1.5, label='이상적 예측')
        ax3.set_title("NN 예측 vs 실제 E_n", fontsize=11)
        ax3.set_xlabel("실제 E_n")
        ax3.set_ylabel("예측 E_n")
        ax3.legend(fontsize=8)
        ax3.grid(True, alpha=0.3)

        ax4 = self.figure.add_subplot(224)
        ax4.plot(r['history']['loss'], label='Train Loss')
        if 'val_loss' in r['history']:
            ax4.plot(r['history']['val_loss'], label='Val Loss')
        ax4.set_title("학습 곡선", fontsize=11)
        ax4.set_xlabel("Epoch")
        ax4.set_ylabel("MSE Loss")
        ax4.set_yscale('log')
        ax4.legend()
        ax4.grid(True, alpha=0.3)

        self.figure.suptitle("Lab 7: 양자 조화 진동자 에너지 준위 예측", fontsize=13, fontweight='bold')
        self.figure.tight_layout()
        self.canvas.draw()

    def save_graph(self):
        if hasattr(self, 'last_result'):
            path = os.path.join("outputs", "07_quantum_oscillator_energy.png")
            self.figure.savefig(path, dpi=150, bbox_inches='tight')
            self.log_text.append(f"저장 완료: {path}")
```

- [ ] **Step 2: Commit**

```bash
git add lab7_widget.py
git commit -m "feat(lab7): add quantum harmonic oscillator energy level prediction"
```

---

## Task 4: Lab 8 — Kepler 궤도 예측

**Files:**
- Create: `C:/Desktop/문서/2-1 AI와 머신러닝/hw/hw.week 4/lab8_widget.py`

- [ ] **Step 1: lab8_widget.py 전체 작성**

```python
"""Lab 8: Kepler 문제의 궤도 예측"""

import numpy as np
import os

from PySide6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QPushButton, QLabel,
    QProgressBar, QGroupBox, QSpinBox, QTextEdit
)
from PySide6.QtCore import QThread, Signal

from matplotlib.backends.backend_qtagg import FigureCanvasQTAgg as FigureCanvas
from matplotlib.figure import Figure


def kepler_orbit(a, e, theta):
    """케플러 궤도 직교좌표 계산"""
    r = a * (1 - e**2) / (1 + e * np.cos(theta))
    x = r * np.cos(theta)
    y = r * np.sin(theta)
    return x, y


class TrainThread(QThread):
    progress = Signal(int)
    log_message = Signal(str)
    finished_result = Signal(dict)
    error_occurred = Signal(str)

    def __init__(self, epochs, n_samples):
        super().__init__()
        self.epochs = epochs
        self.n_samples = n_samples

    def run(self):
        try:
            import tensorflow as tf
            from tensorflow import keras
            tf.get_logger().setLevel('ERROR')

            self.log_message.emit("케플러 궤도 데이터 생성 중...")
            a_arr = np.random.uniform(1.0, 5.0, self.n_samples)
            e_arr = np.random.uniform(0.0, 0.9, self.n_samples)
            theta_arr = np.random.uniform(0, 2 * np.pi, self.n_samples)

            x_arr, y_arr = kepler_orbit(a_arr, e_arr, theta_arr)

            X = np.column_stack([a_arr, e_arr, theta_arr])
            Y = np.column_stack([x_arr, y_arr])

            X_mean, X_std = X.mean(axis=0), X.std(axis=0)
            Y_mean, Y_std = Y.mean(axis=0), Y.std(axis=0)
            X_norm = (X - X_mean) / X_std
            Y_norm = (Y - Y_mean) / Y_std

            perm = np.random.permutation(self.n_samples)
            X_norm, Y_norm = X_norm[perm], Y_norm[perm]

            model = keras.Sequential([
                keras.layers.Dense(128, activation='relu'),
                keras.layers.Dense(64, activation='relu'),
                keras.layers.Dense(32, activation='relu'),
                keras.layers.Dense(2, activation='linear')
            ])
            model.compile(optimizer=keras.optimizers.Adam(0.001), loss='mse')

            class CB(keras.callbacks.Callback):
                def __init__(self, thread):
                    super().__init__()
                    self.thread = thread
                def on_epoch_end(self, epoch, logs=None):
                    self.thread.progress.emit(int((epoch+1)/self.thread.epochs*100))
                    if (epoch+1) % 200 == 0:
                        self.thread.log_message.emit(f"  Epoch {epoch+1} - loss: {logs['loss']:.6f}")

            self.log_message.emit(f"학습 시작 ({self.epochs} epochs)...")
            history = model.fit(X_norm, Y_norm, epochs=self.epochs, batch_size=64,
                                validation_split=0.2, verbose=0, callbacks=[CB(self)])

            # 테스트: a=2, 3가지 이심률
            test_configs = [(2.0, 0.0, "원형 e=0.0"), (2.0, 0.5, "타원 e=0.5"), (2.0, 0.85, "긴 타원 e=0.85")]
            orbits = []
            theta_full = np.linspace(0, 2 * np.pi, 200)

            for a_t, e_t, label in test_configs:
                x_true, y_true = kepler_orbit(a_t, e_t, theta_full)

                X_test = np.column_stack([
                    np.full_like(theta_full, a_t),
                    np.full_like(theta_full, e_t),
                    theta_full
                ])
                X_test_norm = (X_test - X_mean) / X_std
                Y_pred_norm = model.predict(X_test_norm, verbose=0)
                Y_pred = Y_pred_norm * Y_std + Y_mean

                orbits.append({
                    'label': label, 'e': e_t,
                    'x_true': x_true, 'y_true': y_true,
                    'x_pred': Y_pred[:, 0], 'y_pred': Y_pred[:, 1],
                })

            self.log_message.emit("학습 완료!")
            self.finished_result.emit({
                'orbits': orbits,
                'history': history.history,
            })
        except ImportError:
            self.error_occurred.emit("TensorFlow가 설치되지 않았습니다.")
        except Exception as e:
            self.error_occurred.emit(f"학습 오류: {str(e)}")


class Lab8Widget(QWidget):
    def __init__(self):
        super().__init__()
        self.init_ui()

    def init_ui(self):
        layout = QHBoxLayout(self)

        left = QVBoxLayout()
        settings = QGroupBox("실험 설정")
        s = QVBoxLayout(settings)

        s.addWidget(QLabel("학습 샘플 수:"))
        self.sample_spin = QSpinBox()
        self.sample_spin.setRange(500, 5000)
        self.sample_spin.setValue(3000)
        self.sample_spin.setSingleStep(500)
        s.addWidget(self.sample_spin)

        s.addWidget(QLabel("Epochs:"))
        self.epoch_spin = QSpinBox()
        self.epoch_spin.setRange(200, 5000)
        self.epoch_spin.setValue(1000)
        self.epoch_spin.setSingleStep(200)
        s.addWidget(self.epoch_spin)

        info = QLabel("물리:\n• r = a(1-e²)/(1+e·cosθ)\n• a: 1~5 AU\n• e: 0~0.9\n\n테스트: a=2, e=0/0.5/0.85")
        info.setStyleSheet("color: #555; padding: 8px; background: #f0f0f0; border-radius: 4px;")
        s.addWidget(info)
        left.addWidget(settings)

        self.run_btn = QPushButton("학습 시작")
        self.run_btn.setObjectName("runBtn")
        self.run_btn.clicked.connect(self.start_training)
        left.addWidget(self.run_btn)

        self.progress = QProgressBar()
        left.addWidget(self.progress)

        self.save_btn = QPushButton("그래프 PNG 저장")
        self.save_btn.setObjectName("saveBtn")
        self.save_btn.clicked.connect(self.save_graph)
        self.save_btn.setEnabled(False)
        left.addWidget(self.save_btn)

        log_group = QGroupBox("학습 로그")
        ll = QVBoxLayout(log_group)
        self.log_text = QTextEdit()
        self.log_text.setReadOnly(True)
        self.log_text.setMaximumHeight(200)
        ll.addWidget(self.log_text)
        left.addWidget(log_group)
        left.addStretch()

        lw = QWidget()
        lw.setLayout(left)
        lw.setMaximumWidth(320)

        right = QVBoxLayout()
        self.figure = Figure(figsize=(10, 8))
        self.canvas = FigureCanvas(self.figure)
        right.addWidget(self.canvas)
        rw = QWidget()
        rw.setLayout(right)

        layout.addWidget(lw)
        layout.addWidget(rw, 1)

    def start_training(self):
        self.run_btn.setEnabled(False)
        self.save_btn.setEnabled(False)
        self.progress.setValue(0)
        self.log_text.clear()
        self.thread = TrainThread(self.epoch_spin.value(), self.sample_spin.value())
        self.thread.progress.connect(self.progress.setValue)
        self.thread.log_message.connect(lambda m: self.log_text.append(m))
        self.thread.finished_result.connect(self.on_done)
        self.thread.error_occurred.connect(self.on_error)
        self.thread.start()

    def on_done(self, result):
        self.run_btn.setEnabled(True)
        self.save_btn.setEnabled(True)
        self.last_result = result
        self.plot(result)

    def on_error(self, msg):
        self.run_btn.setEnabled(True)
        self.log_text.append(f"[오류] {msg}")

    def plot(self, r):
        self.figure.clear()
        colors = ['#3498db', '#e74c3c', '#2ecc71']

        ax1 = self.figure.add_subplot(121)
        for i, orb in enumerate(r['orbits']):
            ax1.plot(orb['x_true'], orb['y_true'], '-', color=colors[i],
                     linewidth=2, label=f"{orb['label']} (실제)")
            ax1.plot(orb['x_pred'], orb['y_pred'], '--', color=colors[i],
                     linewidth=1.5, alpha=0.7, label=f"{orb['label']} (예측)")
        ax1.plot(0, 0, 'yo', markersize=10, label='태양', zorder=5)
        ax1.set_title("케플러 궤도 예측 (a=2 AU)", fontsize=12)
        ax1.set_xlabel("x (AU)")
        ax1.set_ylabel("y (AU)")
        ax1.legend(fontsize=7)
        ax1.set_aspect('equal')
        ax1.grid(True, alpha=0.3)

        ax2 = self.figure.add_subplot(122)
        ax2.plot(r['history']['loss'], label='Train Loss')
        if 'val_loss' in r['history']:
            ax2.plot(r['history']['val_loss'], label='Val Loss')
        ax2.set_title("학습 곡선", fontsize=12)
        ax2.set_xlabel("Epoch")
        ax2.set_ylabel("MSE Loss")
        ax2.set_yscale('log')
        ax2.legend()
        ax2.grid(True, alpha=0.3)

        self.figure.suptitle("Lab 8: Kepler 궤도 예측", fontsize=13, fontweight='bold')
        self.figure.tight_layout()
        self.canvas.draw()

    def save_graph(self):
        if hasattr(self, 'last_result'):
            path = os.path.join("outputs", "08_kepler_orbit.png")
            self.figure.savefig(path, dpi=150, bbox_inches='tight')
            self.log_text.append(f"저장 완료: {path}")
```

- [ ] **Step 2: Commit**

```bash
git add lab8_widget.py
git commit -m "feat(lab8): add Kepler orbit prediction"
```

---

## Task 5: main_app.py에 Lab 5~8 탭 추가

**Files:**
- Modify: `C:/Desktop/문서/2-1 AI와 머신러닝/hw/hw.week 4/main_app.py`

- [ ] **Step 1: import 추가 (기존 lab4 import 아래)**

```python
from lab5_widget import Lab5Widget
from lab6_widget import Lab6Widget
from lab7_widget import Lab7Widget
from lab8_widget import Lab8Widget
```

- [ ] **Step 2: 탭 추가 (기존 lab4 탭 추가 아래)**

```python
self.lab5 = Lab5Widget()
self.lab6 = Lab6Widget()
self.lab7 = Lab7Widget()
self.lab8 = Lab8Widget()

self.tabs.addTab(self.lab5, "Lab 5: 스프링-질량")
self.tabs.addTab(self.lab6, "Lab 6: Ising Model")
self.tabs.addTab(self.lab7, "Lab 7: 양자 진동자")
self.tabs.addTab(self.lab8, "Lab 8: Kepler 궤도")
```

- [ ] **Step 3: Commit**

```bash
git add main_app.py
git commit -m "feat: add Lab 5~8 tabs to main app"
```

---

## Task 6: AI_GUNWOO 레포 동기화 및 GitHub Push

- [ ] **Step 1: 파일 복사**

```bash
cp "C:/Desktop/문서/2-1 AI와 머신러닝/hw/hw.week 4/lab5_widget.py" "C:/Desktop/문서/AI_GUNWOO/hw/hw.week 4/2. superpowers + PySide6 앱/"
cp "C:/Desktop/문서/2-1 AI와 머신러닝/hw/hw.week 4/lab6_widget.py" "C:/Desktop/문서/AI_GUNWOO/hw/hw.week 4/2. superpowers + PySide6 앱/"
cp "C:/Desktop/문서/2-1 AI와 머신러닝/hw/hw.week 4/lab7_widget.py" "C:/Desktop/문서/AI_GUNWOO/hw/hw.week 4/2. superpowers + PySide6 앱/"
cp "C:/Desktop/문서/2-1 AI와 머신러닝/hw/hw.week 4/lab8_widget.py" "C:/Desktop/문서/AI_GUNWOO/hw/hw.week 4/2. superpowers + PySide6 앱/"
cp "C:/Desktop/문서/2-1 AI와 머신러닝/hw/hw.week 4/main_app.py" "C:/Desktop/문서/AI_GUNWOO/hw/hw.week 4/2. superpowers + PySide6 앱/"
```

- [ ] **Step 2: Commit and push**

```bash
cd "C:/Desktop/문서/AI_GUNWOO"
git add "hw/hw.week 4/2. superpowers + PySide6 앱/"
git commit -m "feat: add Lab 5~8 (spring-mass, Ising, quantum oscillator, Kepler)"
git push origin main
```

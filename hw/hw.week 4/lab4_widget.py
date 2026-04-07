"""Lab 4: 진자 주기 예측"""

import numpy as np
import os

from PySide6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QPushButton, QLabel,
    QProgressBar, QGroupBox, QSpinBox, QTextEdit, QDoubleSpinBox
)
from PySide6.QtCore import QThread, Signal

from matplotlib.backends.backend_qtagg import FigureCanvasQTAgg as FigureCanvas
from matplotlib.figure import Figure


def pendulum_period(L, theta0, g=9.8):
    """큰 각도 보정이 포함된 진자 주기 계산"""
    T0 = 2 * np.pi * np.sqrt(L / g)
    # 타원 적분 근사
    k = np.sin(theta0 / 2)
    T = T0 * (1 + (1/4) * k**2 + (9/64) * k**4 + (25/256) * k**6)
    return T


def rk4_pendulum(L, theta0, omega0=0, t_max=None, dt=0.001, g=9.8):
    """RK4로 진자 운동 시뮬레이션"""
    if t_max is None:
        t_max = 4 * pendulum_period(L, theta0, g)

    def deriv(state):
        theta, omega = state
        return np.array([omega, -(g / L) * np.sin(theta)])

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

            self.log_message.emit("진자 데이터 생성 중...")

            # 학습 데이터 생성
            n = 2000
            L_arr = np.random.uniform(0.3, 3.0, n)
            theta_arr = np.random.uniform(np.radians(5), np.radians(80), n)
            T_arr = np.array([pendulum_period(L, th) for L, th in zip(L_arr, theta_arr)])

            X = np.column_stack([L_arr, theta_arr])
            Y = T_arr.reshape(-1, 1)

            X_mean, X_std = X.mean(axis=0), X.std(axis=0)
            Y_mean, Y_std = Y.mean(axis=0), Y.std(axis=0)
            X_norm = (X - X_mean) / X_std
            Y_norm = (Y - Y_mean) / Y_std

            perm = np.random.permutation(n)
            X_norm, Y_norm = X_norm[perm], Y_norm[perm]

            # 모델
            model = keras.Sequential([
                keras.layers.Dense(64, activation='relu'),
                keras.layers.Dropout(0.1),
                keras.layers.Dense(32, activation='relu'),
                keras.layers.Dropout(0.1),
                keras.layers.Dense(16, activation='relu'),
                keras.layers.Dropout(0.1),
                keras.layers.Dense(1, activation='linear')
            ])
            model.compile(optimizer=keras.optimizers.Adam(0.001), loss='mse')

            class CB(keras.callbacks.Callback):
                def __init__(self, thread):
                    super().__init__()
                    self.thread = thread
                def on_epoch_end(self, epoch, logs=None):
                    pct = int((epoch + 1) / self.thread.epochs * 100)
                    self.thread.progress.emit(min(pct, 95))
                    if (epoch + 1) % 200 == 0:
                        self.thread.log_message.emit(f"  Epoch {epoch+1} - loss: {logs['loss']:.6f}")

            self.log_message.emit(f"학습 시작 ({self.epochs} epochs)...")
            history = model.fit(X_norm, Y_norm, epochs=self.epochs, batch_size=32,
                                validation_split=0.2, verbose=0, callbacks=[CB(self)])

            # 테스트: 다양한 길이에서 각도별 주기
            test_lengths = [0.5, 1.0, 2.0]
            test_angles = np.linspace(np.radians(5), np.radians(80), 50)

            predictions = {}
            for L in test_lengths:
                X_t = np.column_stack([np.full_like(test_angles, L), test_angles])
                X_t_norm = (X_t - X_mean) / X_std
                T_pred_norm = model.predict(X_t_norm, verbose=0)
                T_pred = T_pred_norm * Y_std + Y_mean
                T_true = np.array([pendulum_period(L, th) for th in test_angles])

                mape = np.mean(np.abs((T_true - T_pred.flatten()) / T_true)) * 100
                self.log_message.emit(f"  L={L}m: MAPE = {mape:.2f}%")

                predictions[L] = {
                    'T_pred': T_pred.flatten(),
                    'T_true': T_true,
                    'mape': mape
                }

            # RK4 시뮬레이션
            self.log_message.emit("RK4 시뮬레이션 실행 중...")
            sim_L, sim_theta = 1.0, np.radians(30)
            t_sim, theta_sim, omega_sim = rk4_pendulum(sim_L, sim_theta)

            self.progress.emit(100)
            self.log_message.emit("학습 및 시뮬레이션 완료!")

            self.finished_result.emit({
                'predictions': predictions,
                'test_angles': np.degrees(test_angles),
                'history': history.history,
                't_sim': t_sim, 'theta_sim': theta_sim, 'omega_sim': omega_sim,
            })

        except ImportError:
            self.error_occurred.emit("TensorFlow가 설치되지 않았습니다.")
        except Exception as e:
            self.error_occurred.emit(f"학습 오류: {str(e)}")


class Lab4Widget(QWidget):
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

        info = QLabel("테스트 조건:\n• L = 0.5m, 1.0m, 2.0m\n• 각도: 5° ~ 80°\n\n물리:\n• T = 2π√(L/g)\n• 큰 각도: 타원적분 보정")
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
        colors = ['#e74c3c', '#2ecc71', '#3498db']

        # 주기 예측
        ax1 = self.figure.add_subplot(221)
        for i, (L, data) in enumerate(r['predictions'].items()):
            ax1.plot(r['test_angles'], data['T_true'], '-', color=colors[i], linewidth=2, label=f'L={L}m (실제)')
            ax1.plot(r['test_angles'], data['T_pred'], 'o', color=colors[i], markersize=3, alpha=0.5, label=f'L={L}m (예측)')
        ax1.set_title("진자 주기 예측", fontsize=12)
        ax1.set_xlabel("초기 각도 (°)")
        ax1.set_ylabel("주기 T (s)")
        ax1.legend(fontsize=7)
        ax1.grid(True, alpha=0.3)

        # 학습 곡선
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

        # RK4 시뮬레이션 - 시간에 따른 각도
        ax3 = self.figure.add_subplot(223)
        ax3.plot(r['t_sim'], np.degrees(r['theta_sim']), color='#9b59b6', linewidth=1)
        ax3.set_title("진자 운동 시뮬레이션 (L=1m, θ0=30°)", fontsize=11)
        ax3.set_xlabel("시간 (s)")
        ax3.set_ylabel("각도 (°)")
        ax3.grid(True, alpha=0.3)

        # 위상 공간
        ax4 = self.figure.add_subplot(224)
        ax4.plot(np.degrees(r['theta_sim']), np.degrees(r['omega_sim']), color='#e67e22', linewidth=0.5)
        ax4.set_title("위상 공간 (각도 vs 각속도)", fontsize=11)
        ax4.set_xlabel("각도 (°)")
        ax4.set_ylabel("각속도 (°/s)")
        ax4.grid(True, alpha=0.3)

        self.figure.suptitle("Lab 4: 진자 주기 예측 및 시뮬레이션", fontsize=14, fontweight='bold')
        self.figure.tight_layout()
        self.canvas.draw()

    def save_graph(self):
        if hasattr(self, 'last_result'):
            path = os.path.join("outputs", "04_pendulum_prediction.png")
            self.figure.savefig(path, dpi=150, bbox_inches='tight')
            self.log_text.append(f"저장 완료: {path}")

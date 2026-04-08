"""Lab 5: 스프링-질량 시스템의 고유 진동수 예측"""

import numpy as np
import os

from PySide6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QPushButton, QLabel,
    QProgressBar, QGroupBox, QSpinBox, QTextEdit
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
            Y_mean, Y_std = float(Y.mean()), float(Y.std())
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

            # scatter
            X_sc = np.column_stack([k_arr[:300], m_arr[:300]])
            X_sc_norm = (X_sc - X_mean) / X_std
            f_sc_pred_norm = model.predict(X_sc_norm, verbose=0)
            f_sc_pred = f_sc_pred_norm * Y_std + Y_mean
            f_sc_true = f_arr[:300]

            # RK4 시뮬레이션
            t_sim, x_sim = rk4_spring(k=10.0, m=1.0)

            mse = float(np.mean((f_true - f_pred.flatten())**2))
            self.log_message.emit(f"학습 완료! MSE: {mse:.6f}")

            self.finished_result.emit({
                'k_test': k_test, 'f_true': f_true, 'f_pred': f_pred.flatten(),
                'f_sc_true': f_sc_true, 'f_sc_pred': f_sc_pred.flatten(),
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
        ax1.scatter(r['f_sc_true'], r['f_sc_pred'], s=10, alpha=0.5, color='#3498db')
        lim = [min(r['f_sc_true'].min(), r['f_sc_pred'].min()),
               max(r['f_sc_true'].max(), r['f_sc_pred'].max())]
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
